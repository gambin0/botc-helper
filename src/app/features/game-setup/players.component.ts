import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { GameStateService } from '../../core/services/game-state.service';
import { Player } from '../../core/models/game';
import { CharacterImageComponent } from '../../shared/character-image/character-image.component';
import { RoleGuideComponent } from './role-guide.component';
import { ClaimTestComponent } from './claim-test.component';
import { RevealToggleComponent } from '../../shared/reveal-toggle/reveal-toggle.component';

@Component({
  selector: 'app-players',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    CharacterImageComponent,
    RoleGuideComponent,
    ClaimTestComponent,
    RevealToggleComponent
  ],
  template: `
    <main class="page">
      <h1>Players</h1>
      @if (cards().length === 0) {
        <p>No players. Start a game first.</p>
        <a mat-flat-button routerLink="/game">Go to game setup</a>
      }
      @if (!gameState.deductions().consistent) {
        <div class="conflict" role="alert">
          <strong>The evidence contradicts itself.</strong>
          @if (gameState.deductions().ignoredEvidence.length > 0) {
            Possibilities below ignore:
            @for (e of gameState.deductions().ignoredEvidence; track e.id) {
              <em>{{ gameState.evidenceLabel(e) }}</em>{{ $last ? '.' : ';' }}
            }
          }
          <a routerLink="/deduce">See details</a>
        </div>
      }
      @for (warning of selfWarnings(); track warning) {
        <p class="conflict">{{ warning }}</p>
      }
      @for (card of cards(); track card.player.id) {
        <mat-card class="card" [class.self]="card.isSelf">
          <mat-card-content>
            <div class="head">
              <span class="seat" aria-hidden="true">{{ card.player.seat }}</span>
              <mat-form-field appearance="outline" class="name" subscriptSizing="dynamic">
                <mat-label>Seat {{ card.player.seat }} name</mat-label>
                <input matInput [value]="card.player.name" (change)="rename(card.player, $event)" />
              </mat-form-field>
            </div>

            <div class="actions">
              <button mat-stroked-button (click)="gameState.togglePlayerAlive(card.player.id)" [attr.aria-pressed]="!card.player.alive">
                <mat-icon aria-hidden="true">{{ card.player.alive ? 'favorite' : 'heart_broken' }}</mat-icon>
                {{ card.player.alive ? 'Alive' : 'Dead' }}
              </button>
              <button mat-stroked-button (click)="toggleSelf(card.player)" [attr.aria-pressed]="card.isSelf">
                <mat-icon aria-hidden="true">person</mat-icon>
                {{ card.isSelf ? 'This is me' : 'Mark as me' }}
              </button>
            </div>

            @if (card.isSelf) {
              <div class="private">
                <app-reveal-toggle class="reveal" />
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Character I was shown (private)</mat-label>
                  <mat-select [value]="gameState.selfRole()" (selectionChange)="gameState.setSelfRole($event.value, gameState.selfRoleCertain())">
                    <mat-select-trigger>
                      {{ gameState.revealSelf() ? gameState.roleName(gameState.selfRole()) : 'Hidden' }}
                    </mat-select-trigger>
                    <mat-option [value]="null">Not set</mat-option>
                    @for (r of gameState.activeRoles(); track r.id) {
                      <mat-option [value]="r.id">{{ r.name }} ({{ r.team }})</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                @if (gameState.selfRole(); as role) {
                  <mat-checkbox [checked]="gameState.selfRoleCertain()" (change)="gameState.setSelfRole(role, $event.checked)">
                    I'm certain (I can't be the Drunk, Lunatic or Marionette)
                  </mat-checkbox>
                  <app-role-guide [roleId]="role" [masked]="!gameState.revealSelf()" />
                }
                <app-claim-test />
              </div>
            }

            @if (card.isSelf && !gameState.revealSelf()) {
              <p class="summary">Your possible characters are hidden.</p>
            } @else {
              <p class="summary">
                {{ card.possible.length }} possible character{{ card.possible.length === 1 ? '' : 's' }}
              </p>
              <ul class="roles">
                @for (roleId of card.possible; track roleId) {
                  <li>
                    <app-character-image [roleId]="roleId" [size]="24" />
                    {{ gameState.roleName(roleId) }}
                  </li>
                }
              </ul>
            }
          </mat-card-content>
        </mat-card>
      }
    </main>
  `,
  styles: `
    .page { padding: 16px; }
    h1 { margin-top: 0; }
    .card { margin-bottom: 16px; }
    .conflict { border-left: 6px solid var(--app-danger-border); background: var(--app-danger-bg); color: var(--mat-sys-on-surface); padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .conflict a { color: var(--app-danger-fg); font-weight: 500; }
    .card.self { outline: 3px solid var(--app-accent); }
    .head { display: flex; align-items: center; gap: 12px; }
    .seat {
      display: inline-flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--app-accent); color: var(--app-on-accent); font-weight: 700; flex-shrink: 0;
    }
    .name { flex: 1; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
    .actions button { flex: 1; min-width: 120px; min-height: 44px; }
    .reveal { display: block; margin-bottom: 12px; }
    .private { border: 2px dashed var(--app-accent); border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .full { width: 100%; }
    .summary { margin: 8px 0 4px; font-weight: 500; }
    .roles { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 4px 12px; }
    .roles li { display: inline-flex; align-items: center; gap: 4px; font-size: 0.9rem; }
  `
})
export class PlayersComponent {
  protected readonly gameState = inject(GameStateService);

  protected readonly cards = computed(() => {
    const selfId = this.gameState.selfPlayerId();
    const result = this.gameState.deductions();
    return this.gameState.players().map(player => ({
      player,
      isSelf: player.id === selfId,
      possible: result.possibleRoles
        .filter(r => r.playerId === player.id && r.status !== 'impossible')
        .map(r => r.roleId)
    }));
  });

  /** Warnings about your own character, e.g. it is not on the current script. */
  protected readonly selfWarnings = computed(() =>
    this.gameState.visibleWarnings().filter(w => w.startsWith('Your character'))
  );

  protected rename(player: Player, event: Event): void {
    const name = (event.target as HTMLInputElement).value.trim();
    if (name && name !== player.name) this.gameState.updatePlayer({ ...player, name });
  }

  protected toggleSelf(player: Player): void {
    if (this.gameState.selfPlayerId() === player.id) this.gameState.clearSelf();
    else this.gameState.setSelf(player.id);
  }
}
