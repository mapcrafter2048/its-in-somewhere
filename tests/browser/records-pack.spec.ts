import { launchApp } from './ui-controls';
import { test, expect, type Page } from '@playwright/test';
const boot=async(page:Page)=>{await page.goto('/?test=1');await expect(page.locator('#start')).toBeVisible();await page.evaluate(()=>{const g=(window as any).__GAME__;g.save.started=true;g.save.settings.quality='low';g.save.settings.reducedMotion=true;g.world.setSettings(g.save.settings);g.resume();g.deskScreens.computer('inbox');});};

test('partial catalogue, password retry, digital clipping and unlock persistence',async({page})=>{
 test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await boot(page);
 await launchApp(page,'catalogue');await expect(page.locator('.pc-catalogue-entry')).toHaveCount(64);
 await page.locator('#catalogue-query').fill('Mara retirement');await page.locator('#catalogue-search button').click();await expect(page.locator('.pc-catalogue-entry')).toHaveCount(2);await expect(page.locator('.pc-catalogue')).toContainText('incomplete coverage');await expect(page.locator('.pc-catalogue button')).toHaveCount(1);
 await launchApp(page,'files');await page.locator('[data-digital-folder="Old Backups"]').click();await page.locator('[data-digital-file="duplicate-amendment"]').click();await expect(page.locator('.digital-body')).toHaveCount(0);await expect(page.locator('#clip-digital')).toHaveCount(0);
 await page.locator('#digital-password-input').fill('bad');await page.locator('#digital-password button').click();await expect(page.locator('#digital-password-status')).toContainText('try again');
 await page.locator('#digital-password-input').fill('  fax-1842  ');await page.locator('#digital-password button').click();await expect(page.locator('.digital-body')).toContainText('never supplied');await page.locator('#clip-digital').click();await expect(page.locator('.book-clipping')).toContainText('DO-41 amendment');
 await page.reload();await expect(page.locator('#start')).toBeVisible();expect(await page.evaluate(()=>{const s=(window as any).__GAME__.save;return {unlocked:s.deskLife.unlockedFiles,inspected:s.inspected,clues:s.clues};})).toEqual({unlocked:['duplicate-amendment'],inspected:[],clues:[]});expect(errors).toEqual([]);
});

test('new formats survive every physical reader, large text and keyboard use',async({page})=>{
 test.setTimeout(240000);await boot(page);await page.setViewportSize({width:680,height:850});await page.evaluate(()=>{document.documentElement.style.setProperty('--document-size','26px');document.body.classList.add('reduced-motion');});
 const samples=await page.evaluate(()=>{const g=(window as any).__GAME__,found:Record<string,number>={};for(let id=0;id<12000;id++){const d=g.archive.get(id);if(d.presentation)found[d.presentation.family]??=id;}return Object.entries(found);});expect(samples).toHaveLength(12);
 for(const [family,id]of samples){
  await page.evaluate(async id=>{await(window as any).__GAME__.visit(id);},id);await expect(page.locator(`.record-${family}`)).toBeVisible();await expect(page.locator('#page-text')).toBeVisible();expect(await page.locator('.physical-folder').evaluate(e=>e.scrollWidth<=e.clientWidth+2)).toBe(true);
 }
 const plan=samples.find(([family])=>family==='plan')![1];
 await page.evaluate(async id=>{const g=(window as any).__GAME__;g.save.upgrades.push('comparison');g.save.physical.files[String(id)]='inventory';g.showComparison();},plan);await expect(page.locator('.comparison .record-plan')).toBeVisible();
 await page.evaluate(id=>{const g=(window as any).__GAME__;g.save.physical.copies=[{id:'format-copy',file:id,place:'printer-output'}];g.save.office.printedFile=id;g.showPrintedCopy();},plan);await expect(page.locator('.printed-document .record-plan')).toBeVisible();await page.locator('#print-next').focus();await page.keyboard.press('Tab');
 await page.screenshot({path:'test-results/records-pack/plan-copy-680.png',animations:'disabled',timeout:15000});
});

test('optional correction needs the correct attached pair and changes the office after delivery',async({page})=>{
 test.setTimeout(180000);await boot(page);
 const ids=await page.evaluate(()=>[...(window as any).__GAME__.archive.threadLocations.get('duplicate')]);
 for(const id of ids)await page.evaluate(async id=>{await(window as any).__GAME__.visit(id);},id);
 expect(await page.evaluate(()=>(window as any).__GAME__.save.deskLife.resolved)).toEqual([]);
 await page.evaluate(()=>{const g=(window as any).__GAME__;g.deskScreens.compose({recipient:'accounts',caseId:'duplicate',topic:'inquiry',artifact:'',body:'Please retain both accounts.',attachments:[]});});
 await page.locator('[data-response]').nth(1).click();await page.locator('[data-attachment="0"]').selectOption(String(ids[0]));await page.locator('[data-attachment="1"]').selectOption(String(ids[3]));await page.locator('#compose-form button.primary').click();
 expect(await page.evaluate(()=>(window as any).__GAME__.save.deskLife.resolved)).toEqual([]);
 await page.evaluate(()=>{const g=(window as any).__GAME__;g.save.playSeconds+=100;g.deskScreens.computer('inbox');});await page.locator('[data-mail]').click();await expect(page.locator('.mail-body')).toContainText('Records handling corrected');
 expect(await page.evaluate(()=>{const g=(window as any).__GAME__,scene=g.world.scene;scene.updateMatrixWorld(true);const board=scene.getObjectByName('wall-mounted-whiteboard');board.geometry.computeBoundingBox();const area=board.geometry.boundingBox.clone().applyMatrix4(board.matrixWorld);const sheets=scene.getObjectByName('correspondence-outcomes').children;return {visible:scene.getObjectByName('outcome-duplicate').visible,clear:sheets.every((sheet:any)=>{sheet.geometry.computeBoundingBox();return !area.intersectsBox(sheet.geometry.boundingBox.clone().applyMatrix4(sheet.matrixWorld));})};})).toEqual({visible:true,clear:true});
 await page.evaluate(()=>(window as any).__GAME__.deskScreens.notices());await expect(page.locator('[data-outcome="duplicate"]')).toContainText('six units');
 await page.reload();await expect(page.locator('#start')).toBeVisible();expect(await page.evaluate(()=>{const g=(window as any).__GAME__;return {resolved:g.save.deskLife.resolved,credits:g.save.credits,visible:g.world.scene.getObjectByName('outcome-duplicate').visible};})).toEqual({resolved:['duplicate'],credits:12,visible:true});
});

test('old shifts retain the old collection, and replacement can export its backup first',async({page})=>{
 test.setTimeout(180000);await boot(page);await page.evaluate(()=>{const g=(window as any).__GAME__;delete g.save.recordPack;g.save.inspected=[0];g.write();});await page.reload();await expect(page.locator('#start')).toBeVisible();await page.evaluate(()=>(window as any).__GAME__.deskScreens.computer('inbox'));
 await launchApp(page,'catalogue');await expect(page.locator('.pc-catalogue-entry')).toHaveCount(58);await launchApp(page,'files');await page.locator('[data-digital-folder="Old Backups"]').click();await expect(page.locator('[data-digital-file="duplicate-amendment"]')).toHaveCount(0);
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.locator('#new-game').click();await expect(page.locator('[data-screen="reset"]')).toContainText('expanded record collection');
 const downloadPromise=page.waitForEvent('download');await page.locator('#export-reset').click();const download=await downloadPromise;expect(download.suggestedFilename()).toMatch(/archive-shift/);await expect(page.locator('#start')).toBeVisible();expect(await page.evaluate(()=>(window as any).__GAME__.save.recordPack)).toBe(1);
});
