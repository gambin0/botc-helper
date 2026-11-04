import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { GameStateService } from '../../core/services/game-state.service';
import { RolePossibility } from '../../core/models/game';
import { CharacterImageComponent } from '../../shared/character-image/character-image.component';

@Component({
  selector: 'app-deduce',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule,
    CharacterImageComponent
  ],
  template: `
    <div class="page">
      <div class="header-row">
        <h1>Deduction Board</h1>
      </div>
      @if (players().length === 0) {
        <div class="empty">
          <p>No active game. Start a game to see deductions.</p>
        </div>
      } @else if (deductions(); as result) {
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>insights</mat-icon>
            <mat-card-title>Analysis</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>{{ result.survivingWorldCount }} possible world(s) remaining</p>
            @if (result.contradictions.length > 0) {
              <div class="contradictions">
                <h3>Contradictions</h3>
                @for (c of result.contradictions; track c.description) {
                  <mat-chip color="warn" class="contradiction-chip">
                    {{ c.description }}
                  </mat-chip>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>
      }

      @for (player of players(); track player.id) {
        <div class="player-deduction">
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
                @for (role of getPossibleRoles(player.id); track role.roleId) {
                  <div class="role-row">
                    <app-character-image
                      [roleId]="role.roleId"
                      [alignment]="'unknown'"
                      [size]="24"
                      class="role-image"
                    />
                    <mat-chip
                      [color]="role.status === 'possible' ? 'primary' : 'warn'"
                      [disabled]="role.status === 'impossible'"
                      class="role-chip"
                    >
                      @if (role.status === 'possible') {
                        <mat-icon class="chip-icon">check</mat-icon>
                      } @else {
                        <mat-icon class="chip-icon">close</mat-icon>
                      }
                      {{ getRoleName(role.roleId) }}
                    </mat-chip>
                    @if (role.status === 'impossible' && role.reason) {
                      <span class="reason">
                        {{ role.reason }}
                      </span>
                    }
                  </div>
                }
              </div>
            </mat-expansion-panel>
          </mat-accordion>
        </div>
      }
    </div>
  `,
  styles: [`
    .page {
      padding: 16px;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    h1 {
      margin-top: 0;
      margin-bottom: 0;
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
    .role-image {
      display: flex;
      align-items: center;
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
export class DeduceComponent {
  private gameState = inject(GameStateService);

  readonly players = this.gameState.players;
  readonly deductions = this.gameState.deductions;

  getPossibleRoles(playerId: string): RolePossibility[] {
    return this.deductions().possibleRoles.filter(r => r.playerId === playerId);
  }

  getPossibleCount(playerId: string): number {
    return this.getPossibleRoles(playerId).filter(r => r.status === 'possible').length;
  }

  getRoleName(roleId: string): string {
    const script = this.gameState.script();
    if (!script) return roleId;
    const char = script.characters.find(c => c.id === roleId);
    return char ? char.name : roleId;
  }
}
