import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GameStateService } from '../../core/services/game-state.service';
import { TROUBLE_BREWING_SCRIPT } from '../../core/constants/trouble-brewing';

interface Wc25Script {
  id: string;
  name: string;
  author: string;
  filename: string;
}

@Component({
  selector: 'app-scripts',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <h1 mat-title>Scripts</h1>

      <!-- Official Script -->
      <mat-card class="script-card" (click)="loadTroubleBrewing()">
        <mat-card-header>
          <mat-icon mat-card-avatar>menu_book</mat-icon>
          <mat-card-title>Trouble Brewing</mat-card-title>
          <mat-card-subtitle>Official BotC script</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>24 characters including all Townsfolk, Outsiders, Minions, and the Ogre Demon.</p>
        </mat-card-content>
        @if (isTroubleBrewingActive()) {
          <mat-card-actions>
            <button mat-button color="primary" disabled>
              <mat-icon>check_circle</mat-icon> Active Script
            </button>
          </mat-card-actions>
        } @else {
          <mat-card-actions>
            <button mat-raised-button color="primary">
              <mat-icon>file_download</mat-icon> Select Script
            </button>
          </mat-card-actions>
        }
      </mat-card>

      <!-- WC25 Championship Scripts -->
      <h2>WC25 Championship Scripts</h2>
      @if (loadingWc25()) {
        <mat-spinner diameter="40"></mat-spinner>
      } @else {
        @for (script of wc25Scripts(); track script.id) {
          <mat-card class="script-card" (click)="loadWc25Script(script)">
            <mat-card-header>
              <mat-icon mat-card-avatar>trophy</mat-icon>
              <mat-card-title>{{ script.name }}</mat-card-title>
              <mat-card-subtitle>by {{ script.author }} • WC25</mat-card-subtitle>
            </mat-card-header>
            <mat-card-actions>
              @if (isActiveWc25Script(script)) {
                <button mat-button color="primary" disabled>
                  <mat-icon>check_circle</mat-icon> Active Script
                </button>
              } @else {
                <button mat-raised-button color="primary">
                  <mat-icon>file_download</mat-icon> Select Script
                </button>
              }
            </mat-card-actions>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .page {
      padding: 16px;
    }
    h1 {
      margin-top: 0;
    }
    h2 {
      margin-top: 24px;
      margin-bottom: 16px;
    }
    .script-card {
      cursor: pointer;
      transition: box-shadow 0.2s;
      margin-bottom: 16px;
    }
    .script-card:hover {
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    mat-card-actions {
      padding: 8px 16px;
    }
  `]
})
export class ScriptsComponent {
  private gameState = inject(GameStateService);

  readonly script = this.gameState.script;
  readonly isTroubleBrewingActive = computed(() => this.script()?.id === 'trouble-brewing');

  loadingWc25 = signal(true);
  wc25Scripts = signal<Wc25Script[]>([]);

  constructor() {
    this.loadWc25Scripts();
  }

  async loadWc25Scripts(): Promise<void> {
    try {
      const scripts: Wc25Script[] = [];
      const wc25ScriptIds = [
        '1daymore', 'beautifulhouse', 'binarysupernovae', 'buyersremorse',
        'deadcouncil', 'deadpeople', 'djinnsbargain', 'offwizard',
        'phantomdetectives', 'riverstyx', 'seat7', 'stowedaway',
        'trainedkiller', 'warrens', 'witchhunt', 'wonders'
      ];

      for (const id of wc25ScriptIds) {
        try {
          const response = await fetch(`scripts/wc25/${id}.json`);
          if (response.ok) {
            const data = await response.json();
            const meta = data.find((item: unknown) => {
              if (typeof item !== 'object' || item === null) return false;
              const obj = item as Record<string, unknown>;
              return obj['id'] === '_meta';
            });
            if (meta) {
              const metaObj = meta as Record<string, unknown>;
              scripts.push({
                id: `wc25-${id}`,
                name: metaObj['name'] as string,
                author: metaObj['author'] as string,
                filename: id
              });
            }
          }
        } catch {
          // Skip scripts that fail to load
        }
      }

      this.wc25Scripts.set(scripts);
    } finally {
      this.loadingWc25.set(false);
    }
  }

  async loadTroubleBrewing(): Promise<void> {
    try {
      const response = await fetch('scripts/trouble-brewing.json');
      if (response.ok) {
        const json = await response.text();
        await this.gameState.importScript(json);
        return;
      }
    } catch {
      // Fallback to bundled constant
    }
    this.gameState.setScript(TROUBLE_BREWING_SCRIPT);
  }

  async loadWc25Script(script: Wc25Script): Promise<void> {
    try {
      const response = await fetch(`scripts/wc25/${script.filename}.json`);
      if (response.ok) {
        const json = await response.text();
        await this.gameState.importScript(json);
      }
    } catch (e) {
      console.error('Failed to load WC25 script:', e);
    }
  }

  isActiveWc25Script(script: Wc25Script): boolean {
    return this.script()?.id === script.id;
  }
}
