import { test, expect, type Page } from '@playwright/test';
async function boot(page: Page) {
    await page.goto('/?test=1');
    await expect(page.locator('#start')).toBeVisible();
    await page.evaluate(() => { const g = (window as any).__GAME__; g.save.started = true; g.save.settings.quality = 'low'; g.world.setSettings(g.save.settings); g.resume(); });
}
async function choose(page: Page, id: string, value: string) {
    await page.locator(`[data-choice-for="${id}"] label`).filter({ has: page.locator(`input[value="${value}"]`) }).click();
}

test('notebook stationery replaces dropdowns and preserves writing, colour, strokes and tear-out', async ({ page }) => {
    await boot(page);
    await page.keyboard.press('KeyN');
    await expect(page.locator('.notebook-book details')).toHaveCount(0);
    await expect(page.locator('.book-leaf .physical-choices')).toHaveCount(0);
    await expect(page.locator('.notebook-book select:visible')).toHaveCount(0);
    await page.fill('#note-title', 'A theory on paper');
    await page.fill('#note-text', 'The stationery should belong to this notebook.');
    await choose(page, 'note-paper', 'rose');
    await choose(page, 'note-ink', 'green');
    await page.locator('[data-choice-for="note-ink"] input[value="green"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#note-ink')).toHaveValue('black');
    await choose(page, 'note-ink', 'green');
    await choose(page, 'note-tool', 'broad');
    await expect(page.locator('.notebook-book')).toBeVisible();
    const canvas = await page.locator('#note-sketch').boundingBox();
    await page.mouse.move(canvas!.x + 30, canvas!.y + 30); await page.mouse.down();
    await page.mouse.move(canvas!.x + 100, canvas!.y + 70, { steps: 4 }); await page.mouse.up();
    await page.locator('#read-note').click();
    await expect(page.locator('.book-entry-text')).toContainText('The stationery should belong');
    await page.evaluate(() => (window as any).__GAME__.deskScreens.note(1));
    await expect(page.locator('[data-choice-for="note-paper"] input[value="rose"]')).toBeChecked();
    const saved = await page.evaluate(() => (window as any).__GAME__.save.deskLife.notes[0]);
    expect(saved).toMatchObject({ paper: 'rose', strokes: [{ color: 'green', width: .012 }] });
    await page.locator('#delete-note').click(); await page.locator('#cancel-delete').click();
    await expect(page.locator('#note-text')).toHaveValue('The stationery should belong to this notebook.');
    await page.locator('#delete-note').click(); await page.locator('#confirm-delete').click();
    expect(await page.evaluate(() => (window as any).__GAME__.save.deskLife.notes.length)).toBe(0);
});

test('physical controls remain usable at three sizes and computer controls retain their own language', async ({ page }) => {
    test.setTimeout(120000); await boot(page);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    for (const width of [1440, 1024, 680]) {
        await page.setViewportSize({ width, height: 850 });
        await page.evaluate(() => { document.documentElement.style.setProperty('--document-size', '26px'); document.body.classList.add('reduced-motion'); });
        for (const surface of ['notebook', 'pinboard', 'folder', 'inventory', 'desk', 'printer', 'supplies', 'pause']) {
            await page.evaluate(async surface => { const g = (window as any).__GAME__; const actions: Record<string, () => void> = { notebook: () => g.showNotebook(), pinboard: () => g.deskScreens.board(), folder: () => g.visit(g.tutorialId, 'archive:7:0'), inventory: () => g.showInventory(), desk: () => g.showDesk(), printer: () => g.showPrinter(), supplies: () => g.showSupplies(), pause: () => document.querySelector<HTMLButtonElement>('[data-tool="pause"]')!.click() }; await actions[surface](); }, surface);
            await expect(page.locator('.panel,.reader').first()).toBeVisible();
            await expect(page.locator('#overlay select:visible')).toHaveCount(0);
            await expect(page.locator('#overlay .context-menu')).toHaveCount(0);
            expect(await page.locator('.panel,.reader').first().evaluate(el => el.scrollWidth <= el.clientWidth + 2), `${surface} at ${width}`).toBe(true);
            if (surface === 'notebook') {
                if (width < 900) await page.locator('#book-next').click();
                await expect(page.locator('.book-leaf .physical-choices')).toHaveCount(0);
                await expect(page.locator('[data-choice-for="note-ink"]')).toBeVisible();
                const toolsOutside = await page.locator('.notebook-book').evaluate(book => {
                    const edge = book.querySelector('.book-volume')!.getBoundingClientRect();
                    const paper = book.querySelector('.book-spread')!.getBoundingClientRect();
                    const pencilCase = book.querySelector('.book-palette')!.getBoundingClientRect();
                    return pencilCase.left > edge.right && [...book.querySelectorAll('.book-held-tools .choice-object')].every(tool => { const r = tool.getBoundingClientRect(); return r.bottom > edge.bottom && r.top < paper.bottom + 20; });
                });
                expect(toolsOutside).toBe(true);
                const attached = await page.locator('.notebook-book').evaluate(book => { const edge = book.querySelector('.book-spread')!.getBoundingClientRect().right; return [...book.querySelectorAll('.book-tabs button')].every(tab => { const r = tab.getBoundingClientRect(); return r.left <= edge && r.right > edge; }); });
                expect(attached).toBe(true);
            }
            await page.screenshot({ path: `test-results/materials/${surface}-${width}.png`, animations: 'disabled' });
        }
    }
    await page.evaluate(() => (window as any).__GAME__.deskScreens.compose());
    await expect(page.locator('.pc-terminal select:visible').first()).toBeVisible();
    expect(errors).toEqual([]);
});

test('pinboard colours, connections and file clips use direct controls',async({page})=>{
 await boot(page);await page.evaluate(()=>{const g=(window as any).__GAME__;g.save.upgrades.push('sticky-colours');g.stationery.board();});
 for(const text of ['A pink paper clue.','Another lead.']){await page.click('#new-board-note');await choose(page,'board-sticky-colour','rose');await page.fill('#board-sticky-text',text);await page.click('#board-sticky-done');}
 await page.click('#board-thread');await page.locator('[data-pin]').first().click();await page.locator('[data-pin]').last().click();expect(await page.evaluate(()=>(window as any).__GAME__.save.deskLife.strings.length)).toBe(1);
 await page.evaluate(async()=>{const g=(window as any).__GAME__;await g.visit(g.tutorialId,'archive:7:0');});await page.click('#mark-searched');await page.click('#clip-page');await expect(page.locator('.book-clipping')).toBeVisible();
});
