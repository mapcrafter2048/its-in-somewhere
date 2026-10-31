import { readFile, writeFile } from 'node:fs/promises';
const data=JSON.parse(await readFile('docs/performance/revamp-paired.json','utf8'));
if(data.samples.length!==60)throw Error(`Paired audit incomplete: ${data.samples.length}/60 samples`);
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const rows=[];
for(const name of [...new Set(data.samples.map(s=>s.name))]){
 const before=data.samples.filter(s=>s.name===name&&s.version==='before'),after=data.samples.filter(s=>s.name===name&&s.version==='after');
 const pairs=before.map(b=>{const a=after.find(a=>a.run===b.run);return {run:b.run,changePct:(a.medianMs/b.medianMs-1)*100,budgetUnchanged:['calls','triangles','geometries','textures','objects'].every(k=>a[k]===b[k]),rendererMatches:a.renderer===b.renderer&&a.pixelRatio===b.pixelRatio&&String(a.drawingBuffer)===String(b.drawingBuffer)};});
 rows.push({name,beforeMedianMs:median(before.map(s=>s.medianMs)),afterMedianMs:median(after.map(s=>s.medianMs)),beforeP95Ms:median(before.map(s=>s.p95Ms)),afterP95Ms:median(after.map(s=>s.p95Ms)),pairedMedianChangePct:median(pairs.map(p=>p.changePct)),pairs});
}
const summary={method:data.method,rows,normalScenesWithinTenPercent:rows.filter(r=>!['notebook','files','computer'].includes(r.name)).every(r=>r.pairedMedianChangePct<=10),renderBudgetsUnchanged:rows.every(r=>r.pairs.every(p=>p.budgetUnchanged)),rendererMatches:rows.every(r=>r.pairs.every(p=>p.rendererMatches))};
try {
 const tail=JSON.parse(await readFile('docs/performance/revamp-desk-tail.json','utf8'));
 const paused=JSON.parse(await readFile('docs/performance/revamp-final-paused.json','utf8'));
 if(tail.samples.length===6&&paused.samples.length===12){
  const before=tail.samples.filter(s=>s.version==='before'),after=tail.samples.filter(s=>s.version==='after');
  const changes=before.map(b=>(after.find(a=>a.run===b.run).p95Ms/b.p95Ms-1)*100);
  summary.longDeskAudit={framesPerView:60,beforeMedianMs:median(before.map(s=>s.medianMs)),afterMedianMs:median(after.map(s=>s.medianMs)),beforeP95Ms:median(before.map(s=>s.p95Ms)),afterP95Ms:median(after.map(s=>s.p95Ms)),p95PairedChangesPct:changes,withinTenPercent:changes.every(p=>p<=10)};
  summary.finalPausedRenderBudgetsMatch=paused.samples.every(s=>!s.heldVisible&&['calls','triangles','geometries','textures','objects'].every(k=>s[k]===data.samples.find(b=>b.name===s.name&&b.run===s.run&&b.version==='before')[k]));
 }
}catch(error){if(error.code!=='ENOENT')throw error;}
await writeFile('docs/performance/revamp-summary.json',JSON.stringify(summary,null,2));
console.log('| View | Median ms, before → after | p95 ms, before → after | Median paired change |\n| --- | ---: | ---: | ---: |');
for(const r of rows)console.log(`| ${r.name} | ${r.beforeMedianMs.toFixed(1)} → ${r.afterMedianMs.toFixed(1)} | ${r.beforeP95Ms.toFixed(1)} → ${r.afterP95Ms.toFixed(1)} | ${r.pairedMedianChangePct.toFixed(1)}% |`);
console.log(JSON.stringify({normalScenesWithinTenPercent:summary.normalScenesWithinTenPercent,renderBudgetsUnchanged:summary.renderBudgetsUnchanged,rendererMatches:summary.rendererMatches}));
