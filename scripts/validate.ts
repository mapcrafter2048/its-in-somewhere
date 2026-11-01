import {validateRecordPacks} from './validate-records';
import {STORAGE,containerFor,initialFiles} from '../src/storage';
import {createArchive,searchableText} from '../src/content/generator';
import {SCENARIOS,GOSSIP_FRAGMENTS} from '../src/content/scenarios';
import {ALL_STORIES,SHORT_STORIES,LONG_STORIES} from '../src/content/expanded-stories';
import {OFFICE_BODIES} from '../src/content/ordinary';
import {SOURCE_MANIFEST,installSource} from '../src/content/sources';
import {PHRASE,TOTAL,location} from '../src/archive';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
for(const source of SOURCE_MANIFEST){const data=readFileSync('public/'+source.file);if(createHash('sha256').update(data).digest('hex')!==source.sha256)throw new Error('Source hash mismatch: '+source.id);installSource(JSON.parse(data.toString()));}
const reports=[];
for(const seed of [7391,1,9041]){
 const a=createArchive(seed),counts={reference:0,office:0,social:0,evidence:0};let words=0,targets=0,vouchers=0,dry=0,minGap=Infinity,maxVoucher=0;const last=new Map<string,number>(),uniqueTexts=new Set<string>();
 for(const u of STORAGE)for(let drawer=0;drawer<u.drawers;drawer++){let discoveries=0;
  for(const id of initialFiles(containerFor(u.id,drawer))){
   const d=a.get(id),text=searchableText(d);words+=text.split(/\s+/).length;targets+=(text.match(new RegExp(PHRASE,'gi'))??[]).length;counts[d.category??'office']++;
   if(d.voucher){vouchers++;maxVoucher=Math.max(maxVoucher,d.voucher.value);}if(d.category==='social'||d.story||d.annotation||d.category==='evidence')discoveries++;
   uniqueTexts.add(createHash('sha256').update(text).digest('hex'));
   if(d.bodyKey){const before=last.get(d.bodyKey);if(before!==undefined)minGap=Math.min(minGap,id-before);last.set(d.bodyKey,id);}
   if(d.next!==undefined&&!a.special.has(d.next))throw new Error('Broken next reference');
   if(d.previous!==undefined&&!a.special.has(d.previous))throw new Error('Broken previous reference');
   if(location(id).wing>3)throw new Error('Unreachable wing');
  }if(!discoveries)dry++;
 }
 if(targets!==1||minGap<128||dry)throw new Error(`Content invariant failed for seed ${seed}`);
 reports.push({seed,files:TOTAL,words,targetOccurrences:targets,categories:counts,vouchers,voucherRate:vouchers/TOTAL,maxVoucher,dryDrawers:dry,minimumBodyOrScenarioStageReuseDistance:minGap,distinctSearchableTexts:uniqueTexts.size});
}
console.log(JSON.stringify({archiveVersion:3,reports,recordPacks:validateRecordPacks(),authored:{scenarioFamilies:SCENARIOS.length,writtenFragments:GOSSIP_FRAGMENTS.length,shortChains:SHORT_STORIES.length,newLongChains:LONG_STORIES.length,totalChains:ALL_STORIES.length,storyRecords:ALL_STORIES.reduce((n,s)=>n+s.chapters.length,0),officeProcedureTopics:20,officeDocumentVariants:OFFICE_BODIES.length},sources:{packs:SOURCE_MANIFEST.length,excerpts:SOURCE_MANIFEST.reduce((n,s)=>n+s.excerpts,0),originalWords:SOURCE_MANIFEST.reduce((n,s)=>n+s.words,0),bytes:SOURCE_MANIFEST.reduce((n,s)=>n+statSync('public/'+s.file).size,0)},reuse:'Reference excerpts, office procedures, and social scenarios recur globally. No 152,616-unique-text claim is made; local body/fragment reuse is separated by at least 128 file positions.'},null,2));
