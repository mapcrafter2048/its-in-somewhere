import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { drawerY, DRAWERS } from './archive';
export const MODEL_NAMES = ['cabinet', 'drawer', 'folder', 'desk', 'chair', 'stool', 'table', 'coffee', 'printer', 'whiteboard', 'softboard', 'lamp', 'pen-stand', 'archive-box', 'file-box', 'wall-cabinet', 'double-cabinet', 'box-files', 'pendant-light', 'tube-light', 'shredder', 'water-dispenser', 'printed-copy', 'water-glass', 'desk-fan', 'archive-door'] as const;
export type ModelName = typeof MODEL_NAMES[number];
export const CABINET_BOX = new THREE.BoxGeometry(1, 1, 1);
const paperPlane = new THREE.PlaneGeometry(1, 1);
const unit = new RoundedBoxGeometry(1, 1, 1, 2, .035);
const materials = new Map<string, THREE.MeshStandardMaterial>();
export function material(color: number, metalness = 0, roughness = .88) {
    const key = `${color}/${metalness}/${roughness}`;
    if (!materials.has(key))
        materials.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness }));
    return materials.get(key)!;
}
export function part(root: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, color: number, metalness = 0, geometry: THREE.BufferGeometry = unit) {
    const m = new THREE.Mesh(geometry, material(color, metalness));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    return m;
}
function cylinder(root: THREE.Object3D, x: number, y: number, z: number, r: number, h: number, color: number) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), material(color, .25));
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    return m;
}
/** A soft paper jacket with loose sheets, an exposed tab and a small fastener; no solid spine. */
export function makeFolder(index = 0, detailed = true) {
    const g = new THREE.Group();
    g.name = 'paper-file';
    const cover = [0xb19a70, 0xa99370, 0xb5a17c, 0xa99b7b][index % 4], sheetGeometry = detailed ? CABINET_BOX : paperPlane;
    part(g, 0, .126, -.004, .32, .252, .0018, cover, 0, sheetGeometry);
    for (let page = 0; page < (detailed ? 4 : 1); page++)
        part(g, (page % 2) * .002, .125 + (page % 3) * .001, -.0015 + page * .0012, .303 - page % 2 * .004, .236, .0008, page % 2 ? 0xd5cdb5 : 0xe1d9c2, 0, sheetGeometry);
    part(g, 0, .081, .0045, .32, .162, .0018, cover, 0, sheetGeometry);
    part(g, -.102 + (index % 4) * .067, .259, -.004, .06, .025, .0018, cover, 0, sheetGeometry);
    if (!detailed) {
        const edge = part(g, 0, .244, .0005, .303, .005, 1, 0xd5cdb5, 0, paperPlane);
        edge.rotation.x = -Math.PI / 2;
        for (const side of [-1, 1]) {
            const edge = part(g, side * .1515, .125, .0005, .005, .236, 1, 0xd5cdb5, 0, paperPlane);
            edge.rotation.y = side * Math.PI / 2;
        }
    }
    if (detailed) {
        part(g, -.025, .103, .006, .19, .061, .0006, 0xcac1a7, 0, CABINET_BOX);
        for (let line = 0; line < 3; line++)
            part(g, -.043, .12 - line * .015, .0065, .12 - line % 2 * .028, .0015, .0005, 0x777562, 0, CABINET_BOX);
        for (const x of [-.024, -.015])
            part(g, x, .216, .004, .0015, .028, .0015, 0x8c8a78, .6, CABINET_BOX);
        part(g, -.0195, .23, .004, .0105, .0015, .0015, 0x8c8a78, .6, CABINET_BOX);
    }
    return g;
}
export function makeFileBoxContents(count = 8, detailed = true) {
    const g = new THREE.Group();
    g.name = 'loose-box-files';
    for (let i = 0; i < count; i++) {
        const f = makeFolder(i, detailed);
        f.scale.set(1.87, 1.16 + (i % 3) * .025, 1);
        f.position.set((i % 3 - 1) * .004, .052, -.20 + i * .046);
        f.rotation.x = (i % 3 - 1) * .018;
        g.add(f);
    }
    return g;
}
function makeCeilingFixture(kind: 'pendant-light' | 'tube-light') {
    const g = new THREE.Group();
    g.name = kind;
    if (kind === 'pendant-light') {
        cylinder(g, 0, -.025, 0, .10, .05, 0x41483e);
        cylinder(g, 0, -.23, 0, .009, .42, 0x30352e);
        cylinder(g, 0, -.455, 0, .043, .07, 0x44483b);
        const shade = new THREE.Mesh(new THREE.CylinderGeometry(.105, .34, .28, 32, 1, true), material(0x485344, .45, .76));
        shade.position.y = -.60;
        g.add(shade);
        const lining = new THREE.Mesh(new THREE.CylinderGeometry(.102, .333, .274, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xc8c5ab, roughness: .85, side: THREE.BackSide }));
        lining.position.y = -.60;
        g.add(lining);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(.338, .009, 6, 32), material(0x5b6552, .45));
        rim.rotation.x = Math.PI / 2;
        rim.position.y = -.74;
        g.add(rim);
        cylinder(g, 0, -.525, 0, .031, .10, 0xb1ad91);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(.063, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffe7b2, emissive: 0xffd387, emissiveIntensity: 1.8, roughness: .5 }));
        bulb.scale.y = 1.12;
        bulb.position.y = -.665;
        g.add(bulb);
        cylinder(g, 0, -.59, 0, .026, .06, 0xddd5b6);
    }
    else {
        part(g, 0, -.022, 0, 1.72, .044, .24, 0x596151, .45, CABINET_BOX);
        part(g, 0, -.055, 0, 1.64, .025, .30, 0xb6b6a1, .35, CABINET_BOX);
        for (const x of [-.81, .81])
            part(g, x, -.093, 0, .035, .075, .28, 0x626a59, .4, CABINET_BOX);
        const tubeMaterial = new THREE.MeshStandardMaterial({ color: 0xe1e5d1, emissive: 0xc7d7af, emissiveIntensity: .7, roughness: .6 });
        for (const z of [-.082, .082]) {
            const tube = new THREE.Mesh(new THREE.CylinderGeometry(.026, .026, 1.55, 12), tubeMaterial);
            tube.rotation.z = Math.PI / 2;
            tube.position.set(0, -.101, z);
            g.add(tube);
        }
    }
    g.traverse(o => {
        if (o instanceof THREE.Mesh) {
            o.castShadow = o.receiveShadow = true;
        }
    });
    return g;
}
export function makeDrawer(count = 16, front = true) {
    const g = new THREE.Group();
    g.name = 'drawer';
    part(g, 0, -.15, -.43, 1.61, .025, .91, 0x343b36, .45);
    for (const x of [-.8, .8]) {
        part(g, x, -.035, -.43, .025, .23, .91, 0x667067, .45);
        part(g, x * .96, -.13, -.43, .016, .024, .88, 0x9b9d91, .6);
    }
    part(g, 0, -.035, -.88, 1.6, .23, .025, 0x576157, .4);
    if (front) {
        part(g, 0, 0, 0, 1.7, .34, .08, 0x646b57, .4, CABINET_BOX);
        for (const x of [-.2, .2])
            part(g, x, -.055, .09, .035, .06, .1, 0x8e8264, .65, CABINET_BOX);
        part(g, 0, -.055, .15, .43, .035, .035, 0x8e8264, .65, CABINET_BOX);
        part(g, 0, .075, .047, .52, .085, .009, 0xd2c6a6, 0, CABINET_BOX);
    }
    for (let i = 0; i < count; i++) {
        const f = makeFolder(i);
        f.position.set(-.585 + (i % 4) * .39, -.13, -.75 + Math.floor(i / 4) * .15);
        g.add(f);
    }
    return g;
}
export function cabinetParts() {
    const p: {
        x: number;
        y: number;
        z: number;
        w: number;
        h: number;
        d: number;
        color: number;
    }[] = [];
    const add = (x: number, y: number, z: number, w: number, h: number, d: number, color: number) => p.push({ x, y, z, w, h, d, color });
    add(0, 1.8, -.49, 1.84, 3.6, .08, 0x414a42);
    for (const x of [-.89, .89])
        add(x, 1.8, 0, .06, 3.6, 1.06, 0x525b50);
    add(0, 3.58, 0, 1.84, .06, 1.06, 0x596052);
    add(0, 3.43, .568, 1.72, .28, .08, 0x596052);
    add(0, .12, .03, 1.88, .24, 1.14, 0x303730);
    for (let d = 0; d < DRAWERS; d++)
        add(0, drawerY(d) - .18, 0, 1.72, .025, 1.01, 0x333b34);
    return p;
}
function roundedPanel(width: number, height: number, r: number) {
    const p = new THREE.Shape(), x = -width / 2, y = -height / 2;
    p.moveTo(x + r, y);
    p.lineTo(x + width - r, y);
    p.quadraticCurveTo(x + width, y, x + width, y + r);
    p.lineTo(x + width, y + height - r);
    p.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    p.lineTo(x + r, y + height);
    p.quadraticCurveTo(x, y + height, x, y + height - r);
    p.lineTo(x, y + r);
    p.quadraticCurveTo(x, y, x + r, y);
    return p;
}
function buildModel(name: ModelName, open = false, side: 'front' | 'rear' | 'both' = 'both') {
    const g = new THREE.Group();
    g.name = name;
    const b = (x: number, y: number, z: number, w: number, h: number, d: number, c: number, m = 0) => part(g, x, y, z, w, h, d, c, m);
    if (name === 'file-box')
        return makeFileBox(8, open);
    if (name === 'box-files')
        return makeFileBoxContents(8, open);
    if (name === 'pendant-light' || name === 'tube-light')
        return makeCeilingFixture(name);
    if (name === 'wall-cabinet')
        return buildModel('cabinet', open);
    if (name === 'double-cabinet') {
        for (const face of [-1, 1]) {
            const bank = buildModel('cabinet', open && (side === 'both' || side === (face === 1 ? 'front' : 'rear')));
            bank.position.z = face * .54;
            bank.rotation.y = face === 1 ? 0 : Math.PI;
            g.add(bank);
        }
        return g;
    }
    if (name === 'folder')
        return makeFolder();
    if (name === 'drawer')
        return makeDrawer(16);
    if (name === 'cabinet') {
        for (const p of cabinetParts())
            part(g, p.x, p.y, p.z, p.w, p.h, p.d, p.color, .4, CABINET_BOX);
        for (let d = 0; d < DRAWERS; d++) {
            const drawer = makeDrawer(open && d === 3 ? 16 : 0);
            drawer.position.set(0, drawerY(d), .56 + (open && d === 3 ? .75 : 0));
            g.add(drawer);
        }
        return g;
    }
    if (name === 'desk' || name === 'table') {
        const w = name === 'desk' ? 2.6 : 3.2;
        b(0, .88, 0, w, .12, 1.25, 0x63533f);
        b(0, .815, 0, w - .08, .025, 1.17, 0x3a342b);
        for (const x of [-w / 2 + .16, w / 2 - .16])
            for (const z of [-.45, .45])
                b(x, .41, z, .065, .82, .065, 0x454b40, .55);
        b(0, .25, -.45, w - .26, .05, .045, 0x454b40, .5);
        return g;
    }
    if (name === 'stool') {
        b(0, .61, 0, .55, .09, .55, 0x877355);
        for (const x of [-.21, .21])
            for (const z of [-.21, .21])
                b(x, .29, z, .045, .58, .045, 0x4d5749, .5);
        for (const x of [-.21, .21])
            b(x, .22, 0, .035, .035, .44, 0x4d5749, .5);
        for (const z of [-.21, .21])
            b(0, .22, z, .44, .035, .035, 0x4d5749, .5);
        return g;
    }
    if (name === 'chair') {
        b(0, .56, 0, .64, .14, .62, 0x514f40);
        b(0, 1.02, -.27, .64, .68, .12, 0x555446);
        for (const x of [-.25, .25]) {
            b(x, .79, -.29, .04, .6, .045, 0x42473e, .5);
            for (const z of [-.23, .23])
                b(x, .25, z, .045, .5, .045, 0x42473e, .5);
        }
        return g;
    }
    if (name === 'coffee') {
        b(0, .055, 0, .76, .11, .7, 0x30372e, .4);
        b(0, .45, -.24, .72, .8, .16, 0x515746, .5);
        for (const x of [-.32, .32])
            b(x, .4, 0, .08, .69, .56, 0x5e6355, .4);
        b(0, .85, 0, .76, .13, .64, 0x616657, .4);
        b(0, .6, .23, .55, .21, .06, 0x9b9b83, .4);
        for (const x of [-.15, 0, .15])
            cylinder(g, x, .65, .275, .023, .022, x === 0 ? 0xaaad72 : 0x353d33).rotation.x = Math.PI / 2;
        // A short dispensing head leaves clear space above the ceramic rim.
        b(0, .469, .24, .115, .03, .095, 0x96998a, .6);
        cylinder(g, 0, .426, .24, .022, .058, 0x8b9288);
        for (let i = 0; i < 7; i++)
            b(-.25 + i * .08, .12, .14, .025, .015, .29, 0x8c9180, .6);
        cylinder(g, 0, .98, -.06, .12, .16, 0x534938);
        return g;
    }
    if (name === 'printer') {
        b(0, .23, 0, 1.28, .46, .8, 0xaaa993);
        b(0, .49, 0, 1.36, .07, .86, 0x6b7465);
        b(0, .535, 0, 1.14, .015, .66, 0x292e28);
        b(0, .58, -.03, 1.3, .065, .8, 0xb2b29a);
        b(0, .28, .405, 1.08, .095, .025, 0x242b25);
        b(0, .03, .58, 1.15, .035, .42, 0x69715f);
        b(.35, .41, .415, .32, .08, .015, 0x555f48);
        for (let i = 0; i < 3; i++)
            b(-.25, .19 - i * .045, .414, .6, .012, .014, 0x5b6254);
        return g;
    }
    if (name === 'whiteboard' || name === 'softboard') {
        const white = name === 'whiteboard', w = white ? 3.5 : 1.65, h = white ? 1.65 : 1.2;
        b(0, h / 2, 0, w, h, .07, white ? 0xbebda7 : 0x776447);
        b(0, h / 2, .043, w - .1, h - .1, .025, white ? 0xc9c7b3 : 0x88734e);
        if (white)
            b(0, -.02, .1, w, .045, .2, 0x7e8777, .35);
        else
            for (let i = 0; i < 5; i++) {
                const note = b(-.5 + (i % 3) * .46, .28 + Math.floor(i / 3) * .55, .065, .33, .4, .008, [0xbeb394, 0xb3b197, 0xc7bda2][i % 3]);
                note.rotation.z = (i % 3 - 1) * .08;
                b(note.position.x, note.position.y + .15, .08, .025, .025, .015, 0x874b3f);
            }
        return g;
    }
    if (name === 'lamp') {
        cylinder(g, 0, .035, 0, .2, .07, 0x424d3e);
        cylinder(g, 0, .38, 0, .018, .68, 0x8a8060);
        const shade = new THREE.Mesh(new THREE.CylinderGeometry(.13, .28, .2, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x57634a, roughness: .7, side: THREE.DoubleSide }));
        shade.position.y = .76;
        shade.castShadow = true;
        g.add(shade);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(.045, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffe1a0, emissive: 0xffc777, emissiveIntensity: 2 }));
        bulb.position.y = .72;
        g.add(bulb);
        return g;
    }
    if (name === 'printed-copy') {
        for (let i = 0; i < 4; i++)
            b((i % 2) * .001, .115 + i * .0005, i * .0012, .31, .23, .0008, 0xe0d8bf);
        for (let i = 0; i < 9; i++)
            b(-.015, .20 - i * .019, .0047, .22 - i % 3 * .025, .0015, .0004, 0x777765);
        return g;
    }
    if (name === 'water-glass') {
        const profile = [[0, .005], [.055, .005], [.061, .012], [.073, .184], [.072, .19], [.068, .19], [.065, .018], [0, .018]].map(([x, y]) => new THREE.Vector2(x, y));
        const glass = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), new THREE.MeshPhysicalMaterial({ color: 0xc5d6d2, roughness: .17, metalness: 0, transparent: true, opacity: .32, depthWrite: false, side: THREE.DoubleSide }));
        g.add(glass);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(.070, .0025, 8, 48), new THREE.MeshStandardMaterial({ color: 0xc9d5cf, roughness: .18, transparent: true, opacity: .62, depthWrite: false }));
        rim.rotation.x = Math.PI / 2;
        rim.position.y = .188;
        g.add(rim);
        return g;
    }
    if (name === 'shredder') {
        b(0, .035, 0, .52, .07, .44, 0x30372f, .3);
        for (const x of [-.22, .22])
            for (const z of [-.17, .17])
                b(x, .014, z, .055, .028, .05, 0x252d26);
        b(0, .355, -.205, .51, .57, .035, 0x566054, .3);
        for (const x of [-.25, .25])
            b(x, .355, 0, .04, .57, .43, 0x737e6d, .3);
        const panel = roundedPanel(.49, .54, .042);
        panel.holes.push(new THREE.Path(roundedPanel(.30, .27, .022).getPoints().reverse()));
        const fascia = new THREE.Mesh(new THREE.ExtrudeGeometry(panel, { depth: .026, bevelEnabled: true, bevelThickness: .004, bevelSize: .004, bevelSegments: 2, curveSegments: 6 }), material(0x929b87, .18, .74));
        fascia.position.set(0, .355, .205);
        g.add(fascia);
        b(0, .342, .154, .32, .30, .014, 0x252f27);
        b(0, .565, .237, .17, .026, .012, 0x3f493d);
        b(0, .579, .247, .14, .012, .018, 0x65715e, .4);
        const window = new THREE.Mesh(new THREE.PlaneGeometry(.302, .272), new THREE.MeshStandardMaterial({ color: 0x87988c, transparent: true, opacity: .18, roughness: .35, depthWrite: false }));
        window.position.set(0, .355, .201);
        g.add(window);
        // Separate moulded halves leave a real opening down to the feed rollers.
        b(0, .700, .090, .60, .15, .334, 0x454f43, .25);
        b(0, .700, -.1815, .60, .15, .157, 0x454f43, .25);
        for (const x of [-.278, .278])
            b(x, .700, -.09, .044, .15, .04, 0x454f43, .25);
        for (const z of [-.102, -.078]) {
            const roller = cylinder(g, 0, .714, z, .009, .40, 0x202820);
            roller.rotation.z = Math.PI / 2;
        }
        for (const z of [-.107, -.073])
            b(0, .779, z, .43, .007, .006, 0x8e9984, .5);
        cylinder(g, .225, .781, .155, .025, .013, 0x303b30);
        cylinder(g, .225, .790, .155, .017, .006, 0x9aaf83);
        for (const x of [-.09, .09])
            b(x, .778, .018, .003, .002, .075, 0xaab29a);
        b(0, .778, .056, .18, .002, .003, 0xaab29a);
        const arrow = new THREE.BufferGeometry();
        arrow.setAttribute('position', new THREE.Float32BufferAttribute([-.018, .780, -.018, .018, .780, -.018, 0, .780, -.049], 3));
        arrow.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, .5, 1], 2));
        arrow.computeVertexNormals();
        g.add(new THREE.Mesh(arrow, material(0xaab29a)));
        for (const z of [-.15, -.08, -.01, .06])
            b(.301, .695, z, .002, .035, .028, 0x29332b);
        b(0, .145, -.225, .18, .055, .004, 0xa0a48e);
        return g;
    }
    if (name === 'water-dispenser') {
        b(0, .055, 0, .62, .11, .55, 0x454d42, .25);
        b(0, .50, -.16, .55, .88, .20, 0xa7ad9c, .15);
        for (const x of [-.255, .255])
            b(x, .55, .015, .045, .95, .49, 0x9da493, .2);
        b(0, .38, .18, .47, .54, .08, 0xb7bba9, .15);
        b(0, .95, -.04, .51, .12, .42, 0xb8bdac, .2);
        b(0, .72, .085, .46, .25, .045, 0x4b584c);
        b(0, .617, .23, .49, .045, .20, 0x687365, .4);
        for (let n = 0; n < 6; n++)
            b(-.18 + n * .072, .644, .24, .03, .008, .13, 0x8b9484, .4);
        for (const x of [-.115, .115]) {
            const plate = cylinder(g, x, .965, .193, .030, .016, 0x9ca693);
            plate.rotation.x = Math.PI / 2;
            const button = cylinder(g, x, .965, .204, .019, .009, x < 0 ? 0x6d979f : 0x9caa91);
            button.rotation.x = Math.PI / 2;
            const spout = cylinder(g, x, .925, .244, .014, .104, 0x919d8b);
            spout.rotation.x = Math.PI / 2;
            cylinder(g, x, .900, .295, .015, .050, 0x919d8b);
            cylinder(g, x, .8735, .295, .009, .002, 0x26392f);
        }
        b(0, 1.02, 0, .57, .06, .47, 0x6a7664, .3);
        cylinder(g, 0, 1.065, 0, .065, .08, 0x798a7f);
        const profile = [new THREE.Vector2(.057, 1.08), new THREE.Vector2(.058, 1.14), new THREE.Vector2(.17, 1.23), new THREE.Vector2(.185, 1.28), new THREE.Vector2(.185, 1.55), new THREE.Vector2(.15, 1.63), new THREE.Vector2(0, 1.65)];
        const bottle = new THREE.Mesh(new THREE.LatheGeometry(profile, 24), new THREE.MeshStandardMaterial({ color: 0x73999c, roughness: .3, metalness: .05, transparent: true, opacity: .72 }));
        g.add(bottle);
        cylinder(g, 0, 1.43, 0, .169, .24, 0x6b9295);
        for (const y of [1.28, 1.52]) {
            const band = new THREE.Mesh(new THREE.TorusGeometry(.183, .009, 5, 24), material(0x819fa0, .1, .4));
            band.rotation.x = Math.PI / 2;
            band.position.y = y;
            g.add(band);
        }
        return g;
    }
    if (name === 'pen-stand') {
        cylinder(g, 0, .01, 0, .075, .02, 0x555b4e);
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(.075, .07, .15, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x656c5b, roughness: .65, metalness: .4, side: THREE.DoubleSide }));
        cup.position.y = .085;
        g.add(cup);
        for (let i = 0; i < 5; i++) {
            const pen = cylinder(g, Math.sin(i * 2) * .04, .14, Math.cos(i * 2) * .04, .006, .23, [0x393d35, 0x746245, 0x4d5c63][i % 3]);
            pen.rotation.z = (i - 2) * .08;
        }
        return g;
    }
    b(0, .23, 0, .78, .46, .6, 0x8a7958);
    b(0, .47, 0, .81, .045, .63, 0x95825f);
    b(0, .3, .306, .27, .095, .008, 0xc0b598);
    b(0, .235, .31, .13, .025, .008, 0x514c3b);
    return g;
}
// Static props share merged geometry across game and inspector instances. Moving
// drawer trays stay separate so runtime animation never requires rebuilding a room.
const prototypes = new Map<string, THREE.Group>();
const machineShellMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .74, metalness: .22 });
const staticFileMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 1, side: THREE.DoubleSide });
function cachedModel(key: string, name: string, build: () => THREE.Group, coarse = false) {
    let prototype = prototypes.get(key);
    if (!prototype) {
        const source = build();
        source.updateMatrixWorld(true);
        const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
        source.traverse(o => {
            if (o instanceof THREE.Mesh) {
                const original = o.material as THREE.MeshStandardMaterial, shell = ['stool', 'shredder', 'fan-body', 'fan-rotor', 'door-frame', 'door-leaf'].includes(name) && !original.transparent && original.emissive.getHex() === 0, mat = coarse ? staticFileMaterial : shell ? machineShellMaterial : original;
                let geometry = o.geometry.clone().applyMatrix4(o.matrixWorld);
                if (shell && geometry.index) {
                    const indexed = geometry;
                    geometry = indexed.toNonIndexed();
                    indexed.dispose();
                }
                if (coarse || shell) {
                    const colors = new Float32Array(geometry.attributes.position.count * 3);
                    for (let i = 0; i < colors.length; i += 3) {
                        colors[i] = original.color.r;
                        colors[i + 1] = original.color.g;
                        colors[i + 2] = original.color.b;
                    }
                    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                }
                const list = batches.get(mat) ?? [];
                list.push(geometry);
                batches.set(mat, list);
            }
        });
        prototype = new THREE.Group();
        prototype.name = name;
        for (const [mat, geometries] of batches) {
            const merged = mergeGeometries(geometries);
            geometries.forEach(g => g.dispose());
            const mesh = new THREE.Mesh(merged, mat);
            mesh.castShadow = mesh.receiveShadow = true;
            prototype.add(mesh);
        }
        prototypes.set(key, prototype);
    }
    return prototype.clone(true);
}
export function makeModel(name: ModelName, open = false, side: 'front' | 'rear' | 'both' = 'both') {
    if (name === 'desk-fan')
        return makeDeskFan();
    if (name === 'archive-door')
        return makeArchiveDoor(open);
    return cachedModel(`${name}/${open}/${side}`, name, () => buildModel(name, open, side), name === 'box-files' && !open);
}
/** Whole active contents are batched by material and reused for each valid file count. */
export function makeContainerModel(kind: 'box' | 'drawer', count: number) {
    return cachedModel(`contents/${kind}/${count}`, kind === 'box' ? 'file-box' : 'drawer', () => kind === 'box' ? makeFileBox(count, true) : makeDrawer(count, false));
}
export function fileBoxParts() {
    return [
        { x: 0, y: .025, z: 0, w: .73, h: .05, d: .56, color: 0x877657 },
        { x: 0, y: .24, z: -.27, w: .73, h: .45, d: .035, color: 0x887658 },
        ...[-1, 1].map(side => ({ x: side * .35, y: .24, z: 0, w: .035, h: .45, d: .56, color: 0x958260 })),
        { x: 0, y: .1, z: .275, w: .73, h: .15, d: .035, color: 0x8c7959 },
        { x: 0, y: .12, z: .298, w: .26, h: .075, d: .008, color: 0xbfb393 }
    ];
}
export function makeFileBox(count = 8, detailed = true) {
    const g = new THREE.Group();
    g.name = 'file-box';
    for (const p of fileBoxParts())
        part(g, p.x, p.y, p.z, p.w, p.h, p.d, p.color);
    g.add(makeFileBoxContents(count, detailed));
    return g;
}
/** Guard, motor and blades remain separate so the inspected fan can actually spin. */
export function makeDeskFan() {
    const fan = new THREE.Group();
    fan.name = 'desk-fan';
    fan.add(cachedModel('fan-body', 'fan-body', () => {
        const g = new THREE.Group();
        part(g, 0, .022, 0, .27, .044, .23, 0x59685c, .35);
        part(g, 0, .137, -.025, .045, .23, .045, 0x59685c, .45);
        part(g, .075, .049, .065, .04, .012, .035, 0x363b34);
        const motor = cylinder(g, 0, .36, -.073, .057, .104, 0x58695f);
        motor.rotation.x = Math.PI / 2;
        for (const z of [-.044, .064]) {
            const rim = new THREE.Mesh(new THREE.TorusGeometry(.164, .006, 6, 48), material(0x8a9485, .65, .45));
            rim.position.set(0, .36, z);
            g.add(rim);
            for (let i = 0; i < 20; i++) {
                const a = i * Math.PI / 10, wire = cylinder(g, Math.cos(a) * .099, .36 + Math.sin(a) * .099, z, .0018, .128, 0x8a9485);
                wire.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.cos(a), Math.sin(a), 0));
            }
            const ring = new THREE.Mesh(new THREE.TorusGeometry(.092, .0018, 4, 40), material(0x8a9485, .65, .45));
            ring.position.set(0, .36, z);
            g.add(ring);
        }
        for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5])
            part(g, Math.cos(a) * .164, .36 + Math.sin(a) * .164, .01, .012, .012, .118, 0x59685c, .4);
        const cap = cylinder(g, 0, .36, .068, .035, .012, 0x59685c);
        cap.rotation.x = Math.PI / 2;
        return g;
    }));
    const rotor = cachedModel('fan-rotor', 'fan-rotor', () => {
        const g = new THREE.Group(), shape = new THREE.Shape();
        shape.moveTo(.025, -.018);
        shape.bezierCurveTo(.07, -.057, .148, -.047, .15, .018);
        shape.bezierCurveTo(.145, .065, .07, .075, .027, .025);
        shape.closePath();
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: .004, bevelEnabled: false, curveSegments: 12 });
        for (let i = 0; i < 3; i++) {
            const blade = new THREE.Mesh(geometry, material(0x9caa95, .25, .55));
            blade.rotation.z = i * Math.PI * 2 / 3;
            blade.position.z = .008;
            g.add(blade);
        }
        const hub = cylinder(g, 0, 0, .016, .03, .035, 0x63756a);
        hub.rotation.x = Math.PI / 2;
        return g;
    });
    rotor.name = 'fan-rotor';
    rotor.position.y = .36;
    fan.add(rotor);
    return fan;
}
export function animateDeskFan(fan: THREE.Object3D, on: boolean, dt: number) {
    const rotor = fan.getObjectByName('fan-rotor');
    if (!rotor)
        return;
    const speed = THREE.MathUtils.damp(Number(fan.userData.spin ?? 0), on ? 29 : 0, 3, Math.min(dt, .1));
    fan.userData.spin = speed;
    if (speed > 0)
        rotor.rotation.z = (rotor.rotation.z - speed * Math.min(dt, .1)) % (Math.PI * 2);
}
/** Industrial double doors. Hinge origins match the shared-wall collision aperture. */
export function makeArchiveDoor(open = false) {
    const root = new THREE.Group();
    root.name = 'archive-door';
    root.add(cachedModel('door-frame', 'door-frame', () => {
        const g = new THREE.Group();
        for (const x of [-1.63, 1.63])
            part(g, x, 1.5, 0, .12, 3, .34, 0x4a554e, .5);
        part(g, 0, 2.98, 0, 3.38, .12, .34, 0x4a554e, .5);
        part(g, 0, 3.85, 0, 3.4, 1.5, .22, 0x888773);
        const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xe4d8ad, emissive: 0xffe0a3, emissiveIntensity: .8, roughness: .6 });
        for (const side of [-1, 1]) {
            part(g, 0, 3.92, side * .17, .85, .16, .14, 0x4a554e, .45);
            const glow = new THREE.Mesh(CABINET_BOX, lampMaterial);
            glow.position.set(0, 3.9, side * .245);
            glow.scale.set(.72, .08, .015);
            glow.name = 'door-light';
            g.add(glow);
        }
        return g;
    }));
    for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.name = side === -1 ? 'door-left' : 'door-right';
        pivot.position.x = side * 1.56;
        pivot.rotation.y = open ? -side * Math.PI * .49 : 0;
        root.add(pivot);
        pivot.add(cachedModel(`door-leaf/${side}`, 'door-leaf', () => {
            const g = new THREE.Group(), cx = -side * .77;
            part(g, cx, 1.45, 0, 1.52, 2.86, .095, 0x69786c, .35);
            // A rebated meeting stile covers the clearance between the two moving leaves.
            // Both caps sit outside the door skins, so neither face exposes a through-slit.
            if (side === -1) {
                part(g, 1.54, 1.45, 0, .055, 2.86, .095, 0x4a554e, .5, CABINET_BOX);
                for (const face of [-1, 1])
                    part(g, 1.54, 1.45, face * .0575, .13, 2.86, .018, 0x4a554e, .5, CABINET_BOX);
            }
            for (const face of [-1, 1]) {
                part(g, cx, 1.81, face * .052, 1.24, 1.75, .018, 0x56665b, .35);
                part(g, cx, 1.81, face * .065, 1.13, 1.63, .014, 0x748175, .3);
                part(g, cx, .28, face * .059, 1.40, .40, .018, 0x8b9388, .65);
                for (const x of [-.55, .55])
                    for (const y of [.12, .44])
                        part(g, cx + x, y, face * .072, .014, .014, .006, 0x444e45, .6);
                for (const offset of [-.48, .48])
                    part(g, cx + offset, 1.18, face * .102, .035, .05, .10, 0x444e45, .7);
                part(g, cx, 1.18, face * .153, 1.03, .045, .045, 0xadb0a0, .7);
                part(g, -side * 1.39, 2.42, face * .064, .09, .18, .012, 0xc5b99b);
            }
            for (const y of [.28, 1.45, 2.65])
                part(g, 0, y, 0, .045, .14, .14, 0x4a554e, .7);
            return g;
        }));
    }
    return root;
}
/** Distant boxes retain eight jacket/tab silhouettes with 32 triangles per bundle. */
export function makeDistantBoxFiles() {
    return cachedModel('distant-box-files', 'distant-box-files', () => {
        const group = new THREE.Group();
        for (let i = 0; i < 8; i++) {
            const z = -.20 + i * .046, y = .052;
            part(group, 0, y + .15, z, .59, .29, 1, 0xb19a70, 0, paperPlane);
            part(group, -.19 + (i % 4) * .125, y + .306, z, .105, .028, 1, 0xbba780, 0, paperPlane);
        }
        return group;
    }, true);
}
