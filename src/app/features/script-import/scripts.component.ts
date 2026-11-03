import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-scripts',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="page">
      <h1>Scripts</h1>
      <div class="script-card" (click)="loadTroubleBrewing()">
        <h3>Trouble Brewing</h3>
        <p>Official BotC script (24 characters)</p>
        <p *ngIf="loaded" class="loaded">✓ Loaded</p>
      </div>
    </div>
  `,
  styles: [`
    .page {
      padding: 16px;
    }
    h1 {
      margin-top: 0;
    }
    .script-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      cursor: pointer;
    }
    .script-card h3 {
      margin: 0 0 4px 0;
    }
    .script-card p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
    .loaded {
      color: #2e7d32;
      font-weight: bold;
    }
  `]
})
export class ScriptsComponent {
  loaded = false;

  constructor(private gameState: GameStateService) {}

  async loadTroubleBrewing() {
    try {
      const response = await fetch('/scripts/trouble-brewing.json');
      const json = await response.text();
      await this.gameState.importScript(json);
      this.loaded = true;
    } catch (err) {
      console.error('Failed to load script:', err);
    }
  }
}
