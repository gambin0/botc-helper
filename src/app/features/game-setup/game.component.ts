import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [NgIf, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <div class="page">
      <h1 mat-title>Game</h1>
      <mat-card *ngIf="script">
        <mat-card-header>
          <mat-card-title>{{ script.name }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Players:</strong> {{ players.length }}</p>
        </mat-card-content>
      </mat-card>
      <mat-card *ngIf="!script">
        <mat-card-content>
          <p>No script loaded. Go to Scripts tab to import one.</p>
        </mat-card-content>
      </mat-card>
      <mat-card *ngIf="script && !hasGame">
        <mat-card-header>
          <mat-card-title>Create Game</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Number of players</mat-label>
            <input matInput type="number" [(ngModel)]="playerCount" min="5" max="15" value="8">
          </mat-form-field>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="createGame()">
            <mat-icon>add</mat-icon> Create
          </button>
        </mat-card-actions>
      </mat-card>
      <mat-card *ngIf="hasGame">
        <mat-card-header>
          <mat-card-title>Quick Actions</mat-card-title>
        </mat-card-header>
        <mat-card-actions>
          <button mat-button color="primary" (click)="addRandomClaim()">
            <mat-icon>chat</mat-icon> Add Test Claim
          </button>
          <button mat-button color="warn" (click)="addRandomDeath()">
            <mat-icon>skull</mat-icon> Add Test Death
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
    mat-card {
      margin-bottom: 16px;
    }
    .full-width {
      width: 100%;
    }
    mat-card-actions {
      justify-content: center;
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
