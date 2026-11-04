import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../core/services/game-state.service';
import { describeEvent } from '../../core/rules/events';
import { EventFormComponent } from './event-form.component';

const ICONS: Record<string, string> = {
  claim: 'record_voice_over',
  info: 'visibility',
  death: 'cancel',
  execution: 'gavel',
  resurrection: 'favorite',
  note: 'notes'
};

@Component({
  selector: 'app-log',
  imports: [MatButtonModule, MatCardModule, MatIconModule, EventFormComponent],
  template: `
    <main class="page">
      <h1>Event log</h1>
      <p class="intro">Evidence is evaluated in the order listed: who is alive for each piece of info depends on deaths recorded above it.</p>

      @if (!gameState.hasGame()) {
        <mat-card><mat-card-content><p>Start a game on the Game tab to record evidence.</p></mat-card-content></mat-card>
      } @else {
        @if (rows().length === 0) {
          <p>No evidence recorded yet.</p>
        } @else {
          <ol class="events">
            @for (row of rows(); track row.id) {
              <li class="event">
                <mat-icon class="icon" aria-hidden="true">{{ row.icon }}</mat-icon>
                <div class="text">
                  <div>{{ row.description }}</div>
                  <div class="meta">Night {{ row.night }}</div>
                </div>
                <button mat-icon-button (click)="gameState.removeEvent(row.id)" [attr.aria-label]="'Delete: ' + row.description">
                  <mat-icon aria-hidden="true">delete</mat-icon>
                </button>
              </li>
            }
          </ol>
        }
        <app-event-form />
      }
    </main>
  `,
  styles: `
    .page { padding: 16px; }
    h1 { margin-top: 0; }
    .intro { color: #5f6368; font-size: 0.9rem; }
    .events { list-style: none; padding: 0; margin: 0; }
    .event { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
    .icon { margin-top: 2px; flex-shrink: 0; }
    .text { flex: 1; min-width: 0; overflow-wrap: anywhere; }
    .meta { font-size: 0.8rem; color: #5f6368; margin-top: 2px; }
  `
})
export class LogComponent {
  protected readonly gameState = inject(GameStateService);

  protected readonly rows = computed(() => {
    const name = (id?: string | null) => this.gameState.playerName(id);
    const role = (id?: string | null) => this.gameState.roleName(id);
    return this.gameState.events().map(e => ({
      id: e.id,
      night: e.night,
      icon: ICONS[e.kind] ?? 'event',
      description: describeEvent(e, name, role)
    }));
  });
}
