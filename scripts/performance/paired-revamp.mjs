import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const samples=[];
try {
 for(let run=0;run<3;run++) for(const name of ['desk','aisle','drawer','travel-W1','travel-W2','travel-W3','travel-W4','notebook','files','computer']) {
  for(const version of run%2?['after','before']:['before','after']) {
   const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
   await page.goto(`http://127.0.0.1:${version==='before'?5175:5174}/?test=1`);await page.waitForSelector('#start',{timeout:120000});
   await page.evaluate(async name=>{const g=window.__GAME__;g.save.started=true;g.save.settings.quality='medium';g.world.setSettings(g.save.settings);const travel=name.startsWith('travel'),archive=travel||name==='aisle'||name==='drawer';g.save.wing=travel?Number(name.slice(-1))-1:archive?0:3;g.save.position=archive?(name==='drawer'?[-19,1.7,-.3]:[0,1.7,2]):[-13,1.7,-46.35];g.save.rotation=[.15,0];g.world.restore(g.save);g.resume();if(name==='drawer')g.world.openContainer('archive:0:0');if(name==='notebook')g.showNotebook();if(name==='files')await g.visit(g.tutorialId);if(name==='computer')g.deskScreens.computer();},name);
   await page.waitForTimeout(1000);
   const data=await page.evaluate(async()=>{const g=window.__GAME__,renderer=g.world.renderer,gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');const times=[];let previous=performance.now();for(let i=0;i<12;i++){await new Promise(requestAnimationFrame);const now=performance.now();times.push(now-previous);previous=now;}times.sort((a,b)=>a-b);return {medianMs:times[6],p95Ms:times[11],pixelRatio:renderer.getPixelRatio(),drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),...g.world.stats()};});
   samples.push({run,name,version,...data});console.log(run,name,version,Math.round(data.medianMs));await page.close();
   await writeFile('docs/performance/revamp-paired.json',JSON.stringify({method:'Adjacent before/after views; order reversed on run 2; fresh page per view; one browser at a time',viewport:[1440,900],frames:12,samples},null,2));
  }
 }
} finally {await browser.close();}
