import { selectControl } from './ui-controls';
import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const boot=async(page:any)=>{await page.goto('/?test=1');await expect(page.locator('#start')).toBeVisible();await page.waitForFunction(()=>!!(window as any).__GAME__);await page.evaluate(()=>{const g=(window as any).__GAME__;g.save.settings.quality='low';g.world.setSettings(g.save.settings);});};
const game=async(page:any,code:string)=>page.evaluate(code);
test('walk-through wing connection, eight drawers, sixteen folders, map, and saved wing',async({page})=>{
 test.setTimeout(90000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await boot(page);
 await game(page,`(()=>{const g=window.__GAME__;g.save.started=true;g.save.wing=0;g.save.zone='archive';g.save.position=[20,1.7,1.8];g.save.rotation=[0,0];g.world.restore(g.save);g.world.toggleDoor(0);g.resume();})()`);
 await expect.poll(()=>game(page,'window.__GAME__.stats().doors[0].progress')).toBeGreaterThan(.9);await page.keyboard.down('KeyD');await expect.poll(()=>game(page,'window.__GAME__.world.wing'),{timeout:15000}).toBe(1);await page.keyboard.up('KeyD');
 await expect(page.locator('#area')).toContainText('COMMERCIAL RECORDS');expect(await game(page,'window.__GAME__.save.wing')).toBe(1);expect(await game(page,'window.__GAME__.mode')).toBe('play');
 await game(page,`(()=>{const g=window.__GAME__;g.world.openDrawer(128,7);g.openStorage('archive:128:7');})()`);await expect(page.locator('.drawer-browser')).toBeVisible();await expect(page.locator('[data-file]')).toHaveCount(16);await expect(page.locator('.panel-head')).toContainText('drawer 8');
 await game(page,'window.__GAME__.showMap(0)');await expect(page.locator('[data-mapcab]')).toHaveCount(658);await expect(page.locator('[data-mapwing]')).toHaveCount(4);await page.locator('[data-mapwing="3"]').click();await expect(page.locator('[data-mapcab="511"]')).toBeVisible();expect(await game(page,'window.__GAME__.world.wing')).toBe(1);
 await game(page,'window.__GAME__.write()');await page.reload();await expect(page.locator('#start')).toHaveText(/Continue/);expect(await game(page,'window.__GAME__.world.wing')).toBe(1);expect(errors).toEqual([]);
});
test('voucher is explicitly collected and redeemed once at the Administration desk',async({page})=>{
 await boot(page);const credits=await game(page,'window.__GAME__.save.credits');
 await game(page,'window.__GAME__.save.started=true;window.__GAME__.visit(window.__GAME__.save.earlyVouchers[0])');await expect(page.locator('#collect-voucher')).toBeVisible();await page.locator('#collect-voucher').click();await expect(page.locator('#collect-voucher')).toBeDisabled();expect(await game(page,'window.__GAME__.save.credits')).toBe(credits);
 await game(page,'window.__GAME__.showDesk()');await page.locator('#redeem-vouchers').click();expect(await game(page,'window.__GAME__.save.credits')).toBeGreaterThan(credits);await expect(page.locator('#redeem-vouchers')).toBeDisabled();
 await page.reload();await expect(page.locator('#start')).toBeVisible();expect(await game(page,'window.__GAME__.save.redeemedVouchers.length')).toBe(1);
});
test('retained comparison has independent pages, sheets, hidden rows and evidence',async({page})=>{
 await boot(page);await game(page,`(()=>{const g=window.__GAME__;g.save.started=true;g.save.upgrades.push('comparison');g.save.physical.files[g.archive.storyLocations.get('ghost')[2]]='inventory';g.save.physical.files[g.tutorialId]='inventory';g.showComparison();})()`);
 await expect(page.locator('.comparison-side')).toHaveCount(2);await selectControl(page,'[data-compare-select="0"]',String(await game(page,"window.__GAME__.archive.storyLocations.get('ghost')[2]")));await selectControl(page,'[data-compare-select="1"]',String(await game(page,'window.__GAME__.tutorialId')));await page.locator('[data-compare-page="0,1"]').click();await expect(page.locator('.comparison-side').first().locator('.sheet')).toBeVisible();await expect(page.locator('.comparison-side').nth(1).locator('.document-text')).toContainText('Martin');
 await page.locator('[data-compare-reveal="0"]').click();await page.locator('[data-compare-cell="0,1,2"]').click();await expect(page.locator('.comparison-side').first().locator('.cell-comment')).toContainText('Same reference');expect(await game(page,'window.__GAME__.save.clues.length')).toBe(1);
 await page.locator('[data-compare-sheet="0,1"]').click();await expect(page.locator('.comparison-side').first()).toContainText('Retention');await page.setViewportSize({width:680,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('coloured cabinet tabs survive edits, wing views, rendering, and reload',async({page})=>{
 await boot(page);await game(page,'window.__GAME__.save.started=true;window.__GAME__.save.upgrades.push("tabs");window.__GAME__.showMap(0)');await page.locator('[data-mapcab="7"]').click();await page.locator('#marker-label').fill('The interesting drawer');await selectControl(page,'#marker-color','rose');await page.locator('#marker-form button').first().click();await expect(page.locator('[data-mapcab="7"]')).toHaveClass(/tab-rose/);
 await page.locator('[data-mapcab="7"]').click();await expect(page.locator('#marker-label')).toHaveValue('The interesting drawer');await page.locator('#marker-label').fill('Follow-up');await page.locator('#marker-form button').first().click();expect(await game(page,'window.__GAME__.save.markers.length')).toBe(1);
 await page.reload();await expect(page.locator('#start')).toBeVisible();expect(await game(page,'window.__GAME__.save.markers[0].label')).toBe('Follow-up');await game(page,'window.__GAME__.showMap(0)');await page.locator('[data-mapcab="7"]').click();await page.locator('#remove-marker').click();expect(await game(page,'window.__GAME__.save.markers.length')).toBe(0);
});
test('local source pack failure can be retried, and credits identify the source',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/content/*.json',route=>route.abort());await boot(page);
 const id=await game(page,'(()=>{const g=window.__GAME__;for(let i=0;i<100;i++)if(g.archive.get(i).source)return i;})()');
 await game(page,`window.__GAME__.save.started=true;window.__GAME__.visit(${id})`);await expect(page.locator('#retry-source')).toBeVisible();expect(await game(page,`window.__GAME__.save.inspected.includes(${id})`)).toBe(false);
 await page.unroute('**/content/*.json');await page.locator('#retry-source').click();await expect(page.locator('.source-credit')).toBeVisible();expect((await page.locator('#page-text').innerText()).length).toBeGreaterThan(100);
 await page.locator('.source-credit button').click();await expect(page.getByRole('heading',{name:'Reference collection',exact:true})).toBeVisible();await expect(page.locator('.source-list article')).toHaveCount(8);expect(errors).toEqual([]);
});
test('v1 browser save migrates automatically without changing the original raw backup',async({page})=>{
 const raw=readFileSync('tests/fixtures/legacy-active.json','utf8');await page.addInitScript(raw=>{if(!localStorage.getItem('archive-office-save-v2'))localStorage.setItem('archive-office-save-v1',raw);},raw);await boot(page);
 expect(await game(page,'window.__GAME__.save.version')).toBe(3);expect(await game(page,'window.__GAME__.save.credits')).toBe(173);expect(await page.evaluate(()=>localStorage.getItem('archive-office-v1-backup'))).toBe(raw);
 await game(page,'window.__GAME__.visit(window.__GAME__.tutorialId)');await expect(page.locator('#page-text')).toContainText('You earn credits for steady work');await expect(page.locator('.folder-jacket-label')).toContainText('W1–A08');
 await page.reload();await expect(page.locator('#start')).toHaveText(/Continue/);expect(await page.evaluate(()=>localStorage.getItem('archive-office-v1-backup'))).toBe(raw);expect(await game(page,'window.__GAME__.save.legacy.inspected.length')).toBeGreaterThan(0);
});
test('repeated room visits and open drawers keep resource counts bounded',async({page})=>{
 test.setTimeout(150000);await boot(page);const before=await game(page,'window.__GAME__.stats()');
 const samples=[],settled=[];
 for(let cycle=0;cycle<3;cycle++){
  for(const wing of [1,2,3,2,1,0]){
   await game(page,`(()=>{const g=window.__GAME__;g.world.changeWing(${wing});g.save.wing=${wing};g.world.openDrawer(${wing}*128+7,7);g.world.closeDrawer();})()`);await page.waitForTimeout(60);samples.push(await game(page,'window.__GAME__.stats()'));
  }
  await game(page,'window.__GAME__.world.restore(window.__GAME__.save)');await page.waitForTimeout(300);settled.push(await game(page,'window.__GAME__.stats()'));
 }
 const after=settled.at(-1)!;
 expect(after.objects).toBe(before.objects);expect(after.geometries).toBeLessThanOrEqual(256);expect(after.textures).toBeLessThanOrEqual(96);
 for(const s of settled){expect(s.geometries).toBe(settled[0].geometries);expect(s.textures).toBe(settled[0].textures);expect(s.objects).toBe(settled[0].objects);}
 expect(Math.max(...samples.map(s=>s.textures))).toBeLessThanOrEqual(96);expect(Math.max(...samples.map(s=>s.objects))).toBeLessThan(before.objects+32);
 console.log('Hub and archive resource audit',JSON.stringify({before,settled,after,maxObjects:Math.max(...samples.map(s=>s.objects))}));
});
test('a late mouse-capture grant cannot trap the cursor in a menu',async({page})=>{
 await boot(page);await game(page,'window.__GAME__.save.started=true;window.__GAME__.resume();window.__GAME__.showMap(0)');await page.waitForTimeout(700);expect(await page.evaluate(()=>document.pointerLockElement===null)).toBe(true);await page.locator('[data-mapcab="7"]').click();await expect(page.locator('#map-detail')).toContainText('W1–A08');
});
