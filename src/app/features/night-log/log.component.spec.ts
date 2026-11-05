import { beforeEach, describe, expect, it } from 'vitest';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatRadioGroupHarness } from '@angular/material/radio/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { LogComponent } from './log.component';
import { mount, text } from '../../testing/component-test';

describe('LogComponent and the evidence form', () => {
  beforeEach(() => localStorage.clear());

  function setup() {
    const t = mount(LogComponent);
    t.game.createGame('Test', 5, ['Ana', 'Ben', 'Cal', 'Dee', 'Eve']);
    t.fixture.detectChanges();
    const loader: HarnessLoader = TestbedHarnessEnvironment.loader(t.fixture);
    const select = async (label: string) =>
      (await loader.getHarness(MatFormFieldHarness.with({ floatingLabelText: label }))).getControl(MatSelectHarness);
    const choose = async (label: string, option: string) => (await select(label))!.clickOptions({ text: option });
    const add = () => loader.getHarness(MatButtonHarness.with({ text: /Add/ }));
    const entries = () => [...t.el.querySelectorAll('.event .text > div:first-child')].map(e => text(e));
    return { ...t, loader, select, choose, add, entries };
  }

  it('asks for a game first', () => {
    const { el } = mount(LogComponent);
    expect(text(el)).toContain('Start a game on the Game tab to record evidence.');
  });

  it('logs a claim with how much to trust it', async () => {
    const { loader, choose, add, entries } = setup();
    expect(await (await add()).isDisabled()).toBe(true);
    await choose('Player making the claim', '1. Ana');
    expect(await (await add()).isDisabled()).toBe(true); // no character yet
    await choose('Character claimed', 'Chef (townsfolk)');
    await (await loader.getHarness(MatRadioGroupHarness)).checkRadioButton({ label: /Confirmed/ });
    await (await add()).click();
    expect(entries()).toEqual(['Ana claims Chef (confirmed)']);
  });

  it('logs an execution that ended the game', async () => {
    const { loader, choose, add, entries } = setup();
    await choose('Type', 'Execution');
    await choose('Player executed', '2. Ben');
    await (await loader.getHarness(MatCheckboxHarness)).check();
    await (await add()).click();
    expect(entries()).toEqual(['Ben was executed and the game ended']);
  });

  it('offers only abilities of characters in the role pool', async () => {
    const { choose, select } = setup();
    await choose('Type', 'Ability / night info');
    const abilities = await select('Ability used');
    await abilities!.open();
    const options = await Promise.all((await abilities!.getOptions()).map(o => o.getText()));
    expect(options).toContain('Empath');
    expect(options).toContain('Undertaker');
    expect(options).not.toContain('Sage'); // not in Trouble Brewing
  });

  it('deletes an entry', async () => {
    const { fixture, el, game, entries } = setup();
    game.addDeath(game.players()[2].id, 1);
    fixture.detectChanges();
    expect(entries()).toEqual(['Cal died']);
    el.querySelector<HTMLButtonElement>('button[aria-label="Delete: Cal died"]')!.click();
    fixture.detectChanges();
    expect(entries()).toEqual([]);
    expect(text(el)).toContain('No evidence recorded yet.');
  });
});
