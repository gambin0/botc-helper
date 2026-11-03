import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-log',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  template: `
    <div class="page">
      <h1>Event Log</h1>
      <div *ngIf="events.length > 0" class="event-list">
        <div *ngFor="let event of events" class="event-item">
          <mat-icon class="event-icon">{{ getEventIcon(event.kind) }}</mat-icon>
          <div class="event-content">
            <div class="event-description">{{ getEventDescription(event) }}</div>
            <div class="event-meta">
              Night {{ event.night }} • {{ event.phase }}
            </div>
          </div>
          <button mat-icon-button color="warn" (click)="removeEvent(event.id)" title="Remove event">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>
      <div *ngIf="events.length === 0" class="empty">
        <p>No events recorded yet.</p>
      </div>

      <mat-card class="add-event-card">
        <mat-card-header>
          <mat-card-title>Add Event</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Event type</mat-label>
            <mat-select [(ngModel)]="eventKind">
              <mat-option value="claim">Claim</mat-option>
              <mat-option value="death">Death</mat-option>
              <mat-option value="execution">Execution</mat-option>
            </mat-select>
          </mat-form-field>

          <div *ngIf="eventKind === 'claim'">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Player</mat-label>
              <mat-select [(ngModel)]="claimPlayerId">
                <mat-option *ngFor="let p of players" [value]="p.id">{{ p.name }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Role</mat-label>
              <mat-select [(ngModel)]="claimRole">
                <mat-option *ngFor="let role of roles" [value]="role.id">{{ role.name }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div *ngIf="eventKind === 'death' || eventKind === 'execution'">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Player</mat-label>
              <mat-select [(ngModel)]="deathPlayerId">
                <mat-option *ngFor="let p of players" [value]="p.id">{{ p.name }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="addEvent()">
            <mat-icon>add</mat-icon> Add Event
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .page {
      padding: 16px;
    }
    h1 {
      margin-top: 0;
    }
    .event-list {
      width: 100%;
    }
    .event-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .event-icon {
      margin-right: 12px;
      margin-top: 2px;
      flex-shrink: 0;
    }
    .event-content {
      flex: 1;
      min-width: 0;
    }
    .event-description {
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;
    }
    .event-meta {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    .add-event-card {
      margin-top: 24px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }
  `]
})
export class LogComponent implements OnInit {
  events: any[] = [];
  players: any[] = [];
  roles: any[] = [];
  eventKind = 'claim';
  claimPlayerId = '';
  claimRole = '';
  deathPlayerId = '';

  constructor(private gameState: GameStateService) {}

  ngOnInit() {
    this.refreshState();
  }

  refreshState() {
    this.events = this.gameState.getEvents();
    this.players = this.gameState.getPlayers();
    const script = this.gameState.getScript();
    this.roles = script ? script.characters : [];
    if (this.players.length > 0) {
      this.claimPlayerId = this.players[0].id;
      this.deathPlayerId = this.players[0].id;
    }
    if (this.roles.length > 0) {
      this.claimRole = this.roles[0].id;
    }
  }

  getEventIcon(kind: string): string {
    switch (kind) {
      case 'claim': return 'chat';
      case 'death': return 'skull';
      case 'execution': return 'gavel';
      default: return 'event';
    }
  }

  getEventDescription(event: any): string {
    switch (event.kind) {
      case 'claim':
        const player = this.players.find(p => p.id === event.actorId);
        const role = this.roles.find(r => r.id === event.payload.claimedRole);
        return `${player?.name || 'Player'} claims to be ${role?.name || event.payload.claimedRole}`;
      case 'death':
        const deadPlayer = this.players.find(p => p.id === event.payload.playerId);
        return `${deadPlayer?.name || 'Player'} died`;
      case 'execution':
        const execPlayer = this.players.find(p => p.id === event.payload.executedPlayerId);
        return `${execPlayer?.name || 'Player'} was executed`;
      default:
        return `${event.kind}`;
    }
  }

  addEvent() {
    switch (this.eventKind) {
      case 'claim':
        this.gameState.addClaim(this.claimPlayerId, this.claimRole);
        break;
      case 'death':
        this.gameState.addDeath(this.deathPlayerId, 1);
        break;
      case 'execution':
        this.gameState.addExecution(this.deathPlayerId);
        break;
    }
    this.events = this.gameState.getEvents();
    this.players = this.gameState.getPlayers();
  }

  removeEvent(eventId: string) {
    this.gameState.removeEvent(eventId);
    this.events = this.gameState.getEvents();
  }
}
