import {paintStrokes} from './desk/paper';
import type {BoardStroke} from './types';
export const MAX_STROKES=160, MAX_POINTS=600, MAX_BOARD_POINTS=10000;
export function validateBoards(value:unknown):BoardStroke[][]{
 if(value===undefined)return [[],[],[],[]];
 if(!Array.isArray(value)||value.length!==4)throw new Error('Invalid whiteboards: expected four wing drawings.');
 return value.map(board=>{
  if(!Array.isArray(board)||board.length>MAX_STROKES||board.reduce((n,s)=>n+(Array.isArray(s?.points)?s.points.length:0),0)>MAX_BOARD_POINTS)throw new Error('Whiteboard drawing exceeds its stroke limit.');
  return board.map((s:BoardStroke)=>{
   if(!s||!['marker','eraser'].includes(s.tool)||!['black','blue','red'].includes(s.color)||![.004,.012].includes(s.width)||!Array.isArray(s.points)||!s.points.length||s.points.length>MAX_POINTS||!s.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=1)))throw new Error('Invalid whiteboard stroke. Restore a valid backup.');
   return {tool:s.tool,color:s.color,width:s.width,points:s.points.map(p=>[p[0],p[1]] as [number,number])};
  });
 });
}
export function paintBoard(canvas:HTMLCanvasElement,strokes:BoardStroke[]){
 const ctx=canvas.getContext('2d')!,w=canvas.width,h=canvas.height;ctx.fillStyle='#eef0df';ctx.fillRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';
 paintStrokes(ctx,strokes,w,h,'#eef0df');
}
export function mountWhiteboard(host:HTMLElement,strokes:BoardStroke[],onSave:()=>void,onLimit:()=>void,editable=true){
 host.innerHTML=`<div class="board-tools" role="group" aria-label="Drawing tools"><button data-ink="black" aria-pressed="true" aria-label="Black ink" title="Black ink"></button><button data-ink="blue" aria-pressed="false" aria-label="Blue ink" title="Blue ink"></button><button data-ink="red" aria-pressed="false" aria-label="Red ink" title="Red ink"></button><button id="board-eraser" aria-pressed="false">Eraser</button><label>Size <select id="board-size"><option value="0.004">Fine</option><option value="0.012">Broad</option></select></label><button id="board-undo">Undo</button><button id="board-clear">Clear board</button></div><canvas id="board-editor" width="1024" height="512" tabindex="0" aria-label="Whiteboard drawing surface. Draw using the mouse or a pen."></canvas><div id="board-confirm" hidden>Clear this wing’s drawing? <button id="board-confirm-clear">Clear drawing</button><button id="board-cancel-clear">Keep drawing</button></div><p class="board-status" role="status">Saved</p>`;
 const canvas=host.querySelector<HTMLCanvasElement>('canvas')!,status=host.querySelector<HTMLElement>('.board-status')!;
 let color:BoardStroke['color']='black',tool:BoardStroke['tool']='marker',active:BoardStroke|null=null,pointer=-1;
 const draw=()=>paintBoard(canvas,active?[...strokes,active]:strokes);
 const commit=()=>{if(!active)return;strokes.push(active);active=null;pointer=-1;onSave();status.textContent='Saved';draw();};
 const point=(e:PointerEvent):[number,number]=>{const r=canvas.getBoundingClientRect();return [Math.round(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*10000)/10000,Math.round(Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))*10000)/10000];};
 canvas.onpointerdown=e=>{if(!editable)return;if(e.button!==0||active)return;if(strokes.length>=MAX_STROKES||strokes.reduce((n,s)=>n+s.points.length,0)>=MAX_BOARD_POINTS){onLimit();return;}canvas.setPointerCapture(e.pointerId);pointer=e.pointerId;active={tool,color,width:Number(host.querySelector<HTMLSelectElement>('select')!.value),points:[point(e)]};draw();};
 canvas.onpointermove=e=>{if(!active||pointer!==e.pointerId)return;if(active.points.length<MAX_POINTS&&strokes.reduce((n,s)=>n+s.points.length,0)+active.points.length<MAX_BOARD_POINTS)active.points.push(point(e));draw();};
 canvas.onpointerup=e=>{if(pointer!==e.pointerId)return;commit();if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};canvas.onpointercancel=commit;canvas.onlostpointercapture=commit;
 const select=()=>{host.querySelectorAll<HTMLButtonElement>('[data-ink]').forEach(b=>b.setAttribute('aria-pressed',String(tool==='marker'&&b.dataset.ink===color)));host.querySelector('#board-eraser')!.setAttribute('aria-pressed',String(tool==='eraser'));};
 host.querySelectorAll<HTMLButtonElement>('[data-ink]').forEach(b=>b.onclick=()=>{commit();color=b.dataset.ink as BoardStroke['color'];tool='marker';select();});
 host.querySelector<HTMLButtonElement>('#board-eraser')!.onclick=()=>{commit();tool='eraser';select();};
 host.querySelector<HTMLButtonElement>('#board-undo')!.onclick=()=>{commit();strokes.pop();onSave();draw();status.textContent='Last stroke removed. Saved.';};
 const confirm=host.querySelector<HTMLElement>('#board-confirm')!;
 host.querySelector<HTMLButtonElement>('#board-clear')!.onclick=()=>{commit();confirm.hidden=false;host.querySelector<HTMLButtonElement>('#board-cancel-clear')!.focus();};
 host.querySelector<HTMLButtonElement>('#board-cancel-clear')!.onclick=()=>{confirm.hidden=true;};
 host.querySelector<HTMLButtonElement>('#board-confirm-clear')!.onclick=()=>{strokes.length=0;confirm.hidden=true;onSave();draw();status.textContent='Board cleared. Saved.';};
 if(!editable){host.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('button,select').forEach(c=>c.disabled=true);status.textContent='Retained drawing · equip a marker to write, erase or undo.';canvas.setAttribute('aria-label','Retained whiteboard drawing. Equip a marker to edit.');}
 draw();return commit;
}
