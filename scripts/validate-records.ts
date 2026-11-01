import assert from 'node:assert/strict';
import { createArchive, searchableText } from '../src/content/generator';
import { PHRASE, TOTAL } from '../src/archive';
import { RECORD_VARIANTS, THREADS } from '../src/content/packs/records';
import { catalogueEntries } from '../src/desk/exploration';
export function validateRecordPacks(){
 return [7391,1,9041].map(seed=>{
  const original=createArchive(seed),archive=createArchive(seed,undefined,undefined,3,1),seen=new Map<string,number>(),formats=new Set<string>();
  let targets=0,newRecords=0,minGap=Infinity;
  for(let id=0;id<TOTAL;id++){
   const old=original.get(id),doc=archive.get(id);
   if(old.story||old.source||old.fragment||old.voucher||original.special.has(id)||old.category!=='office')assert.deepEqual(doc,old,`Protected record changed: ${id}`);
   targets+=(searchableText(doc).match(new RegExp(PHRASE,'gi'))??[]).length;
   if(doc.presentation){formats.add(doc.presentation.family);newRecords++;}
   if(doc.bodyKey){const previous=seen.get(doc.bodyKey);if(previous!==undefined)minGap=Math.min(minGap,id-previous);seen.set(doc.bodyKey,id);}
  }
  assert.equal(targets,1);assert.equal(formats.size,12);assert.ok(minGap>=128,`Local reuse distance ${minGap}`);assert.equal(RECORD_VARIANTS.length,48);
  assert.equal(catalogueEntries(archive).length,64);assert.equal(catalogueEntries(original).length,58);
  for(const t of THREADS){const ids=archive.threadLocations!.get(t.id)!;assert.equal(ids.length,6);for(const id of ids){assert.ok(ids.includes(archive.get(id).next!));assert.ok(ids.includes(archive.get(id).previous!));}}
  return {seed,recordPack:1,files:TOTAL,formattedRecords:newRecords,optionalThreads:3,threadRecords:18,catalogueEntries:64,targetOccurrences:targets,minimumBodyReuseDistance:minGap};
 });
}
