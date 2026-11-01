import { selectControl } from './ui-controls';
import {test,expect} from '@playwright/test';

test('paper files and ceiling fixtures can be inspected separately from every side',async({page})=>{
 test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?models=1');await expect(page.locator('#model-select')).toBeVisible();
 for(const name of ['folder','file-box','box-files','pendant-light','tube-light']){
  await page.selectOption('#model-select',name);await page.check('#model-open');
  for(const angle of ['front','back','left','right','top','underneath','perspective']){
   await page.locator(`[data-view="${angle}"]`).click();await page.screenshot({path:`test-results/refinement/models/${name}-${angle}.png`});
  }
 }
 await page.selectOption('#model-select','pendant-light');await selectControl(page,'#model-light','game');await page.locator('[data-view="underneath"]').click();await page.screenshot({path:'test-results/refinement/models/pendant-game-underneath.png'});
 expect(errors).toEqual([]);
});

test('warehouse uses separate paper files, mixed ceiling fixtures and illustrated notices with no floor guide strip',async({page})=>{
 test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?test=1');await expect(page.locator('#start')).toBeVisible();
 const scene=await page.evaluate(()=>{const g=(window as any).__GAME__,pendants:number[]=[],tubes:number[]=[],strips:string[]=[],art:string[][]=[];g.world.scene.traverse((o:any)=>{if(o.name==='pendant-light')pendants.push(o.count);if(o.name==='tube-light')tubes.push(o.count);if(o.name==='worn-wall-compositions')art.push(o.userData.titles);if(o.isInstancedMesh&&o.material.isMeshBasicMaterial&&!o.material.transparent&&o.material.color.getHex()!==0xffffff&&o.boundingSphere?.center.y<.03)strips.push(o.name);});return {pendants,tubes,strips,art,lights:g.world.roomLights.length};});
 expect(scene.pendants.length).toBeGreaterThan(0);expect(scene.pendants.every(n=>n===16)).toBe(true);expect(scene.tubes.every(n=>n===22)).toBe(true);expect(scene.strips).toEqual([]);expect(scene.lights).toBe(6);expect(scene.art).toHaveLength(4);expect(scene.art[0]).toContain('Time spent finding the form');expect(scene.art[0]).toContain('Pinned correspondence');
 await page.evaluate(async()=>{const g=(window as any).__GAME__,{STORAGE}=(window as any).__GAME__.modules.storage,u=STORAGE[2039];g.save.started=true;g.save.wing=u.wing;g.save.position=[u.x,1.7,u.z+1.35];g.save.rotation=[Math.atan2(u.y+.25-1.7,1.07),0];g.world.restore(g.save);g.resume();});
 await expect.poll(()=>page.evaluate(()=>(window as any).__GAME__.world.target?.container)).toBe('box:2:175');await page.screenshot({path:'test-results/refinement/box-static.png'});await page.keyboard.press('KeyE');await expect(page.locator('[data-file]')).toHaveCount(8);
 await page.evaluate(()=>{const g=(window as any).__GAME__;g.resume();g.world.openDrawer(2039,0);});expect(await page.evaluate(()=>(window as any).__GAME__.world.activeDrawer.folders.children.length)).toBeLessThan(16);await page.screenshot({path:'test-results/refinement/box-detailed.png'});
 for(const [name,x,z,pitch,yaw]of [['hallway',0,2,-.18,0],['ceiling',0,2,.58,-.8],['wall-chart',5,2.5,.42,Math.PI],['wall-jokes',15,1.5,.25,Math.PI],['retention-chart',-15,-46.5,.28,0],['pinned-notes',5,-46.5,.28,0],['meeting-notice',15,-46.5,.28,0]] as const){
  await page.evaluate(({x,z,pitch,yaw})=>{const g=(window as any).__GAME__;g.save.wing=0;g.save.position=[x,1.7,z];g.save.rotation=[pitch,yaw];g.world.restore(g.save);g.resume();},{x,z,pitch,yaw});await page.screenshot({path:`test-results/refinement/${name}.png`});
 }
 for(const quality of ['low','medium','high']){
  await page.evaluate(quality=>{const g=(window as any).__GAME__;g.save.settings.quality=quality;g.world.setSettings(g.save.settings);},quality);
  await expect.poll(()=>page.evaluate(()=>(window as any).__GAME__.world.roomLights.filter((l:any)=>l.visible).length)).toBeLessThanOrEqual(quality==='low'?2:quality==='medium'?4:6);
 }
 expect(errors).toEqual([]);
});

test('simplified paper files retain their thin edges and tabs in the isolated preview',async({page})=>{
 test.setTimeout(60000);await page.goto('/?models=1');await expect(page.locator('#model-select')).toBeVisible();await page.selectOption('#model-select','box-files');await page.uncheck('#model-open');
 for(const angle of ['front','back','left','right','top','underneath','perspective']){await page.locator(`[data-view="${angle}"]`).click();await page.screenshot({path:`test-results/refinement/models/box-files-static-${angle}.png`});}
 const triangles=await page.locator('#model-stats').innerText();console.log('Simplified file preview',triangles);
});
