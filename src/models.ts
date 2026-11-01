import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const models=new Map<string,THREE.Group>();
export async function loadModels(){const palette=await fetch(`/models/Textures/colormap.png`);if(!palette.ok||!palette.headers.get('content-type')?.includes('image/png'))throw new Error('The local model palette could not load.');await palette.arrayBuffer();const loader=new GLTFLoader();await Promise.all(['cup'].map(async name=>{if(models.has(name))return;const gltf=await loader.loadAsync(`/models/${name}.glb`);gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){if(/carpet/i.test(m.name))m.color.setHex(0x718d81);m.roughness=.85;}}});models.set(name,gltf.scene);}));}
export function asset(name:string,size:number,axis:'x'|'y'|'z'='y'){
 const original=models.get(name);if(!original)return null;const group=new THREE.Group(),model=original.clone(true);group.add(model);const bounds=new THREE.Box3().setFromObject(model),dimensions=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=size/dimensions[axis];model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);group.name=`asset-${name}`;return group;
}
export const MUG_LIQUID_Y = .18;
export const MUG_LIQUID_RADIUS = .0865;
let ceramicMug: THREE.Group | undefined;
/** Shared smooth ceramic shell: closed base, real inner wall and a side handle. */
export function makeMug() {
 if (!ceramicMug) {
  ceramicMug = new THREE.Group();
  ceramicMug.name = 'ceramic-mug';
  const ceramic = new THREE.MeshStandardMaterial({color:0xeee6d5,roughness:.58});
  const profile = [[0,0],[.064,0],[.075,.006],[.083,.018],[.089,.055],[.096,.15],[.098,.194],[.097,.208],[.094,.214],[.089,.214],[.086,.208],[.086,.195],[.085,.15],[.078,.055],[.073,.031],[.064,.024],[0,.024]].map(([x,y])=>new THREE.Vector2(x,y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile,48),ceramic);
  body.name = 'mug-body';
  body.castShadow = body.receiveShadow = true;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.061,.014,10,24,Math.PI),ceramic);
  handle.name = 'mug-handle';
  handle.rotation.z = -Math.PI/2;
  handle.position.set(.086,.114,0);
  handle.castShadow = handle.receiveShadow = true;
  ceramicMug.add(body,handle);
 }
 return ceramicMug.clone(true);
}
export function makeMeal(empty=false){const model=asset(empty?'styrofoam':'styrofoam-dinner',.42,'x');if(model)return model;const group=new THREE.Group();const box=new THREE.Mesh(new THREE.BoxGeometry(.4,.05,.28),new THREE.MeshLambertMaterial({color:0xe7e4d8}));group.add(box);if(!empty){const food=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),new THREE.MeshLambertMaterial({color:0xc89753}));food.scale.y=.4;food.position.y=.06;group.add(food);}return group;}
