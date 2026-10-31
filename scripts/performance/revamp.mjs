import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const label = process.argv[2] || 'after';
const baseURL = process.env.REVAMP_BASE_URL || `http://127.0.0.1:${label==='before'?5175:5174}`;
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const samples=[];
await mkdir(`docs/performance/captures-${label}`,{recursive:true});
for(let run=0;run<3;run++){
 const page=await browser.newPage({viewport:{width:1440,height:900}}),start=performance.now();
 await page.goto(`${baseURL}/?test=1`);await page.waitForSelector('#start',{timeout:120000});
 const loadingMs=performance.now()-start;
 if(run===0)await page.screenshot({animations:'disabled',path:`docs/performance/captures-${label}/title.png`});
 for(const name of ['desk','aisle','drawer','travel-W1','travel-W2','travel-W3','travel-W4','notebook','files','computer']){
  await page.evaluate(async name=>{const g=window.__GAME__;g.save.started=true;g.save.settings.quality='medium';g.world.setSettings(g.save.settings);const travel=name.startsWith('travel'),archive=travel||name==='aisle'||name==='drawer';g.save.wing=travel?Number(name.slice(-1))-1:archive?0:3;g.save.position=archive?(name==='drawer'?[-19,1.7,-.3]:[0,1.7,2]):[-13,1.7,-46.35];g.save.rotation=[.15,0];g.world.restore(g.save);g.resume();if(name==='drawer')g.world.openContainer('archive:0:0');if(name==='notebook')g.showNotebook();if(name==='files')await g.visit(g.tutorialId);if(name==='computer')g.deskScreens.computer();},name);
  await page.waitForTimeout(700);
  const data=await page.evaluate(async()=>{const times=[];let last=performance.now();for(let i=0;i<12;i++){await new Promise(requestAnimationFrame);const now=performance.now();times.push(now-last);last=now;}times.sort((a,b)=>a-b);return {medianMs:times[6],p95Ms:times[11],...window.__GAME__.world.stats(),heapBytes:performance.memory?.usedJSHeapSize??null};});
  samples.push({run,name,loadingMs,...data});
  console.log(label,run,name,Math.round(data.medianMs));
  if(run===0)await page.screenshot({animations:'disabled',path:`docs/performance/captures-${label}/${name}.png`});
 }
 await page.close();
}
await mkdir('docs/performance',{recursive:true});await writeFile(`docs/performance/revamp-${label}.json`,JSON.stringify({renderer:'Chromium SwiftShader; not hardware FPS',viewport:[1440,900],frames:12,samples},null,2));await browser.close();console.log(`${label}: ${samples.length} samples saved`);
