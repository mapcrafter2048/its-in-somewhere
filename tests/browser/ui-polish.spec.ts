import { test, expect, type Page } from '@playwright/test';

async function boot(page: Page) {
    await page.goto('/?test=1');
    await expect(page.locator('#start')).toBeVisible();
    await page.evaluate(() => {
        const g = (window as any).__GAME__;
        g.save.started = true;
        g.save.settings.quality = 'low';
        g.world.setSettings(g.save.settings);
        g.resume();
    });
}
const mode = (page: Page) => page.evaluate(() => (window as any).__GAME__.mode);

test('Escape toggles once per press, closes disclosures first and resumes without capture churn', async ({ page }) => {
    await boot(page);
    await page.keyboard.press('Escape');
    await expect.poll(() => mode(page)).toBe('pause');
    await page.keyboard.down('Escape');
    await expect.poll(() => mode(page)).toBe('play');
    await page.keyboard.down('Escape');
    await page.waitForTimeout(150);
    expect(await mode(page)).toBe('play');
    await page.keyboard.up('Escape');
    await page.keyboard.press('Escape');
    await expect.poll(() => mode(page)).toBe('pause');
    await page.keyboard.press('Escape');
    await expect.poll(() => mode(page)).toBe('play');
    await page.keyboard.press('KeyN');
    await page.fill('#note-text', 'Save me when Escape closes the notebook.');
    await page.locator('#book-contents').click();
    await expect(page.locator('#book-index')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#book-index')).not.toBeVisible();
    await expect(page.locator('#book-contents')).toBeFocused();
    expect(await mode(page)).toBe('notebook');
    await page.keyboard.press('Escape');
    await expect.poll(() => mode(page)).toBe('play');
    await page.keyboard.press('KeyN');
    await expect(page.locator('#note-text')).toHaveValue('Save me when Escape closes the notebook.');
    // Native pointer-lock release can precede the keyboard event for the same press.
    await page.evaluate(async () => { const g = (window as any).__GAME__; g.resume(false); await document.querySelector<HTMLCanvasElement>('#world')!.requestPointerLock(); });
    await expect.poll(() => page.evaluate(() => document.pointerLockElement?.id)).toBe('world');
    await expect.poll(() => page.evaluate(() => (window as any).__GAME__.world.stats().capture)).toBe('locked');
    await page.evaluate(() => {
        document.addEventListener('pointerlockchange', () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })), { once: true });
        document.exitPointerLock();
    });
    await expect.poll(() => mode(page)).toBe('pause');
    expect(await mode(page)).toBe('pause');
    await page.keyboard.up('Escape');
    await page.keyboard.press('Escape');
    await expect.poll(() => mode(page)).toBe('play');
});

test('held sticky edits in place, pastes, detaches and survives reload', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => { const g = (window as any).__GAME__; g.save.deskLife.tools.pad = 'held'; g.save.physical.held = { kind: 'tool', id: 'pad' }; });
    await page.keyboard.press('KeyF');
    await page.fill('#sticky-text', 'The first theory');
    await page.locator('#detach-sticky').click();
    await page.keyboard.press('KeyF');
    await expect(page.locator('#sticky-text')).toHaveValue('The first theory');
    await page.fill('#sticky-text', 'The revised theory');
    await page.keyboard.press('Escape');
    await page.evaluate(() => (window as any).__GAME__.deskScreens.board());
    await page.locator('#pinboard-surface').click({ position: { x: 100, y: 100 } });
    await expect(page.locator('[data-pin-kind="sticky"]')).toHaveCount(1);
    await page.locator('[data-pin-kind="sticky"]').click();
    await page.locator('#return-sheet').click();
    await page.keyboard.press('Escape');
    await page.keyboard.press('KeyF');
    await expect(page.locator('#sticky-text')).toHaveValue('The revised theory');
    await page.fill('#sticky-text', 'A final handwritten correction');
    await page.locator('#detach-sticky').click();
    await page.reload();
    await expect(page.locator('#start')).toBeVisible();
    expect(await page.evaluate(() => { const g = (window as any).__GAME__; return { notes: g.save.deskLife.stickies, pins: g.save.deskLife.pins, held: g.save.physical.held }; })).toMatchObject({ notes: [{ id: 1, text: 'A final handwritten correction', place: 'held' }], pins: [], held: { kind: 'sticky', id: 1 } });
});

test('desktop icons launch all apps, closing returns home, mail drafts survive and Snake releases controls', async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await boot(page);
    await page.evaluate(() => (window as any).__GAME__.deskScreens.computer());
    await expect(page.locator('.pc-desktop-icon')).toHaveCount(6);
    for (const app of ['inbox', 'files', 'directory', 'print', 'catalogue', 'snake']) {
        await page.locator(`[data-pc-command="${app}"]`).click();
        await expect(page.locator('.pc-app')).toBeVisible();
        await expect(page.locator('.pc-desktop-icon')).toHaveCount(0);
        if (app === 'inbox') {
            await page.locator('[data-mail-tab="compose"]').click();
            await page.fill('#mail-body', 'Retain this when closing the application.');
        }
        if (app === 'snake') {
            await expect(page.locator('#snake-toggle')).toBeVisible();
            await page.locator('#snake-toggle').click();
            await expect(page.locator('#snake-status')).toContainText('Playing');
        }
        await page.locator('.pc-window-close').click();
        await expect(page.locator('.pc-desktop-icon')).toHaveCount(6);
        await expect(page.locator('#snake-board')).toHaveCount(0);
    }
    await page.locator('[data-pc-command="inbox"]').click();
    await page.locator('[data-mail-tab="drafts"]').click();
    await expect(page.locator('#mail-body')).toHaveValue('Retain this when closing the application.');
    await page.keyboard.press('Escape');
    await expect(page.locator('.pc-desktop-icon')).toHaveCount(6);
    await page.keyboard.press('Escape');
    await expect.poll(() => mode(page)).toBe('play');
    expect(errors).toEqual([]);
});

test('drawers expose their last file and bottom object; surfaces fit large text at three widths', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page);
    for (const width of [1440, 1024, 680]) {
        await page.setViewportSize({ width, height: 850 });
        await page.evaluate(() => { document.documentElement.style.setProperty('--document-size', '26px'); document.body.classList.add('reduced-motion'); const g = (window as any).__GAME__; g.openStorage([...g.placements()][0][0]); });
        await page.locator('.drawer-folder').last().scrollIntoViewIfNeeded();
        await expect(page.locator('.drawer-folder').last()).toBeInViewport({ ratio: 1 });
        await page.locator('#collect-artifact').scrollIntoViewIfNeeded();
        await expect(page.locator('#collect-artifact')).toBeInViewport({ ratio: 1 });
        await page.screenshot({ path: `test-results/ui-polish/drawer-${width}.png`, animations: 'disabled' });
        await page.locator('.drawer-folder').last().click();
        await expect(page.locator('.physical-folder')).toHaveAttribute('data-phase', 'ready');
        await expect(page.locator('.document-paper')).toBeVisible();
        await expect(page.locator('.document-letterhead')).toBeInViewport({ ratio: 1 });
        await expect(page.locator('.folder-instruments')).toBeVisible();
        await expect(page.locator('.reader-menu')).toHaveCount(0);
        await page.screenshot({ path: `test-results/ui-polish/file-${width}.png`, animations: 'disabled' });
        await page.evaluate(() => (window as any).__GAME__.showNotebook());
        const gaps = await page.locator('.book-tabs').evaluate(el => [...el.children].slice(1).map((child, i) => child.getBoundingClientRect().top - el.children[i].getBoundingClientRect().bottom));
        expect(new Set(gaps).size).toBe(1);
        expect(gaps[0]).toBeGreaterThan(0);
        expect(await page.locator('.notebook-book').evaluate(book => {
            const edge = book.querySelector('.book-spread')!.getBoundingClientRect().right;
            return [...book.querySelectorAll('.book-tabs button')].every(tab => { const r = tab.getBoundingClientRect(); return r.left <= edge && r.right > edge; });
        })).toBe(true);
        expect(await page.locator('.book-tabs button').evaluateAll(buttons => buttons.every(button => button.scrollWidth <= button.clientWidth))).toBe(true);
        if (width < 900) await page.locator('#book-next').click();
        await expect(page.locator('[data-choice-for="note-paper"]')).toBeVisible();
        await expect(page.locator('.notebook-book select:visible')).toHaveCount(0);
        await page.screenshot({ path: `test-results/ui-polish/notebook-${width}.png`, animations: 'disabled' });
        await page.evaluate(() => (window as any).__GAME__.deskScreens.board());
        await expect(page.locator('#pin-sheet')).not.toBeVisible();
        await page.screenshot({ path: `test-results/ui-polish/board-${width}.png`, animations: 'disabled' });
        await page.evaluate(() => (window as any).__GAME__.deskScreens.computer());
        await page.screenshot({ path: `test-results/ui-polish/desktop-${width}.png`, animations: 'disabled' });
        expect(await page.locator('.pc-terminal').evaluate(el => el.scrollWidth <= el.clientWidth + 2)).toBe(true);
    }
});
