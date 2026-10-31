/** Real elapsed time, independent of the simulation's capped movement timestep. */
export function shiftDuration(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    return [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60].map(n => String(n).padStart(2, '0')).join(':');
}
export class ShiftClock {
    private previous: number;
    constructor(now = performance.now()) { this.previous = now; }
    advance(now: number, active: boolean) { const elapsed = Math.max(0, (now - this.previous) / 1000); this.previous = now; return active ? elapsed : 0; }
    reset(now = performance.now()) { this.previous = now; }
}

export const OFFICE_EPOCH=Date.UTC(2007,0,8,8,0,0);
export function officeDate(seconds:number){return new Date(OFFICE_EPOCH+Math.max(0,seconds)*1000);}
export function officeTime(seconds:number){const date=officeDate(seconds);return {day:date.toLocaleDateString('en-GB',{weekday:'long',timeZone:'UTC'}).toUpperCase(),time:date.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'UTC'}),date:date.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})};}
