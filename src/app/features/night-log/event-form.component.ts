import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { GameStateService } from '../../core/services/game-state.service';
import { ClaimTrust } from '../../core/models/game';
import { InfoPayload, InfoSpec, allInfoSpecs } from '../../core/rules/info-specs';
import { InfoFieldsComponent, isInfoComplete } from '../../shared/info-fields/info-fields.component';

type EntryKind = 'claim' | 'info' | 'death' | 'execution';

const TRUST_OPTIONS: { value: ClaimTrust; label: string; hint: string }[] = [
  { value: 'asserted', label: 'Claimed', hint: 'True if they are good (optional assumption)' },
  { value: 'doubted', label: 'Doubted', hint: 'May be a bluff, even from a good player' },
  { value: 'confirmed', label: 'Confirmed', hint: 'Known to be their true character' },
  { value: 'false', label: 'Known false', hint: 'Known NOT to be their character' }
];

@Component({
  selector: 'app-event-form',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    InfoFieldsComponent
  ],
  template: `
    <mat-card class="card">
      <mat-card-header>
        <mat-card-title><h2 class="title">Add evidence</h2></mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="row">
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Type</mat-label>
            <mat-select [value]="kind()" (selectionChange)="kind.set($event.value)">
              <mat-option value="claim">Claim</mat-option>
              <mat-option value="info">Ability / night info</mat-option>
              <mat-option value="death">Death</mat-option>
              <mat-option value="execution">Execution</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="night">
            <mat-label>Night</mat-label>
            <input matInput type="number" min="1" [value]="night()" (input)="night.set(toNumber($event))" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full">
          <mat-label>{{ playerLabel() }}</mat-label>
          <mat-select [value]="player()" (selectionChange)="player.set($event.value)">
            @for (p of players(); track p.id) {
              <mat-option [value]="p.id">{{ p.seat }}. {{ p.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @switch (kind()) {
          @case ('claim') {
            <mat-form-field appearance="outline" class="full">
              <mat-label>Character claimed</mat-label>
              <mat-select [value]="claimRole()" (selectionChange)="claimRole.set($event.value)">
                @for (r of roles(); track r.id) {
                  <mat-option [value]="r.id">{{ r.name }} ({{ r.team }})</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-radio-group class="radios" aria-label="How much to trust this claim" [value]="trust()" (change)="trust.set($event.value)">
              @for (t of trustOptions; track t.value) {
                <mat-radio-button [value]="t.value">
                  {{ t.label }} <span class="hint">— {{ t.hint }}</span>
                </mat-radio-button>
              }
            </mat-radio-group>
          }
          @case ('info') {
            <mat-form-field appearance="outline" class="full">
              <mat-label>Ability used</mat-label>
              <mat-select [value]="infoType()" (selectionChange)="infoType.set($event.value)">
                @for (s of specs(); track s.roleId) {
                  <mat-option [value]="s.roleId">{{ gameState.roleName(s.roleId) }}</mat-option>
                }
              </mat-select>
              @if (spec(); as s) {
                <mat-hint>{{ s.prompt }}</mat-hint>
              }
            </mat-form-field>
            @if (spec(); as s) {
              <app-info-fields [spec]="s" [(info)]="info" />
            }
          }
          @case ('execution') {
            <mat-checkbox [checked]="gameEnded()" (change)="gameEnded.set($event.checked)">
              The game ended because of this execution
            </mat-checkbox>
          }
        }
      </mat-card-content>
      <mat-card-actions>
        <button mat-flat-button [disabled]="!canSubmit()" (click)="submit()">
          <mat-icon aria-hidden="true">add</mat-icon> Add
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    .card { margin-top: 24px; }
    .title { font-size: 1.25rem; margin: 0; }
    .row { display: flex; gap: 8px; }
    .grow { flex: 1; }
    .night { width: 96px; }
    .full { width: 100%; }
    .radios { display: flex; flex-direction: column; margin-bottom: 12px; }
    .radio-label { font-weight: 500; margin-top: 4px; }
    .hint { color: var(--app-muted); font-size: 0.85em; }
  `
})
export class EventFormComponent {
  protected readonly gameState = inject(GameStateService);
  protected readonly players = this.gameState.players;
  protected readonly roles = this.gameState.activeRoles;
  protected readonly trustOptions = TRUST_OPTIONS;

  protected readonly kind = signal<EntryKind>('claim');
  protected readonly night = linkedSignal(() => this.gameState.currentNight());
  protected readonly player = signal<string>('');
  protected readonly claimRole = signal<string>('');
  protected readonly trust = signal<ClaimTrust>('asserted');
  protected readonly gameEnded = signal(false);
  protected readonly infoType = signal<string>('');
  /** Info field values; reset whenever the ability changes. */
  protected readonly info = linkedSignal<string, InfoPayload>({
    source: this.infoType,
    computation: type => ({ type })
  });

  /** Abilities with deduction rules, limited to roles in the current pool. */
  protected readonly specs = computed<readonly InfoSpec[]>(() => {
    const pool = new Set(this.roles().map(r => r.id));
    return allInfoSpecs().filter(s => pool.has(s.roleId));
  });
  protected readonly spec = computed(() => this.specs().find(s => s.roleId === this.infoType()));

  protected readonly playerLabel = computed(() => {
    switch (this.kind()) {
      case 'claim': return 'Player making the claim';
      case 'info': return 'Player who received the info';
      case 'death': return 'Player who died';
      case 'execution': return 'Player executed';
    }
  });

  protected readonly canSubmit = computed(() => {
    if (!this.player() || this.night() < 1) return false;
    switch (this.kind()) {
      case 'claim':
        return !!this.claimRole();
      case 'info':
        return isInfoComplete(this.spec(), this.info());
      default:
        return true;
    }
  });

  protected toNumber(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    const player = this.player();
    const night = this.night();
    switch (this.kind()) {
      case 'claim':
        this.gameState.addClaim(player, this.claimRole(), this.trust(), night);
        this.claimRole.set('');
        break;
      case 'info':
        this.gameState.addInfo(player, this.info(), night);
        this.info.set({ type: this.infoType() });
        break;
      case 'death':
        this.gameState.addDeath(player, night);
        break;
      case 'execution':
        this.gameState.addExecution(player, night, this.gameEnded());
        this.gameEnded.set(false);
        break;
    }
    this.player.set('');
  }
}
