import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="page">
      <h1>Game</h1>
      <div *ngIf="script">
        <p><strong>Script:</strong> {{ script.name }}</p>
        <p><strong>Players:</strong> {{ players.length }}</p>
        <p><strong>Phase:</strong> {{ phase }}</p>
        <p><strong>Night:</strong> {{ night }}</p>
      </div>
      <div *ngIf="!script">
        <p>No game started. Go to Scripts to import a script.</p>
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
  `]
})
export class GameComponent implements OnInit {
  script: any = null;
  players: any[] = [];
  phase = 'setup';
  night = 0;

  constructor(private gameState: GameStateService) {}

  ngOnInit() {
    this.script = this.gameState.getScript();
    this.players = this.gameState.getPlayers();
  }
}
