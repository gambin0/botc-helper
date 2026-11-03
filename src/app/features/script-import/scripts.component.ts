import { Component } from '@angular/core';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-scripts',
  standalone: true,
  template: `
    <div class="page">
      <h1>Scripts</h1>
      <div class="script-card" (click)="loadTroubleBrewing()">
        <h3>Trouble Brewing</h3>
        <p>Official BotC script</p>
      </div>
      <button class="import-btn" (click)="showImportDialog()">Import Script</button>
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
    .import-btn {
      width: 100%;
      padding: 12px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    }
  `]
})
export class ScriptsComponent {
  constructor(private gameState: GameStateService) {}

  async loadTroubleBrewing() {
    // Load bundled Trouble Brewing script
    const response = await fetch('/assets/scripts/trouble-brewing.json');
    const json = await response.text();
    await this.gameState.importScript(json);
  }

  showImportDialog() {
    // Show file picker or paste dialog
  }
}
