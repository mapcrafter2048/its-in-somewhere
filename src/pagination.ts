import {PHRASE} from './archive';
import type {ArchiveDocument} from './types';
/** Layout-only pagination. Whitespace and wording are retained; original page boundaries remain. */
export function paginatePages(pages:string[],target=105):string[]{
 return pages.flatMap(text=>{
  const protectedRanges=[...text.toLowerCase().matchAll(new RegExp(PHRASE,'g'))].map(m=>[m.index!,m.index!+PHRASE.length]);
  const words=[...text.matchAll(/\S+/g)];if(words.length<=120)return [text];
  const result:string[]=[];let start=0,wordStart=0;
  while(words.length-wordStart>120){
   const first=wordStart+90,last=Math.min(words.length-1,wordStart+120);let at=Math.min(wordStart+target,last);
   for(let n=at;n>=first;n--){const end=words[n].index!;if(/[.!?]\s+$/.test(text.slice(words[n-1].index!,end))||/\n\s*\n/.test(text.slice(words[n-1].index!+words[n-1][0].length,end))){at=n;break;}}
   let cut=words[at].index!;const range=protectedRanges.find(([a,b])=>cut>a&&cut<b);if(range){at=words.findIndex(w=>w.index!>=range[1]);cut=at<0?text.length:words[at].index!;}
   if(cut<=start||at<0)break;result.push(text.slice(start,cut));start=cut;wordStart=at;
  }
  result.push(text.slice(start));return result;
 });
}
export function readableDocument(doc:ArchiveDocument):ArchiveDocument{return {...doc,pages:paginatePages(doc.pages)};}
