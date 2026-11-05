import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';
import sample from './fixtures/sample-game.json' with { type: 'json' };

/**
 * AGENTS.md: the app must pass every axe check and WCAG AA. Each page is
 * scanned with a sample game loaded, in light and dark mode, with its
 * interactive parts opened so their contents are scanned too.
 */

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** A game with nothing logged yet, so seats can still be rearranged. */
const unlogged = { ...sample, events: [] };
/** Remembered names and the last game's seating. */
const roster = {
  known_player_names: JSON.stringify(['Ana', 'Ben', 'Cal', 'Dee', 'Eve', 'Fay', 'Gus', 'Hal']),
  last_seating: JSON.stringify(['Ana', 'Ben', 'Cal', null, 'Eve', 'Fay', 'Gus'])
};

async function open(
  page: Page,
  path: string,
  theme: 'light' | 'dark',
  game: object | null = sample,
  storage: Record<string, string> = {}
): Promise<void> {
  await page.addInitScript(
    ([state, mode, extra]) => {
      if (state) localStorage.setItem('game_state', state);
      localStorage.setItem('theme_mode', mode);
      for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v);
    },
    [game ? JSON.stringify(game) : '', theme, storage] as const
  );
  await page.goto(path);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('html')).toHaveClass(new RegExp(`theme-${theme}`));
}

async function expectNoViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  const summary = violations.map(v => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map(n => n.target.join(' ')).join(', ')}`);
  expect(summary).toEqual([]);
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test('game page without a game', async ({ page }) => {
      await open(page, '/game', theme, null);
      await expectNoViolations(page);
    });

    test('game page, starting with the last game\'s players and remembered names open', async ({ page }) => {
      await open(page, '/game', theme, null, roster);
      await expect(page.getByText('Keep the players from the last game')).toBeVisible();
      await page.getByText(/Remembered player names/).click();
      await expectNoViolations(page);
    });

    test('players page before logging, with seating and name suggestions open', async ({ page }) => {
      await open(page, '/players', theme, unlogged, roster);
      await expect(page.getByRole('heading', { name: 'Seating' })).toBeVisible();
      await page.getByLabel('Seat 1 name').focus();
      await expect(page.getByRole('option').first()).toBeVisible();
      await expectNoViolations(page);
    });

    test('game page', async ({ page }) => {
      await open(page, '/game', theme);
      await expectNoViolations(page);
    });

    test('players page, with the claim test open', async ({ page }) => {
      await open(page, '/players', theme);
      await page.getByText('Test a claim before you make it').click();
      await expectNoViolations(page);
    });

    test('log page', async ({ page }) => {
      await open(page, '/log', theme);
      await expectNoViolations(page);
    });

    test('deduce page, with a player and an explanation open', async ({ page }) => {
      await open(page, '/deduce', theme);
      await expect(page.getByRole('status').filter({ hasText: 'Updating' })).toHaveCount(0, { timeout: 15_000 });
      const panel = page.locator('mat-expansion-panel').nth(1);
      await panel.locator('mat-expansion-panel-header').click();
      await panel.getByText(/Ruled out/).click();
      await panel.getByRole('button', { name: /^Why can/ }).first().click();
      await expect(panel.locator('.why')).not.toContainText('Checking', { timeout: 15_000 });
      await expectNoViolations(page);
    });

    test('scripts page, with the role picker open', async ({ page }) => {
      await open(page, '/scripts', theme);
      await page.getByText('Build a custom role pool').click();
      await expectNoViolations(page);
    });
  });
}

test.describe('players from the last game', () => {
  test('a new game keeps the last players, and seats can be rearranged by keyboard', async ({ page }) => {
    await open(page, '/game', 'light', null, roster);
    await expect(page.getByLabel('Number of players (5-15)')).toHaveValue('7');
    await page.getByRole('button', { name: 'Start game' }).click();
    await page.getByRole('link', { name: /Players/ }).click();
    await expect(page.getByLabel('Seat 1 name')).toHaveValue('Ana');
    await expect(page.getByLabel('Seat 4 name')).toHaveValue('Player 4');

    // Move Ana down with the keyboard: focus stays on her arrow, and the move is announced.
    const down = page.getByRole('button', { name: 'Move Ana down to seat 2' });
    await down.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Seat 2 name')).toHaveValue('Ana');
    await expect(page.getByRole('button', { name: 'Move Ana down to seat 3' })).toBeFocused();
    await expect(page.getByRole('status').filter({ hasText: 'Ana moved to seat 2 of 7.' })).toBeAttached();

    // Moving her to the top disables "up", so focus moves to her other arrow.
    await page.getByRole('button', { name: 'Move Ana up to seat 1' }).click();
    await expect(page.getByRole('button', { name: 'Move Ana down to seat 2' })).toBeFocused();
  });

  test('seat names suggest remembered people who are not already seated', async ({ page }) => {
    await open(page, '/players', 'light', unlogged, roster);
    const seat = page.getByRole('combobox', { name: 'Seat 1 name' });
    await seat.fill('');
    await seat.pressSequentially('h');
    await expect(page.getByRole('option')).toHaveText(['Hal']);
    await page.getByRole('option', { name: 'Hal' }).click();
    await expect(seat).toHaveValue('Hal');
    // Hal is now seated, so another seat no longer offers him.
    await page.getByRole('combobox', { name: 'Seat 2 name' }).fill('h');
    await expect(page.getByRole('option')).toHaveCount(0);
  });

  test('names are remembered when a new game starts, not while typing', async ({ page }) => {
    await open(page, '/players', 'light', unlogged);
    const seat = page.getByRole('combobox', { name: 'Seat 1 name' });
    await seat.fill('Zed');
    await seat.press('Tab');
    await page.getByRole('link', { name: /Game/ }).click();
    await page.getByRole('button', { name: 'New game' }).click();
    await page.getByRole('button', { name: 'Start New Game' }).click();
    const known = () => page.evaluate(() => JSON.parse(localStorage.getItem('known_player_names') ?? '[]') as string[]);
    await expect.poll(async () => (await known()).slice(0, 3)).toEqual(['Zed', 'Ben', 'Cal']);
    expect(await known()).not.toContain('Z');
  });

  test('seats are fixed once something is logged', async ({ page }) => {
    await open(page, '/players', 'light');
    await expect(page.getByText('Seats are fixed once something is logged')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Seating' })).toHaveCount(0);
  });
});
