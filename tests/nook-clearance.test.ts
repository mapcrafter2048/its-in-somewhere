import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {NOOK,PERSONAL_CABINET,NOOK_BOX_STACKS,DESKTOP_Y} from '../src/hub-layout';
import {STORAGE} from '../src/storage';
import {makeModel,makeFolder} from '../src/prop-models';
import {FootstepCadence,WALK_SPEED,RUN_SPEED} from '../src/locomotion';
test('all five desk boxes have separate bounds, correct stacking, and clearance from the personal cabinet and desk',()=>{
 const cabinet=new THREE.Box3(new THREE.Vector3(PERSONAL_CABINET.x-.47,0,-.57),new THREE.Vector3(PERSONAL_CABINET.x+.47,.86,.66)),desk=new THREE.Box3().setFromObject(makeModel('desk'));
 assert.equal(cabinet.intersectsBox(desk),false);const boxes=NOOK_BOX_STACKS.map((position,i)=>{const model=makeModel('file-box',true);model.position.set(position.x,position.y,position.z);const bounds=new THREE.Box3().setFromObject(model),unit=STORAGE.find(u=>u.wing===3&&u.index===384+i&&u.kind==='box')!;assert.equal(unit.x,NOOK.x+position.x);assert.equal(unit.z,NOOK.z+position.z);assert.equal(unit.y,position.y);assert.equal(bounds.intersectsBox(cabinet),false);assert.equal(bounds.intersectsBox(desk),false);return bounds;});
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)assert.equal(boxes[i].intersectsBox(boxes[j]),false);
 assert.ok(cabinet.min.x-Math.max(...boxes.map(b=>b.max.x))>=.6);assert.ok(boxes[2].min.y-boxes[0].max.y<.005);
 const papers=Array.from({length:3},(_,i)=>{const model=makeFolder(i);model.rotation.x=-Math.PI/2;model.rotation.z=.04*i;model.position.set(-.1,DESKTOP_Y+.006+i*.012,-.3);return new THREE.Box3().setFromObject(model);});assert.ok(papers[0].min.y>=DESKTOP_Y);assert.ok(papers[1].min.y-papers[0].max.y<.002);
});
test('walking footfalls are spaced at least 0.48 seconds, running is quicker, and blocked movement stays silent',()=>{
 const sample=(running:boolean)=>{const cadence=new FootstepCadence(),times:number[]=[];for(let frame=0;frame<600;frame++){const t=frame/60;if(cadence.advance((running?RUN_SPEED:WALK_SPEED)/60,running,t))times.push(t);}return times;},walk=sample(false),run=sample(true);
 assert.ok(walk.length>=18&&walk.length<=21);assert.ok(run.length>walk.length);for(let i=1;i<walk.length;i++)assert.ok(walk[i]-walk[i-1]>=.48-1e-8);const stopped=new FootstepCadence();assert.equal(stopped.advance(.7,false,0),false);stopped.reset();assert.equal(stopped.advance(.4,false,2),false);for(let i=0;i<100;i++)assert.equal(stopped.advance(0,false,3+i),false);
});
test('walking speed and footfall distance agree at different frame rates',()=>{
 assert.equal(WALK_SPEED,1.8);assert.equal(RUN_SPEED,3);
 for(const fps of [30,60,120])for(const running of [false,true]){const cadence=new FootstepCadence(),speed=running?RUN_SPEED:WALK_SPEED,interval=running?.34:.48;const steps:number[]=[];for(let frame=0;frame<fps*10;frame++){if(cadence.advance(speed/fps,running,frame/fps))steps.push(frame/fps);}assert.ok(steps.length>=Math.floor(10/interval)-2);for(let i=1;i<steps.length;i++){const distance=(steps[i]-steps[i-1])*speed;assert.ok(distance>=speed*interval-1e-8);assert.ok(distance<speed*(interval+2/fps));}}
});
