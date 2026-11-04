import { Component, computed, inject, linkedSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { GameStateService } from '../../core/services/game-state.service';
import { Explanation, RolePossibility } from '../../core/models/game';
import { CharacterImageComponent } from '../../shared/character-image/character-image.component';

interface PlayerRow {
  id: string;
  name: string;
  seat: number;
  alive: boolean;
  alignment: 'Good' | 'Evil' | 'Unknown' | 'None';
  possible: RolePossibility[];
  impossible: RolePossibility[];
}

@Component({
  selector: 'app-deduce',
  imports: [MatButtonModule, MatCardModule, MatExpansionModule, MatIconModule, MatSlideToggleModule, CharacterImageComponent],
  template: `
    <main class="page">
      <h1>Deductions</h1>
      @if (rows().length === 0) {
        <p>No active game. Start a game to see deductions.</p>
      } @else {
        <mat-card class="summary" [class.bad]="!result().consistent">
          <mat-card-content>
            @if (result().consistent) {
              <p class="status"><mat-icon aria-hidden="true">check_circle</mat-icon> The evidence is consistent.</p>
            } @else {
              <p class="status"><mat-icon aria-hidden="true">error</mat-icon> Contradiction</p>
              @for (c of result().contradictions; track c.description) {
                <p>{{ c.description }}</p>
              }
            }
            @if (result().incomplete) {
              <p class="note">The search limit was reached, so some "possible" roles are not fully checked.</p>
            }
            <mat-slide-toggle [checked]="gameState.assumeHonest()" (change)="gameState.setAssumeHonest($event.checked)">
              Assume good players claim honestly
            </mat-slide-toggle>
            <p class="note">
              Information only counts if its source really has that ability and is not drunk or poisoned.
              Roles shown are starting characters.
            </p>
            @if (result().warnings.length > 0) {
              <details>
                <summary>Modelling notes ({{ result().warnings.length }})</summary>
                <ul>
                  @for (w of result().warnings; track w) {
                    <li>{{ w }}</li>
                  }
                </ul>
              </details>
            }
          </mat-card-content>
        </mat-card>

        <mat-accordion multi>
          @for (row of rows(); track row.id) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>{{ row.seat }}. {{ row.name }}@if (!row.alive) { (dead)}</mat-panel-title>
                <mat-panel-description>
                  <span class="align" [class]="'align-' + row.alignment.toLowerCase()">{{ row.alignment }}</span>
                  {{ row.possible.length }} possible
                </mat-panel-description>
              </mat-expansion-panel-header>

              <h2 class="section">Possible</h2>
              <ul class="roles">
                @for (r of row.possible; track r.roleId) {
                  <li class="role" [class.confirmed]="r.status === 'confirmed'">
                    <app-character-image [roleId]="r.roleId" [size]="28" />
                    <span>{{ gameState.roleName(r.roleId) }}@if (r.status === 'confirmed') { — certain}</span>
                  </li>
                }
              </ul>

              @if (row.impossible.length > 0) {
                <details>
                  <summary>Ruled out ({{ row.impossible.length }})</summary>
                  <ul class="impossible">
                    @for (r of row.impossible; track r.roleId) {
                      <li>
                        <div class="imp-row">
                          <span class="imp-name">{{ gameState.roleName(r.roleId) }}</span>
                          <button mat-button (click)="toggleWhy(row.id, r.roleId)"
                                  [attr.aria-expanded]="!!why(row.id, r.roleId)"
                                  [attr.aria-label]="'Why can ' + row.name + ' not be ' + gameState.roleName(r.roleId) + '?'">
                            Why?
                          </button>
                        </div>
                        @if (why(row.id, r.roleId); as ex) {
                          <div class="why">
                            <p>{{ ex.summary }}</p>
                            @if (ex.evidence.length > 0) {
                              <ul>
                                @for (e of ex.evidence; track e.id) {
                                  <li>{{ e.label }}</li>
                                }
                              </ul>
                            }
                          </div>
                        } @else {
                          <div class="reason">{{ r.reason }}</div>
                        }
                      </li>
                    }
                  </ul>
                </details>
              }
            </mat-expansion-panel>
          }
        </mat-accordion>
      }
    </main>
  `,
  styles: `
    .page { padding: 16px; }
    h1 { margin-top: 0; }
    .summary { margin-bottom: 16px; }
    .summary.bad { border: 2px solid #b3261e; }
    .status { display: flex; align-items: center; gap: 8px; font-weight: 600; }
    .note { color: #5f6368; font-size: 0.85rem; }
    .section { font-size: 0.95rem; margin: 8px 0 4px; }
    .roles, .impossible { list-style: none; padding: 0; margin: 0; }
    .role { display: flex; align-items: center; gap: 8px; padding: 2px 0; }
    .role.confirmed { font-weight: 700; }
    .align { font-weight: 600; margin-right: 8px; }
    .align-good { color: #0b57d0; }
    .align-evil { color: #b3261e; }
    .imp-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .reason, .why { font-size: 0.85rem; color: #444; margin-bottom: 6px; }
    .why { background: #f3f3f3; border-radius: 8px; padding: 8px; }
    .why p { margin: 0 0 4px; }
    details { margin-top: 8px; }
    summary { cursor: pointer; padding: 6px 0; }
  `
})
export class DeduceComponent {
  protected readonly gameState = inject(GameStateService);
  protected readonly result = this.gameState.deductions;
  /** On-demand explanations; cleared whenever the evidence changes. */
  private readonly explanations = linkedSignal<unknown, Map<string, Explanation>>({
    source: this.result,
    computation: () => new Map()
  });

  protected readonly rows = computed<PlayerRow[]>(() => {
    const result = this.result();
    return this.gameState.players().map(p => {
      const roles = result.possibleRoles.filter(r => r.playerId === p.id);
      const align = result.alignments.find(a => a.playerId === p.id);
      const alignment = !align || (!align.canBeGood && !align.canBeEvil)
        ? 'None'
        : align.canBeGood && align.canBeEvil
          ? 'Unknown'
          : align.canBeGood ? 'Good' : 'Evil';
      return {
        id: p.id,
        name: p.name,
        seat: p.seat,
        alive: p.alive,
        alignment,
        possible: roles.filter(r => r.status !== 'impossible'),
        impossible: roles.filter(r => r.status === 'impossible')
      };
    });
  });

  protected why(playerId: string, roleId: string): Explanation | undefined {
    return this.explanations().get(`${playerId}:${roleId}`);
  }

  protected toggleWhy(playerId: string, roleId: string): void {
    const key = `${playerId}:${roleId}`;
    const next = new Map(this.explanations());
    if (next.has(key)) next.delete(key);
    else next.set(key, this.gameState.explain(playerId, roleId));
    this.explanations.set(next);
  }
}
