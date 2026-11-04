import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { GameStateService } from './core/services/game-state.service';
import { DatabaseService } from './core/storage/database.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withFetch()),
    provideAppInitializer(async () => {
      const db = inject(DatabaseService);
      const gameState = inject(GameStateService);
      await db.init();
      await gameState.loadCurrentGame();
    })
  ]
};
