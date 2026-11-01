import { test, expect } from '@playwright/test';
const boot=async(page:any)=>{await page.goto('/?test=1');await expect(page.locator('#start')).toBeVisible();await page.waitForFunction(()=>!!(window as any).__GAME__);};
const game=async(page:any,fn:string)=>page.evaluate(fn);
test('opening, movement, pause, reader, settings, and responsive layout',async({page})=>{
 test.setTimeout(120000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await boot(page);await page.screenshot({path:'test-results/title.png'});
 await page.locator('#start').click();await expect(page.getByText('A perfectly reasonable request',{exact:true})).toBeVisible();
 await page.locator('#accept-letter').click();await expect(page.getByText('Welcome to your shift',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Enter the archive'}).click();
 await expect.poll(()=>game(page,'window.__GAME__.mode')).toBe('play');
 await game(page,`(()=>{const g=window.__GAME__;g.save.wing=0;g.save.position=[0,1.7,2];g.save.rotation=[0,0];g.world.restore(g.save);})()`);
 const before=await game(page,'window.__GAME__.world.camera.position.z');
 await page.keyboard.down('KeyD');await page.waitForTimeout(1000);await page.keyboard.up('KeyD');
 await page.keyboard.down('KeyW');await page.waitForTimeout(400);await page.keyboard.up('KeyW');
 expect(await game(page,'window.__GAME__.world.camera.position.z')).toBeLessThan(before);
 await page.keyboard.press('Escape');await expect(page.getByText('A short break',{exact:true})).toBeVisible();
 await page.locator('#textSize').fill('22');await page.locator('#textSize').dispatchEvent('input');
 expect(await game(page,'window.__GAME__.save.settings.textSize')).toBe(22);
 await game(page,'window.__GAME__.visit(window.__GAME__.tutorialId,"archive:7:0")');await expect(page.getByRole('heading',{name:'A note for the new archivist'})).toBeVisible();
 await page.locator('#mark-searched').click();await expect(page.locator('#mark-searched')).toContainText('Searched');
 await page.locator('#bookmark').click();await expect(page.locator('#bookmark')).toContainText('Retained');
 await page.keyboard.press('BracketRight');await expect.poll(()=>game(page,'window.__GAME__.save.inspected.length')).toBeGreaterThan(1);
 await page.screenshot({path:'test-results/reader.png'});
 await page.setViewportSize({width:680,height:800});await expect(page.locator('.reader')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.setViewportSize({width:1440,height:900});
 await game(page,'window.__GAME__.showMap(0)');await expect(page.locator('[data-mapcab]')).toHaveCount(128);await page.locator('[data-mapcab="3"]').click();await expect(page.locator('#map-detail')).toContainText('A04');
 expect(errors).toEqual([]);
});
test('physical raycast interaction opens and animates the aimed drawer',async({page})=>{
 await boot(page);await game(page,`(()=>{const g=window.__GAME__;g.save.started=true;g.save.zone='archive';g.save.wing=0;g.save.position=[-2.4,1.7,1.7];g.save.rotation=[-.13,0];g.world.restore(g.save);g.resume();})()`);
 await page.waitForTimeout(500);await expect(page.locator('#interaction')).toBeVisible();await page.keyboard.press('KeyE');await expect(page.locator('.drawer-browser')).toBeVisible();await page.locator('[data-file]').first().click();await expect(page.locator('.reader')).toBeVisible();await expect(page.locator('.folder-jacket-label')).toContainText('A08');await page.locator('#mark-searched').click();await expect(page.locator('#mark-searched')).toContainText('Searched');
});
test('spreadsheet hidden rows and comments preserve evidence once; chain resolves',async({page})=>{
 await boot(page);await game(page,`(()=>{const g=window.__GAME__;g.save.started=true;g.visit(g.archive.storyLocations.get('ghost')[2]);})()`);
 expect(await game(page,'window.__GAME__.save.clues.length')).toBe(0);
 await page.locator('#next-page').click();await expect(page.locator('.sheet')).toBeVisible();await expect(page.locator('.hidden-row')).toBeVisible();
 await page.locator('#reveal-rows').click();await expect(page.locator('.restored')).toBeVisible();await page.locator('[data-cell="1,2"]').click();
 expect(await game(page,'window.__GAME__.save.clues.length')).toBe(1);await expect(page.locator('#cell-comment')).toContainText('Same reference');
 const credits=await game(page,'window.__GAME__.save.credits');await page.locator('[data-cell="1,2"]').click();expect(await game(page,'window.__GAME__.save.credits')).toBe(credits);
 await game(page,`(()=>{const g=window.__GAME__;for(const id of g.archive.storyLocations.get('ghost'))g.visit(id);})()`);
 expect(await game(page,"window.__GAME__.save.claimedStories.includes('ghost')")).toBe(true);
 await game(page,'window.__GAME__.showNotebook("discoveries")');await expect(page.getByRole('heading',{name:'The employee who never arrived',exact:true})).toBeVisible();
});
test('equipment, highlighter, and persistence survive reload',async({page})=>{
 await boot(page);await game(page,'window.__GAME__.save.started=true;window.__GAME__.save.credits=200;window.__GAME__.showSupplies()');
 await page.locator('[data-buy="highlighter"]').click();expect(await game(page,"window.__GAME__.save.upgrades.includes('highlighter')")).toBe(true);
 await game(page,'window.__GAME__.visit(window.__GAME__.tutorialId,"archive:7:0")');await page.locator('#keyword').fill('Martin');await page.locator('#highlight-form button').click();await expect(page.locator('mark')).toHaveCount(2);
 await page.locator('#keyword').fill('two words');await page.locator('#highlight-form button').click();await expect(page.locator('#toasts')).toContainText('Choose one word');
 await page.locator('#mark-searched').click();await page.locator('#bookmark').click();const id=await game(page,'window.__GAME__.tutorialId');
 await page.reload();await expect(page.locator('#start')).toHaveText(/Continue/);expect(await game(page,`window.__GAME__.save.searched.includes(${id})`)).toBe(true);expect(await game(page,`window.__GAME__.save.physical.files[${id}]==='inventory'`)).toBe(true);
});
test('opening the phrase page wins immediately without submission or completed stories',async({page})=>{
 await boot(page);await game(page,'window.__GAME__.save.started=true;window.__GAME__.visit(window.__GAME__.tutorialId)');expect(await game(page,'window.__GAME__.save.completed')).toBe(false);
 await game(page,'window.__GAME__.visit(window.__GAME__.archive.target)');await expect(page.getByText('You found it.',{exact:true})).toBeVisible();expect(await game(page,'window.__GAME__.save.completed')).toBe(true);expect(await game(page,'window.__GAME__.save.claimedStories.length')).toBe(0);expect(await game(page,'window.__GAME__.save.selectedFile')).toBe(null);
 await page.getByRole('button',{name:'Stay a little longer'}).click();expect(await game(page,'window.__GAME__.mode')).toBe('play');await page.reload();await expect(page.locator('#start')).toBeVisible();expect(await game(page,'window.__GAME__.save.completed')).toBe(true);
});
test('save export/import, malformed backup, and reset confirmation',async({page})=>{
 await boot(page);await game(page,'window.__GAME__.save.started=true;window.__GAME__.visit(window.__GAME__.tutorialId,"archive:7:0");window.__GAME__.write()');
 await game(page,'window.__GAME__.showNotebook()');await page.keyboard.press('Escape');await page.keyboard.press('Escape');
 await page.locator('#import-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":7}')});await expect(page.locator('#toasts')).toContainText('Import refused');
 await page.locator('#import-file').setInputFiles({name:'huge.json',mimeType:'application/json',buffer:Buffer.alloc(32*1024*1024+1)});await expect(page.locator('#toasts')).toContainText('too large');
 const snapshot=await game(page,'JSON.stringify(window.__GAME__.save)');await page.locator('#import-file').setInputFiles({name:'good.json',mimeType:'application/json',buffer:Buffer.from(snapshot)});await expect(page.locator('#confirm-import')).toBeVisible();await page.locator('#confirm-import').click();
 await expect(page.locator('#new-game')).toBeVisible();const download=page.waitForEvent('download');await page.locator('#export-save').click();expect((await download).suggestedFilename()).toMatch(/archive-shift/);
 await page.locator('#new-game').click();await expect(page.locator('#confirm-reset')).toBeVisible();await page.locator('#cancel-reset').click();expect(await game(page,'window.__GAME__.save.inspected.length')).toBeGreaterThan(0);
 await page.locator('#new-game').click();await page.locator('#confirm-reset').click();await expect(page.locator('#start')).toHaveText(/Clock in/);expect(await game(page,'window.__GAME__.save.inspected.length')).toBe(0);
});
test('corrupt or blocked storage displays recovery guidance',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('archive-office-save-v1','{broken'));await boot(page);await expect(page.locator('#storage-alert')).toContainText('could not be read');
 await page.reload();await expect(page.locator('#storage-alert')).toBeVisible();
});
test('bounded objects and GPU resources after visiting many drawers; collision geometry',async({page})=>{
 await boot(page);await expect.poll(()=>game(page,'window.__GAME__.stats().renderedFrames')).toBeGreaterThan(0);const initial=await game(page,'window.__GAME__.stats()');
 const audit=await game(page,`(()=>{const g=window.__GAME__;for(let c=0;c<128;c++){g.world.openDrawer(c,c%4);g.world.closeDrawer();}return {stats:g.stats(),wall:g.world.isBlocked(43.9,5),cabinet:g.world.isBlocked(-24.4,-30.3),corridor:g.world.isBlocked(-22,-20)};})()`);
 await page.waitForTimeout(300);const after=await game(page,'window.__GAME__.stats()');
 expect(audit.stats.objects).toBe(initial.objects);expect(after.geometries).toBe(initial.geometries);expect(after.textures).toBe(initial.textures);expect(audit.wall).toBe(true);expect(audit.cabinet).toBe(true);expect(audit.corridor).toBe(false);
 const frame=await page.evaluate(async()=>{const samples:number[]=[];let prev=performance.now();for(let i=0;i<60;i++){await new Promise(requestAnimationFrame);const n=performance.now();samples.push(n-prev);prev=n;}return samples.reduce((a,b)=>a+b,0)/samples.length;});
 console.log('Renderer audit:',JSON.stringify({initial,after,meanFrameMs:Math.round(frame*10)/10}));
 await game(page,'window.__GAME__.save.started=true;window.__GAME__.resume()');await page.screenshot({path:'test-results/office.png'});
});
test('blocked persistence, keyboard focus trap, long text, and empty notebook',async({page})=>{
 await boot(page);
 await page.evaluate(()=>{Object.defineProperty(Storage.prototype,'setItem',{configurable:true,value(){throw new DOMException('Storage blocked','QuotaExceededError');}});});
 await game(page,'window.__GAME__.save.started=true;window.__GAME__.visit(window.__GAME__.tutorialId,"archive:7:0")');
 await expect(page.locator('#storage-alert')).toContainText('unavailable or full');
 await page.locator('.drawer-context [data-drawer-back]').focus();await page.keyboard.press('Shift+Tab');await expect(page.locator('#take-file')).toBeFocused();await page.keyboard.press('Tab');await expect(page.locator('.drawer-context [data-drawer-back]')).toBeFocused();
 await game(page,`(()=>{const g=window.__GAME__,id=g.tutorialId;g.archive.special.get(id).pages[0]=('A long but valid record. '.repeat(2000));g.visit(id);})()`);
 expect((await page.locator('#page-text').innerText()).trim().split(/\s+/).length).toBeLessThanOrEqual(120);expect(await game(page,'window.__GAME__.archive.special.get(window.__GAME__.tutorialId).pages[0].length')).toBeGreaterThan(45000);await expect(page.locator('#next-page')).toBeEnabled();await page.locator('#next-page').click();await expect(page.locator('.reader-footer')).toContainText('PAGE 2 /');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await game(page,'window.__GAME__.showNotebook("discoveries")');await expect(page.getByRole('heading',{name:'Nothing unusual. Yet.',exact:true})).toBeVisible();
});
