import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import { random } from './archive';
import { makeModel, material } from './prop-models';
/** Between filing rows, outside the central route and clear of wall cabinets. */
export function stoolPlacement(seed: number, wing: number) {
    const rng = random(seed ^ Math.imul(wing + 1, 0x45d9f3b));
    return { x: rng() < .5 ? -18.9 : 18.9, z: -4.5 - Math.floor(rng() * 7) * 6, yaw: (rng() - .5) * .6 };
}
export const CLOCK_POSITION = { x: 0, y: 3.55, z: -49.58 };
const clockFaceGeometry=new THREE.CircleGeometry(.45,48);
const clockHousingGeometry=(()=>{const parts=[
 {g:new THREE.CylinderGeometry(.49,.49,.11,48).rotateX(Math.PI/2).translate(0,0,-.05),c:0x455649},
 {g:new THREE.TorusGeometry(.455,.025,8,48).translate(0,0,.02),c:0xb8b99d},
 {g:new THREE.SphereGeometry(.025,12,8).translate(0,0,.065),c:0x596953}
].map(({g,c})=>{const geometry=g.toNonIndexed();g.dispose();geometry.deleteAttribute('uv');const color=new THREE.Color(c),array=new Float32Array(geometry.getAttribute('position').count*3);for(let i=0;i<array.length/3;i++)color.toArray(array,i*3);geometry.setAttribute('color',new THREE.BufferAttribute(array,3));return geometry;});const result=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());return result;})();
const clockHousingMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8});
export class RoomDetails {
    readonly root = new THREE.Group();
    readonly stool = makeModel('stool');
    private hands: THREE.Group[] = [];
    private static face?: THREE.MeshStandardMaterial;
    constructor(box: THREE.BufferGeometry, _plane: THREE.BufferGeometry) {
        this.root.name = 'room-details';
        this.root.add(this.stool);
        const clock = new THREE.Group();
        clock.name = 'wall-clock';
        clock.position.set(CLOCK_POSITION.x, CLOCK_POSITION.y, CLOCK_POSITION.z);
        this.root.add(clock);
        if (!RoomDetails.face) {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 256;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#414a3e';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#ddd6bc';
            ctx.beginPath();
            ctx.arc(128, 128, 117, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#384437';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '20px Georgia';
            for (let n = 1; n <= 12; n++) {
                const a = n * Math.PI / 6;
                ctx.fillText(String(n), 128 + Math.sin(a) * 93, 128 - Math.cos(a) * 93);
            }
            ctx.font = '8px monospace';
            ctx.fillText('RECORDS & RETENTION', 128, 170);
            ctx.fillText('TAKE YOUR TIME', 128, 184);
            const map = new THREE.CanvasTexture(canvas);
            map.colorSpace = THREE.SRGBColorSpace;
            RoomDetails.face = new THREE.MeshStandardMaterial({ map, roughness: 1 });
        }
        const housing=new THREE.Mesh(clockHousingGeometry,clockHousingMaterial);housing.name='clock-case-and-rim';clock.add(housing);
        const face = new THREE.Mesh(clockFaceGeometry, RoomDetails.face);
        face.position.z=.012;
        clock.add(face);
        for (const [length, width, color] of [[.22, .025, 0x384437], [.32, .018, 0x384437], [.35, .008, 0x995e43]]) {
            const pivot = new THREE.Group(), hand = new THREE.Mesh(box, material(color));
            hand.scale.set(width, length, .008);
            hand.position.set(0, length / 2, .015 + this.hands.length * .01);
            pivot.add(hand);
            clock.add(pivot);
            this.hands.push(pivot);
        }
    }
    place(seed: number, wing: number) {
        const p = stoolPlacement(seed, wing);
        this.stool.position.set(p.x, 0, p.z);
        this.stool.rotation.y = p.yaw;
    }
    update(date: Date) {
        const seconds = date.getUTCSeconds(), minutes = date.getUTCMinutes() + seconds / 60, hours = date.getUTCHours() % 12 + minutes / 60;
        [hours / 12, minutes / 60, seconds / 60].forEach((turn, i) => this.hands[i].rotation.z = -turn * Math.PI * 2);
    }
    blocked(x: number, z: number) {
        return Math.abs(x - this.stool.position.x) < .58 && Math.abs(z - this.stool.position.z) < .58;
    }
}
