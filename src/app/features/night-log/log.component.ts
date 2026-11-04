import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../core/services/game-state.service';
import { GameEvent } from '../../core/models/game';

@Component({
  selector: 'app-log',
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <div class="page">
      <h1>Event Log</h1>
      @if (events().length > 0) {
        <div class="event-list">
          @for (event of events(); track event.id) {
            <div class="event-item">
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
          }
        </div>
      } @else {
        <div class="empty">
          <p>No events recorded yet.</p>
        </div>
      }

      @if (!hasGame() || players().length === 0) {
        <mat-card class="add-event-card">
          <mat-card-content>
            <p>Start a game on the Game tab to record claims and events.</p>
          </mat-card-content>
        </mat-card>
      } @else {
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

            @if (eventKind === 'claim') {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Player</mat-label>
                <mat-select [(ngModel)]="claimPlayerId">
                  @for (p of players(); track p.id) {
                    <mat-option [value]="p.id">{{ p.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Role</mat-label>
                <mat-select [(ngModel)]="claimRole">
                  @for (role of roles(); track role.id) {
                    <mat-option [value]="role.id">{{ role.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }

            @if (eventKind === 'death' || eventKind === 'execution') {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Player</mat-label>
                <mat-select [(ngModel)]="deathPlayerId">
                  @for (p of players(); track p.id) {
                    <mat-option [value]="p.id">{{ p.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="addEvent()">
              <mat-icon>add</mat-icon> Add Event
            </button>
          </mat-card-actions>
        </mat-card>
      }
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
export class LogComponent {
  private gameState = inject(GameStateService);

  readonly events = this.gameState.events;
  readonly players = this.gameState.players;
  readonly hasGame = this.gameState.hasGame;
  readonly roles = computed(() => this.gameState.script()?.characters ?? []);

  eventKind = 'claim';
  claimPlayerId = '';
  claimRole = '';
  deathPlayerId = '';

  getEventIcon(kind: string): string {
    switch (kind) {
      case 'claim': return 'chat';
      case 'death': return 'cancel';
      case 'execution': return 'gavel';
      case 'resurrection': return 'favorite';
      default: return 'event';
    }
  }

  getEventDescription(event: GameEvent): string {
    const players = this.players();
    const roles = this.roles();
    switch (event.kind) {
      case 'claim': {
        const payload = event.payload as { claimedRole?: string } | undefined;
        const player = players.find(p => p.id === event.actorId);
        const role = roles.find(r => r.id === payload?.claimedRole);
        return `${player?.name || 'Player'} claims to be ${role?.name || payload?.claimedRole || 'unknown'}`;
      }
      case 'death': {
        const payload = event.payload as { playerId?: string } | undefined;
        const deadPlayer = players.find(p => p.id === payload?.playerId);
        return `${deadPlayer?.name || 'Player'} died`;
      }
      case 'execution': {
        const payload = event.payload as { executedPlayerId?: string; playerId?: string; revealedRole?: string } | undefined;
        const targetId = payload?.executedPlayerId || payload?.playerId;
        const execPlayer = players.find(p => p.id === targetId);
        const roleInfo = payload?.revealedRole ? ` (revealed ${payload.revealedRole})` : '';
        return `${execPlayer?.name || 'Player'} was executed${roleInfo}`;
      }
      case 'resurrection': {
        const payload = event.payload as { playerId?: string } | undefined;
        const revivedPlayer = players.find(p => p.id === payload?.playerId);
        return `${revivedPlayer?.name || 'Player'} was resurrected`;
      }
      default:
        return `${event.kind}`;
    }
  }

  addEvent(): void {
    if (!this.hasGame() || this.players().length === 0) {
      return;
    }
    const players = this.players();
    const roles = this.roles();

    // Pick random player and role for more interesting test data
    const randomPlayer = players[Math.floor(Math.random() * players.length)];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];

    switch (this.eventKind) {
      case 'claim': {
        const actorId = this.claimPlayerId || randomPlayer?.id;
        const roleId = this.claimRole || randomRole?.id;
        if (actorId && roleId) {
          this.gameState.addClaim(actorId, roleId);
        }
        // Reset form so next click picks random again
        this.claimPlayerId = '';
        this.claimRole = '';
        break;
      }
      case 'death': {
        const targetId = this.deathPlayerId || randomPlayer?.id;
        if (targetId) {
          this.gameState.addDeath(targetId, 1);
        }
        this.deathPlayerId = '';
        break;
      }
      case 'execution': {
        const targetId = this.deathPlayerId || randomPlayer?.id;
        if (targetId) {
          this.gameState.addExecution(targetId);
        }
        this.deathPlayerId = '';
        break;
      }
    }
  }

  removeEvent(eventId: string): void {
    this.gameState.removeEvent(eventId);
  }
}