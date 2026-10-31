import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test('shift time follows real elapsed time through tools, breaks, focus and save restoration', async ({page,context}) => {
 test.setTimeout(120000);
 await page.goto('/?test=1');await expect(page.locator('#start')).toBeVisible();
 await page.bringToFront();
 await page.evaluate(()=>{const g=(window as any).__GAME__;g.save.started=true;g.save.settings.quality='low';g.world.setSettings(g.save.settings);g.resume();});
 await expect(page.locator('#office-local-time')).toHaveText(/\d\d:\d\d/);
 const start=await page.evaluate(()=>(window as any).__GAME__.save.playSeconds);
 await page.waitForTimeout(2100);
 expect(await page.evaluate(()=>(window as any).__GAME__.save.playSeconds)-start).toBeGreaterThan(1.8);
 await page.evaluate(()=>(window as any).__GAME__.showNotebook());
 const reading=await page.evaluate(()=>(window as any).__GAME__.save.playSeconds);
 await page.waitForTimeout(1500);
 expect(await page.evaluate(()=>(window as any).__GAME__.save.playSeconds)-reading).toBeGreaterThan(1.2);
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');
 await expect(page.locator('#pause-resume')).toBeVisible();
 const paused=await page.evaluate(()=>(window as any).__GAME__.save.playSeconds);
 await page.waitForTimeout(1000);
 expect(await page.evaluate(()=>(window as any).__GAME__.save.playSeconds)).toBeCloseTo(paused,2);
 await page.evaluate(()=>(window as any).__GAME__.resume());
 // Real browser focus loss, including the embedded-preview style window blur.
 const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();
 await page.waitForTimeout(500);const away=await page.evaluate(()=>(window as any).__GAME__.save.playSeconds);
 await page.waitForTimeout(1000);expect(await page.evaluate(()=>(window as any).__GAME__.save.playSeconds)-away).toBeLessThan(.1);
 await other.close();await page.bringToFront();
 await page.evaluate(()=>(window as any).__GAME__.write());
 const saved=await page.evaluate(()=>(window as any).__GAME__.save.playSeconds);
 await page.reload();await expect(page.locator('#start')).toBeVisible();expect(await page.evaluate(()=>(window as any).__GAME__.save.playSeconds)).toBeGreaterThanOrEqual(saved-.1);
 await page.click('#start');await page.keyboard.press('Escape');await page.click('#new-game');await page.click('#confirm-reset');await expect(page.locator('#start')).toBeVisible();expect(await page.evaluate(()=>(window as any).__GAME__.save.playSeconds)).toBe(0);
});

test('decorative furniture, office clock, paper detail and shared document treatments remain coherent', async ({page}) => {
 test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/?test=1');await expect(page.locator('#start')).toBeVisible();
 const geometry=await page.evaluate(()=>{const g=(window as any).__GAME__,w=g.world;g.save.started=true;g.save.settings.quality='low';w.setSettings(g.save.settings);g.resume();return {details:w.details.length,stools:w.details.map((d:any)=>({position:d.stool.position.toArray(),count:d.root.children.filter((o:any)=>o.name==='stool').length})),seats:w.interior.props.seats,hits:w.interior.hits.filter((h:any)=>h.userData.propId==='chair-desk').length};});
 expect(geometry.details).toBe(4);expect(geometry.hits).toBe(0);for(const stool of geometry.stools)expect(stool.count).toBe(1);
 await page.waitForTimeout(1200);
 const paper=await page.evaluate(()=>{const w=(window as any).__GAME__.world;return w.boxPapers.map((b:any)=>({near:b.mesh.count,far:b.far.count,total:b.units.length}));});
 for(const batch of paper)expect(batch.near+batch.far).toBe(batch.total);expect(paper.reduce((sum:number,b:any)=>sum+b.far,0)).toBeGreaterThan(0);
 await page.screenshot({path:'test-results/polish/desk.png'});
 for(const family of ['correspondence','report','form','reference','workbook']){
  await page.evaluate(async family=>{const g=(window as any).__GAME__;const sets:any={correspondence:['memo','email','letter'],report:['report','proposal'],form:['ticket','expense','maintenance'],reference:['reference','research'],workbook:['spreadsheet']};let id=0;for(;id<3000;id++)if(sets[family].includes(g.archive.get(id).kind))break;await g.visit(id);},family);
  await expect(page.locator(`.archive-paper.treatment-${family}`)).toBeVisible();
  if(family==='reference')await page.evaluate(()=>{const g=(window as any).__GAME__;g.save.settings.textSize=26;document.documentElement.style.setProperty('--document-size','26px');});
  await page.screenshot({path:`test-results/polish/document-${family}.png`});
 }
 await page.evaluate(()=>(window as any).__GAME__.showNotebook());await page.screenshot({path:'test-results/polish/notebook.png'});
 await page.evaluate(()=>(window as any).__GAME__.showSupplies());await page.screenshot({path:'test-results/polish/supplies.png'});
 await page.evaluate(()=>{const g=(window as any).__GAME__;g.resume();g.world.openContainer('box:3:384');});
 await page.waitForTimeout(500);expect(await page.evaluate(()=>{const w=(window as any).__GAME__.world;return w.boxPapers.reduce((n:number,b:any)=>n+b.mesh.count+b.far.count,0);})).toBe(1540);
 await page.evaluate(()=>(window as any).__GAME__.world.closeDrawer());await page.waitForTimeout(400);
 expect(await page.evaluate(()=>{const w=(window as any).__GAME__.world;return w.boxPapers.reduce((n:number,b:any)=>n+b.mesh.count+b.far.count,0);})).toBe(1541);

 for(const view of ['chair','clock','stool','notice','mug-ring']){
  await page.evaluate(view=>{const g=(window as any).__GAME__;g.save.wing=3;if(view==='clock'){g.save.position=[0,1.7,-46.4];g.save.rotation=[.52,0];}else if(view==='chair'){g.save.position=[-10.5,1.7,-46.7];g.save.rotation=[-.28,.95];}else if(view==='notice'){g.save.position=[-8,1.7,-46.5];g.save.rotation=[.31,0];}else if(view==='mug-ring'){g.save.position=[-13.8,1.7,-46.5];g.save.rotation=[-.47,0];}else{const p=g.world.details[3].stool.position;g.save.position=[p.x+(p.x>0?-2:2),1.7,p.z];g.save.rotation=[-.45,p.x>0?-Math.PI/2:Math.PI/2];}g.world.restore(g.save);g.resume();},view);
  await page.waitForTimeout(700);await page.screenshot({path:`test-results/polish/${view}.png`});
 }
 const clock=await page.evaluate(()=>{const w=(window as any).__GAME__.world;return w.details.map((d:any)=>{d.update(new Date(Date.UTC(2026,0,1,3,15,30)));return d.hands.map((h:any)=>h.rotation.z);});});
 for(const hands of clock){expect(hands[0]).toBeCloseTo(-(3+15.5/60)/12*Math.PI*2,4);expect(hands[1]).toBeCloseTo(-15.5/60*Math.PI*2,4);expect(hands[2]).toBeCloseTo(-Math.PI,4);}
 await page.evaluate(()=>{const g=(window as any).__GAME__;g.showInventory();});await page.screenshot({path:'test-results/polish/inventory.png'});
 expect(errors).toEqual([]);
});

test('new audio cues are finite, bounded and obey focus and volume', async ({page}) => {
 test.setTimeout(90000);await page.goto('/?test=1');await expect(page.locator('#start')).toBeVisible();await page.click('#start');
 const result=await page.evaluate(async()=>{const a=(window as any).__GAME__.audio;a.start();a.setSceneState(true,true);const cues=['paper','tab','notebook','notebook-close','pencil','mug','complete','tick','building'];for(const cue of cues){a.sound(cue,{x:1,z:1});}for(let i=0;i<100;i++)a.sound('paper');const busy=a.stats();a.setVolume(0);await new Promise(resolve=>setTimeout(resolve,400));const muted=a.stats();a.setSceneState(false,false);const events=a.stats().events;a.sound('mug');const unfocused=a.stats();await new Promise(resolve=>setTimeout(resolve,1200));const clean=a.stats();return {busy,muted,events,unfocused,clean};});
 expect(result.busy.events).toBeGreaterThanOrEqual(9);expect(result.busy.voices).toBeLessThanOrEqual(result.busy.maxVoices);expect(result.busy.dropped).toBeGreaterThan(0);expect(result.muted.masterGain).toBeLessThan(.001);expect(result.unfocused.events).toBe(result.events);expect(result.clean.voices).toBe(0);
 await mkdir('test-results/polish',{recursive:true});await writeFile('test-results/polish/audio.json',JSON.stringify(result,null,2));
});

test('an unsuccessful placement still equips and displays the carried original without losing it', async ({page}) => {
 await page.goto('/?test=1');await expect(page.locator('#start')).toBeVisible();
 const id=await page.evaluate(()=>{const g=(window as any).__GAME__;g.save.started=true;g.save.settings.quality='low';g.save.physical.files[g.tutorialId]='inventory';g.save.wing=0;g.save.position=[0,1.7,2];g.save.rotation=[1.25,0];g.world.setSettings(g.save.settings);g.world.restore(g.save);g.resume();return g.tutorialId;});
 await page.keyboard.press('KeyG');
 await expect.poll(()=>page.evaluate(()=>(window as any).__GAME__.save.physical.held)).toEqual({kind:'file',id});
 await expect.poll(()=>page.evaluate(()=>{const w=(window as any).__GAME__.world;return w.heldRoot.visible&&w.heldRoot.children.length>0;})).toBe(true);
 expect(await page.evaluate(id=>(window as any).__GAME__.save.physical.files[id],id)).toBe('held');
});
