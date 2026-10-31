import * as THREE from 'three';
// All wings retain the original local filing coordinates; only their origins change.
export const ENVIRONMENT_VERSION=2;
export const ROOM_HALF_WIDTH=22;
export const ROOM_FRONT=4.8;
export const ROOM_BACK=-49.8;
export const ROOM_DEPTH=ROOM_FRONT-ROOM_BACK;
export const ROOM_HEIGHT=4.6;
export const ROOM_ANGLES=[0,0,0,0];
export const ROOM_ORIGINS=[[-22,-4.8],[22,-4.8],[22,49.8],[-22,49.8]] as const;
export const DOOR_HALF_WIDTH=1.55;
export const PLAYER_RADIUS=.25;
export interface RoomConnection {a:number;b:number;x:number;z:number;axis:'x'|'z'}
export const CONNECTIONS:RoomConnection[]=[
 {a:0,b:1,x:0,z:-3,axis:'x'},
 {a:1,b:2,x:42,z:0,axis:'z'},
 {a:2,b:3,x:0,z:51.6,axis:'x'},
 {a:3,b:0,x:-42,z:0,axis:'z'}
];
export const STORAGE_RUNS=Array.from({length:8},(_,row)=>[-12,-6,6,12].map(x=>({x,z:1.5-row*6,w:3.5,d:.65}))).flat();
export const NOOK={wing:3,x:-13,z:-48.2};
/** Local work-nook placements shared by geometry, storage addressing and collision. */
export const PERSONAL_CABINET={x:-1.85,z:0,w:.9,d:1.1};
export const NOOK_BOX_STACKS=Array.from({length:5},(_,i)=>({x:-4.15+(i%2)*.83,y:Math.floor(i/2)*.468,z:-.2,w:.78,d:.6}));
export const DESKTOP_Y=.94;
export const NOOK_SPAWN:[number,number,number]=[-13,1.7,-46.35];
export function toWorld(wing:number,x:number,z:number){const o=ROOM_ORIGINS[wing];return new THREE.Vector3(x+o[0],1.7,z+o[1]);}
export function toRoom(wing:number,x:number,z:number){const o=ROOM_ORIGINS[wing];return {x:x-o[0],z:z-o[1]};}
export function zoneAt(x:number,z:number):{zone:'archive';wing:number}{return {zone:'archive',wing:z<0?(x<0?0:1):(x<0?3:2)};}
export function doorwayLocal(d:RoomConnection,x:number,z:number){return {along:d.axis==='x'?z-d.z:x-d.x,across:d.axis==='x'?x-d.x:z-d.z};}
export function withinWarehouse(x:number,z:number){return Math.abs(x)<=44-PLAYER_RADIUS&&z>=-ROOM_DEPTH+PLAYER_RADIUS&&z<=ROOM_DEPTH-PLAYER_RADIUS;}

export const DESK_CHAIR = { x: 0, z: -1.04 };
