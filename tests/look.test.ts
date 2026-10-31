import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lookAngles,wrapYaw,PITCH_LIMIT} from '../src/look';
test('horizontal look supports repeated complete turns in both directions',()=>{
 for(const direction of [-1,1]){let yaw=.37,pitch=.1;for(let turn=0;turn<20;turn++){for(let step=0;step<72;step++){const a=lookAngles(yaw,pitch,direction*Math.PI*2/72/.002,0,1);yaw=a.yaw;pitch=a.pitch;assert.ok(yaw>=-Math.PI&&yaw<Math.PI);}assert.ok(Math.abs(yaw-.37)<1e-10);assert.equal(pitch,.1);}}
 assert.ok(Math.abs(wrapYaw(Math.PI*200+.2)-.2)<1e-10);
});
test('vertical look can reach the floor and ceiling without flipping over',()=>{
 assert.equal(lookAngles(0,0,0,100000,1).pitch,-PITCH_LIMIT);assert.equal(lookAngles(0,0,0,-100000,1).pitch,PITCH_LIMIT);assert.ok(PITCH_LIMIT<Math.PI/2&&PITCH_LIMIT>1.5);
});
