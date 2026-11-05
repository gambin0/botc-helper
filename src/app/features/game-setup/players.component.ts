import { Component, DOCUMENT, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
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
import { RosterService } from '../../core/services/roster.service';
import { nameSuggestions } from '../../core/players/roster';

@Component({
  selector: 'app-players',
  imports: [
    RouterLink,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    MatAutocompleteModule,
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
      @if (seated().length > 0) {
        @if (gameState.canRearrangeSeats()) {
          <mat-card class="card">
            <mat-card-content>
              <h2 class="seating-title">Seating</h2>
              <p class="note">
                Drag players, or use the arrows, to match where people sit. Only the order around the circle
                matters. You can rearrange seats until you log something.
              </p>
              <ol class="seating" cdkDropList (cdkDropListDropped)="dropped($event)" aria-label="Seating order">
                @for (p of seated(); track p.id; let first = $first; let last = $last) {
                  <li class="seat-row" cdkDrag cdkDragLockAxis="y">
                    <span class="handle" cdkDragHandle aria-hidden="true"><mat-icon>drag_indicator</mat-icon></span>
                    <span class="seat-no" aria-hidden="true">{{ p.seat }}</span>
                    <span class="seat-name">{{ p.name }}</span>
                    <button mat-icon-button [id]="'up-' + p.id" [disabled]="first" (click)="move(p.id, p.seat - 1, 'up')"
                            [attr.aria-label]="'Move ' + p.name + ' up to seat ' + (p.seat - 1)">
                      <mat-icon aria-hidden="true">arrow_upward</mat-icon>
                    </button>
                    <button mat-icon-button [id]="'down-' + p.id" [disabled]="last" (click)="move(p.id, p.seat + 1, 'down')"
                            [attr.aria-label]="'Move ' + p.name + ' down to seat ' + (p.seat + 1)">
                      <mat-icon aria-hidden="true">arrow_downward</mat-icon>
                    </button>
                  </li>
                }
              </ol>
              <!-- Always present so screen readers announce each move. -->
              <p class="visually-hidden" role="status">{{ moveStatus() }}</p>
            </mat-card-content>
          </mat-card>
        } @else {
          <p class="note">Seats are fixed once something is logged, because logged info depends on who sat where.</p>
        }
      }
      @for (card of cards(); track card.player.id) {
        <mat-card class="card" [class.self]="card.isSelf">
          <mat-card-content>
            <div class="head">
              <span class="seat" aria-hidden="true">{{ card.player.seat }}</span>
              <mat-form-field appearance="outline" class="name" subscriptSizing="dynamic">
                <mat-label>Seat {{ card.player.seat }} name</mat-label>
                <input
                  matInput
                  [value]="card.player.name"
                  [matAutocomplete]="names"
                  (focus)="typed.set({ id: card.player.id, text: '' })"
                  (input)="typed.set({ id: card.player.id, text: inputValue($event) })"
                  (change)="rename(card.player, $event)"
                />
                <mat-autocomplete #names="matAutocomplete" (optionSelected)="renameTo(card.player, $event.option.value)">
                  @for (name of suggestionsFor(card.player); track name) {
                    <mat-option [value]="name">{{ name }}</mat-option>
                  }
                </mat-autocomplete>
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
    .note { color: var(--app-muted); font-size: 0.85rem; }
    .seating-title { font-size: 1rem; margin: 0 0 4px; }
    .seating { list-style: none; padding: 0; margin: 0; }
    .seat-row {
      display: flex; align-items: center; gap: 8px; padding: 2px 4px;
      border-radius: 8px; background: var(--mat-sys-surface-container, transparent);
    }
    .handle { cursor: grab; display: inline-flex; color: var(--app-muted); }
    .seat-no { width: 1.5rem; text-align: right; font-weight: 700; }
    .seat-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cdk-drag-preview { box-shadow: 0 4px 12px rgb(0 0 0 / 30%); }
    .cdk-drag-placeholder { opacity: 0.4; }
    .visually-hidden {
      position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
      overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
    }
  `
})
export class PlayersComponent {
  protected readonly gameState = inject(GameStateService);
  private readonly roster = inject(RosterService);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  /** Players in seat order. */
  protected readonly seated = computed(() => [...this.gameState.players()].sort((a, b) => a.seat - b.seat));
  /** Announced after a seat move, for screen readers. */
  protected readonly moveStatus = signal('');
  /** What is being typed in which seat's name field, for suggestions. */
  protected readonly typed = signal<{ id: string; text: string } | null>(null);

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
    this.renameTo(player, this.inputValue(event));
  }

  protected renameTo(player: Player, value: string): void {
    const name = value.trim();
    if (name && name !== player.name) this.gameState.updatePlayer({ ...player, name });
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  /** Remembered names for this seat's field, leaving out everyone else at the table. */
  protected suggestionsFor(player: Player): string[] {
    const typed = this.typed();
    const text = typed?.id === player.id ? typed.text : '';
    const taken = this.gameState.players().filter(p => p.id !== player.id).map(p => p.name);
    return nameSuggestions(this.roster.knownNames(), text, taken);
  }

  /**
   * Moves a player and announces it. With `via`, keeps keyboard focus on that
   * player's arrow (or the other one, if the player reached the top or bottom).
   */
  protected move(playerId: string, toSeat: number, via?: 'up' | 'down'): void {
    this.gameState.movePlayer(playerId, toSeat);
    const moved = this.gameState.players().find(p => p.id === playerId);
    if (!moved) return;
    const count = this.gameState.players().length;
    this.moveStatus.set(`${moved.name} moved to seat ${moved.seat} of ${count}.`);
    if (!via) return;
    const atEnd = via === 'up' ? moved.seat === 1 : moved.seat === count;
    const target = atEnd ? (via === 'up' ? 'down' : 'up') : via;
    afterNextRender(() => this.document.getElementById(`${target}-${playerId}`)?.focus(), { injector: this.injector });
  }

  protected dropped(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;
    const player = this.seated()[event.previousIndex];
    if (player) this.move(player.id, event.currentIndex + 1);
  }

  protected toggleSelf(player: Player): void {
    if (this.gameState.selfPlayerId() === player.id) this.gameState.clearSelf();
    else this.gameState.setSelf(player.id);
  }
}
