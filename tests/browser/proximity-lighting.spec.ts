import {test,expect} from '@playwright/test';
test('removed room-light switches and overrides stay absent when loading an override save',async({page})=>{
 await page.goto('/?test=1');await expect(page.locator('#start')).toBeVisible();await page.evaluate(()=>{const g=(window as any).__GAME__;g.save.started=true;g.save.office.roomLights=['on','on','on','on'];g.write();});
 await page.reload();await expect(page.locator('#start')).toBeVisible();
 const restored=await page.evaluate(()=>{const g=(window as any).__GAME__;let points=0,switches=0,fixed=0;g.world.scene.traverse((o:any)=>{if(o.isPointLight)points++;if(o.name.startsWith('room-light-switch-'))switches++;if(o.name.startsWith('fixed-room-light-'))fixed++;});return {points,switches,fixed,override:g.save.office.roomLights??null};});expect(restored).toEqual({points:6,switches:0,fixed:0,override:null});
 await page.evaluate(()=>{const g=(window as any).__GAME__;g.save.settings.quality='low';g.world.setSettings(g.save.settings);g.save.wing=0;g.save.position=[0,1.7,2];g.save.rotation=[0,0];g.world.restore(g.save);g.resume();});
 await expect.poll(()=>page.evaluate(()=>{const w=(window as any).__GAME__.world,sites=w.lightPositions[0];return sites.some((s:any)=>s.on===true)&&sites.some((s:any)=>s.on===false)&&w.roomLights.filter((l:any)=>l.visible).length<=2;})).toBe(true);
});
