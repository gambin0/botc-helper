import { Component, OnInit, effect } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [NgIf, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDialogModule],
  template: `
    <div class="page">
      <h1 mat-title>Game</h1>
      <mat-card *ngIf="script">
        <mat-card-header>
          <mat-card-title>{{ script.name }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Players:</strong> {{ players.length }} ({{ aliveCount }} alive)</p>
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
          <button mat-button color="accent" (click)="confirmNewGame()">
            <mat-icon>restart_alt</mat-icon> New Game
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
  aliveCount = 0;

  constructor(
    private gameState: GameStateService,
    private dialog: MatDialog
  ) {
    // Reactively update when events change
    effect(() => {
      this.gameState.deductions(); // trigger reactivity
      this.players = this.gameState.getPlayers();
      this.hasGame = this.gameState.hasGame();
      this.script = this.gameState.getScript();
      this.aliveCount = this.players.filter(p => p.alive).length;
    });
  }

  ngOnInit() {
    this.refreshState();
  }

  refreshState() {
    this.players = this.gameState.getPlayers();
    this.hasGame = this.gameState.hasGame();
    this.script = this.gameState.getScript();
    this.aliveCount = this.players.filter(p => p.alive).length;
  }

  createGame() {
    this.gameState.createGame('Test Game', this.playerCount);
    this.players = this.gameState.getPlayers();
    this.hasGame = true;
    this.aliveCount = this.players.length;
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
    }
  }

  confirmNewGame() {
    const dialogRef = this.dialog.open(NewGameDialog, {
      width: '300px',
      data: { playerCount: this.players.length }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.gameState.resetGame();
        this.players = [];
        this.hasGame = false;
        this.script = null;
        this.aliveCount = 0;
      }
    });
  }
}

import { Component as DialogComponent } from '@angular/core';

@DialogComponent({
  selector: 'app-new-game-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>New Game</h2>
    <mat-dialog-content>
      <p>Are you sure you want to start a new game?</p>
      <p>All current game data will be lost.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="warn" mat-dialog-close="true">Start New Game</button>
    </mat-dialog-actions>
  `
})
class NewGameDialog {}
