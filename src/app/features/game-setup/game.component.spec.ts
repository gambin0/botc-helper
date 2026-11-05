import { beforeEach, describe, expect, it } from 'vitest';
import { GameComponent } from './game.component';
import { button, mount, seedStorage, text } from '../../testing/component-test';

describe('GameComponent', () => {
  beforeEach(() => localStorage.clear());

  const countInput = (el: HTMLElement) => el.querySelector<HTMLInputElement>('input[type="number"]')!;
  const keepNote = (el: HTMLElement) => el.querySelector('mat-checkbox + p.note');
  const keepBox = (el: HTMLElement) => el.querySelector<HTMLInputElement>('mat-checkbox input');

  it('starts a game of 8 unnamed players when there is no last game', () => {
    const { fixture, el, game } = mount(GameComponent);
    expect(countInput(el).value).toBe('8');
    expect(keepBox(el)).toBeNull();
    button(el, 'play_arrow Start game').click();
    fixture.detectChanges();
    expect(game.players().map(p => p.name)).toEqual(Array.from({ length: 8 }, (_, i) => `Player ${i + 1}`));
    expect(text(el)).toContain('Players: 8 (8 alive)');
  });

  describe('with a last game', () => {
    beforeEach(() => seedStorage({ last_seating: ['Ana', 'Ben', null, 'Dee', 'Eve', 'Fay'] }));

    it('offers to keep its players, at its size', () => {
      const { fixture, el, game } = mount(GameComponent);
      expect(countInput(el).value).toBe('6');
      expect(keepBox(el)!.checked).toBe(true);
      expect(text(keepNote(el))).toContain('1. Ana, 2. Ben, 3. Player 3, 4. Dee, 5. Eve, 6. Fay');
      button(el, 'play_arrow Start game').click();
      fixture.detectChanges();
      expect(game.players().map(p => p.name)).toEqual(['Ana', 'Ben', 'Player 3', 'Dee', 'Eve', 'Fay']);
    });

    it('says what happens when the player count changes', () => {
      const { fixture, el, game } = mount(GameComponent);
      const setCount = (n: number) => {
        countInput(el).value = String(n);
        countInput(el).dispatchEvent(new Event('input'));
        fixture.detectChanges();
      };
      setCount(7);
      expect(text(keepNote(el))).toContain('The last game had 6 players: the extra seats start unnamed.');
      setCount(5);
      expect(text(keepNote(el))).toContain('only the first 5 are kept.');
      button(el, 'play_arrow Start game').click();
      expect(game.players().map(p => p.name)).toEqual(['Ana', 'Ben', 'Player 3', 'Dee', 'Eve']);
    });

    it('starts with unnamed seats when unticked', () => {
      const { fixture, el, game } = mount(GameComponent);
      keepBox(el)!.click();
      fixture.detectChanges();
      expect(keepNote(el)).toBeNull();
      button(el, 'play_arrow Start game').click();
      expect(game.players().map(p => p.name)).toEqual(Array.from({ length: 6 }, (_, i) => `Player ${i + 1}`));
    });
  });

  it('lists remembered names and forgets one', () => {
    seedStorage({ known_player_names: ['Ana', 'Ben'] });
    const { fixture, el } = mount(GameComponent);
    expect(text(el.querySelector('summary'))).toBe('Remembered player names (2)');
    button(el, 'Forget Ana').click();
    fixture.detectChanges();
    expect(text(el.querySelector('summary'))).toBe('Remembered player names (1)');
    expect(JSON.parse(localStorage.getItem('known_player_names')!)).toEqual(['Ben']);
  });

  it('remembers the players when a new game is confirmed', async () => {
    const { fixture, el, game } = mount(GameComponent);
    game.createGame('Test', 5, ['Ana', 'Ben', 'Cal', 'Dee', 'Eve']);
    fixture.detectChanges();
    button(el, 'restart_alt New game').click();
    fixture.detectChanges();
    const confirm = button(document.body, 'Start New Game');
    confirm.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(game.hasGame()).toBe(false);
    expect(JSON.parse(localStorage.getItem('known_player_names')!)).toEqual(['Ana', 'Ben', 'Cal', 'Dee', 'Eve']);
    expect(keepBox(el)!.checked).toBe(true);
  });
});
