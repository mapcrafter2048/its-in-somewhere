import { ShiftClock, shiftDuration } from '../shift-clock';
/** Menus used during a shift count; explicit breaks and onboarding do not. */
const breaks = new Set(['title', 'letter', 'tutorial', 'pause', 'reset', 'import']);
export function countsAsShift(mode: string, started: boolean, focused: boolean, hidden: boolean) {
    return started && focused && !hidden && !breaks.has(mode);
}
export class ShiftSession {
    private clock: ShiftClock;
    constructor(now = performance.now()) {
        this.clock = new ShiftClock(now);
    }
    advance(now: number, mode: string, started: boolean, focused: boolean, hidden: boolean) {
        return this.clock.advance(now, countsAsShift(mode, started, focused, hidden));
    }
    reset(now = performance.now()) {
        this.clock.reset(now);
    }
}
export function localOfficeTime(date = new Date()) {
    return { day: date.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase(), time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }) };
}
export { shiftDuration };
