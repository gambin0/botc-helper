import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { GameStateService } from './core/services/game-state.service';
import { DatabaseService } from './core/storage/database.service';

export function initApp(db: DatabaseService, gameState: GameStateService): () => Promise<void> {
  return async () => {
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
