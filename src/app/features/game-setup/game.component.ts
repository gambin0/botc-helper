import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-new-game-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>New Game</h2>
    <mat-dialog-content>
      <p>Are you sure you want to start a new game?</p>
      <p>All current game data will be lost.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Start New Game</button>
    </mat-dialog-actions>
  `
})
class NewGameDialog {}

@Component({
  selector: 'app-game',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule
  ],
  template: `
    <main class="page">
      <h1>Game</h1>

      @if (hasGame() && script(); as s) {
        <mat-card>
          <mat-card-header>
            <mat-card-title>{{ s.name }}</mat-card-title>
            <mat-card-subtitle>{{ game()?.name || 'Active Game' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p><strong>Players:</strong> {{ players().length }} ({{ alivePlayers().length }} alive)</p>
          </mat-card-content>
        </mat-card>
      }

      @if (!hasGame()) {
        <mat-card>
          <mat-card-header>
            <mat-card-title>Start Game</mat-card-title>
            <mat-card-subtitle>Role pool: {{ script()?.name || 'Trouble Brewing' }} (change on the Scripts tab)</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Number of players (5-15)</mat-label>
              <input matInput type="number" [(ngModel)]="playerCount" min="5" max="15">
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="createGame()">
              <mat-icon aria-hidden="true">play_arrow</mat-icon> Start game
            </button>
          </mat-card-actions>
        </mat-card>
      }

      @if (hasGame()) {
        <button mat-stroked-button (click)="confirmNewGame()">
          <mat-icon aria-hidden="true">restart_alt</mat-icon> New game
        </button>
      }
    </main>
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
  `]
})
export class GameComponent {
  private gameState = inject(GameStateService);
  private dialog = inject(MatDialog);

  readonly script = this.gameState.script;
  readonly game = this.gameState.game;
  readonly players = this.gameState.players;
  readonly alivePlayers = this.gameState.alivePlayers;
  readonly hasGame = this.gameState.hasGame;

  playerCount = 8;

  createGame(): void {
    const count = Math.max(5, Math.min(15, Number(this.playerCount) || 8));
    this.gameState.createGame('Game 1', count);
  }

  confirmNewGame(): void {
    const dialogRef = this.dialog.open(NewGameDialog, {
      width: '320px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.gameState.resetGame();
      }
    });
  }
}
