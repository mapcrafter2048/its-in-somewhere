import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const samples=[];
try{
 for(let run=0;run<3;run++){
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:5174/?test=1');await page.waitForSelector('#start',{timeout:120000});
  for(const name of ['desk','notebook','files','computer']){
   await page.evaluate(async name=>{const g=window.__GAME__;g.save.started=true;g.save.settings.quality='medium';g.save.wing=3;g.save.position=[-13,1.7,-46.35];g.save.rotation=[.15,0];g.world.setSettings(g.save.settings);g.world.restore(g.save);g.resume();if(name==='notebook')g.showNotebook();if(name==='files')await g.visit(g.tutorialId);if(name==='computer')g.deskScreens.computer();},name);
   await page.waitForTimeout(1000);
   const data=await page.evaluate(async()=>{const times=[];let previous=performance.now();for(let i=0;i<12;i++){await new Promise(requestAnimationFrame);const now=performance.now();times.push(now-previous);previous=now;}times.sort((a,b)=>a-b);const g=window.__GAME__;return {medianMs:times[6],p95Ms:times[11],heldVisible:g.world.heldRoot.visible,...g.world.stats()};});
   samples.push({run,name,...data});console.log(run,name,Math.round(data.medianMs),data.calls,data.triangles,data.geometries);
  }
  await page.close();
 }
 await writeFile('docs/performance/revamp-final-paused.json',JSON.stringify({method:'Final dirty-paper and inactive-held-object initialization correction; same medium-quality W4 camera as the paired audit',viewport:[1440,900],frames:12,samples},null,2));
}finally{await browser.close();}
