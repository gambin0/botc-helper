import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { GameStateService } from '../../core/services/game-state.service';
import { InfoPayload, getInfoSpec } from '../../core/rules/info-specs';
import { WhatIfResult, WhatIfVerdict, stressTestClaim } from '../../core/solver/what-if';
import { InfoFieldsComponent, isInfoComplete } from '../../shared/info-fields/info-fields.component';

const VERDICT_LABEL: Record<WhatIfVerdict, string> = {
  contradiction: 'Contradiction',
  exposed: 'You would be exposed',
  reveals: 'Reveals information',
  quiet: 'Fits'
};

/** "If I claim X and say Y, what can the table deduce?" */
@Component({
  selector: 'app-claim-test',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule, InfoFieldsComponent],
  template: `
    <details class="panel">
      <summary>Test a claim before you make it</summary>
      <p class="note">
        Shows what the table could work out from your claim, assuming they know everything in your log
        but not your real character.
      </p>
      <div class="row">
        <mat-form-field appearance="outline" class="grow">
          <mat-label>Character to claim</mat-label>
          <mat-select [value]="roleId()" (selectionChange)="roleId.set($event.value)">
            @for (r of gameState.activeRoles(); track r.id) {
              <mat-option [value]="r.id">{{ r.name }} ({{ r.team }})</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="night">
          <mat-label>Night</mat-label>
          <input matInput type="number" min="1" [value]="night()" (input)="night.set(toNumber($event))" />
        </mat-form-field>
      </div>

      @if (spec(); as s) {
        <mat-checkbox [checked]="withInfo()" (change)="withInfo.set($event.checked)">
          Also say what I learnt as the {{ gameState.roleName(s.roleId) }}
        </mat-checkbox>
        @if (withInfo()) {
          <app-info-fields [spec]="s" [(info)]="info" />
          @if (isPublic()) {
            <p class="warn">This outcome happens in front of everyone, so you can't invent it. Use this to check what a real event would reveal.</p>
          }
        }
      }

      <button mat-flat-button [disabled]="!canRun()" (click)="run()">Test claim</button>

      @if (result(); as r) {
        <section class="result" [class]="'result ' + r.verdict" aria-live="polite">
          <h2 class="verdict">{{ verdictLabel[r.verdict] }}</h2>
          <p>{{ r.headline }}</p>
          @if (r.sameClaim.length > 0) {
            <p>Also claiming it: {{ r.sameClaim.join(', ') }}.</p>
          }
          @for (c of r.conflicts; track c) {
            <p class="small">{{ c }}</p>
          }
          @if (r.changes.length > 0) {
            <h3 class="sub">The table could prove</h3>
            <ul>
              @for (c of r.changes; track c.playerId) {
                <li>{{ c.isSelf ? 'You' : c.name }} {{ c.changes.join('; ') }}</li>
              }
            </ul>
          }
          @if (r.ifBelieved.length > 0) {
            <h3 class="sub">If they believe you</h3>
            <ul>
              @for (c of r.ifBelieved; track c.playerId) {
                <li>{{ c.name }} {{ c.changes.join('; ') }}</li>
              }
            </ul>
          }
          @if (r.incomplete) {
            <p class="small">The search limit was reached, so this may be incomplete.</p>
          }
        </section>
      }
    </details>
  `,
  styles: `
    .panel { margin-top: 12px; }
    summary { cursor: pointer; font-weight: 500; min-height: 44px; display: flex; align-items: center; }
    .note, .small { color: var(--app-muted); font-size: 0.85rem; }
    .warn { color: var(--app-danger-fg); font-size: 0.85rem; }
    .row { display: flex; gap: 8px; }
    .grow { flex: 1; }
    .night { width: 96px; }
    .result { margin-top: 12px; padding: 12px; border-radius: 8px; border-left: 6px solid; }
    .result.quiet { border-color: var(--app-ok-border); background: var(--app-ok-bg); }
    .result.reveals { border-color: var(--app-warn-border); background: var(--app-warn-bg); }
    .result.exposed, .result.contradiction { border-color: var(--app-danger-border); background: var(--app-danger-bg); }
    .verdict { font-size: 1.05rem; margin: 0 0 4px; }
    .sub { font-size: 0.95rem; margin: 12px 0 4px; }
    ul { margin: 0; padding-left: 20px; }
  `
})
export class ClaimTestComponent {
  protected readonly gameState = inject(GameStateService);
  protected readonly verdictLabel = VERDICT_LABEL;

  protected readonly roleId = signal('');
  protected readonly night = linkedSignal(() => this.gameState.currentNight());
  protected readonly withInfo = signal(false);
  protected readonly spec = computed(() => getInfoSpec(this.roleId()));
  protected readonly info = linkedSignal<string, InfoPayload>({
    source: this.roleId,
    computation: type => ({ type })
  });

  protected readonly isPublic = computed(() => this.withInfo() && !!this.spec()?.publicWhen?.(this.info()));

  protected readonly canRun = computed(() => {
    if (!this.roleId() || this.night() < 1 || !this.gameState.selfPlayerId()) return false;
    return !this.spec() || !this.withInfo() || isInfoComplete(this.spec(), this.info());
  });

  /** Cleared whenever the inputs or the game change, so it never shows stale results. */
  protected readonly result = linkedSignal<unknown, WhatIfResult | null>({
    source: () => [this.roleId(), this.night(), this.withInfo(), this.info(), this.gameState.events(), this.gameState.players()],
    computation: () => null
  });

  protected toNumber(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }

  protected run(): void {
    const selfPlayerId = this.gameState.selfPlayerId();
    if (!this.canRun() || !selfPlayerId) return;
    this.result.set(
      stressTestClaim({
        characters: this.gameState.activeRoles(),
        players: this.gameState.players(),
        events: this.gameState.events(),
        selfPlayerId,
        claimRoleId: this.roleId(),
        info: this.spec() && this.withInfo() ? this.info() : null,
        night: this.night(),
        options: { assumeGoodPlayersHonest: this.gameState.assumeHonest() }
      })
    );
  }
}
