import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';
import sample from './fixtures/sample-game.json' with { type: 'json' };

/**
 * AGENTS.md: the app must pass every axe check and WCAG AA. Each page is
 * scanned with a sample game loaded, in light and dark mode, with its
 * interactive parts opened so their contents are scanned too.
 */

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function open(page: Page, path: string, theme: 'light' | 'dark', withGame = true): Promise<void> {
  await page.addInitScript(
    ([state, mode]) => {
      if (state) localStorage.setItem('game_state', state);
      localStorage.setItem('theme_mode', mode);
    },
    [withGame ? JSON.stringify(sample) : '', theme] as const
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
      await open(page, '/game', theme, false);
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
