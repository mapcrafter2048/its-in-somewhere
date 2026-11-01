import { test, expect, type Page } from '@playwright/test';
import { selectControl } from './ui-controls';
async function boot(page: Page) {
 await page.goto('/?test=1'); await expect(page.locator('#start')).toBeVisible();
 await page.evaluate(() => { const g=(window as any).__GAME__;g.save.started=true;g.save.settings.quality='low';g.world.setSettings(g.save.settings);g.showNotebook(); });
}
test('front spread preserves writing, supports the index and turns pages without duplicating content',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await boot(page);
 await page.fill('#note-title','An unfiled idea');await page.fill('#note-text','Retain this line through every turn.');
 await page.locator('#book-contents').click();
 await expect(page.locator('.book-front-spread')).toBeVisible();await expect(page.locator('.book-front-cover')).toContainText('My notebook');
 await expect(page.locator('#book-index')).toContainText('Sheet 01 / An unfiled idea');
 expect(await page.locator('.book-front-spread').evaluate(front=>front.querySelector('.book-front-cover')!.getBoundingClientRect().right<=front.querySelector('#book-index')!.getBoundingClientRect().left+1)).toBe(true);
 await expect(page.locator('#note-text')).not.toBeVisible();
 await page.locator('#book-next').click();await expect(page.locator('#note-text')).toHaveValue('Retain this line through every turn.');
 await page.locator('#book-contents').click();await page.getByRole('button',{name:'Sheet 02 / Unwritten',exact:true}).click();
 await expect(page.locator('#book-position')).toContainText('Sheet 2');await page.fill('#note-text','Second sheet.');
 await page.locator('#book-prev').click();await expect(page.locator('#note-text')).toHaveValue('Retain this line through every turn.');
 await page.locator('#book-next').click();
 const frames=await page.locator('.book-animation-layer').evaluate(layer=>layer.getAnimations({subtree:true}).flatMap(animation=>(animation.effect as KeyframeEffect).getKeyframes()).map(frame=>frame.transform));
 expect(frames.some(frame=>String(frame).includes('rotateY'))).toBe(true);
 await page.locator('#book-next').click();await expect(page.locator('#book-position')).toContainText('Sheet 3');
 await expect(page.locator('.book-turn-leaf')).toHaveCount(0);await expect(page.locator('.book-leaf')).toHaveCount(2);
 await page.locator('#book-contents').click();await page.keyboard.press('Escape');
 await expect(page.locator('.book-front-spread')).not.toBeVisible();await expect(page.locator('#book-contents')).toBeFocused();
 await page.reload();await expect(page.locator('#start')).toBeVisible();
 expect(await page.evaluate(()=>(window as any).__GAME__.save.deskLife.notes.map((note:any)=>note.text))).toEqual(['Retain this line through every turn.','Second sheet.']);expect(errors).toEqual([]);
});
test('colour chips, cropped upright tools, circular rings and attached tags work across sizes',async({page})=>{
 test.setTimeout(120000);await boot(page);
 for(const width of [1440,1024,680]){
  await page.setViewportSize({width,height:850});await page.evaluate(()=>{document.body.classList.add('reduced-motion');document.documentElement.style.setProperty('--document-size','26px');});
  await selectControl(page,'#note-paper','cream');
  const swatches=await page.locator('.book-palette .choice-object').evaluateAll(samples=>samples.map(sample=>({before:getComputedStyle(sample,':before').display,after:getComputedStyle(sample,':after').display,transform:getComputedStyle(sample).transform,w:sample.clientWidth,h:sample.clientHeight})));
  expect(swatches.every(sample=>sample.before==='none'&&sample.after==='none'&&sample.transform==='none'&&sample.w===sample.h)).toBe(true);
  if(width===1440)await page.screenshot({path:'test-results/refined-notebook/colour-swatches.png',animations:'disabled'});
  const geometry=await page.locator('.notebook-book').evaluate(book=>{
   const rail=book.querySelector('.book-held-tools')!.getBoundingClientRect();const edge=book.querySelector('.book-spread')!.getBoundingClientRect().right;
   const close=book.querySelector('.book-close')!.getBoundingClientRect(),contents=book.querySelector('#book-contents')!.getBoundingClientRect();
   return {closeClear:close.right<=contents.left||close.bottom<=contents.top,cropped:[...book.querySelectorAll('.book-held-tools .choice-object')].every(tool=>tool.getBoundingClientRect().bottom>rail.bottom),straight:[...book.querySelectorAll('.book-held-tools .choice-object')].every(tool=>getComputedStyle(tool).transform==='none'),attached:[...book.querySelectorAll('.book-tabs button,#book-contents')].every(tag=>{const r=tag.getBoundingClientRect();return r.left<=edge&&r.right>edge;}),rings:[...book.querySelectorAll('.book-spread .book-binding i')].every(ring=>Math.abs(ring.getBoundingClientRect().width-ring.getBoundingClientRect().height)<1),rule:getComputedStyle(book.querySelector('.book-leaf')!).backgroundImage,textarea:getComputedStyle(book.querySelector('#note-text')!).backgroundImage};
  });
  expect(geometry).toMatchObject({closeClear:true,cropped:true,straight:true,attached:true,rings:true,textarea:'none'});expect(geometry.rule).toContain('repeating-linear-gradient');
  await page.screenshot({path:`test-results/refined-notebook/notes-${width}.png`,animations:'disabled'});
  await page.locator('#book-contents').click();await expect(page.locator('#book-index')).toBeVisible();await expect(page.locator('.book-front-cover')).toBeVisible();
  await page.screenshot({path:`test-results/refined-notebook/contents-${width}.png`,animations:'disabled'});
  expect(await page.locator('.book-volume').evaluate(volume=>volume.scrollWidth<=volume.clientWidth+2)).toBe(true);
  await page.locator('#book-next').click();
 }
 for(const asset of ['ink-bottles','paper-samples']){const response=await page.request.get(`/art/stationery/${asset}.svg`);expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('image/svg+xml');}
});
test('hover nudges the tool and reduced motion removes movement and page-flip animations',async({page})=>{
 await boot(page);const tool=page.locator('.book-held-tools .instrument-marker');
 const initial=await tool.locator('.choice-object').evaluate(el=>getComputedStyle(el).transform);expect(initial).toBe('none');
 await tool.hover();await expect.poll(()=>tool.locator('.choice-object').evaluate(el=>getComputedStyle(el).transform)).not.toBe('none');
 await page.emulateMedia({reducedMotion:'reduce'});await expect.poll(()=>tool.locator('.choice-object').evaluate(el=>getComputedStyle(el).transform)).toBe('none');
 await page.locator('#book-contents').click();await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
 await page.keyboard.press('Escape');await expect(page.locator('#note-text')).toBeVisible();
 await page.locator('#book-next').click();await expect(page.locator('#book-position')).toContainText('Sheet 2');await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
});
