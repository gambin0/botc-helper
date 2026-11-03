import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-deduce',
  standalone: true,
  imports: [NgIf, NgFor, MatCardModule, MatIconModule, MatChipsModule, MatExpansionModule],
  template: `
    <div class="page">
      <h1>Deduction Board</h1>
      <mat-card *ngIf="result">
        <mat-card-header>
          <mat-icon mat-card-avatar>insights</mat-icon>
          <mat-card-title>Analysis</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>{{ result.survivingWorldCount }} possible world(s) remaining</p>
          <div *ngIf="result.contradictions.length > 0" class="contradictions">
            <h3>Contradictions</h3>
            <mat-chip *ngFor="let c of result.contradictions" color="warn" class="contradiction-chip">
              {{ c.description }}
            </mat-chip>
          </div>
        </mat-card-content>
      </mat-card>

      <div *ngFor="let player of players" class="player-deduction">
        <mat-accordion>
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                {{ player.name }}
              </mat-panel-title>
              <mat-panel-description>
                Seat {{ player.seat }} • {{ getPossibleCount(player.id) }} possible
              </mat-panel-description>
            </mat-expansion-panel-header>
            <div class="roles-container">
              <div *ngFor="let role of getPossibleRoles(player.id)" class="role-row">
                <mat-chip [color]="role.status === 'possible' ? 'primary' : 'warn'"
                          [disabled]="role.status === 'impossible'"
                          class="role-chip">
                  <mat-icon *ngIf="role.status === 'possible'" class="chip-icon">check</mat-icon>
                  <mat-icon *ngIf="role.status === 'impossible'" class="chip-icon">close</mat-icon>
                  {{ getRoleName(role.roleId) }}
                </mat-chip>
                <span *ngIf="role.status === 'impossible' && role.reason" class="reason">
                  {{ role.reason }}
                </span>
              </div>
            </div>
          </mat-expansion-panel>
        </mat-accordion>
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
    mat-card {
      margin-bottom: 16px;
    }
    .contradictions {
      margin-top: 16px;
    }
    .contradiction-chip {
      margin: 4px;
    }
    .player-deduction {
      margin-bottom: 8px;
    }
    .roles-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .role-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .role-chip {
      font-size: 12px;
    }
    .chip-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 2px;
    }
    .reason {
      font-size: 12px;
      color: #666;
      font-style: italic;
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

  getPossibleRoles(playerId: string) {
    return this.gameState.getPossibleRoles(playerId);
  }

  getPossibleCount(playerId: string): number {
    return this.gameState.getPossibleRoles(playerId).filter(r => r.status === 'possible').length;
  }

  getRoleName(roleId: string): string {
    const script = this.gameState.getScript();
    if (!script) return roleId;
    const char = script.characters.find(c => c.id === roleId);
    return char ? char.name : roleId;
  }
}
