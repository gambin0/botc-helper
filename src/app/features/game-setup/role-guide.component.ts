import { Component, computed, inject, input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { GameStateService } from '../../core/services/game-state.service';
import { RoleRegistry } from '../../core/roles/role-registry';
import { getRoleTips, hasSpecificTips } from '../../core/rules/role-tips';
import { BluffRating } from '../../core/solver/bluffs';

const RATING_LABEL: Record<BluffRating, string> = { safe: 'Not in play', possible: 'Might be in play', avoid: 'Taken' };

/**
 * Private "how to play" guide for the character you were shown, with bluff
 * suggestions for evil characters. Collapsed by default so it is not visible
 * to neighbours at the table.
 */
@Component({
  selector: 'app-role-guide',
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <details class="guide">
      <summary>How to play the {{ roleName() }}</summary>
      <p class="focus">{{ tips().focus }}</p>
      @if (!specific()) {
        <p class="note">General advice for {{ team() }} characters.</p>
      }
      <ul>
        @for (tip of tips().tips; track tip) {
          <li>{{ tip }}</li>
        }
      </ul>

      @if (isEvil()) {
        <h2 class="sub">Bluffs</h2>
        @if (team() === 'demon') {
          <mat-form-field appearance="outline" class="full">
            <mat-label>Not-in-play characters you were shown</mat-label>
            <mat-select multiple [value]="gameState.demonBluffs()" (selectionChange)="gameState.setDemonBluffs($event.value)">
              @for (c of goodRoles(); track c.id) {
                <mat-option [value]="c.id" [disabled]="gameState.demonBluffs().length >= 3 && !gameState.demonBluffs().includes(c.id)">
                  {{ c.name }}
                </mat-option>
              }
            </mat-select>
            <mat-hint>Up to 3. These are guaranteed not to be in play.</mat-hint>
          </mat-form-field>
        }
        <p class="note">The label says whether a real player could contradict the claim, using the claims and evidence in the log.</p>
        <ul class="bluffs">
          @for (b of gameState.bluffs(); track b.roleId) {
            <li>
              <span [class]="'badge ' + b.rating">{{ ratingLabel[b.rating] }}</span>
              <strong>{{ b.name }}</strong>
              <span class="team">({{ b.team }})</span>
              <div class="why">{{ b.reasons[0] }}</div>
              @if (b.playNote) {
                <div class="why"><em>Playing it:</em> {{ b.playNote }}</div>
              }
            </li>
          }
        </ul>
      }
    </details>
  `,
  styles: `
    .guide { margin-top: 12px; }
    summary { cursor: pointer; font-weight: 500; min-height: 44px; display: flex; align-items: center; }
    .focus { font-weight: 500; }
    .note, .why, .team { color: #5f6368; font-size: 0.85rem; }
    .sub { font-size: 1rem; margin: 16px 0 8px; }
    .full { width: 100%; margin-bottom: 8px; }
    .bluffs { list-style: none; padding: 0; margin: 0; }
    .bluffs li { padding: 6px 0; border-bottom: 1px solid #e0e0e0; }
    .badge { display: inline-block; min-width: 104px; margin-right: 8px; padding: 1px 6px; border-radius: 4px;
             font-size: 0.75rem; font-weight: 700; text-align: center; color: #fff; }
    .badge.safe { background: #146c2e; }
    .badge.possible { background: #7a5900; }
    .badge.avoid { background: #b3261e; }
  `
})
export class RoleGuideComponent {
  protected readonly gameState = inject(GameStateService);
  readonly roleId = input.required<string>();
  protected readonly ratingLabel = RATING_LABEL;

  protected readonly team = computed(
    () =>
      this.gameState.activeRoles().find(c => c.id === this.roleId())?.team ??
      RoleRegistry.get(this.roleId())?.team ??
      'townsfolk'
  );
  protected readonly roleName = computed(() => this.gameState.roleName(this.roleId()));
  protected readonly tips = computed(() => getRoleTips(this.roleId(), this.team()));
  protected readonly specific = computed(() => hasSpecificTips(this.roleId()));
  protected readonly isEvil = computed(() => this.team() === 'minion' || this.team() === 'demon');
  protected readonly goodRoles = computed(() =>
    this.gameState.activeRoles().filter(c => c.team === 'townsfolk' || c.team === 'outsider')
  );
}
