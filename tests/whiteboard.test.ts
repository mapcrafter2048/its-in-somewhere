import {test} from 'node:test';
import type {BoardStroke} from '../src/types';
import assert from 'node:assert/strict';
import {validateBoards,MAX_BOARD_POINTS} from '../src/whiteboard';
import {freshSave,validateSave} from '../src/state';
test('existing saves gain empty wing drawings; drawings survive save round trips without progress changes',()=>{
 const old=freshSave();delete old.whiteboards;old.credits=83;old.selectedFile=old.target;old.completed=true;old.upgrades=['drawers'];
 const normalized=validateSave(old);assert.deepEqual(normalized.whiteboards,[[],[],[],[]] as BoardStroke[][]);
 normalized.whiteboards![2].push({tool:'eraser',color:'blue',width:.012,points:[[0,0],[1,1]]});
 const round=validateSave(JSON.parse(JSON.stringify(normalized)));assert.deepEqual(round,normalized);assert.equal(round.credits,83);assert.equal(round.selectedFile,old.target);assert.equal(round.completed,true);
});
test('malformed and oversized drawings are rejected with actionable errors',()=>{
 for(const bad of [null,[],[[],[],[],[{tool:'bad',points:[[0,0]]}]],[[{tool:'marker',color:'black',width:.004,points:[[NaN,0]]}],[],[],[]],[[{tool:'marker',color:'red',width:.004,points:[[1.1,0]]}],[],[],[]]])assert.throws(()=>validateBoards(bad),/whiteboard/i);
 const stroke={tool:'marker',color:'black',width:.004,points:Array.from({length:500},()=>[.1,.1])};assert.throws(()=>validateBoards([Array.from({length:MAX_BOARD_POINTS/500+1},()=>stroke),[],[],[]]),/limit/);
});
