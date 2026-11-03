import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './shared/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  template: `
    <div class="app-container">
      <router-outlet></router-outlet>
    </div>
    <app-bottom-nav></app-bottom-nav>
  `,
  styles: [`
    .app-container {
      padding-bottom: 60px;
    }
  `]
})
export class AppComponent {}
