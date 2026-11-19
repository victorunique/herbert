import { expect, test } from '@playwright/test';

function makeValidTxtGrid(width: number, height: number): string {
  const rows: string[][] = Array.from({ length: height }, (_, r) =>
    Array.from({ length: width }, (__, c) =>
      r === 0 || r === height - 1 || c === 0 || c === width - 1 ? '*' : '.',
    ),
  );
  rows[12]![12] = 'u';
  rows[10]![12] = 'w';
  return `# name: Uploaded Odd Arena\n# max_bytes: 12\n# points: 150\n${rows.map((r) => r.join('')).join('\n')}`;
}

test.describe('XHerbert Multi-Viewport End-to-End Browser Suite', () => {
  test('Play Mode: theme toggle, quick-symbol bar, step debugger, call stack, and solving a level', async ({
    page,
  }) => {
    await page.goto('/');

    // Theme toggle (dark -> light -> dark), ensure no top-right Reference button and no empty-code error on initial load
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByTestId('reference-btn')).toHaveCount(0);
    await expect(page.getByTestId('compile-diagnostics')).toHaveCount(0);
    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Tap quick symbol keys
    await page.getByTestId('quick-key-s').click();
    await page.getByTestId('quick-key-r').click();
    await expect(page.getByTestId('code-editor')).toHaveValue('sr');
    await expect(page.getByTestId('byte-counter')).toContainText('2 / 6 Bytes');

    // Enter recursive program and use Step Forward & Step Back
    await page.getByTestId('code-editor').fill('a(X):sa(X-1)\na(4)');
    await expect(page.getByTestId('byte-counter')).toContainText('8 / 6 Bytes');

    await page.getByTestId('btn-step-forward').click();
    await expect(page.getByTestId('step-counter')).toHaveText('1');
    await expect(page.getByTestId('call-stack-panel')).toContainText('a(X=4)');

    await page.getByTestId('btn-step-back').click();
    await expect(page.getByTestId('step-counter')).toHaveText('0');

    // Solve level 1-1 with 4-byte tail recursion
    await page.getByTestId('code-editor').fill('a:sa\na');
    await expect(page.getByTestId('byte-counter')).toContainText('4 / 6 Bytes');
    await page.getByTestId('btn-instant-run').click();
    await expect(page.getByTestId('solved-banner')).toBeVisible();
    await expect(page.getByTestId('solved-banner')).toContainText('Level Solved in 4 Bytes');

    // Open Level Selector Modal and switch to 35x25 rectangular odd map
    await page.getByTestId('level-selector-btn').click();
    await expect(page.getByTestId('level-modal')).toBeVisible();
    await page.getByTestId('select-level-c4-wide-boulevard-35x25').click();
    await expect(page.getByTestId('current-level-title')).toContainText('4-2: Grand Boulevard (35x25)');
  });

  test('Learn Mode: Cheat Sheet tab & interactive 5-stage tutorial execution and completion', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-learn').click();
    await expect(page.getByTestId('tutorial-workspace')).toBeVisible();

    await page.getByTestId('tutorial-cheatsheet-tab').click();
    await expect(page.getByTestId('learn-cheatsheet-panel')).toBeVisible();
    await expect(page.getByTestId('learn-cheatsheet-panel')).toContainText('Official Byte Counting Rules');

    await page.getByTestId('tutorial-tab-1').click();
    await page.getByTestId('tutorial-use-solution').click();
    await page.getByTestId('tutorial-run-verify').click();
    await expect(page.getByTestId('tutorial-lesson-status')).toHaveText('Completed');
  });

  test('Create Mode: resize to even rectangular 30x26, paint, save, test in simulator, and batch-upload .txt files', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('nav-create').click();
    await expect(page.getByTestId('editor-workspace')).toBeVisible();

    // Change width to 30 and height to 26 (any integer in [25, 40])
    await page.getByTestId('editor-width-select').selectOption('30');
    await page.getByTestId('editor-height-select').selectOption('26');
    await expect(page.getByTestId('editor-dim-indicator')).toHaveText('30 x 26');

    // Paint a white button on cell (8, 12) and name the level
    await page.getByTestId('brush-w').click();
    await page.getByTestId('grid-cell-8-12').click();
    await page.getByTestId('editor-name-input').fill('E2E Even Rectangular Map');
    await page.getByTestId('editor-save-btn').click();
    await expect(page.getByTestId('custom-levels-list')).toContainText('E2E Even Rectangular Map');

    // Batch upload one valid 26x25 .txt file and one invalid out-of-range 42x25 .txt file
    const validTxt = makeValidTxtGrid(26, 25);
    const invalidLargeTxt = makeValidTxtGrid(42, 25);
    const fileInput = page.getByTestId('batch-upload-input');
    await fileInput.setInputFiles([
      { name: 'valid_26x25.txt', mimeType: 'text/plain', buffer: Buffer.from(validTxt, 'utf-8') },
      {
        name: 'invalid_large_42x25.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(invalidLargeTxt, 'utf-8'),
      },
    ]);

    await expect(page.getByTestId('editor-status-msg')).toContainText('Imported 1 level(s)');
    await expect(page.getByTestId('editor-status-msg')).toContainText('Failed (1)');
    await expect(page.getByTestId('custom-levels-list')).toContainText('Uploaded Odd Arena');

    // Click Test in Play to launch the level in Play Mode
    await page.getByTestId('editor-test-btn').click();
    await expect(page.getByTestId('current-level-title')).toContainText('Uploaded Odd Arena');
  });
});
