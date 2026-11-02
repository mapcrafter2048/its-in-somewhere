import { clickControl, selectControl } from './ui-controls';
import {test,expect,Page} from '@playwright/test';
async function boot(page:Page){await page.goto('/?test=1');await expect(page.locator('#start')).toBeVisible();await page.evaluate(()=>{const g=(window as any).__GAME__;g.save.started=true;g.save.settings.quality='low';g.world.setSettings(g.save.settings);g.save.deskLife.notes=[{id:1,sheet:0,title:'The missing spoon',text:'A theory written in the margin.\nCompare the two records.',paper:'rose',strokes:[]}];g.save.deskLife.nextNote=2;g.resume();});}
async function jump(page:Page,label:string){await page.click('#book-contents');await page.getByRole('button',{name:label,exact:true}).click();}
test('one persistent book has equal leaves, responsive pagination and all four sections',async({page})=>{
 test.setTimeout(180000);await boot(page);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(()=>{const g=(window as any).__GAME__;g.save.deskLife.collected=[...g.placements().values()];g.save.deskLife.rewards=[4,8,12,16,20,24];g.showNotebook('notes');(window as any).__book=document.querySelector('.notebook-book');});
 for(const [width,height] of [[1440,900],[1024,768],[680,850]])for(const large of [false,true]){
  await page.setViewportSize({width,height});await page.evaluate(large=>{document.documentElement.style.setProperty('--document-size',large?'26px':'18px');document.body.classList.toggle('reduced-motion',large);},large);
  for(const section of ['notes','discoveries','collection','log']){
   await page.locator(`[data-desk-tab="${section}"]`).click();await expect(page.locator('.notebook-book')).toHaveAttribute('data-section',section);
   expect(await page.evaluate(()=>document.querySelector('.notebook-book')===(window as any).__book)).toBe(true);
   const leaves=await page.locator('.book-leaf').evaluateAll(ls=>ls.map(l=>({hidden:(l as HTMLElement).hidden,w:l.getBoundingClientRect().width,h:l.getBoundingClientRect().height})));
   if(width>=900){expect(Math.abs(leaves[0].w-leaves[1].w)).toBeLessThanOrEqual(1);expect(Math.abs(leaves[0].h-leaves[1].h)).toBeLessThanOrEqual(1);}else expect(leaves.filter(l=>!l.hidden)).toHaveLength(1);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await expect(page.locator('.book-entry-overflow')).toHaveCount(0);
   expect(await page.locator('.book-leaf').first().locator('.book-folio').textContent()).toBe(await page.evaluate(()=>String((window as any).__GAME__.deskScreens.book.view.page+1).padStart(2,'0')));
   await page.screenshot({animations:'disabled',path:`test-results/unified/book-${section}-${width}-${large?26:18}.png`});
  }
 }
 await page.setViewportSize({width:1440,height:900});await page.locator('[data-desk-tab="collection"]').click();
 const illustrations:string[]=[];do{illustrations.push(...await page.locator('.book-leaf svg').evaluateAll(es=>es.map(e=>e.innerHTML)));if(await page.locator('#book-next').isDisabled())break;await page.click('#book-next');}while(true);
 expect(illustrations).toHaveLength(24);expect(new Set(illustrations).size).toBe(24);
 await jump(page,'My working stamp');await selectControl(page,'#cosmetic-stamp','RETAINED FOR REASONS');expect(await page.evaluate(()=>(window as any).__GAME__.save.deskLife.stamp)).toBe('RETAINED FOR REASONS');
 await page.locator('[data-desk-tab="log"]').click();await jump(page,'Certificate of incidental thoroughness');await expect(page.locator('.book-certificate')).toBeVisible();
 await jump(page,'Amount owed: one quiet moment');const download=page.waitForEvent('download');await page.click('#export-receipt');expect((await download).suggestedFilename()).toContain('shift-');expect(errors).toEqual([]);
});
test('long Unicode writing reconstructs exactly and editor flushes across leaves, sections and reload',async({page})=>{
 test.setTimeout(150000);await boot(page);const text=('LongUnbrokenWord'.repeat(18)+' 👩🏽‍💻 café é 漢字\n\n').repeat(14);
 await page.evaluate(text=>{const g=(window as any).__GAME__;g.save.deskLife.notes[0].text=text;g.deskScreens.note(1);},text);
 await page.fill('#note-title','A retained theory');await clickControl(page,'#read-note');
 let reconstructed='';do{reconstructed+=await page.locator('[data-entry-text="note-1"]').evaluateAll(es=>es.map(e=>e.textContent).join(''));if(await page.locator('#book-next').isDisabled())break;await page.click('#book-next');}while(true);expect(reconstructed).toBe(text);
 await page.evaluate(()=>(window as any).__GAME__.deskScreens.note(1));await page.fill('#note-text',text+'\nFinal line.');
 const canvas=page.locator('#note-sketch'),box=(await canvas.boundingBox())!;await page.mouse.move(box.x+20,box.y+20);await page.mouse.down();await page.mouse.move(box.x+80,box.y+60);await page.mouse.up();
 await page.locator('[data-desk-tab="collection"]').click();await page.locator('[data-desk-tab="notes"]').click();await page.evaluate(()=>(window as any).__GAME__.deskScreens.note(1));await expect(page.locator('#note-text')).toHaveValue(text+'\nFinal line.');
 await page.setViewportSize({width:680,height:850});await page.click('#book-next');await expect(canvas).toBeVisible();await page.click('#book-prev');await expect(page.locator('#note-text')).toBeVisible();
 await page.keyboard.press('Escape');await page.reload();await expect(page.locator('#start')).toBeVisible();const saved=await page.evaluate(()=>(window as any).__GAME__.save.deskLife.notes[0]);expect(saved.title).toBe('A retained theory');expect(saved.text).toBe(text+'\nFinal line.');expect(saved.strokes).toHaveLength(1);
});
test('folder keeps its right flap at every size, supports drawer switching and all document families',async({page})=>{
 test.setTimeout(120000);await boot(page);
 for(const width of [1440,1024,680]){await page.setViewportSize({width,height:width===1024?768:850});await page.evaluate(()=>{const g=(window as any).__GAME__;g.openStorage('archive:7:0');});await page.locator('[data-file]').first().click();await expect(page.locator('.physical-folder')).toHaveAttribute('data-phase','ready');await expect(page.locator('.folder-sidebar')).not.toBeVisible();await expect(page.locator('.folder-contents')).toHaveCount(0);await expect(page.locator('.folder-workspace')).toBeVisible();await page.screenshot({animations:'disabled',path:`test-results/unified/folder-${width}.png`});}
 const previousReference=await page.locator('.folder-jacket-label').textContent();await page.keyboard.press('BracketRight');await page.keyboard.press('BracketRight');await page.keyboard.press('BracketRight');await expect(page.locator('.folder-jacket-label')).not.toHaveText(previousReference!);
 for(const family of ['correspondence','report','form','reference','workbook']){await page.evaluate(async family=>{const g=(window as any).__GAME__,k:any={correspondence:['memo','email','letter'],report:['report','proposal'],form:['ticket','expense','maintenance'],reference:['reference','research'],workbook:['spreadsheet']};for(let id=0;id<3000;id++)if(k[family].includes(g.archive.get(id).kind)){await g.visit(id);break;}},family);await expect(page.locator(`.treatment-${family}`)).toBeVisible();await page.screenshot({animations:'disabled',path:`test-results/unified/family-${family}.png`});}
});
test('late source loads cannot replace a newer file or reopen a closed folder',async({page})=>{
 await boot(page);let release!:()=>void;const gate=new Promise<void>(r=>release=r);await page.route('**/content/*.json',async route=>{await gate;await route.continue();});
 const source=await page.evaluate(()=>{const g=(window as any).__GAME__;for(let i=0;i<100;i++)if(g.archive.get(i).source){void g.visit(i);return i;}return -1;});
 await expect(page.locator('.physical-folder[data-phase="loading"]')).toBeVisible();await page.evaluate(()=>{void (window as any).__GAME__.visit(0);});await expect(page.locator('.physical-folder[data-phase="ready"]')).toBeVisible();release();await page.waitForTimeout(300);
 expect(await page.evaluate(id=>(window as any).__GAME__.save.inspected.includes(id),source)).toBe(false);await expect(page.locator('.document-paper h2')).toHaveText(await page.evaluate(()=>(window as any).__GAME__.archive.get(0).title));
 await page.reload();await expect(page.locator('#start')).toBeVisible();let releaseAgain!:()=>void;const nextGate=new Promise<void>(r=>releaseAgain=r);await page.unroute('**/content/*.json');await page.route('**/content/*.json',async route=>{await nextGate;await route.continue();});
 await page.evaluate(id=>{const g=(window as any).__GAME__;g.save.started=true;void g.visit(id);},source);await expect(page.locator('.physical-folder[data-phase="loading"]')).toBeVisible();await page.keyboard.press('Escape');releaseAgain();await page.waitForTimeout(300);expect(await page.evaluate(()=>(window as any).__GAME__.mode)).toBe('play');await expect(page.locator('.physical-folder')).toHaveCount(0);
});
test('empty and partial notebooks retain identification, evidence, source and recycling rules',async({page})=>{
 await boot(page);await page.evaluate(()=>{const g=(window as any).__GAME__;g.save.deskLife.notes=[];g.save.credits=20;g.showNotebook('collection');});
 await expect(page.locator('.catalogue-blank').first()).toBeVisible();await expect(page.locator('.catalogue-entry svg')).toHaveCount(0);await page.locator('[data-identify]').first().click();expect(await page.evaluate(()=>(window as any).__GAME__.save.credits)).toBe(16);await expect(page.locator('.catalogue-entry svg')).toHaveCount(1);expect(await page.evaluate(()=>(window as any).__GAME__.save.deskLife.collected.length)).toBe(0);
 await page.evaluate(()=>{const g=(window as any).__GAME__;g.save.clues=[...g.archive.storyLocations.get('ghost'),g.archive.storyLocations.get('fridge')[0]];g.save.claimedStories=['ghost'];g.showNotebook('discoveries');});await page.click('#book-contents');await page.getByRole('button',{name:'The employee who never arrived',exact:true}).click();await expect(page.getByRole('heading',{name:'The employee who never arrived',exact:true})).toBeVisible();
 await page.click('#book-contents');await page.getByRole('button',{name:'The employee who never arrived / conclusion',exact:true}).click();await expect(page.locator('[data-book-entry="ending-ghost"]')).toBeVisible();await page.screenshot({animations:'disabled',path:'test-results/unified/partial-discoveries.png'});
 await page.evaluate(()=>(window as any).__GAME__.showNotebook('notes'));await page.fill('#note-text','Keep this until I choose to recycle.');await clickControl(page,'#delete-note');await page.click('#cancel-delete');await expect(page.locator('#note-text')).toHaveValue('Keep this until I choose to recycle.');await clickControl(page,'#delete-note');await page.click('#confirm-delete');expect(await page.evaluate(()=>(window as any).__GAME__.save.deskLife.notes.length)).toBe(0);
});
