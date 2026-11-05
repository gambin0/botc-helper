import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { GameStateService } from '../core/services/game-state.service';

/**
 * Helpers for component tests. They use the real services: storage is
 * jsdom's localStorage, and without Web Workers the solver runs on the main
 * thread (see SolverTaskRunner), so results arrive asynchronously.
 */

/** Seeds localStorage before any service reads it. Call before `mount`. */
export function seedStorage(entries: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, JSON.stringify(value));
}

export function mount<T>(component: Type<T>): { fixture: ComponentFixture<T>; el: HTMLElement; game: GameStateService } {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }]
  });
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, game: TestBed.inject(GameStateService) };
}

/** Lets the solver finish and re-renders. */
export async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  const game = TestBed.inject(GameStateService);
  for (let i = 0; i < 200; i++) {
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
    if (!game.solving()) return;
  }
  throw new Error('The solver did not finish');
}

/** The button with this accessible name (its aria-label, or its text). */
export function button(root: ParentNode, name: string): HTMLButtonElement {
  const found = [...root.querySelectorAll('button')].find(
    b => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim() === name || b.textContent?.trim() === name
  );
  if (!found) throw new Error(`No button "${name}"`);
  return found;
}

export function text(el: Element | null | undefined): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}
