import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-scripts',
  standalone: true,
  imports: [NgIf, MatCardModule, MatButtonModule, MatIconModule],
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
        <mat-card-actions *ngIf="loaded">
          <button mat-button color="primary" disabled>
            <mat-icon>check_circle</mat-icon> Loaded
          </button>
        </mat-card-actions>
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
