import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [NgIf, FormsModule],
  template: `
    <div class="page">
      <h1>Game</h1>
      <div *ngIf="script">
        <p><strong>Script:</strong> {{ script.name }}</p>
        <p><strong>Players:</strong> {{ players.length }}</p>
      </div>
      <div *ngIf="!script">
        <p>No script loaded. Go to Scripts tab to import one.</p>
      </div>
      <div *ngIf="script && !hasGame">
        <h3>Create Game</h3>
        <label>Number of players:</label>
        <input type="number" [(ngModel)]="playerCount" min="5" max="15" value="8">
        <button (click)="createGame()">Create</button>
      </div>
      <div *ngIf="hasGame">
        <h3>Quick Actions</h3>
        <button (click)="addRandomClaim()">Add Test Claim</button>
        <button (click)="addRandomDeath()">Add Test Death</button>
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
    label {
      display: block;
      margin: 8px 0 4px 0;
    }
    input {
      width: 100%;
      padding: 8px;
      margin-bottom: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      padding: 8px 16px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 8px;
      margin-bottom: 8px;
    }
  `]
})
export class GameComponent implements OnInit {
  script: any = null;
  players: any[] = [];
  hasGame = false;
  playerCount = 8;

  constructor(private gameState: GameStateService) {}

  ngOnInit() {
    this.script = this.gameState.getScript();
    this.players = this.gameState.getPlayers();
    this.hasGame = this.gameState.hasGame();
  }

  createGame() {
    this.gameState.createGame('Test Game', this.playerCount);
    this.players = this.gameState.getPlayers();
    this.hasGame = true;
  }

  addRandomClaim() {
    if (this.players.length > 0) {
      const player = this.players[0];
      const script = this.gameState.getScript();
      if (script && script.characters.length > 0) {
        const role = script.characters[0];
        this.gameState.addClaim(player.id, role.id);
      }
    }
  }

  addRandomDeath() {
    const alivePlayers = this.players.filter(p => p.alive);
    if (alivePlayers.length > 0) {
      const player = alivePlayers[0];
      this.gameState.addDeath(player.id, 1);
      this.players = this.gameState.getPlayers();
    }
  }
}
