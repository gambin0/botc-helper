import { Component, computed, input } from '@angular/core';
import { ScriptCharacter } from '../../core/models/game';
import { compositionFor, setupModifiers } from '../../core/rules/setup';

/** Character type counts for a player count, plus modifiers in the role pool. */
@Component({
  selector: 'app-setup-counts',
  template: `
    <dl class="counts" [attr.aria-label]="'Character counts for ' + playerCount() + ' players'">
      @for (row of rows(); track row.label) {
        <div class="cell" [class]="'cell ' + row.kind">
          <dt>{{ row.label }}</dt>
          <dd>{{ row.count }}</dd>
        </div>
      }
    </dl>
    @if (modifiers().length > 0) {
      <p class="note">Can change if one of these is in play:</p>
      <ul class="mods">
        @for (m of modifiers(); track m.roleId) {
          <li><strong>{{ m.name }}</strong>: {{ m.effect }}</li>
        }
      </ul>
      <p class="note">Townsfolk fill whatever seats are left.</p>
    }
  `,
  styles: `
    .counts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 8px 0; }
    .cell { border-radius: 8px; padding: 8px 4px; text-align: center; }
    dt { font-size: 0.75rem; font-weight: 500; }
    dd { margin: 0; font-size: 1.5rem; font-weight: 700; }
    .good { background: var(--app-good-bg); color: var(--app-good-fg); }
    .evil { background: var(--app-evil-bg); color: var(--app-evil-fg); }
    .note { color: var(--app-muted); font-size: 0.85rem; margin: 8px 0 4px; }
    .mods { margin: 0; padding-left: 20px; font-size: 0.9rem; }
  `
})
export class SetupCountsComponent {
  readonly playerCount = input.required<number>();
  readonly characters = input<readonly ScriptCharacter[]>([]);

  protected readonly rows = computed(() => {
    const c = compositionFor(this.playerCount());
    return [
      { label: 'Townsfolk', count: c.townsfolk, kind: 'good' },
      { label: 'Outsiders', count: c.outsiders, kind: 'good' },
      { label: 'Minions', count: c.minions, kind: 'evil' },
      { label: 'Demon', count: c.demons, kind: 'evil' }
    ];
  });
  protected readonly modifiers = computed(() => setupModifiers(this.characters()));
}
