import { OutcomeWorld } from './outcome-world';
import {boardNote} from './stationery';
import { buildVintagePC, keyboardLegendTexture } from './vintage-pc';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import { part } from '../prop-models';
import type { Save } from '../types';
import { deskFor, deliveredMail } from './state';
import { paintPinboard } from './paper';
import { MUG_DISPUTE, NOTICES } from './content';
/** Fixed meshes and cached canvases: no per-note geometry or animation-loop uploads. */
export class PersonalDeskWorld {
    readonly root = new THREE.Group();
    readonly hits: THREE.Mesh[] = [];
    readonly computer: ReturnType<typeof buildVintagePC>;
    readonly boardCanvas = document.createElement('canvas');
    private boardTexture: THREE.CanvasTexture;
    private screenCanvas = document.createElement('canvas');
    private screenTexture: THREE.CanvasTexture;
    private board: THREE.Mesh;
    private boardHit: THREE.Mesh;
    private indicator: THREE.Mesh;
    private objects: THREE.InstancedMesh;
    private noticeCanvas = document.createElement('canvas');
    private noticeTexture: THREE.CanvasTexture;
    private outcomes=new OutcomeWorld();
    private key = 'uninitialised';
    private boardKey='';
    private transform = new THREE.Object3D();
    constructor(unit: THREE.BufferGeometry) {
        this.root.name = 'personal-desk-expansion';
        const hit = (name: string, x: number, y: number, z: number, w: number, h: number, d: number) => {
            const mesh = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ visible: false }));
            mesh.position.set(x, y, z);
            mesh.scale.set(w, h, d);
            mesh.userData.deskFeature = name;
            this.root.add(mesh);
            this.hits.push(mesh);
            return mesh;
        };
        this.screenCanvas.width = 512;
        this.screenCanvas.height = 320;
        this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
        this.screenTexture.colorSpace = THREE.SRGBColorSpace;
        this.computer = buildVintagePC(unit, this.screenTexture, keyboardLegendTexture());
        this.root.add(this.computer.root);
        this.indicator = this.computer.indicator;
        hit('computer', -.64, 1.36, .04, .79, .66, .72);
        this.boardCanvas.width = 1200;
        this.boardCanvas.height = 650;
        this.boardTexture = new THREE.CanvasTexture(this.boardCanvas);
        this.boardTexture.colorSpace = THREE.SRGBColorSpace;
        part(this.root, 4.6, 2.35, -1.4, 1.8, 1.25, .08, 0x564b36);
        this.board = new THREE.Mesh(unit, new THREE.MeshStandardMaterial({ map: this.boardTexture, roughness: 1 }));
        this.board.position.set(4.6, 2.35, -1.35);
        this.board.scale.set(1.7, 1.15, .015);
        this.root.add(this.board);
        this.boardHit = hit('pinboard', 4.6, 2.35, -1.29, 1.8, 1.25, .1);
        // Collection shelf is separate from both file drawers and from the whiteboard.
        part(this.root, -2.8, 1.7, -1.17, 1.5, .08, .45, 0x5a4d39);
        for (const y of [1.905, 2.085])
            part(this.root, -2.8, y, -1.17, 1.5, .03, .45, 0x5a4d39);
        part(this.root, -2.8, 2, -1.37, 1.5, .55, .06, 0x68715b);
        this.objects = new THREE.InstancedMesh(unit, new THREE.MeshStandardMaterial({ color: 0xc9b680, roughness: .8 }), 26);
        this.objects.count = 0;
        this.objects.frustumCulled = false;
        this.root.add(this.objects);
        hit('collection', -2.8, 1.95, -1.06, 1.5, .6, .4);
        this.noticeCanvas.width = 512;
        this.noticeCanvas.height = 384;
        this.noticeTexture = new THREE.CanvasTexture(this.noticeCanvas);
        this.noticeTexture.colorSpace = THREE.SRGBColorSpace;
        const notice = new THREE.Mesh(unit, new THREE.MeshStandardMaterial({ map: this.noticeTexture, roughness: 1 }));
        notice.position.set(6.75, 2.5, -1.35);
        notice.scale.set(1.25, .94, .02);
        notice.name = 'public-noticeboard';
        this.root.add(notice);
        hit('notices', 6.75, 2.5, -1.29, 1.3, 1, .1);
        this.batchFixedParts(unit);
        this.root.add(this.outcomes.root);
    }
    private batchFixedParts(unit: THREE.BufferGeometry) {
        const parts = this.root.children.filter((o): o is THREE.Mesh => o instanceof THREE.Mesh && o.geometry !== unit && o.position.x !== 4.6);
        const pieces = parts.map(mesh => {
            mesh.updateMatrix();
            const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrix), color = (mesh.material as THREE.MeshStandardMaterial).color, values = new Float32Array(geometry.getAttribute('position').count * 3);
            for (let i = 0; i < values.length; i += 3) {
                values[i] = color.r;
                values[i + 1] = color.g;
                values[i + 2] = color.b;
            }
            geometry.setAttribute('color', new THREE.BufferAttribute(values, 3));
            return geometry;
        });
        const geometry = mergeGeometries(pieces);
        pieces.forEach(piece => piece.dispose());
        if (!geometry)
            return;
        parts.forEach(mesh => this.root.remove(mesh));
        const batch = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .88 }));
        batch.name = 'desk-fixed-solids';
        batch.castShadow = batch.receiveShadow = true;
        this.root.add(batch);
    }
    sync(save: Save) {
        this.outcomes.sync(save);
        const d = deskFor(save), big = save.upgrades.includes('pinboard');
        this.board.scale.x = big ? 2.8 : 1.7;
        this.boardHit.scale.x = big ? 2.9 : 1.8;
        // Frame expands with the artwork rather than leaving the original frame inside it.
        const frame = this.root.children.find(o => o.position.x === 4.6 && o.position.z === -1.4)!;
        frame.scale.x = big ? 2.9 : 1.8;
        const boardKey=JSON.stringify([d.pins,d.strings,d.pins.map(p=>boardNote(d,p))]);
        if(boardKey!==this.boardKey){this.boardKey=boardKey;paintPinboard(this.boardCanvas,d);this.boardTexture.needsUpdate=true;}
        let count = 0;
        for (let i = 0; i < d.collected.length; i++) {
            this.transform.position.set(-3.42 + (i % 8) * .175, 0, -1.12);
            this.transform.rotation.set(0, i * .3, 0);
            const shape = i % 4;
            this.transform.scale.set(shape === 2 ? .025 : .1, shape === 2 ? .15 : shape === 0 ? .12 : .075, shape === 0 ? .012 : shape === 2 ? .025 : .08);
            this.transform.position.y = 1.74 + Math.floor(i / 8) * .18 + this.transform.scale.y / 2;
            this.transform.updateMatrix();
            this.objects.setColorAt(count, new THREE.Color([0xd6c48e, 0x718475, 0xb58e76, 0xbbb8a0][i % 4]));
            this.objects.setMatrixAt(count++, this.transform.matrix);
        }
        if (d.rewards.includes(8)) {
            this.transform.position.set(.29, d.rewards.includes(16) ? 1.02 : .99, .25);
            this.transform.rotation.set(0, 0, 0);
            this.transform.scale.set(.16, .09, .12);
            this.transform.updateMatrix();
            this.objects.setMatrixAt(count++, this.transform.matrix);
        }
        if (d.rewards.includes(16)) {
            this.transform.position.set(.29, .9575, .25);
            this.transform.scale.set(.28, .035, .22);
            this.transform.updateMatrix();
            this.objects.setMatrixAt(count++, this.transform.matrix);
        }
        this.objects.count = count;
        this.objects.instanceMatrix.needsUpdate = true;
        if (this.objects.instanceColor)
            this.objects.instanceColor.needsUpdate = true;
        this.updateMail(save);
        const stage = Math.min(5, Math.floor((save.clues.length + d.resolved.length * 3) / 4));
        const ctx = this.noticeCanvas.getContext('2d')!;
        ctx.fillStyle = '#ddd2b1';
        ctx.fillRect(0, 0, 512, 384);
        ctx.fillStyle = '#374838';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('NOTICES TO ALL CONCERNED', 22, 35);
        ctx.font = '20px Georgia';
        const notice = save.recordPack===1?'An odd record is an invitation, not an assignment. Your notebook, the partial Catalogue and desk mail can help if you wish to follow it.':NOTICES[(stage + save.seed) % NOTICES.length];
        const lines = (notice + '\n\nRE: THE BLUE MUG\n' + MUG_DISPUTE[stage]).split('\n').flatMap(p => p.match(/.{1,40}(?:\s|$)|.{1,40}/g) || ['']);
        lines.slice(0, 12).forEach((line, i) => ctx.fillText(line.trim(), 22, 75 + i * 23));
        this.noticeTexture.needsUpdate = true;
    }
    updateMail(save: Save) {
        const key = deliveredMail(save).filter(m => !m.read).map(m => m.id).join(',');
        if (key === this.key)
            return;
        this.key = key;
        this.indicator.visible = !!key;
        const ctx = this.screenCanvas.getContext('2d')!;
        ctx.fillStyle = '#506b66';
        ctx.fillRect(0, 0, 512, 320);
        ctx.fillStyle = '#bdc3ae';
        ctx.fillRect(25, 23, 462, 251);
        ctx.fillStyle = '#344e56';
        ctx.fillRect(29, 27, 454, 28);
        ctx.fillStyle = '#eee8cc';
        ctx.font = 'bold 17px monospace';
        ctx.fillText('Archive Mail', 42, 47);
        ctx.fillStyle = '#28382f';
        ctx.font = '15px monospace';
        ctx.fillText('Mailbox   Message   Enclosures', 40, 79);
        ctx.fillStyle = '#eeebd9';
        ctx.fillRect(38, 95, 436, 145);
        ctx.fillStyle = '#28382f';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('INTERNAL CORRESPONDENCE', 53, 125);
        ctx.font = '18px monospace';
        ctx.fillText(`${key ? key.split(',').length : 0} unread messages`, 53, 164);
        ctx.font = '14px monospace';
        ctx.fillText('Please retain the awkward replies.', 53, 204);
        ctx.fillStyle = '#bec4af';
        ctx.fillRect(0, 287, 512, 33);
        ctx.fillStyle = '#344e56';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('R&R', 14, 309);
        ctx.font = '14px monospace';
        ctx.fillText('Archive Mail                  LOCAL', 72, 309);
        ctx.fillStyle = 'rgba(10,25,20,.065)';
        for (let y = 0; y < 320; y += 3)
            ctx.fillRect(0, y, 512, 1);
        this.screenTexture.needsUpdate = true;
    }
}
