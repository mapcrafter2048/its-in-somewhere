import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page = await browser.newPage({viewport:{width:1440,height:900}});
const start=performance.now();
await page.goto('http://127.0.0.1:5173/?test=1');
await page.waitForSelector('#start',{timeout:120000});
const loadingMs=performance.now()-start;
const samples=[];
for(const [name,wing,position,rotation,drawer] of [
 ['desk',3,[-13,1.7,-46.35],[.15,0],false],
 ['aisle',0,[0,1.7,2],[0,0],false],
 ['drawer',0,[-19,1.7,-.3],[.2,0],true],
 ...[0,1,2,3].map(wing=>[`travel-W${wing+1}`,wing,[0,1.7,2],[0,0],false])
]){
 if(process.argv[3] && name!==process.argv[3]) continue;
 await page.evaluate(({wing,position,rotation,drawer})=>{const g=window.__GAME__;g.save.started=true;g.save.wing=wing;g.save.position=position;g.save.rotation=rotation;g.save.settings.quality='medium';g.world.setSettings(g.save.settings);g.world.restore(g.save);g.resume();if(drawer)g.world.openContainer('archive:0:0');},{wing,position,rotation,drawer});
 await page.waitForTimeout(1200);
 const data=await page.evaluate(async(frames)=>{const values=[];let last=performance.now();for(let i=0;i<frames;i++){await new Promise(requestAnimationFrame);const now=performance.now();values.push(now-last);last=now;}values.sort((a,b)=>a-b);return {meanMs:values.reduce((a,b)=>a+b,0)/values.length,p95Ms:values[Math.floor(values.length*.95)],...window.__GAME__.world.stats(),heapBytes:performance.memory?.usedJSHeapSize??null};},drawer?12:35);
 samples.push({name,...data});
}
await mkdir('docs/performance',{recursive:true});
await writeFile(`docs/performance/${process.argv[2]??'measurement'}.json`,JSON.stringify({renderer:'Chromium SwiftShader (software; not a hardware FPS claim)',viewport:[1440,900],quality:'medium',framesPerView:35,drawerFrames:12,loadingMs,samples},null,2));
await browser.close();
console.log(JSON.stringify({loadingMs,samples:samples.map(({name,meanMs,calls,triangles,geometries,textures})=>({name,meanMs,calls,triangles,geometries,textures}))}));
