import {createPrintedCopy} from '../src/inventory';
import {freshPhysical,takeItem,consumeHeld,placeItem} from '../src/physical';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {OfficeProps} from '../src/appliances';
import {freshOffice,validateOffice} from '../src/office-state';
import {freshSave,validateSave,loadSave,SAVE_KEY,ENVIRONMENT_BACKUP_KEY} from '../src/state';
import {NOOK_SPAWN} from '../src/hub-layout';
test('retained equipment state round trips alongside filing progress',()=>{
 const save=freshSave();delete save.office;const loaded=validateSave(save);assert.deepEqual(loaded.office,freshOffice());loaded.office!.coffee=1;loaded.office!.printedFile=loaded.target;createPrintedCopy(loaded.physical!,loaded.target);loaded.credits=123;loaded.completed=true;assert.deepEqual(validateSave(JSON.parse(JSON.stringify(loaded))),loaded);
 for(const bad of [null,{...freshOffice(),open:['printer']},{...freshOffice(),coffee:3},{...freshOffice(),printedFile:152616}])assert.throws(()=>validateOffice(bad),/appliance/);
});
test('coffee and printer cycles finish once, preserve prior output, and restore stopped',t=>{
 let now=1000;t.mock.method(performance,'now',()=>now);const state=freshOffice(),physical=freshPhysical(),props=new OfficeProps(3,new THREE.BoxGeometry(),state,physical);let changes=0;props.onChange=()=>changes++;
 assert.deepEqual(props.hits.map(h=>h.userData.propId),['fan','coffee','printer','water','shredder','printer-input','printer-output']);assert.deepEqual(props.action('microwave-control'),{});
 assert.equal(props.action('coffee').sound,'brew');assert.match(props.action('coffee').message!,/still brewing/);now+=5100;props.update(.05,true);assert.equal(state.coffee,1);assert.match(props.action('coffee').message!,/drink/i);takeItem(physical,'coffee-mug');consumeHeld(physical);placeItem(physical,'coffee');props.syncItems();assert.equal(state.coffee,0);props.action('coffee');props.restore(state);assert.equal(props.brewing,false);
 state.printedFile=1;createPrintedCopy(physical,1);physical.files[2]='printer-input';assert.equal(props.startPrint(2),false);physical.copies![0].place='personal:0';state.printedFile=null;
 assert.equal(props.startPrint(2),true);assert.equal(props.startPrint(3),false);assert.equal(state.printedFile,null);now+=4100;props.update(.05,true);assert.equal(state.printedFile,2);assert.equal(physical.files[2],'printer-input');props.update(.05,true);assert.equal(changes,2);physical.copies!.find(c=>c.place==='printer-output')!.place='personal:0';state.printedFile=null;physical.files[2]='inventory';physical.files[3]='printer-input';props.startPrint(3);props.restore(state);assert.equal(props.printing,false);assert.equal(state.printedFile,null);

});
function oldKitchenSave(){const save=freshSave();delete save.environmentVersion;save.zone='hub';save.wing=0;save.position=[15,1.7,-20];save.office!.open=['fridge','microwave'];const p=save.physical!;p.items[1].place='water';p.items[2].place='cupboard-0';p.items.push(...Array.from({length:6},(_,i)=>({id:`meal-${i+1}`,kind:'meal' as const,contents:'food' as const,place:i===0?'held' as const:'fridge' as const,warm:false})));p.held={kind:'item',id:'meal-1'};save.inspected=[0];save.credits=128;p.files['0']='personal:0';return save;}
test('warehouse migration backs up raw save, retires kitchen safely and is idempotent',()=>{
 const old=oldKitchenSave(),raw=JSON.stringify(old),entries=new Map([[SAVE_KEY,raw]]),storage={getItem:(k:string)=>entries.get(k)??null,setItem:(k:string,v:string)=>{entries.set(k,v);}};
 const {save,error}=loadSave(storage);assert.equal(error,undefined);assert.equal(entries.get(ENVIRONMENT_BACKUP_KEY),raw);assert.equal(save.environmentVersion,2);assert.equal(save.wing,3);assert.deepEqual(save.position,NOOK_SPAWN);assert.equal(save.credits,128);assert.deepEqual(save.inspected,[0]);assert.equal(save.physical!.files['0'],'personal:0');assert.equal(save.physical!.items.length,3);assert.equal(save.physical!.held,null);assert.deepEqual(save.office!.open,[]);assert.ok(save.physical!.items.every(i=>['coffee','table'].includes(i.place)));assert.deepEqual(validateSave(save),save);assert.deepEqual(loadSave(storage).save,save);assert.equal(entries.get(ENVIRONMENT_BACKUP_KEY),raw);
 old.zone='archive';old.wing=2;old.position=[0,1.7,-20];old.physical!.held={kind:'file',id:1};old.physical!.files['1']='held';old.physical!.items.find(i=>i.id==='meal-1')!.place='fridge';const migrated=validateSave(old);assert.equal(migrated.wing,2);assert.deepEqual(migrated.position,old.position);assert.deepEqual(migrated.physical!.held,{kind:'file',id:1});
});
test('failed migration backup pauses writes and leaves the source save untouched',()=>{
 const raw=JSON.stringify(oldKitchenSave());const result=loadSave({getItem:k=>k===SAVE_KEY?raw:null,setItem:()=>{throw new Error('quota');}});assert.match(result.error!,/automatic writes are paused/);assert.equal(result.save.credits,128);
});
test('desk fan toggles, animates inside its guard and restores its saved power state',()=>{
 const state=freshOffice(),props=new OfficeProps(3,new THREE.BoxGeometry(),state),fan=props.root.getObjectByName('desk-fan')!,rotor=fan.getObjectByName('fan-rotor')!;let changes=0;props.onChange=()=>changes++;
 assert.equal(state.fanOn,false);assert.match(props.target('fan').label,/ on$/);props.update(.05,false);assert.equal(Math.abs(rotor.rotation.z),0);assert.equal(props.action('fan').sound,'switch');for(let i=0;i<20;i++)props.update(.05,false);assert.notEqual(rotor.rotation.z,0);assert.match(props.target('fan').label,/ off$/);assert.equal(changes,1);assert.equal(validateOffice(JSON.parse(JSON.stringify(state))).fanOn,true);
 props.action('fan');for(let i=0;i<100;i++)props.update(.05,false);assert.ok(fan.userData.spin<.001);const legacy={...state};delete legacy.fanOn;assert.equal(validateOffice(legacy).fanOn,false);assert.throws(()=>validateOffice({...state,fanOn:'yes'}),/appliance/);
});
test('removed room-light overrides are ignored when loading existing office saves',()=>{
 const office=freshOffice();
 assert.deepEqual(validateOffice({...office,roomLights:['on','on','on','on']}),office);
 assert.deepEqual(validateOffice({...office,roomLights:['off','auto','on','off']}),office);
});
