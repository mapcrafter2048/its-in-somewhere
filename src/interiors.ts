import { DESK_CHAIR } from './hub-layout';
import {PersonalDeskWorld} from './desk/world';
import { addOfficeDetails } from './ui/office-details';
import * as THREE from 'three';
import type { PhysicalState } from './physical';
import { OfficeProps } from './appliances';
import type { OfficeState, BoardStroke } from './types';
import { paintBoard } from './whiteboard';
import { makeModel, makeFolder, part } from './prop-models';
import { NOOK, PERSONAL_CABINET, NOOK_BOX_STACKS, DESKTOP_Y, toWorld } from './hub-layout';
export interface Collider {
    x: number;
    z: number;
    w: number;
    d: number;
}
export class OfficeInterior {
    private hitGeometry: THREE.BufferGeometry;
    readonly root = new THREE.Group();
    readonly colliders: Collider[] = [];
    readonly hits: THREE.Mesh[] = [];
    readonly props: OfficeProps;
    readonly personal: PersonalDeskWorld;
    readonly boardCanvas = document.createElement('canvas');
    private boardTexture: THREE.CanvasTexture;
    private drawings: BoardStroke[][] = [[], [], [], []];
    private boardPage = 0;
    get brewing() {
        return this.props.brewing;
    }
    constructor(wing: number, unit: THREE.BufferGeometry, state: OfficeState, physical?: PhysicalState) {
        this.hitGeometry = unit;
        const origin = toWorld(NOOK.wing, NOOK.x, NOOK.z);
        this.root.position.set(origin.x, 0, origin.z);
        this.root.name = 'archive-work-nook';
        this.props = new OfficeProps(wing, unit, state, physical);
        this.root.add(this.props.root);
        this.hits.push(...this.props.hits);
        this.add('desk', 0, 0, 0, 2.6, 1.25);
        this.add('chair', DESK_CHAIR.x, 0, DESK_CHAIR.z, .75, .7);
        // Decorative: tucked behind the desk, its back towards the wall.
        this.colliders.push({ x: 7.2, z: 0, w: .62, d: .55 }, { x: 2.3, z: .2, w: .59, d: .51 });
        this.add('table', 4.8, 0, 0, 3.2, 1.25);
        this.add('lamp', .95, DESKTOP_Y, -.1);
        this.add('pen-stand', .6, DESKTOP_Y, .12);
        for (let i = 0; i < 3; i++) {
            const f = makeFolder(i);
            f.rotation.x = -Math.PI / 2;
            f.rotation.z = .04 * i;
            f.position.set(-.1, DESKTOP_Y + .006 + i * .012, -.3);
            f.scale.setScalar(1);
            this.root.add(f);
        }
        const cabinet = PERSONAL_CABINET, pedestal = new THREE.Group();
        pedestal.name = 'personal-filing-cabinet';
        pedestal.position.set(cabinet.x, 0, cabinet.z);
        this.root.add(pedestal);
        this.colliders.push(cabinet);
        part(pedestal, 0, .025, 0, .94, .05, 1.14, 0x343e33, .4);
        part(pedestal, 0, .44, 0, cabinet.w, .84, cabinet.d, 0x545d50, .4);
        for (let i = 0; i < 2; i++) {
            const y = .25 + i * .36;
            part(pedestal, 0, y, .59, .83, .31, .06, 0x69715f, .4);
            part(pedestal, 0, y, .64, .28, .025, .035, 0x9a9175, .5);
            this.hit(cabinet.x, y, cabinet.z + .65, .87, .32, .1).userData.container = `personal:${i}`;
        }
        const board = makeModel('whiteboard');
        board.position.set(0, 1.75, -1.4);
        this.root.add(board);
        this.boardCanvas.width = 1024;
        this.boardCanvas.height = 512;
        this.boardTexture = new THREE.CanvasTexture(this.boardCanvas);
        this.boardTexture.colorSpace = THREE.SRGBColorSpace;
        const drawing = new THREE.Mesh(new THREE.PlaneGeometry(3.36, 1.51), new THREE.MeshStandardMaterial({ map: this.boardTexture, roughness: .95 }));
        drawing.position.set(0, 2.575, -1.34);
        drawing.name = 'wall-mounted-whiteboard';
        this.root.add(drawing);
        this.hit(0, 2.575, -1.28, 3.4, 1.55, .13).userData.prop = 'whiteboard';
        this.personal = new PersonalDeskWorld(unit);
        this.root.add(this.personal.root);
        this.hits.push(...this.personal.hits);
        addOfficeDetails(this.root, unit);
        for (const p of NOOK_BOX_STACKS)
            this.colliders.push({ x: p.x, z: p.z, w: p.w, d: p.d });
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = shadowCanvas.height = 64;
        const ctx = shadowCanvas.getContext('2d')!, gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(20,18,12,.38)');
        gradient.addColorStop(1, 'rgba(20,18,12,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        const contacts = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }), this.colliders.length), transform = new THREE.Object3D();
        this.colliders.forEach((p, i) => {
            transform.position.set(p.x, .012, p.z);
            transform.rotation.x = -Math.PI / 2;
            transform.scale.set(p.w + .35, p.d + .35, 1);
            transform.updateMatrix();
            contacts.setMatrixAt(i, transform.matrix);
        });
        contacts.computeBoundingSphere();
        this.root.add(contacts);
        // A grounded pool of light from the same lamp used in the inspection scene.
        const light = new THREE.SpotLight(0xffcf8d, 17, 7, Math.PI * .38, .7, 2);
        light.position.set(.95, 1.65, -.1);
        light.target.position.set(.8, .9, .1);
        light.castShadow = true;
        light.shadow.mapSize.set(512, 512);
        light.shadow.bias = -.001;
        this.root.add(light, light.target);
    }
    private add(name: Parameters<typeof makeModel>[0], x: number, y: number, z: number, w?: number, d?: number) {
        const model = makeModel(name);
        model.position.set(x, y, z);
        this.root.add(model);
        if (w && d)
            this.colliders.push({ x, z, w, d });
        return model;
    }
    private hit(x: number, y: number, z: number, w: number, h: number, d: number) {
        const hit = new THREE.Mesh(this.hitGeometry, new THREE.MeshBasicMaterial({ visible: false }));
        hit.position.set(x, y, z);
        hit.scale.set(w, h, d);
        this.root.add(hit);
        this.hits.push(hit);
        return hit;
    }
    update(dt: number, reducedMotion: boolean) {
        this.props.update(dt, reducedMotion);
    }
    setBoardPage(index: number) {
        this.boardPage = index;
        this.setDrawing(this.drawings[index], index);
    }
    setDrawing(strokes: BoardStroke[], index = 0) {
        this.drawings[index] = strokes;
        if (index === this.boardPage) {
            paintBoard(this.boardCanvas, strokes);
            this.boardTexture.needsUpdate = true;
        }
    }
    blocked(x: number, z: number) {
        const lx = x - this.root.position.x, lz = z - this.root.position.z;
        return this.colliders.some(c => Math.abs(lx - c.x) < c.w / 2 + .25 && Math.abs(lz - c.z) < c.d / 2 + .25);
    }
    setQuality(quality: string) {
        this.root.traverse(o => {
            if (o instanceof THREE.SpotLight) {
                o.castShadow = quality !== 'low';
                const size = quality === 'high' ? 1024 : 512;
                if (o.shadow.mapSize.x !== size) {
                    o.shadow.map?.dispose();
                    o.shadow.map = null;
                    o.shadow.mapSize.set(size, size);
                }
                o.shadow.needsUpdate = true;
            }
        });
    }
}
