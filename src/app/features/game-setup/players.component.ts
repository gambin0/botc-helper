import { Component, OnInit } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [NgFor, NgClass],
  template: `
    <div class="page">
      <h1>Players</h1>
      <div *ngFor="let player of players" class="player-card">
        <div class="player-header">
          <span class="seat">#{{ player.seat }}</span>
          <span class="name">{{ player.name }}</span>
          <span class="status" [class.alive]="player.alive" [class.dead]="!player.alive">
            {{ player.alive ? 'Alive' : 'Dead' }}
          </span>
        </div>
        <div class="player-roles">
          <div *ngFor="let role of getPossibleRoles(player.id)" class="role">
            <span [class.possible]="role.status === 'possible'" [class.impossible]="role.status === 'impossible'">
              {{ getRoleName(role.roleId) }}
            </span>
          </div>
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
    .player-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .player-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .seat {
      background: #1976d2;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }
    .name {
      font-weight: bold;
      flex: 1;
      margin-left: 8px;
    }
    .status {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .status.alive {
      background: #c8e6c9;
      color: #2e7d32;
    }
    .status.dead {
      background: #ffcdd2;
      color: #c62828;
    }
    .role {
      font-size: 14px;
      margin: 2px 0;
    }
    .possible {
      color: #1976d2;
    }
    .impossible {
      color: #999;
      text-decoration: line-through;
    }
  `]
})
export class PlayersComponent implements OnInit {
  players: any[] = [];

  constructor(private gameState: GameStateService) {}

  ngOnInit() {
    this.players = this.gameState.getPlayers();
  }

  getPossibleRoles(playerId: string) {
    return this.gameState.getPossibleRoles(playerId);
  }

  getRoleName(roleId: string): string {
    const script = this.gameState.getScript();
    if (!script) return roleId;
    const char = script.characters.find(c => c.id === roleId);
    return char ? char.name : roleId;
  }
}
