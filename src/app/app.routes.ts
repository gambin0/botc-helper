import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'game', pathMatch: 'full' },
  {
    path: 'game',
    loadComponent: () => import('./features/game-setup/game.component').then(m => m.GameComponent)
  },
  {
    path: 'players',
    loadComponent: () => import('./features/game-setup/players.component').then(m => m.PlayersComponent)
  },
  {
    path: 'log',
    loadComponent: () => import('./features/night-log/log.component').then(m => m.LogComponent)
  },
  {
    path: 'deduce',
    loadComponent: () => import('./features/deduction-board/deduce.component').then(m => m.DeduceComponent)
  },
  {
    path: 'scripts',
    loadComponent: () => import('./features/script-import/scripts.component').then(m => m.ScriptsComponent)
  }
];
