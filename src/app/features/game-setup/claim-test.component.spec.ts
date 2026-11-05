import { beforeEach, describe, expect, it } from 'vitest';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { ClaimTestComponent } from './claim-test.component';
import { mount, settle, text } from '../../testing/component-test';

describe('ClaimTestComponent', () => {
  beforeEach(() => localStorage.clear());

  async function setup(markSelf = true) {
    const t = mount(ClaimTestComponent);
    t.game.createGame('Test', 5, ['Ana', 'Ben', 'Cal', 'Dee', 'Eve']);
    const id = (name: string) => t.game.players().find(p => p.name === name)!.id;
    if (markSelf) t.game.setSelf(id('Ben'));
    await settle(t.fixture);
    const loader = TestbedHarnessEnvironment.loader(t.fixture);
    const testButton = () => loader.getHarness(MatButtonHarness.with({ text: 'Test claim' }));
    const claim = async (role: string) => (await loader.getHarness(MatSelectHarness)).clickOptions({ text: role });
    return { ...t, id, testButton, claim };
  }

  /** Waits for the test to finish (it runs on the main thread here, asynchronously). */
  async function finish(t: Awaited<ReturnType<typeof setup>>) {
    for (let i = 0; i < 100 && text(t.el.querySelector('[role="status"]')) === 'Testing claim…'; i++) {
      await new Promise(resolve => setTimeout(resolve, 0));
      t.fixture.detectChanges();
    }
  }

  it('needs you to be marked on the Players tab', async () => {
    const t = await setup(false);
    await t.claim('Chef (townsfolk)');
    expect(await (await t.testButton()).isDisabled()).toBe(true);
  });

  it('shows what the table could deduce from the claim', async () => {
    const t = await setup();
    t.game.addClaim(t.id('Ana'), 'chef', 'asserted', 1);
    await settle(t.fixture);
    await t.claim('Chef (townsfolk)');
    await (await t.testButton()).click();
    await finish(t);
    const result = t.el.querySelector('section.result');
    expect(result).not.toBeNull();
    expect(text(result?.querySelector('.verdict'))).toMatch(/^(Contradiction|You would be exposed|Reveals information|Fits)$/);
    expect(text(result)).toContain('Also claiming it: Ana.');
  });

  it('clears the answer when the game changes', async () => {
    const t = await setup();
    await t.claim('Empath (townsfolk)');
    await (await t.testButton()).click();
    await finish(t);
    expect(t.el.querySelector('section.result')).not.toBeNull();
    t.game.addDeath(t.id('Eve'), 1);
    t.fixture.detectChanges();
    expect(t.el.querySelector('section.result')).toBeNull();
  });
});
