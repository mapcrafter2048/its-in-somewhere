import {boardNote,noteKey,STICKY_COLORS} from './stationery';
import type { SketchStroke, PaperNote, DeskLife } from './types';
export const INKS = { black: '#28382f', blue: '#285e99', red: '#ae3e38', green: '#48744d' };
export const PAPERS = { cream: '#eee5cc', rose: '#ecd6cb', blue: '#d8e2df', sage: '#dce2c8' };
/** Shared normalized stroke painter for notebook sheets and the original wall whiteboard. */
export function paintStrokes(ctx: CanvasRenderingContext2D, strokes: SketchStroke[], w: number, h: number, background: string) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of strokes) {
        ctx.strokeStyle = s.tool === 'eraser' ? background : INKS[s.color];
        ctx.lineWidth = s.width * w * (s.tool === 'eraser' ? 3 : 1);
        ctx.beginPath();
        s.points.forEach(([x, y], i) => i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h));
        if (s.points.length === 1)
            ctx.lineTo(s.points[0][0] * w + .01, s.points[0][1] * h);
        ctx.stroke();
    }
}
export function paintNote(canvas: HTMLCanvasElement, note: PaperNote) {
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = PAPERS[note.paper];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    paintStrokes(ctx, note.strokes, canvas.width, canvas.height, PAPERS[note.paper]);
}
export function paintPinboard(canvas: HTMLCanvasElement, d: DeskLife) {
    const ctx = canvas.getContext('2d')!, w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#766b4c';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#9a8962';
    for (let x = 0; x < w; x += 13)
        for (let y = 0; y < h; y += 13)
            ctx.fillRect(x + (y % 7), y, 2, 2);
    const position = (id: number,kind?:import('./types').NoteKind) => {
        const p = d.pins.find(p => noteKey(p.kind,p.note)===noteKey(kind,id))!;
        return { x: 25 + p.x * (w - 190), y: 20 + p.y * (h - 155) };
    };
    for (const s of d.strings) {
        const a = position(s.from,s.fromKind), b = position(s.to,s.toKind);
        ctx.strokeStyle = INKS[s.color];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(a.x + 75, a.y + 20);
        ctx.lineTo(b.x + 75, b.y + 20);
        ctx.stroke();
        if (s.label) {
            const x = (a.x + b.x) / 2 + 75, y = (a.y + b.y) / 2 + 20;
            ctx.font = '12px monospace';
            const width = ctx.measureText(s.label).width;
            ctx.fillStyle = '#eee5cc';
            ctx.fillRect(x - width / 2 - 5, y - 12, width + 10, 18);
            ctx.fillStyle = INKS[s.color];
            ctx.fillText(s.label, x - width / 2, y + 1);
        }
    }
    for (const p of d.pins) {
        const n = boardNote(d,p);if(!n)continue;
        const { x, y } = position(p.note,p.kind);
        ctx.fillStyle = 'rgba(0,0,0,.15)';
        ctx.fillRect(x + 4, y + 5, 150, 125);
        ctx.fillStyle = p.kind==='sticky'?STICKY_COLORS[d.stickies.find(n=>n.id===p.note)!.color]:PAPERS[n.paper];
        ctx.fillRect(x, y, 150, 125);
        ctx.fillStyle = INKS.black;
        ctx.font = 'bold 13px Georgia';
        ctx.fillText(n.title.slice(0, 20), x + 10, y + 28);
        ctx.font = '11px Georgia';
        const lines = (n.text || n.excerpt?.text || 'A theory in progress.').match(/.{1,23}(?:\s|$)|.{1,23}/g) || [];
        lines.slice(0, 4).forEach((line, i) => ctx.fillText(line.trim(), x + 10, y + 48 + i * 15));
        ctx.save();
        ctx.translate(x + 8, y + 30);
        paintStrokes(ctx, n.strokes, 134, 85, PAPERS[n.paper]);
        ctx.restore();
        ctx.fillStyle = INKS.red;
        ctx.beginPath();
        ctx.arc(x + 75, y + 9, 4, 0, Math.PI * 2);
        ctx.fill();
        if (n.excerpt) {
            ctx.strokeStyle = '#abb4a6';
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 125, y - 3, 8, 24);
        }
    }
    if (!d.pins.length) {
        ctx.fillStyle = '#eee5cc';
        ctx.font = '24px Georgia';
        ctx.fillText('A little room for your own theories.', 35, h / 2);
    }
}
