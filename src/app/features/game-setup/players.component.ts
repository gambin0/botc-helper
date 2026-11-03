import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="page">
      <h1 mat-title>Players</h1>
      <div *ngIf="players.length === 0" class="empty">
        <p>No players. Create a game first.</p>
      </div>
      <mat-card *ngFor="let player of players" class="player-card">
        <mat-card-header>
          <div mat-card-avatar class="seat-avatar">{{ player.seat }}</div>
          <mat-card-title>
            <input [(ngModel)]="player.name" (change)="updatePlayer(player)" class="player-name-input">
          </mat-card-title>
          <mat-card-subtitle>
            <button mat-stroked-button color="{{ player.alive ? 'primary' : 'warn' }}"
                    (click)="toggleAlive(player)" class="alive-btn">
              <mat-icon>{{ player.alive ? 'check_circle' : 'cancel' }}</mat-icon>
              {{ player.alive ? 'Alive' : 'Dead' }}
            </button>
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="roles-container">
            <mat-chip *ngFor="let role of getPossibleRoles(player.id)"
                      [color]="role.status === 'possible' ? 'primary' : ''"
                      [disabled]="role.status === 'impossible'"
                      class="role-chip">
              {{ getRoleName(role.roleId) }}
            </mat-chip>
          </div>
        </mat-card-content>
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
    .player-card {
      margin-bottom: 16px;
    }
    .seat-avatar {
      background: #3f51b5;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    .player-name-input {
      border: none;
      border-bottom: 1px solid #ccc;
      font-size: 16px;
      font-weight: bold;
      width: 100%;
      padding: 4px 0;
      background: transparent;
    }
    .player-name-input:focus {
      outline: none;
      border-bottom-color: #3f51b5;
    }
    .alive-btn {
      margin-top: 8px;
    }
    .roles-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .role-chip {
      font-size: 12px;
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
