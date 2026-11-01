import type { Page } from '@playwright/test';

/** Open physical disclosures through their real controls before operating on their contents. */
export async function revealControl(page: Page, selector: string) {
    const target = page.locator(selector).first();
    await target.waitFor({ state: 'attached' });
    if (await target.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " stationery-inventory ")]').count() && await page.locator('[data-inventory-tab="stationery"]').count()) await page.locator('[data-inventory-tab="stationery"]').click();
    const pocket=target.locator('xpath=ancestor::article[.//button[contains(@class,"inventory-file-select")]]');
    if(await pocket.count() && !(await target.isVisible())) await pocket.locator('.inventory-file-select').click();
    const closed = target.locator('xpath=ancestor::details[not(@open)]');
    while (await closed.count()) await closed.first().locator(':scope > summary').click();
}
export async function clickControl(page: Page, selector: string) {
    await revealControl(page, selector);
    await page.locator(selector).click();
}
export async function launchApp(page: Page, command: string) {
    if (command === 'compose') {
        if (!(await page.locator('[data-mail-tab="compose"]').count())) {
            await launchApp(page, 'inbox');
        }
        await page.locator('[data-mail-tab="compose"]').click();
        return;
    }
    if (await page.locator('.pc-app').count()) await page.locator('.pc-window-close').click();
    await page.locator(`[data-pc-command="${command}"]`).click();
}

/** Choose the actual paper sample, ink dot or printed entry; computer forms keep native selects. */
export async function selectControl(page: Page, selector: string, value: string) {
    const select = page.locator(selector).first();
    await select.waitFor({ state: 'attached' });
    const id = await select.getAttribute('id');
    const group = page.locator(`[data-choice-for=${JSON.stringify(id)}]`);
    if (id && await group.count()) {
        await revealControl(page, `[data-choice-for=${JSON.stringify(id)}]`);
        await group.locator('label').filter({ has: page.locator(`input[value=${JSON.stringify(value)}]`) }).click();
    } else {
        await revealControl(page, selector);
        await select.selectOption(value);
    }
}
