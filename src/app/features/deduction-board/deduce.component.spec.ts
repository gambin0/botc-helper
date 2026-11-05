import { beforeEach, describe, expect, it } from 'vitest';
import { DeduceComponent } from './deduce.component';
import { button, mount, settle, text } from '../../testing/component-test';

describe('DeduceComponent', () => {
  beforeEach(() => localStorage.clear());

  async function setup() {
    const t = mount(DeduceComponent);
    t.game.createGame('Test', 5, ['Ana', 'Ben', 'Cal', 'Dee', 'Eve']);
    await settle(t.fixture);
    const id = (name: string) => t.game.players().find(p => p.name === name)!.id;
    const panel = (name: string) =>
      [...t.el.querySelectorAll('mat-expansion-panel')].find(p => text(p.querySelector('mat-panel-title')).includes(name))!;
    return { ...t, id, panel };
  }

  it('asks for a game when there is none', () => {
    const { el } = mount(DeduceComponent);
    expect(text(el)).toContain('No active game.');
  });

  it('shows who could be the Demon now, and alignments', async () => {
    const { fixture, el, game, id, panel } = await setup();
    expect(text(el.querySelector('.summary'))).toContain('The evidence is consistent.');
    game.addClaim(id('Cal'), 'imp', 'confirmed', 1);
    await settle(fixture);
    expect(text(el.querySelector('.summary .now span'))).toBe('Could be the Demon now: Cal');
    expect(text(panel('Cal').querySelector('.align'))).toBe('Evil');
    expect(text(panel('Ana').querySelector('.align'))).toBe('Unknown');
  });

  it("hides your row and leaves you out of 'could be the Demon now'", async () => {
    const { fixture, el, game, id, panel } = await setup();
    game.setSelf(id('Cal'));
    game.addClaim(id('Cal'), 'imp', 'confirmed', 1);
    await settle(fixture);
    expect(text(panel('Cal').querySelector('mat-panel-description'))).toBe('You (hidden)');
    expect(el.querySelector('.summary .now')).toBeNull();
    game.revealSelf.set(true);
    fixture.detectChanges();
    expect(text(el.querySelector('.summary .now'))).toContain('Cal');
  });

  it('explains the contradiction and what is set aside', async () => {
    const { fixture, el, game, id } = await setup();
    game.addClaim(id('Ana'), 'imp', 'confirmed', 1);
    game.addClaim(id('Ben'), 'imp', 'confirmed', 1);
    await settle(fixture);
    const summary = text(el.querySelector('.summary'));
    expect(summary).toContain('Contradiction');
    expect(summary).toContain('this is being set aside');
  });

  it('explains why a character is ruled out, on request', async () => {
    const { fixture, game, id, panel } = await setup();
    game.addClaim(id('Ana'), 'chef', 'confirmed', 1);
    await settle(fixture);
    const why = button(panel('Ben'), 'Why can Ben not be Chef?');
    expect(why.getAttribute('aria-expanded')).toBe('false');
    why.click();
    fixture.detectChanges();
    expect(why.getAttribute('aria-expanded')).toBe('true');
    await settle(fixture);
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
    const answer = panel('Ben').querySelector('.why')!;
    expect(text(answer)).not.toBe('Checking…');
    expect(text(answer)).toContain('Ana claims Chef (confirmed)');
  });

  it('lists notes from the engine', async () => {
    const { fixture, el, game, id } = await setup();
    game.addInfo(id('Ana'), { type: 'undertaker', player: id('Ben'), roleId: 'imp' }, 2);
    await settle(fixture);
    expect(text(el.querySelector('details summary'))).toMatch(/^Notes \(\d+\)$/);
    expect(text(el.querySelector('details'))).toContain('was not executed the day before night 2');
  });
});
