import { Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../core/services/game-state.service';
import { TROUBLE_BREWING_SCRIPT } from '../../core/constants/trouble-brewing';

@Component({
  selector: 'app-scripts',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="page">
      <h1 mat-title>Scripts</h1>
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
      cursor: pointer;
      transition: box-shadow 0.2s;
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
}
