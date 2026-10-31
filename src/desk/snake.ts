export type Cell = readonly [number,number];
export class SnakeGame {
 readonly size=20;
 body:Cell[]=[[5,10],[4,10],[3,10]];
 direction:Cell=[1,0]; next:Cell=[1,0]; food:Cell=[12,10]; score=0; ended=false; turned=false;
 turn(x:number,y:number){if(this.turned||x===-this.direction[0]&&y===-this.direction[1])return;this.next=[x,y];this.turned=true;}
 step(random=Math.random){
  if(this.ended)return;
  this.direction=this.next;this.turned=false;
  const head:Cell=[this.body[0][0]+this.direction[0],this.body[0][1]+this.direction[1]];
  const eats=head[0]===this.food[0]&&head[1]===this.food[1];
  if(head.some(v=>v<0||v>=this.size)||this.body.slice(0,eats?undefined:-1).some(p=>p[0]===head[0]&&p[1]===head[1])){this.ended=true;return;}
  this.body.unshift(head);
  if(!eats)this.body.pop();else{this.score+=10;const free:Cell[]=[];for(let y=0;y<this.size;y++)for(let x=0;x<this.size;x++)if(!this.body.some(p=>p[0]===x&&p[1]===y))free.push([x,y]);if(!free.length){this.ended=true;return;}this.food=free[Math.floor(random()*free.length)];}
 }
}
/** Only the foreground app owns a timer; focus loss requires an explicit resume. */
export function mountSnake(host:HTMLElement,best:number,onBest:(score:number)=>void){
 host.innerHTML='<div class="snake-layout"><div><canvas id="snake-board" width="400" height="400" tabindex="0" aria-label="Snake board. Arrow keys or WASD to steer. Space pauses."></canvas><p id="snake-status" role="status"></p><button id="snake-toggle">Start</button> <button id="snake-restart">Restart</button></div><aside><h3>Lunch-break league</h3><p>Fictional coworker scores</p><ol><li>TESS · 180</li><li>ACCT · 120</li><li>MV · 40</li></ol><p id="snake-best"></p><p>Arrows / WASD: steer<br>Space: pause<br>Esc: leave terminal</p><p>No evidence. No promotion.<br>Just one more square.</p></aside></div>';
 const canvas=host.querySelector<HTMLCanvasElement>('canvas')!,ctx=canvas.getContext('2d')!,status=host.querySelector<HTMLElement>('#snake-status')!,toggle=host.querySelector<HTMLButtonElement>('#snake-toggle')!;
 let game=new SnakeGame(),timer:ReturnType<typeof setInterval>|undefined,disposed=false;
 const draw=()=>{ctx.fillStyle='#243c34';ctx.fillRect(0,0,400,400);ctx.fillStyle='#d9b36c';ctx.fillRect(game.food[0]*20+3,game.food[1]*20+3,14,14);game.body.forEach((p,i)=>{ctx.fillStyle=i?'#a9c08a':'#e8ecd0';ctx.fillRect(p[0]*20+1,p[1]*20+1,18,18);});status.textContent=`${game.ended?'Game over':timer?'Playing':'Paused'} · ${game.score} points`;toggle.textContent=timer?'Pause':'Resume';toggle.disabled=game.ended;host.querySelector('#snake-best')!.textContent=`Your best: ${best}`;};
 const pause=()=>{clearInterval(timer);timer=undefined;if(!disposed)draw();};
 const step=()=>{game.step();if(game.score>best){best=game.score;onBest(best);}if(game.ended)pause();draw();};
 const play=()=>{if(disposed||game.ended||document.hidden||!document.hasFocus())return;timer=setInterval(step,130);canvas.focus();draw();};
 toggle.onclick=()=>timer?pause():play();host.querySelector<HTMLButtonElement>('#snake-restart')!.onclick=()=>{pause();game=new SnakeGame();draw();canvas.focus();};
 const key=(e:KeyboardEvent)=>{if(e.target!==canvas&&e.target!==toggle)return;const directions:Record<string,Cell>={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};if(e.key===' '){e.preventDefault();if(!e.repeat)timer?pause():play();}else if(directions[e.key]){e.preventDefault();game.turn(...directions[e.key]);}};
 const visibility=()=>{if(document.hidden)pause();};
 host.addEventListener('keydown',key);window.addEventListener('blur',pause);document.addEventListener('visibilitychange',visibility);draw();
 return ()=>{disposed=true;clearInterval(timer);host.removeEventListener('keydown',key);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',visibility);};
}
