import manifestData from './source-manifest.json';
import type { ContentPack, SourceManifestEntry, SourceRef } from '../types';
export const SOURCE_MANIFEST=manifestData as SourceManifestEntry[];
const packs=new Map<string,ContentPack>(),pending=new Map<string,Promise<void>>();
export function sourceReference(ordinal:number,seed:number):SourceRef {
 const total=SOURCE_MANIFEST.reduce((n,s)=>n+s.excerpts,0);
 if(!total)throw new Error('Reference corpus has no excerpts. Run the source importer.');
 let stride=37;const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;while(gcd(stride,total)!==1)stride+=2;
 let n=((ordinal*stride+(seed%total))%total+total)%total;
 for(const source of SOURCE_MANIFEST){if(n<source.excerpts)return {id:source.id,excerpt:n,title:source.title,section:packs.get(source.id)?.excerpts[n]?.section??`Reference extract ${n+1}`};n-=source.excerpts;}
 throw new Error('Reference index outside corpus');
}
export function sourceText(ref:SourceRef){return packs.get(ref.id)?.excerpts[ref.excerpt]?.text;}
export async function ensureSource(id:string):Promise<void>{
 if(packs.has(id))return;if(pending.has(id))return pending.get(id)!;
 const source=SOURCE_MANIFEST.find(s=>s.id===id);if(!source)throw new Error('Unknown reference source.');
 const task=(async()=>{
  const response=await fetch(`${import.meta.env.BASE_URL}${source.file}`);if(!response.ok)throw new Error(`Reference pack unavailable (${response.status}).`);
  const input=await response.json() as ContentPack;
  if(input.id!==id||!Array.isArray(input.excerpts)||input.excerpts.length!==source.excerpts||!input.excerpts.every(e=>typeof e.section==='string'&&typeof e.text==='string'&&e.text.length>0))throw new Error('Reference pack is incomplete.');
  packs.set(id,input);
 })();pending.set(id,task);try{await task;}finally{pending.delete(id);}
}
export function installSource(pack:ContentPack){const source=SOURCE_MANIFEST.find(s=>s.id===pack.id);if(!source||pack.excerpts.length!==source.excerpts)throw new Error('Reference pack does not match manifest.');packs.set(pack.id,pack);}
export function sourceStats(){return {loaded:packs.size,excerpts:SOURCE_MANIFEST.reduce((n,s)=>n+s.excerpts,0)};}
