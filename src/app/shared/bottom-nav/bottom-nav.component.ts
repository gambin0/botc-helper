import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      <a routerLink="/game" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
        <span class="icon">🎮</span>
        <span>Game</span>
      </a>
      <a routerLink="/players" routerLinkActive="active">
        <span class="icon">👥</span>
        <span>Players</span>
      </a>
      <a routerLink="/log" routerLinkActive="active">
        <span class="icon">📝</span>
        <span>Log</span>
      </a>
      <a routerLink="/deduce" routerLinkActive="active">
        <span class="icon">🔍</span>
        <span>Deduce</span>
      </a>
      <a routerLink="/scripts" routerLinkActive="active">
        <span class="icon">📜</span>
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
      background: white;
      border-top: 1px solid #e0e0e0;
      padding: 8px 0;
      z-index: 100;
    }
    .bottom-nav a {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      color: #666;
      font-size: 12px;
      padding: 4px 8px;
    }
    .bottom-nav a.active {
      color: #1976d2;
    }
    .bottom-nav .icon {
      font-size: 24px;
      margin-bottom: 2px;
    }
  `]
})
export class BottomNavComponent {}
