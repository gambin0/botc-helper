import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-deduce',
  standalone: true,
  imports: [NgIf, NgFor, NgClass],
  template: `
    <div class="page">
      <h1>Deduction Board</h1>
      <p class="summary">
        {{ result.survivingWorldCount }} possible world(s) remaining
      </p>
      <div *ngIf="result.contradictions.length > 0" class="contradictions">
        <h3>Contradictions</h3>
        <div *ngFor="let c of result.contradictions" class="contradiction">
          {{ c.description }}
        </div>
      </div>
      <div class="matrix">
        <div class="matrix-header">
          <span></span>
          <span *ngFor="let role of roles">{{ role.name }}</span>
        </div>
        <div *ngFor="let player of players" class="matrix-row">
          <span class="player-name">{{ player.name }}</span>
          <span *ngFor="let role of roles" class="cell"
                [class.possible]="isPossible(player.id, role.id)"
                [class.impossible]="isImpossible(player.id, role.id)">
            {{ isPossible(player.id, role.id) ? '✓' : '✗' }}
          </span>
        </div>
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
    .summary {
      font-size: 14px;
      color: #666;
      margin-bottom: 16px;
    }
    .contradictions {
      background: #fff3e0;
      border: 1px solid #ffb74d;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
    }
    .contradiction {
      font-size: 14px;
      margin: 4px 0;
    }
    .matrix {
      overflow-x: auto;
    }
    .matrix-header, .matrix-row {
      display: flex;
      border-bottom: 1px solid #e0e0e0;
    }
    .matrix-header span {
      padding: 8px;
      font-weight: bold;
      font-size: 12px;
      min-width: 60px;
      text-align: center;
    }
    .player-name {
      padding: 8px;
      font-weight: bold;
      min-width: 80px;
    }
    .cell {
      padding: 8px;
      min-width: 60px;
      text-align: center;
      font-size: 16px;
    }
    .possible {
      color: #2e7d32;
    }
    .impossible {
      color: #c62828;
    }
  `]
})
export class DeduceComponent implements OnInit {
  players: any[] = [];
  roles: any[] = [];
  result: any = null;

  constructor(private gameState: GameStateService) {}

  ngOnInit() {
    this.players = this.gameState.getPlayers();
    const script = this.gameState.getScript();
    this.roles = script ? script.characters : [];
    this.result = this.gameState.getDeductions();
  }

  isPossible(playerId: string, roleId: string): boolean {
    if (!this.result) return false;
    const possibility = this.result.possibleRoles.find(
      (r: any) => r.playerId === playerId && r.roleId === roleId
    );
    return possibility?.status === 'possible';
  }

  isImpossible(playerId: string, roleId: string): boolean {
    if (!this.result) return false;
    const possibility = this.result.possibleRoles.find(
      (r: any) => r.playerId === playerId && r.roleId === roleId
    );
    return possibility?.status === 'impossible';
  }
}
