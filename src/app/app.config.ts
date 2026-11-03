import { APP_INITIALIZER, ApplicationConfig, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { GameStateService } from './core/services/game-state.service';
import { DatabaseService } from './core/storage/database.service';

function initApp(): () => Promise<void> {
  return async () => {
    const db = inject(DatabaseService);
    const gameState = inject(GameStateService);

    await db.init();
    await gameState.loadCurrentGame();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [DatabaseService, GameStateService],
      multi: true
    }
  ]
};
