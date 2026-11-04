import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GameStateService } from '../../core/services/game-state.service';

/** Shows or hides your private character everywhere it appears. */
@Component({
  selector: 'app-reveal-toggle',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button mat-stroked-button type="button" (click)="toggle()" [attr.aria-pressed]="gameState.revealSelf()">
      <mat-icon aria-hidden="true">{{ gameState.revealSelf() ? 'visibility_off' : 'visibility' }}</mat-icon>
      {{ gameState.revealSelf() ? 'Hide my character' : 'Show my character' }}
    </button>
  `
})
export class RevealToggleComponent {
  protected readonly gameState = inject(GameStateService);

  protected toggle(): void {
    this.gameState.revealSelf.update(v => !v);
  }
}
