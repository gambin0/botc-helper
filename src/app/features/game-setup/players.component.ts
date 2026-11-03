import { Component, OnInit } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [NgFor, NgClass, NgIf, FormsModule],
  template: `
    <div class="page">
      <h1>Players</h1>
      <div *ngIf="players.length === 0" class="empty">
        <p>No players. Create a game first.</p>
      </div>
      <div *ngFor="let player of players" class="player-card">
        <div class="player-header">
          <span class="seat">#{{ player.seat }}</span>
          <input class="name" [(ngModel)]="player.name" (change)="updatePlayer(player)">
          <button class="alive-btn" (click)="toggleAlive(player)"
                  [class.alive]="player.alive" [class.dead]="!player.alive">
            {{ player.alive ? 'Alive' : 'Dead' }}
          </button>
        </div>
        <div class="player-roles">
          <div *ngFor="let role of getPossibleRoles(player.id)" class="role">
            <span [class.possible]="role.status === 'possible'"
                  [class.impossible]="role.status === 'impossible'">
              {{ getRoleName(role.roleId) }}
            </span>
            <span *ngIf="role.status === 'impossible' && role.reason" class="reason">
              ({{ role.reason }})
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
      align-items: center;
      margin-bottom: 8px;
      gap: 8px;
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
      flex-shrink: 0;
    }
    .name {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .alive-btn {
      padding: 4px 8px;
      border: none;
      border-radius: 12px;
      font-size: 12px;
      cursor: pointer;
    }
    .alive-btn.alive {
      background: #c8e6c9;
      color: #2e7d32;
    }
    .alive-btn.dead {
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
    .reason {
      font-size: 12px;
      color: #666;
    }
  `]
})
export class PlayersComponent implements OnInit {
  players: any[] = [];

  constructor(private gameState: GameStateService) {}

  ngOnInit() {
    this.players = this.gameState.getPlayers();
  }

  updatePlayer(player: any) {
    this.gameState.updatePlayer(player);
  }

  toggleAlive(player: any) {
    player.alive = !player.alive;
    this.updatePlayer(player);
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
