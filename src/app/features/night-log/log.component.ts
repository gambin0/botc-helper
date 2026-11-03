import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-log',
  standalone: true,
  imports: [NgIf, NgFor],
  template: `
    <div class="page">
      <h1>Event Log</h1>
      <div *ngIf="events.length === 0" class="empty">
        <p>No events recorded yet.</p>
      </div>
      <div *ngFor="let event of events" class="event-card">
        <div class="event-header">
          <span class="night">Night {{ event.night }}</span>
          <span class="phase">{{ event.phase }}</span>
        </div>
        <div class="event-body">
          <p>{{ getEventDescription(event) }}</p>
        </div>
      </div>
      <button class="add-event-btn" (click)="showAddEventSheet()">+ Add Event</button>
    </div>
  `,
  styles: [`
    .page {
      padding: 16px;
    }
    h1 {
      margin-top: 0;
    }
    .event-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .event-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;
      color: #666;
    }
    .add-event-btn {
      width: 100%;
      padding: 12px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    }
  `]
})
export class LogComponent implements OnInit {
  events: any[] = [];

  constructor(private gameState: GameStateService) {}

  ngOnInit() {
    this.events = this.gameState.getEvents();
  }

  getEventDescription(event: any): string {
    return `${event.kind}: ${JSON.stringify(event.payload)}`;
  }

  showAddEventSheet() {
    // Show bottom sheet for adding event
  }
}
