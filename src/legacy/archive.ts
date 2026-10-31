export const CABINETS = 128;
export const DRAWERS = 4;
export const FILES = 8;
export const TOTAL = CABINETS * DRAWERS * FILES;
export const PHRASE = 'the discrepancy was considered an acceptable loss';
export const DEPARTMENTS = ['Correspondence', 'Procurement', 'Personnel', 'Accounts', 'Facilities', 'Operations', 'Research', 'Executive'];
export const DEPT_COLORS = [0x9da883, 0xc5ab74, 0xa3b4b7, 0xc49b82, 0xa9a184, 0x9eac99, 0xb9a4b6, 0xc5bc9a];
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export function random(seed: number) {
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function location(id: number) {
  const cabinet = Math.floor(id / 32), drawer = Math.floor(id % 32 / 8), file = id % 8;
  const department = Math.floor(cabinet / 16), column = cabinet % 16;
  return { cabinet, drawer, file, department, column,
    ref: `${String.fromCharCode(65 + department)}${String(column + 1).padStart(2,'0')} / ${drawer + 1}.${file + 1}`,
    label: `${String.fromCharCode(65 + department)}${String(column + 1).padStart(2,'0')}`,
    date: `2023-${String(column % 12 + 1).padStart(2,'0')}-${String(id % 27 + 1).padStart(2,'0')}` };
}
export function cabinetPosition(cabinet: number) {
  const row = Math.floor(cabinet / 16), col = cabinet % 16;
  return { x: (col - 7.5) * 2.2 + (col < 8 ? -1.3 : 1.3), z: -3 - row * 6 };
}
export function validId(id: unknown): id is number { return Number.isInteger(id) && Number(id) >= 0 && Number(id) < TOTAL; }
export function reference(id: number) { return location(id).ref; }
