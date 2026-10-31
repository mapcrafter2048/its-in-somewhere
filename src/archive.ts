export const WINGS = ['Administration', 'Commercial Records', 'Technical Services', 'Executive Depository'];
export const WING_COLORS = [0x9da883, 0xc3a274, 0x8eafb6, 0xb8a0aa];
export const CABINETS_PER_WING = 128;
export const COLUMNS = 16;
export const ROWS = 8;
export const DRAWERS = 8;
export const FILES = 16;
export const FILES_PER_CABINET = DRAWERS * FILES;
export const FILES_PER_WING = CABINETS_PER_WING * FILES_PER_CABINET;
export const CABINETS = CABINETS_PER_WING * WINGS.length;
export const BASE_TOTAL = FILES_PER_WING * WINGS.length;
export const DRAWER_BANKS = 1096;
export const BOXES = 1541;
export const STORAGE_UNITS = DRAWER_BANKS + BOXES;
export const TOTAL = DRAWER_BANKS * FILES_PER_CABINET + BOXES * 8;
export type StorageKind = 'front' | 'rear' | 'wall' | 'box';
export const FIRST_ROW_Z = -1.5;
export const ROW_PITCH = 6;
export const PHRASE = 'the discrepancy was considered an acceptable loss';
export const DEPARTMENTS = ['Correspondence', 'Procurement', 'Personnel', 'Accounts', 'Facilities', 'Operations', 'Research', 'Executive'];
export const DEPT_COLORS = [0x9da883, 0xc5ab74, 0xa3b4b7, 0xc49b82, 0xa9a184, 0x9eac99, 0xb9a4b6, 0xc5bc9a];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function random(seed: number) {
    let a = seed >>> 0;
    return () => {
        a += 0x6D2B79F5;
        let t = a;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
export function fileId(cabinet: number, drawer = 0, file = 0) {
    return cabinet < DRAWER_BANKS ? cabinet * FILES_PER_CABINET + drawer * FILES + file : DRAWER_BANKS * FILES_PER_CABINET + (cabinet - DRAWER_BANKS) * 8 + file;
}
export function unitForFile(id: number) {
    return id < DRAWER_BANKS * FILES_PER_CABINET ? Math.floor(id / FILES_PER_CABINET) : DRAWER_BANKS + Math.floor((id - DRAWER_BANKS * FILES_PER_CABINET) / 8);
}
export function location(id: number) {
    const cabinet = unitForFile(id);
    let kind: StorageKind, wing: number, localCabinet: number, department: number, column: number, shortLabel: string;
    if (cabinet < 1024) {
        kind = cabinet < 512 ? 'front' : 'rear';
        const physical = cabinet % 512;
        wing = Math.floor(physical / 128);
        localCabinet = physical % 128;
        department = Math.floor(localCabinet / COLUMNS);
        column = localCabinet % COLUMNS;
        shortLabel = `${String.fromCharCode(65 + department)}${String(column + 1).padStart(2, '0')}${kind === 'rear' ? 'R' : ''}`;
    }
    else if (cabinet < DRAWER_BANKS) {
        kind = 'wall';
        wing = Math.floor((cabinet - 1024) / 18);
        localCabinet = (cabinet - 1024) % 18;
        department = Math.min(7, Math.floor(localCabinet / 2));
        column = localCabinet;
        shortLabel = `WC${String(localCabinet + 1).padStart(2, '0')}`;
    }
    else {
        kind = 'box';
        const global = cabinet - DRAWER_BANKS;
        wing = Math.min(3, Math.floor(global / 384));
        localCabinet = global - wing * 384;
        department = Math.min(7, Math.floor(localCabinet / 48));
        column = localCabinet;
        shortLabel = `BX${String(localCabinet + 1).padStart(3, '0')}`;
    }
    const offset = id - fileId(cabinet), drawer = kind === 'box' ? 0 : Math.floor(offset / FILES), file = kind === 'box' ? offset : offset % FILES;
    return { cabinet, localCabinet, wing, drawer, file, department, column, kind, shortLabel, label: `W${wing + 1}–${shortLabel}`, ref: kind === 'box' ? `W${wing + 1}–${shortLabel} / ${file + 1}` : `W${wing + 1}–${shortLabel} / ${drawer + 1}.${file + 1}`, date: `2023-${String(column % 12 + 1).padStart(2, '0')}-${String(id % 27 + 1).padStart(2, '0')}` };
}
export function cabinetPosition(cabinet: number) {
    const local = cabinet % CABINETS_PER_WING, row = Math.floor(local / COLUMNS), col = local % COLUMNS;
    return { x: (col - 7.5) * 2.2 + (col < 8 ? -1.3 : 1.3), z: FIRST_ROW_Z - row * ROW_PITCH };
}
export function drawerY(drawer: number) {
    return 0.38 + drawer * 0.39;
}
export function validId(id: unknown): id is number {
    return Number.isInteger(id) && Number(id) >= 0 && Number(id) < TOTAL;
}
export function reference(id: number) {
    return location(id).ref;
}
export function fromLegacyId(id: number) {
    return fileId(Math.floor(id / 32), Math.floor(id % 32 / 8), id % 8);
}
export function toLegacyId(id: number): number | null {
    const l = location(id);
    return l.kind === 'front' && l.wing === 0 && l.drawer < 4 && l.file < 8 ? l.localCabinet * 32 + l.drawer * 8 + l.file : null;
}
export function drawerStart(id: number) {
    const l = location(id);
    return fileId(l.cabinet, l.drawer);
}
