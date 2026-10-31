import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const samples=[];
try {
 for(let run=0;run<3;run++)for(const version of run%2?['after','before']:['before','after']){
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await page.goto(`http://127.0.0.1:${version==='before'?5175:5174}/?test=1`);await page.waitForSelector('#start',{timeout:120000});
  await page.evaluate(()=>{const g=window.__GAME__;g.save.started=true;g.save.settings.quality='medium';g.save.wing=3;g.save.position=[-13,1.7,-46.35];g.save.rotation=[.15,0];g.world.setSettings(g.save.settings);g.world.restore(g.save);g.resume();});
  const data=await page.evaluate(async()=>{for(let i=0;i<8;i++)await new Promise(requestAnimationFrame);const intervals=[];let previous=performance.now();for(let i=0;i<60;i++){await new Promise(requestAnimationFrame);const now=performance.now();intervals.push(now-previous);previous=now;}const sorted=[...intervals].sort((a,b)=>a-b);return {medianMs:sorted[30],p95Ms:sorted[57],maxMs:sorted[59],intervals,...window.__GAME__.world.stats()};});
  samples.push({run,version,...data});console.log(run,version,'median',Math.round(data.medianMs),'p95',Math.round(data.p95Ms));await page.close();
  await writeFile('docs/performance/revamp-desk-tail.json',JSON.stringify({method:'Adjacent versions; reversed order on run 2; 8 warmup frames followed by 60 measured frames per desk view',viewport:[1440,900],quality:'medium',samples},null,2));
 }
}finally{await browser.close();}
