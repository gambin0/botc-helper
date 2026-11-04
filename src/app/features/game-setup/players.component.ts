import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GameStateService } from '../../core/services/game-state.service';
import { Player, RolePossibility } from '../../core/models/game';
import { CharacterImageComponent } from '../../shared/character-image/character-image.component';

@Component({
  selector: 'app-players',
  imports: [
    RouterLink, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatSelectModule, MatFormFieldModule, MatCheckboxModule, MatTooltipModule,
    CharacterImageComponent
  ],
  template: `
    <div class="page">
      <h1>Players</h1>
      @if (players().length === 0) {
        <div class="empty">
          <p>No players. Start a game first.</p>
          <a mat-raised-button color="primary" routerLink="/game">
            <mat-icon>gamepad</mat-icon> Go to Game Setup
          </a>
        </div>
      }
      @for (player of players(); track player.id) {
        <mat-card class="player-card" [class.self-card]="isSelf(player.id)">
          <mat-card-header>
            <div mat-card-avatar class="seat-avatar" [class.self-avatar]="isSelf(player.id)">
              {{ player.seat }}
            </div>
            <mat-card-title class="player-title">
              <input
                [ngModel]="player.name"
                (ngModelChange)="updatePlayerName(player, $event)"
                class="player-name-input"
              >
            </mat-card-title>
            <mat-card-subtitle>
              @if (isSelf(player.id)) {
                <span class="self-badge">
                  <mat-icon class="badge-icon">person</mat-icon> You
                </span>
              }
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="actions-row">
              <button
                mat-stroked-button
                [color]="player.alive ? 'primary' : 'warn'"
                (click)="toggleAlive(player)"
                class="alive-btn"
              >
                <mat-icon>{{ player.alive ? 'check_circle' : 'cancel' }}</mat-icon>
                {{ player.alive ? 'Alive' : 'Dead' }}
              </button>
              <button
                mat-stroked-button
                [color]="isSelf(player.id) ? 'accent' : ''"
                (click)="toggleSelf(player)"
                class="self-btn"
                [matTooltip]="isSelf(player.id) ? 'Clear: this is not me' : 'Mark: this is me'"
              >
                <mat-icon>{{ isSelf(player.id) ? 'person' : 'person_outline' }}</mat-icon>
                {{ isSelf(player.id) ? 'Me' : 'This is me' }}
              </button>
            </div>

            @if (isSelf(player.id)) {
              <div class="private-role-section">
                <div class="private-role-label">
                  <mat-icon class="lock-icon">lock</mat-icon>
                  <span>My Role (Private — not in event log)</span>
                </div>
                <mat-form-field appearance="outline" class="role-select">
                  <mat-label>My role</mat-label>
                  <mat-select
                    [ngModel]="selfRole()"
                    (ngModelChange)="onSelfRoleChange($event)"
                  >
                    <mat-option [value]="null">— Not set —</mat-option>
                    @for (char of activeRoles(); track char.id) {
                      <mat-option [value]="char.id">
                        {{ char.name }} ({{ char.team }})
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                @if (selfRole()) {
                  <mat-checkbox
                    [ngModel]="selfRoleCertain()"
                    (ngModelChange)="onCertainChange($event)"
                    class="certain-checkbox"
                  >
                    I'm certain this is my role
                    <span class="certain-hint">(uncheck if you might be Drunk/poisoned)</span>
                  </mat-checkbox>
                }
              </div>
            }

            <div class="roles-container">
              @for (role of getPossibleRoles(player.id); track role.roleId) {
                <mat-chip
                  [color]="getRoleChipColor(role)"
                  [disabled]="role.status === 'impossible'"
                  class="role-chip"
                  [class.confirmed-chip]="role.status === 'confirmed'"
                >
                  <app-character-image
                    [roleId]="role.roleId"
                    [alignment]="getRoleAlignment(role)"
                    [size]="24"
                    class="chip-image"
                  />
                  {{ getRoleName(role.roleId) }}
                </mat-chip>
              }
            </div>
          </mat-card-content>
        </mat-card>
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
    .player-card {
      margin-bottom: 16px;
    }
    .self-card {
      border: 2px solid #7c4dff;
    }
    .seat-avatar {
      background: #3f51b5;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    .self-avatar {
      background: #7c4dff;
    }
    .player-title {
      margin-left: 12px;
    }
    .self-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      color: #7c4dff;
      font-size: 12px;
      font-weight: 600;
      margin-left: 12px;
    }
    .badge-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
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
    .actions-row {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .alive-btn, .self-btn {
      flex: 1;
      min-width: 100px;
    }
    .private-role-section {
      background: #f3e5ff;
      border: 1px dashed #7c4dff;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .private-role-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #7c4dff;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .lock-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }
    .role-select {
      width: 100%;
    }
    .certain-checkbox {
      display: block;
      margin-top: 4px;
    }
    .certain-hint {
      font-size: 11px;
      color: #888;
      margin-left: 4px;
    }
    .roles-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .role-chip {
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .chip-image {
      display: flex;
      align-items: center;
    }
    .confirmed-chip {
      font-weight: bold;
    }
  `]
})
export class PlayersComponent {
  private gameState = inject(GameStateService);

  readonly players = this.gameState.players;
  readonly activeRoles = this.gameState.activeRoles;
  readonly selfPlayerId = this.gameState.selfPlayerId;
  readonly selfRole = this.gameState.selfRole;
  readonly selfRoleCertain = this.gameState.selfRoleCertain;

  isSelf(playerId: string): boolean {
    return this.selfPlayerId() === playerId;
  }

  updatePlayerName(player: Player, name: string): void {
    this.gameState.updatePlayer({ ...player, name });
  }

  toggleAlive(player: Player): void {
    this.gameState.togglePlayerAlive(player.id);
  }

  toggleSelf(player: Player): void {
    if (this.isSelf(player.id)) {
      this.gameState.clearSelf();
    } else {
      this.gameState.setSelf(player.id);
    }
  }

  onSelfRoleChange(roleId: string | null): void {
    this.gameState.setSelfRole(roleId, this.selfRoleCertain());
  }

  onCertainChange(certain: boolean): void {
    const role = this.selfRole();
    if (role) {
      this.gameState.setSelfRole(role, certain);
    }
  }

  getPossibleRoles(playerId: string): RolePossibility[] {
    return this.gameState.getPossibleRoles(playerId);
  }

  getRoleName(roleId: string): string {
    const roles = this.gameState.activeRoles();
    const char = roles.find(c => c.id === roleId);
    return char ? char.name : roleId;
  }

  getRoleChipColor(role: RolePossibility): string | undefined {
    if (role.status === 'confirmed') return 'accent';
    if (role.status === 'possible') return 'primary';
    return undefined;
  }

  getRoleAlignment(role: RolePossibility): 'good' | 'evil' | 'unknown' {
    if (role.status === 'confirmed') {
      // For confirmed roles, we could determine alignment from the role definition
      // For now, return unknown
      return 'unknown';
    }
    return 'unknown';
  }
}
