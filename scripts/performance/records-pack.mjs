import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:5173';
const samples=[];
try{
 for(let run=0;run<2;run++)for(const pack of run%2?[1,0]:[0,1]){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(base+'/?test=1');await page.waitForSelector('#start',{timeout:120000});
  await page.evaluate(async pack=>{const {freshSave}=window.__GAME__.modules.state;const s=freshSave();if(!pack)delete s.recordPack;s.started=true;s.settings.quality='medium';s.settings.reducedMotion=true;localStorage.setItem('archive-office-save-v3',JSON.stringify(s));},pack);
  const loadStart=performance.now();await page.reload();await page.waitForSelector('#start',{timeout:120000});const loadingMs=performance.now()-loadStart;await page.waitForFunction(()=>window.__GAME__.stats().renderedFrames>0);
  const renderer=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),ext=gl?.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable';});
  const record=await page.evaluate(async()=>{const g=window.__GAME__;const {createArchive}=window.__GAME__.modules.generator;return createArchive(g.save.seed,undefined,undefined,3,1).threadLocations.get('department')[0];});
  for(const view of ['exploration','document','computer']){
   await page.evaluate(async({view,record})=>{const g=window.__GAME__;g.save.started=true;
    if(view==='exploration'){g.save.wing=0;g.save.position=[0,1.7,2];g.save.rotation=[0,0];g.world.restore(g.save);g.resume();}
    if(view==='document')await g.visit(record);
    if(view==='computer'){const {NOOK_SPAWN}=window.__GAME__.modules.hubLayout;g.save.wing=3;g.save.position=[...NOOK_SPAWN];g.world.restore(g.save);g.resume();await g.deskScreens.desktop('catalogue');}
   },{view,record});
   const measured=await page.evaluate(async()=>{
    for(let i=0;i<4;i++)await new Promise(requestAnimationFrame);
    const times=[];let previous=performance.now();for(let i=0;i<16;i++){await new Promise(requestAnimationFrame);const now=performance.now();times.push(now-previous);previous=now;}
    times.sort((a,b)=>a-b);return {medianMs:times[8],p95Ms:times[15],...window.__GAME__.stats()};
   });
   samples.push({run,pack,view,loadingMs,renderer,...measured});
  }
  if(run===0)await page.screenshot({path:`test-results/records-pack/catalogue-pack-${pack}.png`,animations:'disabled'});
  await page.close();
 }
 await mkdir('docs/performance',{recursive:true});
 const report={method:'Within-build original-pack versus expanded-pack comparison; both include new shared UI and world details. Wait for initial GPU resource upload, alternate pack order, two runs, four warmup frames and sixteen sampled animation-frame intervals per view. Software rendering; no hardware FPS or whole-update before/after claim.',viewport:[1440,900],quality:'medium',samples};
 await writeFile('docs/performance/records-pack.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(samples.map(({run,pack,view,medianMs,p95Ms,calls,geometries,textures})=>({run,pack,view,medianMs,p95Ms,calls,geometries,textures})),null,2));
}finally{await browser.close();}
