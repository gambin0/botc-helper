import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GameStateService } from '../../core/services/game-state.service';
import { ScriptImportService } from '../../core/script/script-import.service';
import { TROUBLE_BREWING_SCRIPT } from '../../core/constants/trouble-brewing';
import { Script } from '../../core/models/game';
import { RolePickerComponent } from './role-picker.component';

const WC25_IDS = [
  '1daymore', 'beautifulhouse', 'binarysupernovae', 'buyersremorse', 'deadcouncil', 'deadpeople',
  'djinnsbargain', 'offwizard', 'phantomdetectives', 'riverstyx', 'seat7', 'stowedaway',
  'trainedkiller', 'warrens', 'witchhunt', 'wonders'
];

@Component({
  selector: 'app-scripts',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, RolePickerComponent],
  template: `
    <main class="page">
      <h1>Scripts</h1>
      <p class="intro">A script only chooses which characters can be in play. Deduction rules belong to the characters.</p>
      <p>Current role pool: <strong>{{ gameState.script()?.name ?? 'Trouble Brewing' }}</strong> ({{ gameState.activeRoles().length }} characters)</p>

      <h2>Bundled</h2>
      <ul class="list">
        @for (s of bundled(); track s.id) {
          <li class="item">
            <div>
              <div class="name">{{ s.name }}</div>
              <div class="meta">{{ s.author ? 'by ' + s.author + ' · ' : '' }}{{ s.characters.length }} characters</div>
            </div>
            @if (activeId() === s.id) {
              <span class="active"><mat-icon aria-hidden="true">check_circle</mat-icon> Active</span>
            } @else {
              <button mat-stroked-button (click)="use(s)" [attr.aria-label]="'Use ' + s.name">Use</button>
            }
          </li>
        }
      </ul>
      @if (loading()) {
        <mat-spinner diameter="32" aria-label="Loading scripts" />
      }

      <h2>Your custom pools</h2>
      @if (gameState.customScripts().length === 0) {
        <p class="meta">None yet. Build one below.</p>
      } @else {
        <ul class="list">
          @for (s of gameState.customScripts(); track s.id) {
            <li class="item">
              <div>
                <div class="name">{{ s.name }}</div>
                <div class="meta">{{ s.characters.length }} characters</div>
              </div>
              <div class="buttons">
                @if (activeId() === s.id) {
                  <span class="active"><mat-icon aria-hidden="true">check_circle</mat-icon> Active</span>
                } @else {
                  <button mat-stroked-button (click)="use(s)" [attr.aria-label]="'Use ' + s.name">Use</button>
                }
                <button mat-button (click)="edit(s)" [attr.aria-label]="'Edit ' + s.name">Edit</button>
                @if (confirmDelete() === s.id) {
                  <button mat-button class="danger" (click)="remove(s.id)" [attr.aria-label]="'Confirm delete ' + s.name">Confirm delete</button>
                } @else {
                  <button mat-button (click)="confirmDelete.set(s.id)" [attr.aria-label]="'Delete ' + s.name">Delete</button>
                }
              </div>
            </li>
          }
        </ul>
      }

      <details class="builder" [open]="builderOpen()" (toggle)="builderOpen.set($any($event.target).open)">
        <summary><h2 class="inline">Build a custom role pool</h2></summary>
        <app-role-picker [scripts]="startOptions()" />
      </details>

      <h2>Import</h2>
      <mat-card>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Paste script JSON</mat-label>
            <textarea matInput rows="5" [value]="pasted()" (input)="pasted.set($any($event.target).value)"></textarea>
            <mat-hint>Official format from the Script Tool, e.g. [{{ '{' }}"id":"_meta","name":"My Script"{{ '}' }}, "chef", "imp", ...]</mat-hint>
          </mat-form-field>
          <div class="import-actions">
            <button mat-flat-button [disabled]="!pasted().trim()" (click)="importText()">Import pasted JSON</button>
            <label class="file">
              <input type="file" accept=".json,application/json" (change)="importFile($event)" />
              <span>or choose a .json file</span>
            </label>
          </div>
          @if (error(); as e) {
            <p class="error" role="alert">{{ e }}</p>
          }
          @for (w of importWarnings(); track w) {
            <p class="note">{{ w }}</p>
          }
        </mat-card-content>
      </mat-card>
    </main>
  `,
  styles: `
    .page { padding: 16px; }
    h1 { margin-top: 0; }
    h2 { font-size: 1.15rem; margin: 24px 0 8px; }
    .intro, .meta, .note { color: var(--app-muted); font-size: 0.9rem; }
    .list { list-style: none; padding: 0; margin: 0; }
    .item { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--app-border); }
    .name { font-weight: 500; }
    .active { display: inline-flex; align-items: center; gap: 4px; color: var(--app-ok-fg); font-weight: 500; }
    .full { width: 100%; }
    .import-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 12px; }
    .error { color: var(--app-danger-fg); }
    .buttons { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 4px; }
    .danger { color: var(--app-danger-fg); }
    .builder { margin-top: 24px; }
    .builder summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; }
    .inline { display: inline; margin: 0; }
  `
})
export class ScriptsComponent {
  protected readonly gameState = inject(GameStateService);
  private readonly importer = inject(ScriptImportService);

  protected readonly wc25 = signal<Script[]>([]);
  protected readonly loading = signal(true);
  protected readonly pasted = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly importWarnings = signal<string[]>([]);

  protected readonly bundled = computed(() => [TROUBLE_BREWING_SCRIPT, ...this.wc25()]);
  protected readonly startOptions = computed(() => [...this.bundled(), ...this.gameState.customScripts()]);
  protected readonly builderOpen = signal(false);
  protected readonly confirmDelete = signal<string | null>(null);
  private readonly picker = viewChild(RolePickerComponent);
  protected readonly activeId = computed(() => this.gameState.script()?.id ?? TROUBLE_BREWING_SCRIPT.id);

  constructor() {
    this.loadWc25();
  }

  private async loadWc25(): Promise<void> {
    const results = await Promise.allSettled(
      WC25_IDS.map(id => this.importer.fetchBundled(`assets/scripts/wc25/${id}.json`, `wc25-${id}`))
    );
    this.wc25.set(results.flatMap(r => (r.status === 'fulfilled' ? [r.value] : [])));
    this.loading.set(false);
  }

  protected use(script: Script): void {
    this.gameState.setScript(script);
  }

  protected edit(script: Script): void {
    this.builderOpen.set(true);
    this.picker()?.load(script, true);
  }

  protected remove(id: string): void {
    this.gameState.deleteCustomScript(id);
    this.confirmDelete.set(null);
  }

  protected importText(): void {
    this.tryImport(() => this.importer.parse(this.pasted()));
  }

  protected async importFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const text = await file.text();
    this.tryImport(() => this.importer.parse(text));
  }

  private tryImport(parse: () => ReturnType<ScriptImportService['parse']>): void {
    try {
      const { script, warnings } = parse();
      this.gameState.setScript(script);
      this.error.set(null);
      this.importWarnings.set([`Imported "${script.name}" (${script.characters.length} characters).`, ...warnings]);
      this.pasted.set('');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
      this.importWarnings.set([]);
    }
  }
}
