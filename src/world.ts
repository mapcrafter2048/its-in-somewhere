import {OfficeLifeWorld,makeStationeryHeld,makeCan,makeStickyHeld} from './desk/office-life-world';
import {officeDate} from './shift-clock';
import {STICKY_COLORS} from './desk/stationery';
import { nearestLights } from './runtime/world-updates';
import { makeDistantBoxFiles } from './prop-models';
import { RoomDetails, CLOCK_POSITION } from './room-details';
import { FootstepCadence, WALK_SPEED, RUN_SPEED } from './locomotion';
import { insertOriginal, printerOriginal } from './inventory';
import { ART_WIDTH, ART_HEIGHT, WALL_ART_TITLES, drawArchiveWallArt } from './wall-art';
import { STORAGE, UNITS_BY_WING, containerFor, parseContainer, isContainer, type StorageUnit } from './storage';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ROOM_ANGLES, ROOM_FRONT, ROOM_BACK, ROOM_DEPTH, ROOM_HEIGHT, STORAGE_RUNS, CONNECTIONS, DOOR_HALF_WIDTH, NOOK, NOOK_SPAWN, DESKTOP_Y, toWorld, toRoom, zoneAt, doorwayLocal, withinWarehouse } from './hub-layout';
import { cabinetParts, makeFolder, makeContainerModel, fileBoxParts, makeModel, material } from './prop-models';
import { physicalFor, containerFiles, containerLoad, containerOriginalCount, placeFile, placeItem, takeItem, consumeHeld, type PhysicalState, type Container, type Surface } from './physical';
import { makeMug, makeMeal, MUG_LIQUID_Y, MUG_LIQUID_RADIUS } from './models';
import { officeFor } from './office-state';
import * as THREE from 'three';
import { COLUMNS, ROWS, DRAWERS, DEPARTMENTS, MONTHS, FIRST_ROW_Z, ROW_PITCH, fileId, location, cabinetPosition, drawerY } from './archive';
import { OfficeInterior } from './interiors';
import { lookAngles, wrapYaw } from './look';
import type { Save, Settings, CabinetMarker, BoardStroke, OfficeState, PropId, PropTarget } from './types';
export type Target = {kind:'office-life';feature:'stationery'|'vending'|'recycling'} | {kind:'desk-feature'; feature:'computer'|'pinboard'|'collection'|'notices'} | {
    kind: 'drawer';
    cabinet: number;
    drawer: number;
} | {
    kind: 'desk';
} | {
    kind: 'door';
    side: number;
    destination: number;
    open: boolean;
} | {
    kind: 'whiteboard';
    board: number;
} | {
    kind: 'storage';
    container: Container;
} | {
    kind: 'item';
    id: string;
} | {
    kind: 'surface';
    surface: Surface;
} | PropTarget;
interface OfficeDoor {
    side: number;
    destination: number;
    pivot: THREE.Group;
    other: THREE.Group;
    hit: THREE.Mesh;
    open: boolean;
    progress: number;
}
const WALL_UNITS = UNITS_BY_WING.map(units => units.filter(unit => unit.kind === 'wall'));
const BOX = new THREE.BoxGeometry(1, 1, 1);
const LABEL_PLANE = new THREE.PlaneGeometry(1, 1);
const handlePieces = [new THREE.BoxGeometry(1, 1, 1), ...[-1, 1].map(side => new THREE.BoxGeometry(.035 / .43, .06 / .035, .1 / .035).translate(side * .2 / .43, 0, -.06 / .035))];
const HANDLE_GEOMETRY = mergeGeometries(handlePieces);
handlePieces.forEach(g => g.dispose());
const dark = material(0x2a3029, .3);
const brass = material(0x8e8264, .65);
const paper = material(0xd7caaa);
const wood = new THREE.MeshStandardMaterial({ color: 0x49352a, roughness: 0.85 });
const _object = new THREE.Object3D();
interface BankBatch {
    wing: number;
    units: number[];
    front: THREE.InstancedMesh;
    handles: THREE.InstancedMesh;
    farHandles: THREE.InstancedMesh;
    depth: number;
    labels: THREE.InstancedMesh;
    fp: Placement[];
    hp: Placement[];
    lp: Placement[];
}
function placed(unit: StorageUnit, p: Placement): Placement {
    const c = Math.cos(unit.yaw), s = Math.sin(unit.yaw);
    return { ...p, x: unit.x + p.x * c + p.z * s, z: unit.z - p.x * s + p.z * c, y: unit.y + p.y, ry: unit.yaw + (p.ry ?? 0) };
}
interface Placement {
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
    d: number;
    color?: number;
    ry?: number;
}
function instance(scene: THREE.Object3D, mat: THREE.Material, placements: Placement[], geometry: THREE.BufferGeometry = BOX) {
    const mesh = new THREE.InstancedMesh(geometry, mat, placements.length);
    placements.forEach((p, i) => {
        _object.position.set(p.x, p.y, p.z);
        _object.scale.set(p.w, p.h, p.d);
        _object.rotation.set(0, p.ry ?? 0, 0);
        _object.updateMatrix();
        mesh.setMatrixAt(i, _object.matrix);
        if (p.color)
            mesh.setColorAt(i, new THREE.Color(p.color));
    });
    mesh.computeBoundingSphere();
    scene.add(mesh);
    return mesh;
}
function box(parent: THREE.Object3D, mat: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, ry = 0) {
    const m = new THREE.Mesh(BOX, mat);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    m.rotation.y = ry;
    parent.add(m);
    return m;
}
function labelTexture(lines: string[], bg = '#c6c5ac', fg = '#24392e', width = 512, height = 160) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    lines.forEach((s, i) => {
        ctx.font = `${i === 0 ? 'bold ' : ''}${lines.length > 1 ? (i === 0 ? 46 : 25) : 50}px monospace`;
        ctx.fillText(s, width / 2, lines.length > 1 ? 61 + i * 53 : 96);
    });
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 2;
    return tex;
}
interface LightSite {
    position: THREE.Vector3;
    kind: 'tube' | 'pendant' | 'door';
    fixture?: THREE.MeshStandardMaterial;
    lastNear?: number;
    strength?: number;
    on?: boolean;
    glow?: THREE.InstancedBufferAttribute;
    glowIndex?: number;
}
export class OfficeWorld {
    readonly scene = new THREE.Scene();
    readonly camera = new THREE.PerspectiveCamera(68, 1, .08, 125);
    readonly renderer: THREE.WebGLRenderer;
    wing = 3;
    zone: 'hub' | 'archive' = 'archive';
    onWingUnload?: () => void;
    onWing?: (wing: number) => void;
    onTravel?: () => void;
    enabled = false;
    target: Target | null = null;
    onInteract?: (target: Target) => void;
    onUseHeld?: () => void;
    onPause?: () => void;
    onStep?: (running: boolean) => void;
    onLightSwitch?: () => void;
    onPosition?: () => void;
    onPointerError?: (reason: 'denied' | 'pending') => void;
    private visibleRooms = new Set<number>();
    private nearest: LightSite[] = [];
    private paperCamera = new THREE.Vector3(Infinity, Infinity, Infinity);
    private paperDirty = true;
    private heldDirty = true;
    private details: RoomDetails[] = [];
    private detailSecond = -1;
    private renderFrame = 0;
    private renderedFrames = 0;
    private backgroundTicks = 0;
    private portalKey = '';
    private lightFrame = 0;
    private archives: {
        root: THREE.Group;
    }[] = [];
    private bankBatches: BankBatch[] = [];
    private bankIndex = new Map<number, {
        batch: BankBatch;
        start: number;
    }>();
    private boxHits: THREE.InstancedMesh[] = [];
    private boxBodies: {
        mesh: THREE.InstancedMesh;
        units: number[];
        placements: Placement[];
    }[] = [];
    private boxPapers: {
        mesh: THREE.InstancedMesh;
        units: number[];
        placements: Placement[];
        far: THREE.InstancedMesh;
        wing: number;
    }[] = [];
    private markerGroup = new THREE.Group();
    private frame!: THREE.LineSegments;
    private deskHit!: THREE.Mesh;
    private officeState: OfficeState;
    private physical: PhysicalState;
    onOfficeChange?: () => void;
    onMachineComplete?: (message: string) => void;
    private seated: {
        standing: [
            number,
            number,
            number
        ];
        id: PropId;
    } | null = null;
    private interior!: OfficeInterior;
    private doors: OfficeDoor[] = [];
    private keys = new Set<string>();
    private ray = new THREE.Raycaster();
    private previousFrame = performance.now();
    captureState: 'idle' | 'pending' | 'locked' | 'fallback' | 'suspended' = 'idle';
    private dragging = false;
    private edgeTurn = 0;
    private lockAttempt = 0;
    private promiseCapture = false;
    private boardDrawings: BoardStroke[][] = [[], [], [], []];
    private dragDistance = 0;
    private pitch = 0;
    private yaw = 0;
    private settings: Settings;
    private footsteps = new FootstepCadence();
    private sensorFrame = performance.now();
    private sinceRay = 0;
    private alive = true;
    private activeDrawer: {
        cabinet: number;
        drawer: number;
        progress: number;
        folders: THREE.Group;
    } | null = null;
    private deskEnvelope!: THREE.Mesh;
    private envelopeDelivery = 0;
    private elapsed = 0;
    private fileTrayGroup = new THREE.Group();
    private heldScene = new THREE.Scene();
    private heldRoot = new THREE.Group();
    private roomLights: THREE.PointLight[] = [];
    private lightPositions: LightSite[][] = [];
    private portalFrustum = new THREE.Frustum();
    private portalMatrix = new THREE.Matrix4();
    private portalSphere = new THREE.Sphere(new THREE.Vector3(), 2.5);
    readonly officeLife:OfficeLifeWorld;
    private lifeSave:Save;
    private sipStart = -1;
    constructor(canvas: HTMLCanvasElement, save: Save) {
        this.lifeSave=save;
        this.officeState = officeFor(save);
        this.physical = physicalFor(save);
        this.settings = save.settings;
        this.boardDrawings = save.whiteboards ?? [[], [], [], []];
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = .95;
        this.buildOffice();
        this.officeLife=new OfficeLifeWorld();this.scene.add(this.officeLife.root);
        this.restore(save);
        this.resize();
        addEventListener('resize', () => this.resize());
        addEventListener('keydown', e => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName))
                return;
            this.keys.add(e.code);
            if (this.enabled && ['KeyQ', 'KeyR', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code))
                e.preventDefault();
        });
        addEventListener('keyup', e => this.keys.delete(e.code));
        addEventListener('blur', () => this.suspendCapture());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden)
                this.suspendCapture();
        });
        document.addEventListener('mousemove', e => {
            if (!this.enabled)
                return;
            if (!e.buttons) {
                this.dragging = false;
                this.edgeTurn = 0;
            }
            if (document.pointerLockElement === canvas) {
                this.look(e.movementX, e.movementY);
                return;
            }
            if (this.dragging && e.buttons === 1) {
                this.dragDistance += Math.hypot(e.movementX, e.movementY);
                this.look(e.movementX, e.movementY);
                const r = canvas.getBoundingClientRect();
                this.edgeTurn = e.clientX < r.left + 32 ? 1 : e.clientX > r.right - 32 ? -1 : 0;
            }
        });
        document.addEventListener('mouseup', () => {
            this.dragging = false;
            this.edgeTurn = 0;
        });
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === canvas) {
                if (!this.enabled) {
                    document.exitPointerLock();
                    return;
                }
                this.captureState = 'locked';
                this.dragging = false;
                this.edgeTurn = 0;
            }
            else if (this.captureState === 'locked') {
                this.captureState = 'idle';
                this.keys.clear();
                if (this.enabled)
                    this.onPause?.();
            }
        });
        document.addEventListener('pointerlockerror', () => {
            if (!this.promiseCapture && this.captureState === 'pending')
                this.captureFailed(this.lockAttempt);
        });
        canvas.addEventListener('mousedown', e => {
            if (e.button !== 0)
                return;
            this.dragDistance = 0;
            this.dragging = this.enabled && document.pointerLockElement !== canvas;
        });
        canvas.addEventListener('click', () => {
            if (this.dragDistance > 6) {
                this.dragDistance = 0;
                return;
            }
            if (this.enabled) {
                if (this.physical.held?.kind === 'item'||this.physical.held?.kind==='can')
                    this.onUseHeld?.();
                else if (this.target)
                    this.onInteract?.(this.target);
            }
        });
    }
    private buildOffice() {
        this.scene.background = new THREE.Color(0x171a15);
        this.scene.fog = new THREE.FogExp2(0x272a22, .003);
        this.scene.add(new THREE.HemisphereLight(0xd6d9c5, 0x665b46, .56));
        const cv = document.createElement('canvas');
        cv.width = cv.height = 256;
        const ctx = cv.getContext('2d')!;
        ctx.fillStyle = '#787666';
        ctx.fillRect(0, 0, 256, 256);
        // Seeded scuffs and mottling, shared by every repeated floor tile.
        let seed = 41;
        const random = () => {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        };
        for (let i = 0; i < 1800; i++) {
            ctx.fillStyle = `rgba(${random() > .5 ? '34,31,22' : '166,159,132'},${random() * .12})`;
            ctx.fillRect(random() * 256, random() * 256, random() * 18 + 1, random() * 3 + 1);
        }
        ctx.strokeStyle = '#5b5a4d';
        ctx.strokeRect(0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(cv);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(22, 27);
        tex.colorSpace = THREE.SRGBColorSpace;
        const wallCanvas = document.createElement('canvas');
        wallCanvas.width = 512;
        wallCanvas.height = 512;
        const wc = wallCanvas.getContext('2d')!;
        wc.fillStyle = '#918d77';
        wc.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 2200; i++) {
            wc.fillStyle = `rgba(39,34,23,${random() * .075})`;
            wc.fillRect(random() * 512, random() * 512, 1 + random() * 35, 1 + random() * 7);
        }
        const damp = wc.createLinearGradient(0, 330, 0, 512);
        damp.addColorStop(0, 'rgba(50,46,31,0)');
        damp.addColorStop(1, 'rgba(50,46,31,.4)');
        wc.fillStyle = damp;
        wc.fillRect(0, 330, 512, 182);
        wc.strokeStyle = 'rgba(53,48,34,.3)';
        wc.lineWidth = 1;
        wc.beginPath();
        wc.moveTo(179, 0);
        wc.lineTo(183, 58);
        wc.lineTo(168, 77);
        wc.lineTo(173, 106);
        wc.stroke();
        const wallTex = new THREE.CanvasTexture(wallCanvas);
        wallTex.colorSpace = THREE.SRGBColorSpace;
        wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
        wallTex.repeat.set(8, 1);
        const floor = new THREE.MeshStandardMaterial({ map: tex, roughness: .98 }), wall = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 1 }), ceiling = material(0x747566);
        for (let wing = 0; wing < 4; wing++) {
            const room = new THREE.Group(), origin = toWorld(wing, 0, 0);
            room.position.set(origin.x, 0, origin.z);
            room.name = `archive-room-${wing}`;
            this.scene.add(room);
            const f = box(room, floor, 0, -.1, (ROOM_FRONT + ROOM_BACK) / 2, 44, .2, ROOM_DEPTH);
            f.receiveShadow = true;
            box(room, ceiling, 0, ROOM_HEIGHT + .1, (ROOM_FRONT + ROOM_BACK) / 2, 44, .2, ROOM_DEPTH);
            this.buildArchive(wing, room);
        }
        const wallSegment = (axis: 'x' | 'z', fixed: number, start: number, end: number) => {
            if (end <= start)
                return;
            const m = axis === 'x' ? box(this.scene, wall, fixed, ROOM_HEIGHT / 2, (start + end) / 2, .22, ROOM_HEIGHT, end - start) : box(this.scene, wall, (start + end) / 2, ROOM_HEIGHT / 2, fixed, end - start, ROOM_HEIGHT, .22);
            m.receiveShadow = true;
        };
        wallSegment('x', -44, -ROOM_DEPTH, ROOM_DEPTH);
        wallSegment('x', 44, -ROOM_DEPTH, ROOM_DEPTH);
        wallSegment('z', -ROOM_DEPTH, -44, 44);
        wallSegment('z', ROOM_DEPTH, -44, 44);
        for (const axis of ['x', 'z'] as const) {
            let start = axis === 'x' ? -ROOM_DEPTH : -44;
            const end = axis === 'x' ? ROOM_DEPTH : 44;
            for (const at of CONNECTIONS.filter(d => d.axis === axis).map(d => axis === 'x' ? d.z : d.x).sort((a, b) => a - b)) {
                wallSegment(axis, 0, start, at - 1.65);
                start = at + 1.65;
            }
            wallSegment(axis, 0, start, end);
        }
        CONNECTIONS.forEach((_connection, i) => this.buildDoor(i));
        this.interior = new OfficeInterior(3, BOX, this.officeState, this.physical);
        this.scene.add(this.interior.root);
        this.buildDesk();
        this.interior.props.onChange = () => {
            this.syncPhysical();
            this.onOfficeChange?.();
        };
        this.interior.props.onComplete = message => this.onMachineComplete?.(message);
        this.boardDrawings.forEach((strokes, i) => this.interior.setDrawing(strokes, i));
        for (let i = 0; i < 6; i++) {
            const light = new THREE.PointLight(i % 2 ? 0xd5dbc1 : 0xe3ddbd, 46.2, 13, 2);
            this.scene.add(light);
            this.roomLights.push(light);
        }
        this.frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.76, .37, .12)), new THREE.LineBasicMaterial({ color: 0xbda566 }));
        this.frame.visible = false;
        this.scene.add(this.frame);
        this.scene.add(this.markerGroup);
        this.scene.add(this.fileTrayGroup);
        const nook = toWorld(NOOK.wing, NOOK.x, NOOK.z);
        this.fileTrayGroup.position.set(nook.x, 0, nook.z);
        this.heldRoot.visible = false;
        this.heldScene.add(this.heldRoot);
        this.heldScene.add(new THREE.HemisphereLight(0xd9d9c4, 0x534f3e, 1));
        const handLight = new THREE.DirectionalLight(0xe4ddc4, .7);
        handLight.position.set(-2, 4, 3);
        this.heldScene.add(handLight);
        this.renderer.info.autoReset = false;
    }
    private buildArchive(wing: number, root: THREE.Group) {
        const detail = new RoomDetails(BOX, LABEL_PLANE);
        root.add(detail.root);
        this.details.push(detail);
        this.archives.push({ root });
        const banks = UNITS_BY_WING[wing].filter(u => u.kind !== 'box');
        const atlas = document.createElement('canvas');
        atlas.width = 4096;
        atlas.height = 2048;
        const ac = atlas.getContext('2d')!;
        ac.fillStyle = '#bdb99d';
        ac.fillRect(0, 0, 4096, 2048);
        banks.forEach((u, i) => {
            const l = location(fileId(u.id)), x = (i % 16) * 256, y = Math.floor(i / 16) * 112;
            ac.fillStyle = '#30382b';
            ac.textAlign = 'center';
            ac.font = 'bold 24px monospace';
            ac.fillText(u.label, x + 128, y + 42);
            if(u.kind==='rear'){ac.font='bold 16px monospace';ac.fillText('↶ REAR / INDEPENDENT',x+128,y+61);}
            ac.font = '18px monospace';
            ac.fillText(`${MONTHS[l.column % 12].slice(0, 3).toUpperCase()} 2023`, x + 128, y + 80);
        });
        const atlasTex = new THREE.CanvasTexture(atlas);
        atlasTex.colorSpace = THREE.SRGBColorSpace;
        atlasTex.anisotropy = 2;
        // Each row is independently batched/cullable; wall banks are grouped in threes.
        const groups = new Map<string, StorageUnit[]>();
        for (const u of banks) {
            const key = u.kind === 'wall' ? `wall-${Math.floor(u.index / 6)}` : `row-${Math.floor(u.index / 16)}`;
            const list = groups.get(key) ?? [];
            list.push(u);
            groups.set(key, list);
        }
        for (const units of groups.values()) {
            const group = new THREE.Group();
            root.add(group);
            const bodies: Placement[] = [], fp: Placement[] = [], hp: Placement[] = [], lp: Placement[] = [], shadows: Placement[] = [], vertices: number[] = [], uv: number[] = [];
            for (const u of units) {
                for (const p of cabinetParts())
                    bodies.push(placed(u, { ...p, color: p.color + (u.index % 3) * 0x020201 }));
                shadows.push(placed(u, { x: 0, y: .009, z: 0, w: 1.96, h: .008, d: 1.2 }));
                const start = fp.length;
                for (let d = 0; d < DRAWERS; d++) {
                    const y = drawerY(d);
                    fp.push(placed(u, { x: 0, y, z: .56, w: 1.7, h: .34, d: .08, color: 0x606854 }));
                    hp.push(placed(u, { x: 0, y: y - .055, z: .71, w: .43, h: .035, d: .035 }));
                    lp.push(placed(u, { x: 0, y: y + .075, z: .607, w: .52, h: .085, d: .009 }));
                }
                const index = banks.indexOf(u), tx = (index % 16) * 256, ty = Math.floor(index / 16) * 112;
                for (const [x, y] of [[-.625, -.14], [.625, -.14], [.625, .14], [-.625, -.14], [.625, .14], [-.625, .14]]) {
                    const q = placed(u, { x, y: y + 3.43, z: .612, w: 1, h: 1, d: 1 });
                    vertices.push(q.x, q.y, q.z);
                    uv.push((tx + (x / .625 + 1) * 128) / 4096, 1 - (ty + (1 - y / .14) * 56) / 2048);
                }
                this.bankIndex.set(u.id, { batch: null as unknown as BankBatch, start });
            }
            const body = instance(group, material(0xffffff, .4), bodies);
            body.name = 'cabinet-construction';
            instance(group, new THREE.MeshBasicMaterial({ color: 0x24291f, transparent: true, opacity: .35, depthWrite: false }), shadows);
            const front = instance(group, material(0xffffff, .4), fp), handles = instance(group, brass, hp, HANDLE_GEOMETRY), labels = instance(group, paper, lp, LABEL_PLANE);
            // At a distance the small side posts occupy less than a pixel. Keep the
            // full handle close up and use a single bar for distant cabinet rows.
            const farHandles = instance(group, brass, hp, BOX);
            farHandles.visible = false;
            for (const mesh of [front, handles, farHandles, labels]) {
                mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                mesh.boundingSphere!.radius += .85;
            }
            const batch: BankBatch = { wing, units: units.map(u => u.id), front, handles, farHandles, depth: handles.boundingSphere!.center.z + toWorld(wing, 0, 0).z, labels, fp, hp, lp };
            front.userData.bankBatch = this.bankBatches.length;
            this.bankBatches.push(batch);
            units.forEach(u => this.bankIndex.get(u.id)!.batch = batch);
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
            geo.computeVertexNormals();
            root.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: atlasTex, roughness: .95 })));
        }
        const boxGroups = new Map<number, StorageUnit[]>();
        for (const u of UNITS_BY_WING[wing].filter(u => u.kind === 'box')) {
            const row = Math.floor(u.index / 48), list = boxGroups.get(row) ?? [];
            list.push(u);
            boxGroups.set(row, list);
        }
        for (const boxes of boxGroups.values()) {
            const boxParts: Placement[] = [], bundles: Placement[] = [], hits: Placement[] = [];
            for (const u of boxes) {
                for (const p of fileBoxParts())
                    boxParts.push(placed(u, p));
                bundles.push(placed(u, { x: 0, y: 0, z: 0, w: 1, h: 1, d: 1 }));
                hits.push(placed(u, { x: 0, y: .24, z: .28, w: .73, h: .46, d: .1 }));
            }
            const boxBody = instance(root, material(0xffffff), boxParts);
            this.boxBodies.push({ mesh: boxBody, units: boxes.map(u => u.id), placements: boxParts });
            for (const child of makeModel('box-files').children) {
                const source = child as THREE.Mesh;
                const bundle = instance(root, source.material as THREE.Material, bundles, source.geometry);
                bundle.name = 'stocked-box-files';
                const distant = makeDistantBoxFiles().children[0] as THREE.Mesh;
                const far = instance(root, distant.material as THREE.Material, bundles, distant.geometry);
                far.count = 0;
                far.name = 'distant-box-files';
                this.boxPapers.push({ mesh: bundle, far, wing, units: boxes.map(u => u.id), placements: bundles });
            }
            const hit = instance(root, new THREE.MeshBasicMaterial({ visible: false }), hits);
            hit.userData.boxUnits = boxes.map(u => u.id);
            hit.userData.wing = wing;
            this.boxHits.push(hit);
        }
        const shelves: Placement[] = [];
        for (const p of STORAGE_RUNS) {
            for (const dx of [-p.w / 2, p.w / 2])
                for (const dz of [-.28, .28])
                    shelves.push({ x: p.x + dx, y: .8, z: p.z + dz, w: .04, h: 1.6, d: .04, color: 0x555947 });
            for (let shelf = 0; shelf < 3; shelf++)
                shelves.push({ x: p.x, y: .12 + shelf * .68, z: p.z, w: p.w, h: .035, d: p.d, color: 0x676b55 });
        }
        instance(root, material(0xffffff, .35), shelves);
        const signHangers: Placement[] = [], lights: LightSite[] = [];
        const fixturePlacements = new Map<'tube-light' | 'pendant-light', Placement[]>([['tube-light', []], ['pendant-light', []]]);
        for (let row = 0; row < ROWS; row++) {
            const z = FIRST_ROW_Z + 2 - row * ROW_PITCH;
            for (const x of [-13, -5, 5, 13]) {
                const kind = (row + (x < 0 ? 1 : 0)) % 2 === 0 ? 'pendant-light' : 'tube-light';
                fixturePlacements.get(kind)!.push({ x, y: ROOM_HEIGHT, z, w: 1, h: 1, d: 1 });
                lights.push({ position: toWorld(wing, x, z).setY(kind === 'pendant-light' ? 3.83 : 4.35), kind: kind === 'pendant-light' ? 'pendant' : 'tube' });
            }
            const map = labelTexture([`${String.fromCharCode(65 + row)} / ${DEPARTMENTS[row].toUpperCase()}`, 'RETAINED RECORDS · 2023'], '#bfc5a7', '#263b2f', 1024, 200);
            for (const face of [-1, 1]) {
                const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, .82), new THREE.MeshStandardMaterial({ map }));
                sign.name = 'readable-aisle-sign';
                sign.position.set(0, 3.97, z - 2 + face * .015);
                sign.rotation.y = face === 1 ? 0 : Math.PI;
                root.add(sign);
            }
            for (const x of [-1.2, 1.2])
                signHangers.push({ x, y: 4.43, z: z - 2, w: .025, h: .34, d: .025 });
        }
        for (const u of banks.filter(u => u.kind === 'wall' && u.index % 3 === 0)) {
            const x = u.x > 0 ? 20.2 : -20.2;
            fixturePlacements.get('tube-light')!.push({ x, y: ROOM_HEIGHT, z: u.z, w: 1, h: 1, d: 1, ry: Math.PI / 2 });
            lights.push({ position: toWorld(wing, x, u.z).setY(4.35), kind: 'tube' });
        }
        for (const [kind, placements] of fixturePlacements) {
            const sites = lights.filter(l => l.kind === (kind === 'pendant-light' ? 'pendant' : 'tube'));
            for (const child of makeModel(kind).children) {
                const source = child as THREE.Mesh, original = source.material as THREE.MeshStandardMaterial;
                let geometry = source.geometry, mat = original;
                if (original.emissiveIntensity > 0 && original.emissive.getHex() !== 0) {
                    geometry = geometry.clone();
                    const glow = new THREE.InstancedBufferAttribute(new Float32Array(placements.length), 1);
                    geometry.setAttribute('fixtureGlow', glow);
                    sites.forEach((site, i) => {
                        site.glow = glow;
                        site.glowIndex = i;
                    });
                    mat = original.clone();
                    mat.onBeforeCompile = shader => {
                        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float fixtureGlow; varying float vFixtureGlow;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFixtureGlow = fixtureGlow;');
                        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFixtureGlow;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vFixtureGlow;');
                    };
                    mat.customProgramCacheKey = () => 'proximity-fixture-v1';
                }
                const mesh = instance(root, mat, placements, geometry);
                mesh.name = kind;
            }
        }
        instance(root, dark, signHangers);
        this.lightPositions[wing] = lights;
        this.buildWallArt(root, wing);
    }
    private buildWallArt(root: THREE.Group, wing: number) {
        const canvas = document.createElement('canvas');
        canvas.width = ART_WIDTH * 4;
        canvas.height = ART_HEIGHT * 2;
        const c = canvas.getContext('2d')!, positions: number[] = [], uvs: number[] = [], frames: Placement[] = [];
        drawArchiveWallArt(c, wing);
        for (let i = 0; i < 8; i++) {
            const tx = i % 4 * ART_WIDTH, ty = Math.floor(i / 4) * ART_HEIGHT, front = i < 4, x = [-15, -5, 5, 15][i % 4], z = front ? ROOM_FRONT - .13 : ROOM_BACK + .13, h = !front && wing === 3 ? .7 : 1.3, y = !front && wing === 3 ? 4.04 : 2.8, yaw = front ? Math.PI : 0, w = h * ART_WIDTH / ART_HEIGHT;
            frames.push({ x, y, z: z + (front ? .035 : -.035), w: w + .12, h: h + .12, d: .055, color: 0x61543f });
            for (const [a, b] of [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, -.5], [.5, .5], [-.5, .5]]) {
                positions.push(x + a * w * Math.cos(yaw), y + b * h, z);
                uvs.push((tx + (a + .5) * ART_WIDTH) / canvas.width, 1 - (ty + (1 - (b + .5)) * ART_HEIGHT) / canvas.height);
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.computeVertexNormals();
        const art = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }));
        art.name = 'worn-wall-compositions';
        art.userData.titles = WALL_ART_TITLES;
        root.add(art);
        instance(root, material(0xffffff), frames);
    }
    private buildDesk() {
        const root = this.interior.root;
        this.deskEnvelope = box(root, new THREE.MeshStandardMaterial({ map: labelTexture(['INTERNAL MAIL', 'M. VOSS'], '#c3b99b', '#494b3d', 512, 256), roughness: .95 }), .7, DESKTOP_Y + .006, .4, .4, .012, .25, -.06);
        this.deskHit = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1, .95), new THREE.MeshBasicMaterial({ visible: false }));
        this.deskHit.position.set(.25, .65, .1);
        root.add(this.deskHit);
        const trayHit = new THREE.Mesh(new THREE.BoxGeometry(1.1, .12, .7), new THREE.MeshBasicMaterial({ visible: false }));
        trayHit.position.set(-.48, 1.03, .05);
        trayHit.userData.container = 'desk-tray';
        root.add(trayHit);
        this.interior.hits.push(trayHit);
    }
    private buildDoor(index: number) {
        const connection = CONNECTIONS[index], root = new THREE.Group();
        root.position.set(connection.x, 0, connection.z);
        root.rotation.y = connection.axis === 'x' ? Math.PI / 2 : 0;
        this.scene.add(root);
        const door = makeModel('archive-door');
        root.add(door);
        const leaves = [door.getObjectByName('door-left') as THREE.Group, door.getObjectByName('door-right') as THREE.Group];
        root.updateMatrixWorld(true);
        // A separate lamp on each side shares the archive's capped live-light pool.
        const source = door.getObjectByName('door-frame')!;
        const glowMeshes: THREE.Mesh[] = [];
        source.traverse(o => {
            if (o instanceof THREE.Mesh && (o.material as THREE.MeshStandardMaterial).emissiveIntensity > 0 && (o.material as THREE.MeshStandardMaterial).emissive.getHex() !== 0)
                glowMeshes.push(o);
        });
        for (const glow of glowMeshes) {
            const base = glow.material as THREE.MeshStandardMaterial;
            for (const face of [-1, 1]) {
                const mesh = glow.clone();
                mesh.geometry = BOX;
                mesh.scale.set(.72, .08, .015);
                mesh.position.set(0, 3.9, face * .245);
                const fixture = base.clone();
                fixture.emissiveIntensity = 0;
                mesh.material = fixture;
                root.add(mesh);
                const point = root.localToWorld(new THREE.Vector3(0, 3.85, face * .65)), center = (wing: number) => toWorld(wing, 0, (ROOM_FRONT + ROOM_BACK) / 2);
                const wing = point.distanceToSquared(center(connection.a)) < point.distanceToSquared(center(connection.b)) ? connection.a : connection.b;
                this.lightPositions[wing].push({ position: root.localToWorld(new THREE.Vector3(0, 3.85, face * .65)), kind: 'door', fixture });
            }
            glow.visible = false;
        }
        for (const facing of [-1, 1]) {
            const plaque = new THREE.Mesh(new THREE.PlaneGeometry(3.2, .4), new THREE.MeshStandardMaterial({ map: labelTexture([`W${connection.a + 1} ↔ W${connection.b + 1} / CONNECTED ARCHIVES`], '#bdb99c', '#343b2d', 1024, 128) }));
            plaque.position.set(0, 3.35, facing * .14);
            plaque.rotation.y = facing === 1 ? 0 : Math.PI;
            root.add(plaque);
        }
        const hit = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.9, .4), new THREE.MeshBasicMaterial({ visible: false }));
        hit.position.y = 1.45;
        hit.userData.door = index;
        root.add(hit);
        this.doors.push({ side: index, destination: connection.b, pivot: leaves[0], other: leaves[1], hit, open: false, progress: 0 });
    }
    toggleDoor(side: number) {
        const d = this.doors[side];
        if (!d)
            return false;
        const l = doorwayLocal(CONNECTIONS[side], this.camera.position.x, this.camera.position.z);
        if (d.open && Math.abs(l.along) < 1.9 && Math.abs(l.across) < 1.8)
            return false;
        d.open = !d.open;
        return true;
    }
    private updateDoors(dt: number) {
        for (const d of this.doors) {
            d.progress = THREE.MathUtils.damp(d.progress, d.open ? 1 : 0, this.settings.reducedMotion ? 1000 : 8, dt);
            d.pivot.rotation.y = d.progress * Math.PI * .49;
            d.other.rotation.y = -d.progress * Math.PI * .49;
        }
    }
    get isSeated() {
        return !!this.seated;
    }
    propAction(id: PropId) {
        return this.interior.props.action(id);
    }
    startShred() {
        return this.interior.props.startShred();
    }
    startPrint(id: number) {
        return this.interior.props.startPrint(id);
    }
    sit(id: PropId) {
        if (this.seated)
            return false;
        const seat = this.interior.props.seats.get(id);
        if (!seat)
            return false;
        this.seated = { standing: [this.camera.position.x, 1.7, this.camera.position.z], id };
        this.camera.position.set(seat.x, 1.25, seat.z);
        this.yaw = seat.yaw;
        this.pitch = 0;
        this.rotate();
        this.keys.clear();
        return true;
    }
    stand() {
        if (!this.seated)
            return true;
        const safe = [this.seated.standing, ...[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map(a => [this.camera.position.x + Math.cos(a) * 1.3, 1.7, this.camera.position.z + Math.sin(a) * 1.3] as [
                number,
                number,
                number
            ])].find(p => !this.blocked(p[0], p[2]));
        if (!safe)
            return false;
        this.camera.position.set(...safe);
        this.seated = null;
        this.keys.clear();
        return true;
    }
    brewCoffee() {
        return !!this.propAction('coffee').sound;
    }
    setWhiteboards(drawings: BoardStroke[][]) {
        this.boardDrawings = drawings;
        drawings.forEach((strokes, i) => this.interior.setDrawing(strokes, i));
    }
    syncDesk(save:Save) { this.lifeSave=save;this.interior.personal.sync(save);this.officeLife?.sync(save); }
    updateMailIndicator(save:Save) { this.interior.personal.updateMail(save); }
    changeWing(wing: number) {
        if (wing < 0 || wing > 3)
            return;
        this.camera.position.copy(toWorld(wing, 0, 3.5));
        this.yaw = ROOM_ANGLES[wing];
        this.rotate();
        this.zone = 'archive';
        this.wing = wing;
        this.target = null;
    }
    goHub() {
        this.camera.position.copy(toWorld(NOOK.wing, NOOK_SPAWN[0], NOOK_SPAWN[2]));
        this.wing = NOOK.wing;
        this.yaw = 0;
        this.pitch = 0;
        this.rotate();
        this.zone = 'archive';
        this.seated = null;
    }
    setMarkers(markers: CabinetMarker[]) {
        this.markerGroup.traverse(o => {
            if (o instanceof THREE.Mesh)
                (o.material as THREE.Material).dispose();
        });
        this.markerGroup.clear();
        const colors = { gold: 0xd6b866, blue: 0x83b9cb, rose: 0xd5949e, green: 0xa9c77f };
        for (const m of markers) {
            const u = STORAGE[m.cabinet];
            if (!u)
                continue;
            const local = placed(u, { x: .32, y: u.kind === 'box' ? .35 : 3.5, z: u.kind === 'box' ? .3 : .619, w: .16, h: .18, d: .02 }), w = toWorld(u.wing, local.x, local.z);
            const tab = box(this.markerGroup, new THREE.MeshBasicMaterial({ color: colors[m.color] }), w.x, local.y, w.z, local.w, local.h, local.d, u.yaw);
            tab.userData.label = m.label;
        }
    }
    restore(save: Save) {
        this.lifeSave=save;this.detailSecond=-1;
        this.portalKey = '';
        this.lightFrame = 0;
        this.paperDirty = true;
        this.details.forEach((detail, wing) => detail.place(save.seed, wing));
        this.target = null;
        this.sinceRay = .11;
        this.officeState = officeFor(save);
        this.physical = physicalFor(save);
        this.seated = null;
        this.zone = 'archive';
        this.wing = save.wing;
        this.closeDrawer();
        this.interior.props.restore(this.officeState, this.physical);
        this.setWhiteboards(save.whiteboards ?? [[], [], [], []]);
        this.setMarkers(save.markers);
        this.syncDesk(save);
        this.camera.position.copy(toWorld(save.wing, save.position[0], save.position[2]));
        this.pitch = save.rotation[0];
        this.yaw = save.rotation[1];
        this.rotate();
        if (this.blocked(this.camera.position.x, this.camera.position.z)) {
            if (this.wing === NOOK.wing)
                this.goHub();
            else
                this.camera.position.copy(toWorld(save.wing, 0, 2));
        }
        this.syncPhysical();
    }
    snapshot(save: Save) {
        save.environmentVersion = 2;
        save.zone = 'archive';
        save.wing = this.wing;
        save.office = this.officeState;
        save.physical = this.physical;
        const p = this.seated ? new THREE.Vector3(...this.seated.standing) : this.camera.position, l = toRoom(this.wing, p.x, p.z);
        save.position = [l.x, 1.7, l.z];
        save.rotation = [this.pitch, wrapYaw(this.yaw)];
    }
    setBoardPage(page: number) {
        this.interior.setBoardPage(page);
    }
    look(dx: number, dy: number) {
        const angles = lookAngles(this.yaw, this.pitch, dx, dy, this.settings.sensitivity);
        this.yaw = angles.yaw;
        this.pitch = angles.pitch;
        this.rotate();
    }
    private rotate() {
        this.yaw = wrapYaw(this.yaw);
        this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    }
    setSettings(s: Settings) {
        this.portalKey = '';
        this.lightFrame = 0;
        this.paperDirty = true;
        this.settings = s;
        this.renderer.shadowMap.enabled = s.quality !== 'low';
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = false;
        this.renderer.shadowMap.needsUpdate = true;
        this.interior.setQuality(s.quality);
        this.resize();
    }
    resize() {
        this.camera.aspect = innerWidth / innerHeight;
        this.camera.updateProjectionMatrix();
        const q = this.settings.quality;
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, q === 'low' ? 0.85 : q === 'medium' ? 1.25 : 1.75));
        this.renderer.setSize(innerWidth, innerHeight);
    }
    private suspendCapture() {
        const wasEnabled = this.enabled;
        this.unlock();
        if (wasEnabled)
            this.onPause?.();
        this.captureState = 'suspended';
    }
    private captureFailed(attempt: number) {
        if (attempt !== this.lockAttempt || !this.enabled || document.hidden || !document.hasFocus() || this.captureState === 'locked')
            return;
        this.captureState = 'fallback';
        this.onPointerError?.('denied');
    }
    lock() {
        this.enabled = true;
        this.keys.clear();
        this.dragging = false;
        this.edgeTurn = 0;
        if (document.pointerLockElement === this.renderer.domElement) {
            this.captureState = 'locked';
            return;
        }
        const attempt = ++this.lockAttempt;
        if (document.hidden || !document.hasFocus()) {
            this.suspendCapture();
            return;
        }
        this.captureState = 'pending';
        try {
            const result = this.renderer.domElement.requestPointerLock();
            this.promiseCapture = !!result;
            if (result)
                result.then(() => {
                    if (attempt !== this.lockAttempt || !this.enabled) {
                        if (document.pointerLockElement === this.renderer.domElement && !this.enabled)
                            document.exitPointerLock();
                        return;
                    }
                    if (document.pointerLockElement === this.renderer.domElement)
                        this.captureState = 'locked';
                }).catch(() => this.captureFailed(attempt));
            setTimeout(() => {
                if (attempt === this.lockAttempt && this.enabled && this.captureState === 'pending' && !document.hidden && document.hasFocus()) {
                    this.onPointerError?.('pending');
                }
            }, 4000);
        }
        catch {
            this.captureFailed(attempt);
        }
    }
    unlock() {
        this.enabled = false;
        this.heldRoot.visible = false;
        this.lockAttempt++;
        this.captureState = 'idle';
        this.keys.clear();
        this.dragging = false;
        this.edgeTurn = 0;
        if (document.pointerLockElement === this.renderer.domElement)
            document.exitPointerLock();
    }
    atWorkNook() {
        if(this.wing!==NOOK.wing)return false;
        const x=this.camera.position.x-this.interior.root.position.x,z=this.camera.position.z-this.interior.root.position.z;
        return x>=-4&&x<=8&&z>=-1.4&&z<=3.5;
    }
    atDesk() {
        return this.wing === NOOK.wing && Math.hypot(this.camera.position.x - this.interior.root.position.x, this.camera.position.z - this.interior.root.position.z) < 3.5;
    }
    private blocked(x: number, z: number) {
        if (!withinWarehouse(x, z))
            return true;
        for (const axis of ['x', 'z'] as const) {
            const across = axis === 'x' ? x : z;
            if (Math.abs(across) < .4) {
                const doorIndex = CONNECTIONS.findIndex(d => d.axis === axis && Math.abs(doorwayLocal(d, x, z).along) < DOOR_HALF_WIDTH - .25);
                if (doorIndex < 0 || this.doors[doorIndex].progress < .9)
                    return true;
            }
        }
        if (this.interior?.blocked(x, z))
            return true;
        const where = zoneAt(x, z), l = toRoom(where.wing, x, z);
        if(this.officeLife?.blocked(where.wing,l.x,l.z))return true;
        if (this.details[where.wing]?.blocked(l.x, l.z))
            return true;
        const row = Math.round((FIRST_ROW_Z - l.z) / ROW_PITCH);
        if (row >= 0 && row < ROWS && Math.abs(l.z - (FIRST_ROW_Z - row * ROW_PITCH)) < 1.52)
            for (let col = 0; col < COLUMNS; col++)
                if (Math.abs(l.x - cabinetPosition(row * COLUMNS + col).x) < 1.19)
                    return true;
        if (STORAGE_RUNS.some(p => Math.abs(l.x - p.x) < p.w / 2 + .25 && Math.abs(l.z - p.z) < p.d / 2 + .25))
            return true;
        for (const u of WALL_UNITS[where.wing])
            if (Math.abs(l.x - u.x) < .98 && Math.abs(l.z - u.z) < 1.19)
                return true;
        if (this.activeDrawer) {
            const u = STORAGE[this.activeDrawer.cabinet];
            if (u.wing === where.wing && u.kind !== 'box') {
                const dx = l.x - u.x, dz = l.z - u.z, c = Math.cos(u.yaw), s = Math.sin(u.yaw), x = dx * c - dz * s, z = dx * s + dz * c;
                if (Math.abs(x) < 1.1 && z > .5 && z < 1.75)
                    return true;
            }
        }
        return false;
    }
    isBlocked(x: number, z: number) {
        return this.blocked(x, z);
    }
    private move(dt: number) {
        const edge = this.dragging ? this.edgeTurn : 0;
        if (edge)
            this.dragDistance = 7;
        const turn = Number(this.keys.has('KeyQ')) - Number(this.keys.has('KeyR')) + edge;
        if (turn) {
            this.yaw += turn * 1.65 * dt;
            this.rotate();
        }
        if (this.seated)
            return;
        let f = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')), r = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
        if (!f && !r) {
            this.footsteps.reset();
            return;
        }
        const norm = Math.hypot(f, r);
        f /= norm;
        r /= norm;
        const speed = (this.keys.has('ShiftLeft') ? RUN_SPEED : WALK_SPEED) * dt, dx = (-Math.sin(this.yaw) * f + Math.cos(this.yaw) * r) * speed, dz = (-Math.cos(this.yaw) * f - Math.sin(this.yaw) * r) * speed, p = this.camera.position, beforeX = p.x, beforeZ = p.z;
        if (!this.blocked(p.x + dx, p.z))
            p.x += dx;
        if (!this.blocked(p.x, p.z + dz))
            p.z += dz;
        const next = zoneAt(p.x, p.z);
        if (next.zone !== this.zone || (next.zone === 'archive' && next.wing !== this.wing)) {
            this.zone = next.zone;
            if (next.zone === 'archive')
                this.wing = next.wing;
            this.closeDrawer();
            this.target = null;
            this.onTravel?.();
        }
        const running = this.keys.has('ShiftLeft');
        if (this.footsteps.advance(Math.hypot(p.x - beforeX, p.z - beforeZ), running, performance.now() / 1000))
            this.onStep?.(running);
    }
    private updateTarget() {
        this.scene.updateMatrixWorld(true);
        this.camera.updateMatrixWorld();
        this.ray.setFromCamera(new THREE.Vector2(), this.camera);
        this.ray.far = 3.2;
        const locate = toRoom(this.wing, this.camera.position.x, this.camera.position.z);
        const nookHits = this.wing === NOOK.wing ? [this.deskHit, ...this.interior.hits, ...this.interior.props.itemHits, ...this.interior.props.surfaceHits] : [];
        const nearby = this.bankBatches.filter(b => b.wing === this.wing && b.units.some(id => {
            const u = STORAGE[id];
            return Math.hypot(locate.x - u.x, locate.z - u.z) < 5;
        }));
        const hits = this.ray.intersectObjects([...nearby.map(b => b.front), ...this.boxHits.filter(h => h.userData.wing === this.wing && h.userData.boxUnits.some((id: number) => {
                const u = STORAGE[id];
                return Math.hypot(locate.x - u.x, locate.z - u.z) < 5;
            })), ...this.doors.filter(d => {
                const c = CONNECTIONS[d.side];
                return c.a === this.wing || c.b === this.wing;
            }).map(d => d.hit), ...nookHits,...this.officeLife.hits.filter(h=>h.userData.wing===this.wing)]).filter(h => {
            if (!this.interior.props.hitAvailable(h.object))
                return false;
            const data = h.object.userData;
            let unit: number | undefined;
            if (h.instanceId !== undefined && data.bankBatch !== undefined)
                unit = this.bankBatches[data.bankBatch].units[Math.floor(h.instanceId / 8)];
            if (h.instanceId !== undefined && data.boxUnits)
                unit = data.boxUnits[h.instanceId];
            if (unit !== undefined) {
                const u = STORAGE[unit], facing = (locate.x - u.x) * Math.sin(u.yaw) + (locate.z - u.z) * Math.cos(u.yaw);
                return facing > (u.kind === 'box' ? .29 : .6);
            }
            return true;
        });
        this.target = null;
        this.frame.visible = false;
        if (!hits.length)
            return;
        const first = hits.find(h => !h.object.userData.surface) ?? hits[0], nearbyItem = hits.find(h => h.object.userData.itemId && h.distance <= first.distance + .2);
        const hit = nearbyItem ?? first, data = hit.object.userData;
        if(data.lifeFeature)this.target={kind:'office-life',feature:data.lifeFeature};
        else if (data.door !== undefined)
            this.target = { kind: 'door', side: data.door, destination: CONNECTIONS[data.door].a === this.wing ? CONNECTIONS[data.door].b : CONNECTIONS[data.door].a, open: this.doors[data.door].open };
        else if (data.itemId)
            this.target = { kind: 'item', id: data.itemId };
        else if (data.surface)
            this.target = { kind: 'surface', surface: data.surface };
        else if (data.container)
            this.target = { kind: 'storage', container: data.container };
        else if (data.propId) {
            const ready = data.propId === 'water' ? this.interior.props.waterPickup() : null;
            this.target = ready ? { kind: 'item', id: ready } : this.interior.props.target(data.propId);
        }
        else if (data.deskFeature)
            this.target = {kind:'desk-feature',feature:data.deskFeature};
        else if (data.prop === 'whiteboard')
            this.target = { kind: 'whiteboard', board: data.board ?? 0 };
        else if (hit.object === this.deskHit)
            this.target = { kind: 'desk' };
        else if (hit.instanceId !== undefined && data.bankBatch !== undefined) {
            const b = this.bankBatches[data.bankBatch], cabinet = b.units[Math.floor(hit.instanceId / DRAWERS)], drawer = hit.instanceId % DRAWERS;
            this.target = { kind: 'drawer', cabinet, drawer };
            const p = b.fp[hit.instanceId], w = toWorld(b.wing, p.x, p.z);
            this.frame.position.set(w.x, p.y, w.z);
            this.frame.rotation.y = p.ry ?? 0;
            this.frame.visible = true;
        }
        else if (hit.instanceId !== undefined && data.boxUnits) {
            const unit = data.boxUnits[hit.instanceId];
            this.target = { kind: 'storage', container: containerFor(unit) };
        }
    }
    openContainer(container: Container) {
        const p = parseContainer(container);
        if (p)
            this.openDrawer(p.unit, p.drawer);
    }
    openDrawer(cabinet: number, drawer: number) {
        this.closeDrawer();
        const u = STORAGE[cabinet];
        if (!u)
            return;
        const count = containerLoad(this.physical, containerFor(cabinet, drawer)), folders = makeContainerModel(u.kind === 'box' ? 'box' : 'drawer', count);
        folders.position.set(u.x, u.y + (u.kind === 'box' ? 0 : drawerY(drawer)), u.z);
        folders.rotation.y = u.yaw;
        if (u.kind !== 'box')
            folders.translateZ(.57);
        this.archives[u.wing].root.add(folders);
        this.activeDrawer = { cabinet, drawer, progress: 0, folders };
        if (u.kind === 'box')
            this.boxVisibility(cabinet, false);
    }
    private drawerTransform(amount: number) {
        if (!this.activeDrawer)
            return;
        const a = this.activeDrawer, u = STORAGE[a.cabinet];
        if (u.kind === 'box')
            return;
        const entry = this.bankIndex.get(u.id)!;
        for (const [mesh, ps] of [[entry.batch.front, entry.batch.fp], [entry.batch.handles, entry.batch.hp], [entry.batch.farHandles, entry.batch.hp], [entry.batch.labels, entry.batch.lp]] as const) {
            const p = ps[entry.start + a.drawer];
            _object.position.set(p.x + Math.sin(u.yaw) * amount, p.y, p.z + Math.cos(u.yaw) * amount);
            _object.scale.set(p.w, p.h, p.d);
            _object.rotation.set(0, p.ry ?? 0, 0);
            _object.updateMatrix();
            mesh.setMatrixAt(entry.start + a.drawer, _object.matrix);
            mesh.instanceMatrix.needsUpdate = true;
        }
        a.folders.position.set(u.x, u.y + drawerY(a.drawer), u.z);
        a.folders.translateZ(.57 + amount);
    }
    private updateDrawer(dt: number, fast: boolean) {
        if (!this.activeDrawer || this.activeDrawer.progress >= 1)
            return;
        this.activeDrawer.progress = Math.min(1, this.activeDrawer.progress + dt / (this.settings.reducedMotion ? .01 : fast ? .36 : .45));
        this.drawerTransform((1 - Math.pow(1 - this.activeDrawer.progress, 3)) * .75);
    }
    private boxVisibility(unit: number, visible: boolean) {
        for (const b of this.boxBodies) {
            const index = b.units.indexOf(unit);
            if (index < 0)
                continue;
            const parts = fileBoxParts().length;
            for (let n = 0; n < parts; n++) {
                const p = b.placements[index * parts + n];
                _object.position.set(p.x, p.y, p.z);
                _object.rotation.set(0, p.ry ?? 0, 0);
                _object.scale.set(p.w, visible ? p.h : 0, p.d);
                _object.updateMatrix();
                b.mesh.setMatrixAt(index * parts + n, _object.matrix);
            }
            b.mesh.instanceMatrix.needsUpdate = true;
        }
        this.paperDirty = true;
    }
    onStorageClose?: (point: THREE.Vector3, kind: 'box' | 'drawer-close') => void;
    closeDrawer() {
        if (!this.activeDrawer)
            return;
        const u = STORAGE[this.activeDrawer.cabinet];
        this.drawerTransform(0);
        this.activeDrawer.folders.removeFromParent();
        this.activeDrawer = null;
        if (u.kind === 'box')
            this.boxVisibility(u.id, true);
        this.onStorageClose?.(toWorld(u.wing, u.x, u.z), u.kind === 'box' ? 'box' : 'drawer-close');
    }
    pickup(id: string) {
        if (!this.interior.props.canTake(id))
            return 'Open the appliance and stop its cycle first.';
        const error = takeItem(this.physical, id);
        if (!error) {
            this.syncPhysical();
            this.onOfficeChange?.();
        }
        return error;
    }
    placement() {
        const t = this.target;
        if (!t)
            return null;
        if (t.kind === 'drawer')
            return containerFor(t.cabinet, t.drawer);
        if (t.kind === 'storage')
            return t.container;
        if (t.kind === 'desk')
            return 'desk-tray';
        if (t.kind === 'surface')
            return t.surface;
        if (t.kind === 'item')
            return this.physical.items.find(i => i.id === t.id)?.place ?? null;
        if (t.kind === 'prop') {
            if (t.id === 'coffee' || t.id === 'water')
                return t.id as Surface;
            if (t.id === 'printer' || t.id === 'printer-input')
                return 'printer-input';
        }
        return null;
    }
    placeHeld() {
        this.updateTarget();
        const to = this.placement();
        if (!to || to === 'held')
            return 'Aim at a drawer or file box, the utility table, or the coffee tray.';
        let error: string | null;
        if (to === 'printer-input') {
            if (this.interior.props.printing)
                return 'Wait until the printer finishes.';
            if (this.physical.held?.kind !== 'file')
                return 'Only originals go in the printer input tray.';
            error = insertOriginal(this.physical, this.physical.held.id);
        }
        else if (isContainer(to))
            error = placeFile(this.physical, to as Container);
        else if (!this.interior.props.canPlace(to as Surface))
            error = 'Open the appliance and stop its cycle first.';
        else
            error = placeItem(this.physical, to as Surface);
        if (!error) {
            this.syncPhysical();
            this.onOfficeChange?.();
        }
        return error;
    }
    consume() {
        const h = this.physical.held, item = h?.kind === 'item' ? this.physical.items.find(i => i.id === h.id) : null;
        if (item && item.contents !== 'empty')
            this.sipStart = performance.now();
        const message = consumeHeld(this.physical);
        this.syncPhysical();
        this.onOfficeChange?.();
        return message;
    }
    syncPhysical() {
        this.interior.props.syncItems();
        this.heldDirty = true;
        this.paperDirty = true;
        this.fileTrayGroup.clear();
        [...containerFiles(this.physical, 'desk-tray').map(id => ({ id, copy: false })), ...(this.physical.copies ?? []).filter(c => c.place === 'desk-tray').map(c => ({ id: c.file, copy: true }))].forEach((entry, i) => {
            const x = -.75 + (i % 2) * .58, z = -.25 + Math.floor(i / 2) * .5;
            if (!entry.copy)
                box(this.fileTrayGroup, wood, x, DESKTOP_Y + .011, z, .53, .022, .65);
            box(this.fileTrayGroup, paper, x, DESKTOP_Y + (entry.copy ? .006 : .027), z, .49, .012, .6);
        });
    }
    private cullRooms() {
        const key = [this.wing, ...this.camera.position.toArray(), ...this.camera.quaternion.toArray(), ...this.camera.projectionMatrix.elements, ...this.doors.map(d => d.open)].join(',');
        const visible = this.visibleRooms;
        if (key !== this.portalKey) {
            this.portalKey = key;
            this.camera.updateMatrixWorld();
            this.portalMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
            this.portalFrustum.setFromProjectionMatrix(this.portalMatrix);
            // Traverse only open, visible portals. Closed shared walls fully occlude neighbours.
            visible.clear();
            visible.add(this.wing);
            let changed = true;
            while (changed) {
                changed = false;
                CONNECTIONS.forEach((d, i) => {
                    if (!this.doors[i].open || (!visible.has(d.a) && !visible.has(d.b)))
                        return;
                    this.portalSphere.center.set(d.x, 1.5, d.z);
                    if (this.portalFrustum.intersectsSphere(this.portalSphere)) {
                        for (const wing of [d.a, d.b])
                            if (!visible.has(wing)) {
                                visible.add(wing);
                                changed = true;
                            }
                    }
                });
            }
            this.archives.forEach((a, i) => a.root.visible = visible.has(i));
            this.interior.root.visible = visible.has(NOOK.wing);
            this.fileTrayGroup.visible = visible.has(NOOK.wing);
        }
        const frame = performance.now();
        if (frame - this.lightFrame < 100) return;
        this.lightFrame = frame;
        const now = frame / 1000, dt = Math.min((frame - this.sensorFrame) / 1000, 1);
        this.sensorFrame = frame;
        let switched = false;
        for (const [wing, sites] of this.lightPositions.entries())
            for (const site of sites) {
                if (visible.has(wing) && Math.hypot(site.position.x - this.camera.position.x, site.position.z - this.camera.position.z) < 7.5)
                    site.lastNear = now;
                const on = now - (site.lastNear ?? -Infinity) < 8;
                if (site.on !== undefined && site.on !== on)
                    switched = true;
                site.on = on;
                const previous = site.strength ?? 0, goal = on ? 1 : 0;
                site.strength = Math.abs(previous - goal) < .001 ? goal : THREE.MathUtils.damp(previous, goal, 7, dt);
                if (site.strength !== previous) {
                    if (site.fixture)
                        site.fixture.emissiveIntensity = .8 * site.strength;
                    if (site.glow) {
                        site.glow.setX(site.glowIndex!, site.strength);
                        site.glow.needsUpdate = true;
                    }
                }
            }
        if (switched && this.enabled)
            this.onLightSwitch?.();
        const candidates = this.nearest;
        candidates.length = 0;
        const limit = this.settings.quality === 'low' ? 2 : this.settings.quality === 'medium' ? 4 : 6;
        for (const wing of visible)
            nearestLights(this.lightPositions[wing], this.camera.position, candidates, limit);
        this.roomLights.forEach((light, i) => {
            const p = candidates[i];
            light.visible = !!p && i < (this.settings.quality === 'low' ? 2 : this.settings.quality === 'medium' ? 4 : 6);
            if (p) {
                light.position.copy(p.position);
                light.color.setHex(p.kind === 'tube' ? 0xdce5cc : 0xffdfa8);
                light.intensity = (p.kind === 'door' ? 18 : p.kind === 'pendant' ? 38 : 46.2) * (p.strength ?? 0);
            }
        });
    }
    private updatePaperDetail() {
        if (!this.paperDirty && this.paperCamera.distanceToSquared(this.camera.position) < 4)
            return;
        this.paperDirty = false;
        this.paperCamera.copy(this.camera.position);
        const radius = this.settings.quality === 'high' ? 18 : this.settings.quality === 'medium' ? 12 : 8;
        for (const batch of this.bankBatches) {
            const near = Math.abs(batch.depth - this.camera.position.z) < 18;
            batch.handles.visible = near;
            batch.farHandles.visible = !near;
        }
        // All box meshes share the same filing state. Count copies once and reuse
        // each box's load across its material batches rather than scanning the
        // entire copy list for every visible paper component.
        const copies = new Map<string, number>();
        for (const copy of this.physical.copies ?? []) copies.set(copy.place, (copies.get(copy.place) ?? 0) + 1);
        const loads = new Map<number, number>();
        for (const batch of this.boxPapers) {
            let near = 0, far = 0;
            const origin = toWorld(batch.wing, 0, 0);
            for (let i = 0; i < batch.units.length; i++) {
                const id = batch.units[i], p = batch.placements[i];
                let n = loads.get(id);
                if (n === undefined) {
                    const container = containerFor(id);
                    n = containerOriginalCount(this.physical, container) + (copies.get(container) ?? 0);
                    loads.set(id, n);
                }
                if (!n || this.activeDrawer?.cabinet === id)
                    continue;
                const detailed = (p.x + origin.x - this.camera.position.x) ** 2 + (p.z + origin.z - this.camera.position.z) ** 2 < radius * radius;
                _object.position.set(p.x, p.y, p.z);
                _object.rotation.set(0, p.ry ?? 0, 0);
                _object.scale.set(p.w, p.h, p.d * Math.min(1, n / 8));
                _object.updateMatrix();
                if (detailed)
                    batch.mesh.setMatrixAt(near++, _object.matrix);
                else
                    batch.far.setMatrixAt(far++, _object.matrix);
            }
            batch.mesh.count = near;
            batch.far.count = far;
            batch.mesh.instanceMatrix.needsUpdate = true;
            batch.far.instanceMatrix.needsUpdate = true;
            batch.mesh.computeBoundingSphere();
            batch.far.computeBoundingSphere();
        }
    }
    clockPoint() {
        const origin = toWorld(this.wing, CLOCK_POSITION.x, CLOCK_POSITION.z);
        return Math.hypot(origin.x - this.camera.position.x, origin.z - this.camera.position.z) < 9 ? origin : null;
    }
    private updateHeld() {
        const held = this.physical.held;
        if (this.heldDirty) {
            const item = held?.kind === 'item' ? this.physical.items.find(i => i.id === held.id) : null;
            this.heldDirty = false;
            this.heldRoot.traverse(o => {
                if (o instanceof THREE.Mesh && o.userData.owned) {
                    if (o.geometry !== BOX)
                        o.geometry.dispose();
                    if (o.material !== paper)
                        (o.material as THREE.Material).dispose();
                }
            });
            this.heldRoot.clear();
            if (held) {
                if (held.kind === 'copy') {
                    this.heldRoot.add(makeModel('printed-copy'));
                }
                else if (held.kind === 'file') {
                    const folder = makeFolder(held.id);
                    folder.scale.setScalar(1.2);
                    this.heldRoot.add(folder);
                }
                else if(held.kind==='tool'){this.heldRoot.add(makeStationeryHeld(held.id));}
                else if(held.kind==='sticky'){const n=this.lifeSave.deskLife!.stickies.find(n=>n.id===held.id);this.heldRoot.add(makeStickyHeld(n?.text??'',parseInt((n?STICKY_COLORS[n.color]:'#eee4a2').slice(1),16)));}
                else if(held.kind==='can'){this.heldRoot.add(makeCan(this.lifeSave.deskLife!.vending.drink!,this.lifeSave.deskLife!.vending.empty));}
                else {
                    const model = item!.id === 'water-cup' ? makeModel('water-glass') : item!.kind === 'mug' ? makeMug() : makeMeal(item!.contents === 'empty');
                    this.heldRoot.add(model);
                    if (item!.kind === 'mug' && item!.contents !== 'empty') {
                        const liquid = new THREE.Mesh(new THREE.CircleGeometry(item!.id === 'water-cup' ? .064 : MUG_LIQUID_RADIUS, 48), new THREE.MeshBasicMaterial({ color: item!.contents === 'coffee' ? 0x513322 : 0xa2c3c4, transparent: item!.contents === 'water', opacity: .72 }));
                        liquid.rotation.x = -Math.PI / 2;
                        liquid.position.y = item!.id === 'water-cup' ? .153 : MUG_LIQUID_Y;
                        liquid.userData.owned = true;
                        this.heldRoot.add(liquid);
                    }
                }
            }
        }
        const readingStorage = this.target?.kind === 'drawer' || this.target?.kind === 'storage';
        this.heldRoot.visible = !!held && this.enabled && !(readingStorage && (held.kind === 'file' || held.kind === 'copy'));
        const t = this.sipStart < 0 ? 2 : (performance.now() - this.sipStart) / 1000, lift = this.settings.reducedMotion ? 0 : t < 1.5 ? Math.sin(Math.PI * t / 1.5) : 0;
        this.heldRoot.position.copy(this.camera.position);
        this.heldRoot.quaternion.copy(this.camera.quaternion);
        this.heldRoot.translateX(.40 - lift * .14);
        this.heldRoot.translateY(-.50 + lift * .26);
        this.heldRoot.translateZ(-.67 + lift * .27);
        this.heldRoot.rotateX(lift * .65);
        if (held?.kind === 'file')
            this.heldRoot.rotateZ(-.12);
    }
    deliver() {
        this.envelopeDelivery = 1;
    }
    run(onFrame: (dt: number) => void, hasFastDrawers: () => boolean) {
        const tick = () => {
            if (!this.alive)
                return;
            requestAnimationFrame(tick);
            const now = performance.now();
            if (document.hidden) {
                this.previousFrame = now;
                return;
            }

            const second = Math.floor(this.lifeSave.playSeconds);
            if (second !== this.detailSecond) {
                this.detailSecond = second;
                const date = officeDate(this.lifeSave.playSeconds);
                this.details.forEach(detail => detail.update(date));
                this.officeLife.sync(this.lifeSave);
            }
            const visualDt = Math.min((now - this.previousFrame) / 1000, 1), dt = Math.min(visualDt, .05);
            this.previousFrame = now;
            this.elapsed += dt;
            if (this.enabled)
                this.move(dt);
            this.officeLife.setWing(this.wing);
            this.officeLife.animateDispense(this.lifeSave);
            this.sinceRay += dt;
            if (this.enabled && this.sinceRay > .1) {
                this.sinceRay = 0;
                this.updateTarget();
            }
            this.updateDrawer(visualDt, hasFastDrawers());
            this.updateDoors(visualDt);
            this.interior.update(dt, this.settings.reducedMotion);
            this.updatePaperDetail();
            if (this.enabled) this.updateHeld();
            if (this.envelopeDelivery > 0) {
                this.envelopeDelivery = Math.max(0, this.envelopeDelivery - dt * 1.2);
                this.deskEnvelope.position.y = DESKTOP_Y + .006 + this.envelopeDelivery * 1.4;
            }
            onFrame(dt);
            // Simulation and delivery keep ticking independently of background GPU work.
            if (!this.enabled) {
                this.backgroundTicks++;
                // Keep simulation active while limiting expensive background redraws behind panels.
                if (this.backgroundTicks < 4 || now - this.renderFrame < 1000) return;
            }
            this.backgroundTicks = 0;
            this.renderFrame = now;
            this.renderedFrames++;
            this.cullRooms();
            this.renderer.info.reset();
            this.renderer.render(this.scene, this.camera);
            if (this.heldRoot.visible) {
                this.renderer.autoClear = false;
                this.renderer.clearDepth();
                this.renderer.render(this.heldScene, this.camera);
                this.renderer.autoClear = true;
            }
        };
        tick();
    }
    stats() {
        return { renderedFrames: this.renderedFrames, zone: this.zone, wing: this.wing, fanOn: !!this.officeState.fanOn, held: this.physical.held, brewing: this.interior.brewing, dispensing: this.interior.props.dispensing, shredding: this.interior.props.shredding, printerInput: printerOriginal(this.physical), sensors: this.lightPositions.flat().filter(l => l.on).length, lightTimeout: 8, heating: this.interior.props.heating, printing: this.interior.props.printing, seated: this.isSeated, tap: this.interior.props.tapRunning, capture: this.captureState, doors: this.doors.map(d => ({ side: d.side, destination: d.destination, open: d.open, progress: d.progress })), calls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures, objects: this.scene.children.length };
    }
}
