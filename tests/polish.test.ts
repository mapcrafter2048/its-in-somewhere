import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ShiftSession, countsAsShift, shiftDuration, localOfficeTime } from '../src/runtime/shift-session';
import { stoolPlacement } from '../src/room-details';
import { STORAGE } from '../src/storage';
import { makeModel } from '../src/prop-models';
import { documentClass, documentLetterhead, documentTreatment } from '../src/ui/document';
import { createArchive } from '../src/content/generator';
test('shift duration measures real time at slow frame rates and excludes breaks', () => {
 const clock = new ShiftSession(0);
 assert.equal(clock.advance(1500, 'reader', true, true, false), 1.5);
 assert.equal(clock.advance(3000, 'map', true, true, false), 1.5);
 for (const mode of ['title', 'letter', 'tutorial', 'pause', 'reset', 'import']) assert.equal(clock.advance(4000, mode, true, true, false), 0);
 assert.equal(clock.advance(5000, 'reader', true, false, false), 0);
 assert.equal(clock.advance(6000, 'reader', true, true, true), 0);
 clock.reset(10000);
 assert.equal(clock.advance(11000, 'whiteboard', true, true, false), 1);
 for (const mode of ['play', 'reader', 'inventory', 'notebook', 'map', 'comparison', 'printed-copy']) assert.equal(countsAsShift(mode, true, true, false), true);
 assert.equal(countsAsShift('play', false, true, false), false);
 assert.equal(shiftDuration(3661.9), '01:01:01');
 const date = new Date(2026, 9, 29, 23, 58, 3);
 assert.equal(localOfficeTime(date).time, '23:58');
});
test('seeded stools have actual model clearance from storage throughout all wings', () => {
 for (const seed of [1, 7391, 9041, 0, 4294967295]) for (let wing=0; wing<4; wing++) {
  const placement=stoolPlacement(seed,wing);
  assert.deepEqual(stoolPlacement(seed,wing),placement);
  const model=makeModel('stool');model.position.set(placement.x,0,placement.z);model.rotation.y=placement.yaw;
  const bounds=new THREE.Box3().setFromObject(model);
  for (const unit of STORAGE.filter(unit=>unit.wing===wing)) {
   const object=unit.kind==='box'?makeModel('file-box'):unit.kind==='wall'?makeModel('wall-cabinet'):makeModel('cabinet');object.position.set(unit.x,unit.y,unit.z);object.rotation.y=unit.yaw;const storage=new THREE.Box3().setFromObject(object);
   assert.equal(bounds.intersectsBox(storage),false,`${seed} W${wing+1} ${unit.label}`);
  }
  assert.ok(bounds.min.x>-21.75&&bounds.max.x<21.75);
 }
});
test('document presentation is deterministic, escapes metadata, and never mutates content', () => {
 const archive=createArchive(7391),doc=archive.get(0),before=JSON.stringify(doc);
 for (const [kind,treatment] of [['memo','correspondence'],['report','report'],['ticket','form'],['reference','reference'],['spreadsheet','workbook']] as const) assert.equal(documentTreatment({...doc,kind}),treatment);
 assert.equal(documentClass(doc),documentClass({...doc}));
 assert.ok(documentLetterhead({...doc,kind:'<script>' as any}).includes('&lt;SCRIPT&gt;'));
 assert.equal(JSON.stringify(doc),before);
});
test('desk chair fits behind the desk with its back facing the wall', () => {
 const chair=makeModel('chair');chair.position.set(0,0,-1.04);
 const desk=makeModel('desk');const chairBounds=new THREE.Box3().setFromObject(chair),deskBounds=new THREE.Box3().setFromObject(desk);
 assert.ok(chairBounds.max.z<deskBounds.min.z);
 assert.ok(chairBounds.min.z>-1.5);
 const geometry=(chair.children[0] as THREE.Mesh).geometry;
 assert.ok(geometry.attributes.position.count>0);
});
