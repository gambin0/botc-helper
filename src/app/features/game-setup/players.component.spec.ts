import { beforeEach, describe, expect, it } from 'vitest';
import { By } from '@angular/platform-browser';
import { CdkDropList } from '@angular/cdk/drag-drop';
import { PlayersComponent } from './players.component';
import { button, mount, settle, text } from '../../testing/component-test';

const NAMES = ['Ana', 'Ben', 'Cal', 'Dee', 'Eve'];

describe('PlayersComponent', () => {
  beforeEach(() => localStorage.clear());

  function setup() {
    const t = mount(PlayersComponent);
    t.game.createGame('Test', 5, NAMES);
    t.fixture.detectChanges();
    const id = (name: string) => t.game.players().find(p => p.name === name)!.id;
    const card = (name: string) =>
      [...t.el.querySelectorAll('mat-card')].find(c => c.querySelector('input')?.value === name)!;
    const seating = () => [...t.el.querySelectorAll('.seat-name')].map(s => text(s));
    return { ...t, id, card, seating };
  }

  it('asks for a game when there are no players', () => {
    const { el } = mount(PlayersComponent);
    expect(text(el)).toContain('No players. Start a game first.');
  });

  it("shows each player's possible characters, narrowed by a confirmed claim", async () => {
    const { fixture, game, id, card } = setup();
    await settle(fixture);
    expect(text(card('Ana').querySelector('.summary'))).toMatch(/^\d+ possible characters$/);
    game.addClaim(id('Ana'), 'chef', 'confirmed', 1);
    await settle(fixture);
    expect(text(card('Ana').querySelector('.summary'))).toBe('1 possible character');
    expect(text(card('Ana').querySelector('.roles'))).toBe('Chef');
  });

  it('hides your own possible characters until you reveal them', async () => {
    const { fixture, game, id, card } = setup();
    game.setSelf(id('Ben'));
    await settle(fixture);
    expect(text(card('Ben'))).toContain('Your possible characters are hidden.');
    expect(card('Ben').querySelector('.roles')).toBeNull();
    expect(text(card('Ana'))).not.toContain('hidden');
  });

  it('moves players with the arrow buttons and announces each move', () => {
    const { fixture, el, seating } = setup();
    expect(button(el, 'Move Ana up to seat 0').disabled).toBe(true);
    expect(button(el, 'Move Eve down to seat 6').disabled).toBe(true);

    button(el, 'Move Ana down to seat 2').click();
    fixture.detectChanges();
    expect(seating()).toEqual(['Ben', 'Ana', 'Cal', 'Dee', 'Eve']);
    expect(text(el.querySelector('[role="status"]'))).toBe('Ana moved to seat 2 of 5.');

    button(el, 'Move Eve up to seat 4').click();
    fixture.detectChanges();
    expect(seating()).toEqual(['Ben', 'Ana', 'Cal', 'Eve', 'Dee']);
  });

  it('moves a dragged player to where it was dropped', () => {
    const { fixture, seating, game } = setup();
    const list = fixture.debugElement.query(By.directive(CdkDropList));
    list.triggerEventHandler('cdkDropListDropped', { previousIndex: 0, currentIndex: 2 });
    fixture.detectChanges();
    expect(seating()).toEqual(['Ben', 'Cal', 'Ana', 'Dee', 'Eve']);
    expect(game.players().find(p => p.name === 'Ana')!.seat).toBe(3);
  });

  it('fixes the seats once something is logged', () => {
    const { fixture, el, game, id } = setup();
    game.addClaim(id('Ana'), 'chef', 'asserted', 1);
    fixture.detectChanges();
    expect(el.querySelector('.seating')).toBeNull();
    expect(text(el)).toContain('Seats are fixed once something is logged');
    game.movePlayer(id('Ana'), 3);
    expect(game.players().find(p => p.name === 'Ana')!.seat).toBe(1);
  });

  it('renames a seat and saves the seating for next game', () => {
    const { fixture, card, game } = setup();
    const input = card('Cal').querySelector('input')!;
    input.value = '  Cleo ';
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(game.players().map(p => p.name)).toEqual(['Ana', 'Ben', 'Cleo', 'Dee', 'Eve']);
    expect(JSON.parse(localStorage.getItem('last_seating')!)).toEqual(['Ana', 'Ben', 'Cleo', 'Dee', 'Eve']);
  });

  it('warns when the evidence contradicts itself', async () => {
    const { fixture, el, game, id } = setup();
    game.addClaim(id('Ana'), 'imp', 'confirmed', 1);
    game.addClaim(id('Ben'), 'imp', 'confirmed', 1);
    await settle(fixture);
    expect(text(el.querySelector('[role="alert"]'))).toContain('The evidence contradicts itself.');
  });
});
