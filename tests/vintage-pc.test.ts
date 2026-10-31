import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildVintagePC} from '../src/desk/vintage-pc';
test('vintage workstation faces the chair, fits its desk and keeps its tower below the worktop',()=>{
 const pc=buildVintagePC(new THREE.BoxGeometry(1,1,1),new THREE.Texture(),new THREE.Texture());pc.root.updateMatrixWorld(true);
 assert.ok(new THREE.Vector3(0,0,1).transformDirection(pc.screen.matrixWorld).z<-.99);
 for(const name of ['monitor','keyboard','mouse']){const b=pc.components[name].clone().applyMatrix4(pc.root.matrixWorld);assert.ok(b.min.x>=-1.3&&b.max.x<=1.3,`${name} fits desktop width`);assert.ok(b.min.z>=-.625&&b.max.z<=.625,`${name} fits desktop depth`);}
 const tower=pc.components.tower.clone().applyMatrix4(pc.root.matrixWorld);assert.ok(tower.min.y>=-1e-6);assert.ok(tower.max.y<.8);assert.ok(tower.min.x>-1.1&&tower.max.x<1.1);
 assert.ok(pc.components.monitor.getSize(new THREE.Vector3()).z>.5,'deep CRT shell');
 const keyboard=pc.components.keyboard.clone().applyMatrix4(pc.root.matrixWorld),mouse=pc.components.mouseBody.clone().applyMatrix4(pc.root.matrixWorld);assert.equal(keyboard.intersectsBox(mouse),false);
});
test('individual keys, mouse cable, tower and curved CRT keep a fixed small rendering budget',()=>{
 const pc=buildVintagePC(new THREE.BoxGeometry(1,1,1),new THREE.Texture(),new THREE.Texture());let meshes=0,triangles=0;pc.root.traverse(o=>{if(o instanceof THREE.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
 assert.equal(meshes,4);assert.ok(triangles<3000);assert.ok(pc.glyphs.includes('Shift')&&pc.glyphs.includes('Enter')&&pc.glyphs.includes('F10'));
 const z=pc.screen.geometry.getAttribute('position');assert.ok(Array.from({length:z.count},(_,i)=>z.getZ(i)).some(v=>v>.01));
});
