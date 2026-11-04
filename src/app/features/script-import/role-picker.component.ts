import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { GameStateService } from '../../core/services/game-state.service';
import { RoleRegistry } from '../../core/roles/role-registry';
import { Script, ScriptCharacter, Team } from '../../core/models/game';
import { checkPool } from '../../core/solver/pool-check';
import { generateUUID } from '../../core/utils/uuid';
import { CharacterImageComponent } from '../../shared/character-image/character-image.component';
import { SetupCountsComponent } from '../../shared/setup-counts/setup-counts.component';

const GROUPS: { team: Team; label: string }[] = [
  { team: 'townsfolk', label: 'Townsfolk' },
  { team: 'outsider', label: 'Outsiders' },
  { team: 'minion', label: 'Minions' },
  { team: 'demon', label: 'Demons' },
  { team: 'fabled', label: 'Fabled' }
];

/**
 * Build a custom role pool: every character the host might use. Deduction
 * treats it exactly like a script.
 */
@Component({
  selector: 'app-role-picker',
  imports: [
    MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    CharacterImageComponent, SetupCountsComponent
  ],
  template: `
    <p class="note">Tick every character the host might use. Deduction treats the pool like a script.</p>

    <div class="row">
      <mat-form-field appearance="outline" class="grow">
        <mat-label>Start from</mat-label>
        <mat-select [value]="startId()" (selectionChange)="startFrom($event.value)">
          <mat-option value="">Nothing (empty)</mat-option>
          @for (s of scripts(); track s.id) {
            <mat-option [value]="s.id">{{ s.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="count">
        <mat-label>Players</mat-label>
        <input matInput type="number" min="5" max="15" [value]="playerCount()" (input)="setCount($event)" />
      </mat-form-field>
    </div>

    <mat-form-field appearance="outline" class="full">
      <mat-label>Pool name</mat-label>
      <input matInput [value]="name()" (input)="name.set(text($event))" />
    </mat-form-field>

    <section class="status" [class.bad]="!check().valid" aria-live="polite">
      <p class="headline">
        {{ selectedCount() }} selected ·
        @if (check().valid) {
          a legal setup exists for {{ playerCount() }} players
        } @else if (check().unknown) {
          still checking (search limit reached)
        } @else {
          no legal setup for {{ playerCount() }} players yet
        }
      </p>
      @for (w of check().warnings; track w) {
        <p class="small">{{ w }}</p>
      }
      @if (!check().valid && !check().unknown && check().warnings.length === 0 && selectedCount() > 0) {
        <p class="small">Add more characters: each type needs enough options to fill its seats.</p>
      }
      <app-setup-counts [playerCount]="playerCount()" [characters]="selectedCharacters()" />
    </section>

    <mat-form-field appearance="outline" class="full">
      <mat-label>Search characters</mat-label>
      <input matInput [value]="search()" (input)="search.set(text($event))" />
    </mat-form-field>

    @for (g of groups(); track g.team) {
      <details class="group" [open]="search().length > 0">
        <summary>{{ g.label }} ({{ g.selected }} selected of {{ g.total }})</summary>
        <ul class="grid">
          @for (c of g.chars; track c.id) {
            <li>
              <mat-checkbox [checked]="isSelected(c.id)" (change)="toggle(c.id, $event.checked)">
                <span class="char">
                  <app-character-image [roleId]="c.id" [size]="24" />
                  {{ c.name }}@if (isCustom(c.id)) {<span class="tag">custom</span>}
                </span>
              </mat-checkbox>
            </li>
          }
        </ul>
      </details>
    }

    <div class="actions">
      <button mat-flat-button [disabled]="!canSave()" (click)="save()">
        {{ editingId() ? 'Save changes and use' : 'Save and use' }}
      </button>
      <button mat-stroked-button (click)="clear()">Clear</button>
    </div>
    @if (!name().trim() && selectedCount() > 0) {
      <p class="small">Give the pool a name to save it.</p>
    }
  `,
  styles: `
    :host { display: block; }
    .note, .small { color: var(--app-muted); font-size: 0.85rem; }
    .row { display: flex; gap: 8px; }
    .grow { flex: 1; }
    .count { width: 96px; }
    .full { width: 100%; }
    .status { border-left: 6px solid var(--app-ok-border); background: var(--app-ok-bg); border-radius: 8px; padding: 8px 12px; margin-bottom: 16px; }
    .status.bad { border-color: var(--app-danger-border); background: var(--app-danger-bg); }
    .headline { font-weight: 500; margin: 4px 0; }
    .group { margin-bottom: 8px; }
    summary { cursor: pointer; font-weight: 500; min-height: 44px; display: flex; align-items: center; }
    .grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
    .char { display: inline-flex; align-items: center; gap: 6px; }
    .tag { font-size: 0.7rem; font-weight: 600; color: var(--app-muted); border: 1px solid var(--app-muted); border-radius: 4px; padding: 0 4px; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
  `
})
export class RolePickerComponent {
  private readonly gameState = inject(GameStateService);
  /** Scripts that can be used as a starting point. */
  readonly scripts = input<Script[]>([]);

  protected readonly name = signal('');
  protected readonly search = signal('');
  protected readonly playerCount = signal(this.gameState.players().length || 8);
  protected readonly startId = signal('');
  /** Set when editing a saved custom pool, so saving replaces it. */
  protected readonly editingId = signal<string | null>(null);
  private readonly selected = signal<ReadonlySet<string>>(new Set());
  /** Homebrew characters carried over from a starting script. */
  private readonly homebrew = signal<ScriptCharacter[]>([]);

  private readonly universe = computed<ScriptCharacter[]>(() => {
    const official = RoleRegistry.getAll()
      .filter(r => GROUPS.some(g => g.team === r.team))
      .map(r => RoleRegistry.toScriptCharacters([r.id])[0]);
    return [...official, ...this.homebrew()];
  });

  protected readonly selectedCharacters = computed(() => this.universe().filter(c => this.selected().has(c.id)));
  protected readonly selectedCount = computed(() => this.selectedCharacters().length);
  protected readonly check = computed(() => {
    const chars = this.selectedCharacters();
    if (chars.length === 0) return { valid: false, unknown: false, warnings: [] as string[] };
    return checkPool(chars, this.playerCount());
  });
  protected readonly canSave = computed(() => !!this.name().trim() && this.check().valid);

  protected readonly groups = computed(() => {
    const q = this.search().trim().toLowerCase();
    return GROUPS.map(g => {
      const all = this.universe().filter(c => c.team === g.team).sort((a, b) => a.name.localeCompare(b.name));
      return {
        ...g,
        total: all.length,
        selected: all.filter(c => this.selected().has(c.id)).length,
        chars: q ? all.filter(c => c.name.toLowerCase().includes(q)) : all
      };
    }).filter(g => g.chars.length > 0);
  });

  protected isCustom(id: string): boolean {
    return !RoleRegistry.has(id);
  }

  protected isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  protected toggle(id: string, checked: boolean): void {
    this.selected.update(set => {
      const next = new Set(set);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  protected text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected setCount(event: Event): void {
    const n = Math.round(Number(this.text(event)));
    if (n >= 5 && n <= 15) this.playerCount.set(n);
  }

  protected startFrom(id: string): void {
    const script = this.scripts().find(s => s.id === id);
    this.startId.set(id);
    if (!script) {
      this.selected.set(new Set());
      this.homebrew.set([]);
      return;
    }
    this.load(script, script.source === 'custom');
  }

  /** Loads a script into the picker; `edit` keeps its identity so saving replaces it. */
  load(script: Script, edit = true): void {
    this.startId.set(script.id);
    this.homebrew.set(script.characters.filter(c => !RoleRegistry.has(c.id)));
    this.selected.set(new Set(script.characters.map(c => c.id)));
    this.editingId.set(edit ? script.id : null);
    this.name.set(edit ? script.name : `${script.name} (custom)`);
  }

  protected clear(): void {
    this.selected.set(new Set());
    this.homebrew.set([]);
    this.name.set('');
    this.startId.set('');
    this.editingId.set(null);
  }

  protected save(): void {
    if (!this.canSave()) return;
    this.gameState.saveCustomScript({
      id: this.editingId() ?? `custom-${generateUUID()}`,
      name: this.name().trim(),
      source: 'custom',
      characters: this.selectedCharacters()
    });
    this.clear();
  }
}
