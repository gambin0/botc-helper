import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GameStateService } from '../../core/services/game-state.service';
import { ThemeService } from '../../core/services/theme.service';
import { RosterService } from '../../core/services/roster.service';
import { seatNamesFrom } from '../../core/players/roster';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { SetupCountsComponent } from '../../shared/setup-counts/setup-counts.component';

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
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    SetupCountsComponent
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
            <app-setup-counts [playerCount]="players().length" [characters]="roles()" />
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
              <input matInput type="number" min="5" max="15" [value]="playerCount()" (input)="setCount($event)">
            </mat-form-field>
            <app-setup-counts [playerCount]="clampedCount()" [characters]="roles()" />
            @if (lastPlayers(); as last) {
              <mat-checkbox [checked]="keepPlayers()" (change)="keepPlayers.set($event.checked)">
                Keep the players from the last game
              </mat-checkbox>
              @if (keepPlayers()) {
                <p class="note">
                  {{ seatPreview() }}
                  @if (last.count !== clampedCount()) {
                    <br />The last game had {{ last.count }} players:
                    {{ clampedCount() > last.count ? 'the extra seats start unnamed.' : 'only the first ' + clampedCount() + ' are kept.' }}
                  }
                  <br />You can rearrange seats on the Players tab before logging anything.
                </p>
              }
            }
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="createGame()">
              <mat-icon aria-hidden="true">play_arrow</mat-icon> Start game
            </button>
          </mat-card-actions>
        </mat-card>
      }

      @if (roster.knownNames().length > 0) {
        <mat-card>
          <mat-card-content>
            <details>
              <summary><h2 class="setting inline">Remembered player names ({{ roster.knownNames().length }})</h2></summary>
              <p class="note">Suggested when you name a seat. Kept only on this device.</p>
              <ul class="names">
                @for (name of roster.knownNames(); track name) {
                  <li>
                    <span>{{ name }}</span>
                    <button mat-icon-button (click)="roster.forget(name)" [attr.aria-label]="'Forget ' + name">
                      <mat-icon aria-hidden="true">close</mat-icon>
                    </button>
                  </li>
                }
              </ul>
            </details>
          </mat-card-content>
        </mat-card>
      }

      <mat-card>
        <mat-card-content>
          <h2 class="setting">Appearance</h2>
          <mat-button-toggle-group
            aria-label="Appearance"
            [value]="theme.mode()"
            (change)="theme.setMode($event.value)"
          >
            <mat-button-toggle value="system">System</mat-button-toggle>
            <mat-button-toggle value="light">Light</mat-button-toggle>
            <mat-button-toggle value="dark">Dark</mat-button-toggle>
          </mat-button-toggle-group>
        </mat-card-content>
      </mat-card>

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
    .setting {
      font-size: 1rem;
      margin: 0 0 8px;
    }
    .full-width {
      width: 100%;
    }
    .note {
      color: var(--app-muted);
      font-size: 0.85rem;
    }
    .inline {
      display: inline;
    }
    summary {
      cursor: pointer;
      min-height: 44px;
      display: flex;
      align-items: center;
    }
    .names {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
    }
    .names li {
      display: inline-flex;
      align-items: center;
    }
  `]
})
export class GameComponent {
  private gameState = inject(GameStateService);
  private dialog = inject(MatDialog);
  protected readonly theme = inject(ThemeService);

  readonly script = this.gameState.script;
  readonly game = this.gameState.game;
  readonly players = this.gameState.players;
  readonly alivePlayers = this.gameState.alivePlayers;
  readonly hasGame = this.gameState.hasGame;

  protected readonly roster = inject(RosterService);

  readonly roles = this.gameState.activeRoles;
  /** Defaults to the last game's size when there is one. */
  readonly playerCount = linkedSignal(() => this.roster.lastSeating().length || 8);
  readonly keepPlayers = signal(true);

  /** The last game's players, if any of them were named. */
  protected readonly lastPlayers = computed(() => {
    const seating = this.roster.lastSeating();
    return seating.some(name => name !== null) ? { count: seating.length } : null;
  });

  protected readonly seatPreview = computed(() =>
    seatNamesFrom(this.roster.lastSeating(), this.clampedCount())
      .map((name, i) => `${i + 1}. ${name}`)
      .join(', ')
  );

  clampedCount(): number {
    return Math.max(5, Math.min(15, Math.round(this.playerCount()) || 8));
  }

  setCount(event: Event): void {
    this.playerCount.set(Number((event.target as HTMLInputElement).value));
  }

  createGame(): void {
    const names = this.lastPlayers() && this.keepPlayers() ? seatNamesFrom(this.roster.lastSeating(), this.clampedCount()) : [];
    this.gameState.createGame('Game 1', this.clampedCount(), names);
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
