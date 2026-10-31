import { initialStationery, validateStationery, noteKey } from './stationery';
import { conversationNode } from './conversations';
import type { Save } from '../types';
import type { Archive } from '../content/generator';
import { DEPARTMENTS, MONTHS, fileId, location, validId } from '../archive';
import { UNITS_BY_WING, STORAGE, parseContainer, containerFor, storageLabel, type Container } from '../storage';
import { ARTIFACTS, CASES, CONTACTS, REWARDS } from './content';
import type { DeskLife, DeskMail, MailDraft, PaperNote } from './types';
export const DESKTOP_BACKUP_KEY = 'archive-office-before-desktop-v2';
export const DESK_BACKUP_KEY = 'archive-office-before-desk-life';
export const freshDesk = (seconds = 0): DeskLife => ({ version: 3, ...initialStationery(), responses: [], snakeBest: 0, notes: [], nextNote: 1, pins: [], strings: [], collected: [], identified: [], rewards: [], stamp: '', fileStamps: {}, mail: [], drafts: [], nextMail: 1, resolved: [], counters: { issuedAt: seconds, notesWritten: 0, mailSent: 0 } });
export function deskFor(save: Save) {
    return save.deskLife ??= freshDesk(save.playSeconds);
}
export const noteCapacity = (s: Save) => s.upgrades.includes('stationery') ? 36 : 12;
export const pinCapacity = (s: Save) => s.upgrades.includes('pinboard') ? 24 : 8;
function hash(text: string, seed = 2166136261) {
    let n = seed >>> 0;
    for (let i = 0; i < text.length; i++)
        n = Math.imul(n ^ text.charCodeAt(i), 16777619) >>> 0;
    return n;
}
/** No content generator or world meshes participate in placement. */
export function artifactPlacements(seed: number): Map<Container, string> {
    const map = new Map<Container, string>();
    for (let wing = 0; wing < 4; wing++) {
        const drawers = UNITS_BY_WING[wing].filter(u => u.kind !== 'box').flatMap(u => Array.from({ length: u.drawers }, (_, d) => containerFor(u.id, d)));
        let n = hash(`desk-artifacts-v1:${seed}:${wing}`);
        for (let i = 0; i < 6; i++) {
            n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
            const index = n % drawers.length;
            map.set(drawers[index], ARTIFACTS[wing * 6 + i].id);
            drawers.splice(index, 1);
        }
    }
    return map;
}
export function collectArtifact(save: Save, container: Container, placements = artifactPlacements(save.seed)) {
    const id = placements.get(container), d = deskFor(save);
    if (!id || d.collected.includes(id))
        return null;
    d.collected.push(id);
    for (const reward of REWARDS)
        if (d.collected.length >= reward.at && !d.rewards.includes(reward.at))
            d.rewards.push(reward.at);
    return ARTIFACTS.find(a => a.id === id)!;
}
export function identifyArtifact(save: Save, id: string) {
    const d = deskFor(save);
    if (!ARTIFACTS.some(a => a.id === id) || d.identified.includes(id) || d.collected.includes(id))
        return false;
    if (save.credits < 4)
        return false;
    save.credits -= 4;
    d.identified.push(id);
    return true;
}
export function createNote(save: Save): PaperNote | null {
    const d = deskFor(save);
    if (d.notes.length >= noteCapacity(save))
        return null;
    const used=new Set(d.notes.map((n,i)=>n.sheet??i));const sheet=Array.from({length:noteCapacity(save)},(_,i)=>i).find(i=>!used.has(i))!;
    const note: PaperNote = { sheet, id: d.nextNote++, title: 'Untitled theory', text: '', paper: 'cream', strokes: [] };
    d.notes.push(note);
    d.counters.notesWritten++;
    return note;
}
export function deleteNote(save: Save, id: number) {
    const d = deskFor(save);
    d.notes = d.notes.filter(n => n.id !== id);
    d.pins = d.pins.filter(p => p.kind==='sticky'||p.note !== id);
    d.strings = d.strings.filter(s => (s.fromKind==='sticky'||s.from !== id) && (s.toKind==='sticky'||s.to !== id));
}
export const defaultDraft = (): MailDraft => ({ recipient: 'tess', caseId: 'fridge', topic: 'inquiry', artifact: 'fridge:0', body: '', attachments: [] });
export function martinStage(save: Save, archive: Archive) {
    const count = (archive.storyLocations.get('martin') ?? []).filter(id => save.clues.includes(id)).length;
    return count >= 6 ? 3 : count >= 3 ? 2 : count >= 1 ? 1 : 0;
}
const martinReplies = ['', 'Routine administration. I have sent the wing and department. Please keep this between us.', 'You are misreading the dates. I have sent the retention month. No need to circulate this.', '…I have sent the cabinet group. Bring the whole original. Please.'];
export function migrateDesk(save: Save) {
    if (save.deskLife)
        return save;
    const d = save.deskLife = freshDesk(save.playSeconds);
    for (const stage of save.messages) {
        const hint = Number(stage);
        d.mail.push({ ...defaultDraft(), recipient: 'martin', caseId: 'martin', topic: 'martin', id: d.nextMail++, direction: 'in', subject: 'The revised assessment', text: martinReplies[hint], sentAt: save.playSeconds, due: save.playSeconds, read: true, signature: `legacy-martin:${hint}`, hint });
    }
    return save;
}
export function sendMail(save: Save, archive: Archive, draft: MailDraft) {
    const d = deskFor(save);
    const selected = draft.choice ? conversationNode(save, archive, draft).options.find(o => o.id === draft.choice) : undefined;
    if (draft.choice && (!selected || selected.locked)) throw new Error(selected?.locked ?? 'This response has changed. Choose a current response.');
    if (selected) draft = { ...draft, topic: selected.topic };
    const c = CASES.find(c => c.id === draft.caseId);
    if (!Object.hasOwn(CONTACTS, draft.recipient) || !['inquiry', 'evidence', 'lead', 'location', 'martin'].includes(draft.topic))
        throw new Error('Choose a recipient and subject.');
    if (draft.body.length > 4000 || draft.attachments.length > 2 || new Set(draft.attachments).size !== draft.attachments.length || draft.attachments.some(id => !save.inspected.includes(id)))
        throw new Error('Attach up to two previously opened records.');
    let text = '', hint: number | undefined, resolves: string | undefined;
    if (draft.topic === 'martin') {
        if (draft.recipient !== 'martin')
            throw new Error('Address this enquiry to Martin.');
        hint = selected && selected.intent !== 'evidence' ? 0 : martinStage(save, archive);
        if (!hint)
            text = 'Please retain an original record connecting me to the revised assessment before continuing this enquiry.';
        else if (save.messages.includes(String(hint)))
            return { duplicate: true };
        else
            text = martinReplies[hint];
    }
    else {
        if (!c || c.contact !== draft.recipient)
            throw new Error('Choose a subject handled by this recipient.');
        if (draft.topic === 'inquiry')
            text = `${c.intro}\n\nThe reference for the first retained account is attached below. It points to the remaining records.`;
        if (draft.topic === 'evidence') {
            const evidence = (archive.storyLocations.get(c.id) ?? []).filter(id => save.clues.includes(id));
            const attached = draft.attachments.filter(id => evidence.includes(id));
            if (attached.length === 2) {
                text = c.resolution;
                resolves = c.id;
            }
            else
                text = 'Please attach two different retained evidence records from this case. Workbook evidence must be uncovered in its cells or comments first. A title alone is not enough for the accounts file.';
        }
        if (draft.topic === 'lead' || draft.topic === 'location') {
            const a = ARTIFACTS.find(a => a.id === draft.artifact && a.caseId === c.id);
            if (!a)
                throw new Error('Choose an object for this enquiry.');
            const container = [...artifactPlacements(save.seed)].find(([, id]) => id === a.id)![0];
            const unit = STORAGE[parseContainer(container)!.unit], wing = unit.wing + 1, loc = location(fileId(unit.id));
            text = draft.topic === 'location' ? `${a.name}: ${storageLabel(container)}. Look beneath the filed records after opening the drawer. No purchase or case resolution is required.` : `A keepsake from “${c.title}” was retained in W${wing}. ${DEPARTMENTS[loc.department]}, ${unit.kind === 'rear' ? 'rear bank' : unit.kind === 'wall' ? 'side-wall cabinets' : 'front bank'}, ${MONTHS[loc.column % 12]} retention. It was put beneath the records. Ask for the precise location if this is insufficient.`;
        }
    }
    if (selected) {
        if (selected.intent === 'evidence' && draft.topic === 'evidence' && !resolves)
            throw new Error('Attach two different uncovered records from this case before submitting the comparison.');
        text = selected.reply + (selected.intent === 'levity' && draft.topic === 'inquiry' || draft.topic === 'martin' && !hint ? '' : '\n\n' + text);
    }
    const relevant = draft.topic === 'evidence' ? draft.attachments.filter(id => save.clues.includes(id)).sort((a, b) => a - b) : [];
    const signature = JSON.stringify([draft.recipient, draft.caseId, draft.topic, ['lead', 'location'].includes(draft.topic) ? draft.artifact : '', hint ?? 0, relevant, ...(selected ? [selected.id] : [])]);
    if (d.mail.some(m => m.signature === signature))
        return { duplicate: true };
    if (d.mail.length > 1000)
        throw new Error('The correspondence binder is full. Existing threads remain available.');
    const id = d.nextMail++, subject = draft.topic === 'martin' ? 'The revised assessment' : `${c!.title} / ${({ inquiry: 'Enquiry', evidence: 'Retained comparison', lead: 'Object lead', location: 'Precise location', martin: 'Assessment' })[draft.topic]}`;
    const out: DeskMail = { ...structuredClone(draft), id, direction: 'out', subject, text: selected ? selected.label + (draft.body ? '\n\nPersonal note:\n' + draft.body : '') : draft.body, sentAt: save.playSeconds, due: save.playSeconds, read: true, signature };
    const replyAttachments = draft.topic === 'inquiry' && c ? [archive.storyLocations.get(c.id)![0]] : [];
    d.mail.push(out, { ...structuredClone(draft), attachments: replyAttachments, id: d.nextMail++, direction: 'in', subject: `Re: ${subject}`, text, sentAt: save.playSeconds, due: save.playSeconds + 30 + hash(signature, save.seed) % 61, read: false, signature, hint: hint || undefined, resolves });
    if (selected) d.responses.push({ choice: selected.id, mail: id, at: save.playSeconds });
    d.counters.mailSent++;
    d.drafts = [];
    return { duplicate: false };
}
/** One optional follow-up per case, due only after three active minutes. */
export function updateCorrespondence(save: Save) {
    const d = deskFor(save); let changed = false;
    if (d.mail.length > 1000) return false;
    for (const c of CASES) {
        const prior = d.mail.find(m => m.caseId === c.id && m.direction === 'in' && m.read);
        const signature = `follow-up:${c.id}`;
        if (!prior || d.resolved.includes(c.id) || save.playSeconds < prior.due + 180 || d.mail.some(m => m.signature === signature)) continue;
        d.mail.push({ ...defaultDraft(), recipient: c.contact, caseId: c.id, artifact: `${c.id}:0`, id: d.nextMail++, direction: 'in', subject: `Following up / ${c.title}`, text: `A small follow-up, not a deadline. ${c.intro}\n\nIf you are still looking, ask for clarification. The original records will wait.`, sentAt: save.playSeconds, due: save.playSeconds, read: false, signature });
        changed = true;
    }
    return changed;
}
export function deliveredMail(save: Save) {
    return deskFor(save).mail.filter(m => m.direction === 'in' && m.due <= save.playSeconds);
}
export function openMail(save: Save, id: number) {
    const d = deskFor(save), m = d.mail.find(m => m.id === id);
    if (!m || m.due > save.playSeconds)
        return null;
    m.read = true;
    if (m.hint) {
        save.hintLevel = Math.max(save.hintLevel, m.hint);
        if (!save.messages.includes(String(m.hint)))
            save.messages.push(String(m.hint));
    }
    if (m.resolves && !d.resolved.includes(m.resolves))
        d.resolved.push(m.resolves);
    return m;
}
export function validateDesk(value: unknown, save: Save): DeskLife {
    if (value === undefined)
        return migrateDesk({ ...save, deskLife: undefined }).deskLife!;
    const d = structuredClone(value) as DeskLife;
    const version = (value as { version?: number })?.version;
    if (d && version === 1) { d.version = 3; d.responses = []; d.snakeBest = 0; }
    if(d && (version===1||version===2)){
        Object.assign(d,initialStationery());d.version=3;
        d.notes?.forEach((n,i)=>n.sheet=i);
        d.pins?.forEach(p=>p.kind='notebook');
        d.strings?.forEach(p=>{p.fromKind='notebook';p.toKind='notebook';});
    }
    const fail = () => {
        throw new Error('Invalid personal desk data. Restore a valid backup.');
    };
    const text = (v: unknown, max: number) => typeof v === 'string' && v.length <= max;
    const list = (v: unknown, max: number) => Array.isArray(v) && v.length <= max;
    const unique = (v: unknown[], max: number) => list(v, max) && new Set(v).size === v.length;
    const positive = (v: number) => Number.isSafeInteger(v) && v > 0;
    if (!d || d.version !== 3 || !list(d.notes, 36) || !positive(d.nextNote) || !list(d.pins, 24) || !list(d.strings, 96) || !unique(d.collected, 24) || !unique(d.identified, 24) || ![...d.collected, ...d.identified].every(id => ARTIFACTS.some(a => a.id === id)) || !unique(d.rewards, 6) || !d.rewards.every(n => REWARDS.some(r => r.at === n) && d.collected.length >= n) || !list(d.mail, 1100) || !list(d.drafts, 1) || !positive(d.nextMail) || !unique(d.resolved, 6) || !d.resolved.every(id => CASES.some(c => c.id === id)))
        fail();
    if (!list(d.responses, 550) || !Number.isSafeInteger(d.snakeBest) || d.snakeBest < 0 || d.snakeBest > 3970 || d.snakeBest % 10 !== 0 || d.responses.some(r => !r || !text(r.choice, 200) || !Number.isFinite(r.at) || r.at < 0 || r.at > save.playSeconds || !d.mail.some(m => m.id === r.mail && m.direction === 'out' && m.choice === r.choice)) || new Set(d.responses.map(r => r.mail)).size !== d.responses.length) fail();
    if (!d.counters || !Number.isFinite(d.counters.issuedAt) || d.counters.issuedAt < 0 || d.counters.issuedAt > save.playSeconds || ![d.counters.notesWritten, d.counters.mailSent].every(n => Number.isSafeInteger(n) && n >= 0))
        fail();
    let totalPoints = 0;
    for (const n of d.notes) {
        if (!positive(n.id) || n.id >= d.nextNote || !text(n.title, 100) || !text(n.text, 8000) || !['cream', 'rose', 'blue', 'sage'].includes(n.paper) || !list(n.strokes, 160))
            fail();
        let points = 0;
        for (const s of n.strokes) {
            if (!s || !['marker', 'eraser'].includes(s.tool) || !['black', 'blue', 'red', 'green'].includes(s.color) || ![.004, .012].includes(s.width) || !list(s.points, 600) || !s.points.length || !s.points.every(p => Array.isArray(p) && p.length === 2 && p.every(v => Number.isFinite(v) && v >= 0 && v <= 1)))
                fail();
            points += s.points.length;
        }
        if (points > 10000)
            fail();
        totalPoints += points;
        if (n.digitalExcerpt && (!text(n.digitalExcerpt.id, 100) || !/^[a-z0-9-]+$/.test(n.digitalExcerpt.id) || !text(n.digitalExcerpt.text, 6000) || !text(n.digitalExcerpt.label, 200))) fail();
        if (n.excerpt && (!validId(n.excerpt.file) || !text(n.excerpt.text, 6000) || !text(n.excerpt.label, 200)))
            fail();
    }
    if (totalPoints > 60000 || new Set(d.notes.map(n => n.id)).size !== d.notes.length || d.notes.length > noteCapacity(save) || d.pins.length > pinCapacity(save))
        fail();
    if(d.pins.some(p=>![p.x,p.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1)))fail();
    if(d.strings.some(s=>noteKey(s.fromKind,s.from)===noteKey(s.toKind,s.to)||!['black','blue','red','green'].includes(s.color)||!text(s.label,80)))fail();
    validateStationery(d,save);
    const draftValid = (m: MailDraft) => m && (m.choice === undefined || text(m.choice, 200) && /^(fridge|betting|ghost|long-47|long-57|short-27|martin):(enquiry|discussion|resolved):(inquiry|lead|location):(clarify|evidence|levity)$/.test(m.choice)) && Object.hasOwn(CONTACTS, m.recipient) && ['inquiry', 'evidence', 'lead', 'location', 'martin'].includes(m.topic) && (m.caseId === 'martin' || CASES.some(c => c.id === m.caseId)) && text(m.artifact, 80) && text(m.body, 4000) && unique(m.attachments, 2) && m.attachments.every(validId);
    if (!d.drafts.every(draftValid) || new Set(d.mail.map(m => m.id)).size !== d.mail.length)
        fail();
    for (const m of d.mail)
        if (!draftValid(m) || !positive(m.id) || m.id >= d.nextMail || !['in', 'out'].includes(m.direction) || !text(m.subject, 200) || !text(m.text, 6000) || !text(m.signature, 1000) || !Number.isFinite(m.sentAt) || m.sentAt < 0 || !Number.isFinite(m.due) || m.due < m.sentAt || typeof m.read !== 'boolean' || (m.hint !== undefined && (![1, 2, 3].includes(m.hint) || m.recipient !== 'martin' || m.topic !== 'martin')) || (m.resolves !== undefined && !CASES.some(c => c.id === m.resolves)))
            fail();
    const stamps = ['', ...REWARDS.filter(r => r.kind === 'stamp' && d.rewards.includes(r.at)).map(r => r.name)];
    if (!stamps.includes(d.stamp) || !d.fileStamps || typeof d.fileStamps !== 'object' || Array.isArray(d.fileStamps) || Object.keys(d.fileStamps).length > 10000 || Object.entries(d.fileStamps).some(([id, stamp]) => !validId(Number(id)) || !stamps.includes(stamp)))
        fail();
    return structuredClone(d);
}
