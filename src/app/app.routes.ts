import { Routes } from '@angular/router';
import { GameComponent } from './features/game-setup/game.component';
import { PlayersComponent } from './features/game-setup/players.component';
import { LogComponent } from './features/night-log/log.component';
import { DeduceComponent } from './features/deduction-board/deduce.component';
import { ScriptsComponent } from './features/script-import/scripts.component';

export const routes: Routes = [
  { path: '', redirectTo: 'game', pathMatch: 'full' },
  { path: 'game', component: GameComponent },
  { path: 'players', component: PlayersComponent },
  { path: 'log', component: LogComponent },
  { path: 'deduce', component: DeduceComponent },
  { path: 'scripts', component: ScriptsComponent }
];
