import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-log',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  template: `
    <div class="page">
      <h1>Event Log</h1>
      <div *ngIf="events.length === 0" class="empty">
        <p>No events recorded yet.</p>
      </div>
      <div *ngFor="let event of events" class="event-card">
        <div class="event-header">
          <span class="night">Night {{ event.night }}</span>
          <span class="phase">{{ event.phase }}</span>
        </div>
        <div class="event-body">
          <p>{{ getEventDescription(event) }}</p>
        </div>
      </div>

      <div class="add-event">
        <h3>Add Event</h3>
        <select [(ngModel)]="eventKind">
          <option value="claim">Claim</option>
          <option value="death">Death</option>
          <option value="execution">Execution</option>
        </select>

        <div *ngIf="eventKind === 'claim'">
          <select [(ngModel)]="claimPlayerId">
            <option *ngFor="let p of players" [value]="p.id">{{ p.name }}</option>
          </select>
          <select [(ngModel)]="claimRole">
            <option *ngFor="let role of roles" [value]="role.id">{{ role.name }}</option>
          </select>
          <button (click)="addClaim()">Add Claim</button>
        </div>

        <div *ngIf="eventKind === 'death'">
          <select [(ngModel)]="deathPlayerId">
            <option *ngFor="let p of players" [value]="p.id">{{ p.name }}</option>
          </select>
          <button (click)="addDeath()">Add Death</button>
        </div>

        <div *ngIf="eventKind === 'execution'">
          <select [(ngModel)]="execPlayerId">
            <option *ngFor="let p of players" [value]="p.id">{{ p.name }}</option>
          </select>
          <button (click)="addExecution()">Add Execution</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      padding: 16px;
    }
    h1 {
      margin-top: 0;
    }
    .event-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .event-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;
      color: #666;
    }
    .add-event {
      margin-top: 24px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }
    select {
      width: 100%;
      padding: 8px;
      margin-bottom: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      width: 100%;
      padding: 12px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
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
  execPlayerId = '';

  constructor(private gameState: GameStateService) {}

  ngOnInit() {
    this.events = this.gameState.getEvents();
    this.players = this.gameState.getPlayers();
    const script = this.gameState.getScript();
    this.roles = script ? script.characters : [];
    if (this.players.length > 0) {
      this.claimPlayerId = this.players[0].id;
      this.deathPlayerId = this.players[0].id;
      this.execPlayerId = this.players[0].id;
    }
    if (this.roles.length > 0) {
      this.claimRole = this.roles[0].id;
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
        return `${event.kind}: ${JSON.stringify(event.payload)}`;
    }
  }

  addClaim() {
    this.gameState.addClaim(this.claimPlayerId, this.claimRole);
    this.events = this.gameState.getEvents();
  }

  addDeath() {
    this.gameState.addDeath(this.deathPlayerId, 1);
    this.events = this.gameState.getEvents();
    this.players = this.gameState.getPlayers();
  }

  addExecution() {
    this.gameState.addExecution(this.execPlayerId);
    this.events = this.gameState.getEvents();
  }
}
