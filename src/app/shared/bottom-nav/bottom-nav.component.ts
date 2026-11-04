import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <nav class="bottom-nav">
      <a routerLink="/game" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
        <mat-icon>gamepad</mat-icon>
        <span>Game</span>
      </a>
      <a routerLink="/players" routerLinkActive="active" class="nav-item">
        <mat-icon>people</mat-icon>
        <span>Players</span>
      </a>
      <a routerLink="/log" routerLinkActive="active" class="nav-item">
        <mat-icon>history</mat-icon>
        <span>Log</span>
      </a>
      <a routerLink="/deduce" routerLinkActive="active" class="nav-item">
        <mat-icon>insights</mat-icon>
        <span>Deduce</span>
      </a>
      <a routerLink="/scripts" routerLinkActive="active" class="nav-item">
        <mat-icon>menu_book</mat-icon>
        <span>Scripts</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-around;
      align-items: center;
      background: var(--mat-sys-surface-container);
      border-top: 1px solid var(--app-border);
      padding: 8px 0;
      z-index: 100;
      box-shadow: 0 -2px 10px rgb(0 0 0 / 0.15);
    }
    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      color: var(--app-muted);
      font-size: 12px;
      padding: 4px 8px;
      transition: color 0.2s;
      min-width: 0;
    }
    .nav-item:hover {
      color: var(--app-accent);
    }
    .nav-item.active {
      color: var(--app-accent);
      font-weight: bold;
    }
    .nav-item mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      margin-bottom: 2px;
    }
    .nav-item span {
      white-space: nowrap;
    }
  `]
})
export class BottomNavComponent {}
