import { mailCases, threadNotices } from './thread-mail';
import { threadById } from '../content/packs/records';
import { NotebookController, type NotebookEntry, type NotebookSection } from '../ui/notebook';
import { artifactSketch } from '../ui/artifact-sketches';
import { conversationNode } from './conversations';
import type { DesktopApps } from './desktop-apps';
import type { DesktopApp } from './types';
import { computerWindow, computerFolders, computerMessages } from './computer-ui';
import type { Save } from '../types';
import type { Archive } from '../content/generator';
import { reference } from '../archive';
import { shiftDuration } from '../shift-clock';
import { escapeHtml as esc, panel } from '../ui/dom';
import { ARTIFACTS, CONTACTS, MUG_DISPUTE, NOTICES, REWARDS } from './content';
import { createNote, defaultDraft, deleteNote, deliveredMail, deskFor, identifyArtifact, noteCapacity, openMail, sendMail } from './state';
import { INKS, PAPERS, paintNote } from './paper';
import type { Contact, MailDraft, MailTopic, PaperNote, SketchStroke } from './types';
interface Options {
    save: () => Save;
    archive: () => Archive;
    atDesk: () => boolean;
    show: (mode: string, html: string) => void;
    write: () => void;
    notify: (text: string) => void;
    sound: (name: 'tear' | 'pin' | 'keyboard' | 'mail' | 'collection' | 'pencil' | 'paper') => void;
    cleanup: (callback: () => void) => void;
    sync: () => void;
    visit: (id: number) => void;
    discoveryEntries: () => NotebookEntry[];
    board:()=>void;
    map:()=>void;
    printing: () => boolean;
    printer: () => void;
}
export class DeskScreens {
    private book: NotebookController;
    private lastNote?: number;
    private lastSheet=0;
    private lastBookMode: 'index'|'read'|'edit' = 'index';
    constructor(private o: Options) {
        this.book = new NotebookController({ show: html => this.o.show('notebook', html), cleanup: o.cleanup, sound: () => o.sound('paper'), select: section => this.openSection(section), write: () => this.newNote(), canWrite: () => this.d.notes.length < noteCapacity(this.save) });
    }
    private desktopApps?: DesktopApps;
    private desktopRequest = 0;
    reset() {
        this.book.reset();
        this.lastNote=undefined;this.lastBookMode='index';this.lastSheet=0;
        this.desktopRequest++;
        this.desktopApps = undefined;

    }
    private get save() {
        return this.o.save();
    }
    private get d() {
        return deskFor(this.save);
    }
    private display(mode: string, title: string, eyebrow: string, body: string) {
        this.desktopRequest++;
        this.o.show(mode, panel(title, eyebrow, body, true));
    }
    private displayComputer(title: string, body: string, compose = title === 'New message', app: DesktopApp | null = 'mail') {
        const pending = this.d.mail.filter(m => m.direction === 'in' && m.due > this.save.playSeconds).length;
        this.o.show('computer', computerWindow(title, body, pending, compose, app));
    }
    private bindComputerMenu(beforeNavigate = () => {
    }) {
        document.querySelectorAll<HTMLButtonElement>('[data-pc-command]').forEach(b => b.onclick = () => {
            beforeNavigate();
            if (b.dataset.pcCommand === 'desktop') { this.computerHome(); return; }
            if (['files', 'directory', 'print', 'snake', 'catalogue'].includes(b.dataset.pcCommand!)) { void this.desktop(b.dataset.pcCommand as DesktopApp); return; }
            if (b.dataset.pcCommand === 'inbox')
                this.computer('inbox');
            else {
                this.compose();
                if (b.dataset.pcCommand === 'attachments') {
                    requestAnimationFrame(() => {
                        const field = document.querySelector<HTMLInputElement>('#attachment-query');
                        field?.focus();
                        field?.scrollIntoView({ block: 'nearest' });
                    });
                }
            }
        });
    }
    async desktop(app: DesktopApp, file?: string) {
        if (!this.o.atDesk()) return;
        this.desktopRequest++;
        this.displayComputer('Opening application', '<p class="pc-compose-hint" role="status">Opening application…</p>', false, app);
        this.bindComputerMenu();
        const request = ++this.desktopRequest;
        this.o.cleanup(() => { this.desktopRequest++; });
        try {
            const { DesktopApps } = await import('./desktop-apps');
            if (request !== this.desktopRequest) return;
            this.desktopApps ??= new DesktopApps({
                save: this.o.save, archive: this.o.archive, cleanup: this.o.cleanup, write: () => this.commit(), notify: this.o.notify,
                show: (app, title, html) => { this.displayComputer(title, html, false, app); this.bindComputerMenu(); },
                mail: (recipient, caseId) => this.compose({ ...defaultDraft(), recipient, caseId, topic: caseId === 'martin' ? 'martin' : 'inquiry', artifact: `${caseId}:0` }),
                note: id => this.note(id), printing: this.o.printing, printer: this.o.printer
            });
            this.desktopApps.open(app, file);
        } catch {
            if (request === this.desktopRequest) { this.displayComputer('Application unavailable', '<p class="pc-compose-hint">Could not load the application. Return to the desktop and open it again.</p>', false, app); this.bindComputerMenu(); }
        }
    }
    private commit() {
        this.o.write();
        this.o.sync();
    }
    private newNote() {this.book.flushPending();const used=new Set(this.d.notes.map((n,i)=>n.sheet??i));const slot=Array.from({length:noteCapacity(this.save)},(_,i)=>i).find(i=>!used.has(i));if(slot===undefined)this.o.notify('The notebook is full. Recycle a sheet or order stationery.');else this.sheet(slot);}
    sheet(index:number){this.book.flushPending();this.lastSheet=Math.max(0,Math.min(noteCapacity(this.save)-1,index));const n=this.d.notes.find((n,i)=>(n.sheet??i)===this.lastSheet);this.note(n?.id??0,false,this.lastSheet);}
    private openSection(section:NotebookSection) {if(section==='rooms'){this.o.map();return;}this.notebook(section);}
    notebook(tab?: string) {
        if(!tab && this.book.section==='notes' && this.lastNote && this.d.notes.some(n=>n.id===this.lastNote)) { if(this.lastBookMode==='read'){this.readNote(this.lastNote,true);return;}if(this.lastBookMode==='edit'){this.note(this.lastNote);return;} }
        const section = (['notes','discoveries','collection','log','rooms'].includes(tab ?? '') ? tab : this.book.section) as NotebookSection;
        if(section==='rooms'){this.o.map();return;}
        if(section==='notes'){this.sheet(this.lastSheet);return;}
        const entries = section === 'collection' ? this.collectionEntries() : section === 'log' ? this.logEntries() : section === 'discoveries' ? this.o.discoveryEntries() : [];
        this.book.show(section, entries, () => this.bindBookActions());
    }
    roomSpread(left:string,right:string,room:number,turn:(direction:number)=>void,contents:{label:string;select:()=>void}[]){this.book.roomSpread(left,right,room,4,turn,contents);}
    private noteContents() {
        this.book.setContents(()=>Array.from({length:noteCapacity(this.save)},(_,i)=>{const n=this.d.notes.find((n,j)=>(n.sheet??j)===i);return {label:`Sheet ${String(i+1).padStart(2,'0')} / ${n?(n.title||'Untitled sheet'):'Unwritten'}`,select:()=>this.sheet(i)};}));
    }
    private bindBookActions() {
        document.querySelectorAll<HTMLButtonElement>('[data-note]').forEach(b => b.onclick = () => this.readNote(Number(b.dataset.note)));
        document.querySelector<HTMLButtonElement>('[data-new-sheet]')?.addEventListener('click', () => this.newNote());
        document.querySelectorAll<HTMLButtonElement>('[data-retained]').forEach(b => b.onclick = () => this.o.visit(Number(b.dataset.retained)));
        document.querySelectorAll<HTMLButtonElement>('[data-identify]').forEach(b => b.onclick = () => { identifyArtifact(this.save, b.dataset.identify!); this.commit(); this.collection(); });
        document.querySelector<HTMLSelectElement>('#cosmetic-stamp')?.addEventListener('change', e => { this.d.stamp = (e.target as HTMLSelectElement).value; this.commit(); });
        document.querySelector<HTMLButtonElement>('#export-receipt')?.addEventListener('click', () => this.exportReceipt());
    }
    private readNote(id: number, preservePage=false) {
        this.lastNote=id;this.lastBookMode='read';
        const n = this.d.notes.find(n => n.id === id); if (!n) return;
        const entries: NotebookEntry[] = [{ id: `note-${id}`, title: n.title, text: n.text, html: `<div class="book-actions"><button id="edit-note">Edit this sheet</button><button id="back-notes">All notes</button></div>` }];
        if (n.strokes.length) entries.push({ id: `sketch-${id}`, title: 'A thought in lines', html: `<canvas class="book-drawing" data-read-sketch="${id}" width="720" height="360" aria-label="Saved sketch"></canvas>` });
        const excerpt = n.excerpt ?? n.digitalExcerpt;
        if (excerpt) entries.push({ id: `excerpt-${id}`, title: excerpt.label, text: excerpt.text, className: 'book-evidence', html: `<button id="read-note-source">Read ${n.digitalExcerpt ? 'digital' : 'retained'} source ↗</button>` });
        this.book.show('notes', entries, () => {
            this.noteContents();
            document.querySelector<HTMLButtonElement>('#edit-note')?.addEventListener('click', () => this.note(id));
            document.querySelector<HTMLButtonElement>('#back-notes')?.addEventListener('click', () => this.notebook('notes'));
            const canvas = document.querySelector<HTMLCanvasElement>('[data-read-sketch]'); if (canvas) paintNote(canvas, n);
            document.querySelector<HTMLButtonElement>('#read-note-source')?.addEventListener('click', () => {
                if (n.excerpt) this.o.visit(n.excerpt.file);
                else if (this.o.atDesk()) void this.desktop('files', n.digitalExcerpt!.id);
                else this.o.notify('Visit the desk computer to read this digital source.');
            });
        }, preservePage ? undefined : `note-${id}`);
    }
    note(id: number, atBoard = false, blankSheet=this.lastSheet) {
        this.lastNote=id;this.lastBookMode='edit';
        const existing=this.d.notes.find(n=>n.id===id);
        if(!existing&&id!==0)return;
        let n:PaperNote=existing??{id:0,sheet:blankSheet,title:'',text:'',paper:this.d.sheetPapers?.[blankSheet]??'cream',strokes:[]};
        let committed=n.id!==0;
        const sheet = n.sheet??this.d.notes.indexOf(n), totalSheets=noteCapacity(this.save);
        this.lastSheet=sheet;
        const retain=()=>{if(committed)return;if(!n!.text&&!n!.title&&!n!.strokes.length&&!n!.excerpt&&!n!.digitalExcerpt)return;const saved=createNote(this.save);if(!saved)return;Object.assign(saved,n,{id:saved.id,sheet});n=saved;committed=true;this.lastNote=n.id;};
        const pinned = this.d.pins.some(p => p.kind!=='sticky'&&p.note === id), locked = pinned && !(atBoard && this.o.atDesk());
        const left = `<div class="book-writing note-editor"><label>Sheet title <input id="note-title" placeholder="Untitled sheet" maxlength="100" value="${esc(n.title)}" ${locked ? 'disabled' : ''}></label><label>Your notes <textarea id="note-text" maxlength="8000" rows="6" ${locked ? 'disabled' : ''}>${esc(n.text)}</textarea></label><div class="book-actions book-marginalia"><button id="back-notes">${atBoard ? 'Back to board' : 'Index'}</button><button id="read-note">Read this sheet</button><button id="delete-note" class="tear-sheet" aria-label="Tear out and recycle this sheet" title="Tear out sheet" ${locked ? 'disabled' : ''}>Tear out</button></div><div id="delete-confirm" hidden>Recycle this sheet and its connections?<br><button id="confirm-delete">Recycle</button> <button id="cancel-delete">Keep sheet</button></div></div>`;
        const right = `<div class="book-art-tools stationery-roll" aria-label="Drawing materials"><label>Paper <select id="note-paper" ${locked ? 'disabled' : ''}>${Object.keys(PAPERS).map(p => `<option ${p === n.paper ? 'selected' : ''}>${p}</option>`).join('')}</select></label><label>Ink <select id="note-ink" ${locked ? 'disabled' : ''}>${Object.keys(INKS).map(p => `<option>${p}</option>`).join('')}</select></label><label>Pen <select id="note-tool" ${locked ? 'disabled' : ''}><option value="marker">Pencil</option><option value="broad">Pen</option><option value="eraser">Eraser</option></select></label><button id="sketch-undo" ${locked ? 'disabled' : ''}>Undo</button></div><canvas id="note-sketch" width="720" height="360" tabindex="0" aria-label="Sketch sheet. Draw with a mouse or pen."></canvas><p id="note-status" role="status">${locked ? 'Pinned sheets can be edited at the desk board.' : 'Your writing is saved automatically.'}</p><div class="book-editor-clippings">${n.digitalExcerpt ? `<blockquote class="book-clipping"><span class="book-caption">${esc(n.digitalExcerpt.label)}</span><p>${esc(n.digitalExcerpt.text)}</p><button id="digital-source" aria-label="Read digital source" title="Read source">↗</button></blockquote>` : ''}${n.excerpt ? `<blockquote class="book-clipping"><span class="book-caption">${esc(n.excerpt.label)}</span><p>${esc(n.excerpt.text)}</p><button id="clip-source" aria-label="Read source" title="Read source">↗</button></blockquote>` : ''}</div>`;
        this.book.editor(left, right, () => {},{index:sheet,total:totalSheets,turn:direction=>this.sheet(sheet+direction)});
        this.noteContents();
        const q = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
        const canvas = q<HTMLCanvasElement>('#note-sketch');
        let active: SketchStroke | null = null, timer: ReturnType<typeof setTimeout> | undefined;
        const draw = () => {
            canvas.closest<HTMLElement>('.notebook-book')!.style.setProperty('--book-paper', PAPERS[n.paper]);
            paintNote(canvas, active ? { ...n!, strokes: [...n!.strokes, active] } : n!);
        };
        const flush = () => {
            clearTimeout(timer);
            if (active) {
                n.strokes.push(active);
                active = null;
            }
            retain();
            if(committed)this.commit();
        };
        const changed = () => {
            clearTimeout(timer);
            timer = setTimeout(flush, 300);
        };
        this.book.onLeave(flush);
        q<HTMLInputElement>('#note-title').oninput = e => {
            n.title = (e.target as HTMLInputElement).value;
            changed();
        };
        q<HTMLTextAreaElement>('#note-text').oninput = e => {
            n.text = (e.target as HTMLTextAreaElement).value;
            changed();
            this.o.sound('keyboard');
        };
        q<HTMLSelectElement>('#note-paper').onchange = e => {
            n.paper = (e.target as HTMLSelectElement).value as PaperNote['paper'];
            (this.d.sheetPapers??={})[sheet]=n.paper;this.commit();
            q('.note-editor').dataset.paper = n.paper;
            draw();
            changed();
        };
        const point = (e: PointerEvent): [
            number,
            number
        ] => {
            const r = canvas.getBoundingClientRect();
            return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))];
        };
        canvas.onpointerdown = e => {
            if (locked || e.button !== 0 || active)
                return;
            const total = this.d.notes.reduce((sum, n) => sum + n.strokes.reduce((sum, s) => sum + s.points.length, 0), 0);
            if (n.strokes.length >= 160 || n.strokes.reduce((sum, s) => sum + s.points.length, 0) >= 9400 || total >= 59400) {
                this.o.notify('Sketch capacity reached. Undo a stroke or use written notes.');
                return;
            }
            const tool = q<HTMLSelectElement>('#note-tool').value;
            active = { tool: tool === 'eraser' ? 'eraser' : 'marker', color: q<HTMLSelectElement>('#note-ink').value as SketchStroke['color'], width: tool === 'broad' ? .012 : .004, points: [point(e)] };
            canvas.setPointerCapture(e.pointerId);
            draw();
        };
        canvas.onpointermove = e => {
            if (active && active.points.length < 600) {
                active.points.push(point(e));
                draw();
            }
        };
        const finish = () => {
            if (active) {
                flush();
                draw();
                this.o.sound('pencil');
            }
        };
        canvas.onpointerup = finish;
        canvas.onpointercancel = finish;
        canvas.onlostpointercapture = finish;
        q<HTMLButtonElement>('#sketch-undo').onclick = () => {
            finish();
            n.strokes.pop();
            flush();
            draw();
        };
        q<HTMLButtonElement>('#digital-source')?.addEventListener('click', () => { if (!this.o.atDesk()) this.o.notify('Visit the desk computer to open this digital source.'); else void this.desktop('files', n.digitalExcerpt!.id); });
        q<HTMLButtonElement>('#back-notes').onclick = () => {if(atBoard)this.board();else document.querySelector<HTMLButtonElement>('#book-contents')!.click();};
        q<HTMLButtonElement>('#read-note').onclick = () => {flush();if(committed)this.readNote(n!.id);else this.o.notify('This sheet is unwritten.');};
        q<HTMLButtonElement>('#delete-note').onclick = () => {
            q('#delete-confirm').hidden = false;
            q('#cancel-delete').focus();
        };
        q<HTMLButtonElement>('#cancel-delete').onclick = () => {
            q('#delete-confirm').hidden = true;
        };
        q<HTMLButtonElement>('#confirm-delete').onclick = () => {
            flush();
            deleteNote(this.save, n!.id);
            this.commit();
            atBoard ? this.board() : this.notebook('notes');
        };
        if (n.excerpt)
            q<HTMLButtonElement>('#clip-source').onclick = () => this.o.visit(n.excerpt!.file);
        draw();
    }
    clip(file: number, text: string, label: string) {
        const n = createNote(this.save);
        if (!n) {
            this.o.notify('Your notebook is full. Recycle a sheet or order personal stationery.');
            return;
        }
        n.title = `Extract · ${label}`.slice(0, 100);
        n.excerpt = { file, text: text.slice(0, 6000), label: label.slice(0, 200) };
        this.commit();
        this.o.sound('pin');
        this.note(n.id);
    }
    collection() { this.notebook('collection'); }
    private collectionEntries(): NotebookEntry[] {
        const d = this.d;
        return [
            { id: 'collection-title', title: 'Things I was not asked to find', text: `${d.collected.length} / 24 objects retained. Identification costs 4 credits; finding an object is always free. Leads are available by desk email.`, className: 'book-introduction' },
            ...ARTIFACTS.map((a, i) => {
                const found = d.collected.includes(a.id), known = found || d.identified.includes(a.id);
                return { id: `artifact-${a.id}`, contentsLabel: `Catalogue ${String(i+1).padStart(2,'0')} / ${known ? a.name : 'Unidentified'}`, title: '', html: `<article class="catalogue-entry ${found ? 'collected' : ''}" data-artifact="${a.id}">${known ? artifactSketch(a.id, a.name) : `<div class="catalogue-blank" aria-hidden="true">${String(i + 1).padStart(2,'0')}</div>`}<small>CATALOGUE ${String(i + 1).padStart(2,'0')}</small><h4>${known ? esc(a.name) : 'An unidentified object'}</h4><p>${found ? esc(a.description) : known ? 'Name retained. Object still at large.' : ''}</p>${found ? '<small>COLLECTED / RETAINED</small>' : known ? '<small>IDENTIFIED / NOT YET FOUND</small>' : `<button data-identify="${a.id}" ${this.save.credits < 4 ? 'disabled' : ''}>Identify · 4 cr</button>`}</article>` };
            }),
            ...REWARDS.map(r => ({ id: `reward-${r.at}`, title: r.at === 4 ? 'Incidental achievements' : '', text: `${d.rewards.includes(r.at) ? '✓' : '○'} ${r.at} objects · ${r.name}` })),
            { id: 'stamp-selection', title: 'My working stamp', html: `<label class="book-stamp-controls">File stamp <select id="cosmetic-stamp"><option value="">Plain</option>${REWARDS.filter(r => r.kind === 'stamp' && d.rewards.includes(r.at)).map(r => `<option ${r.name === d.stamp ? 'selected' : ''}>${r.name}</option>`).join('')}</select></label><p class="book-introduction">Apply it explicitly while reading a file. It carries no evidential authority.</p>` }
        , ...this.certificateEntries()];
    }
    private certificateEntries():NotebookEntry[] {
        return this.d.rewards.includes(24) ? [{id:'collection-certificate',title:'Certificate of incidental thoroughness',html:`<article class="book-certificate"><h3>Awarded to the archivist of this shift</h3><p>For finding all twenty-four things nobody formally requested.</p><p>Shift ${this.save.seed} · ${shiftDuration(this.save.playSeconds)} on the clock.</p><p>Signed: Accounts, reluctantly countersigned by Facilities.</p></article>`}] : [];
    }
    board(){this.o.board();}
    refreshMail() {
        const panel = document.querySelector<HTMLElement>('.panel[data-screen="computer"]');
        const inbox = panel?.querySelector<HTMLButtonElement>('[data-mail-tab="inbox"]');
        if (!panel)
            return;
        const delivered = deliveredMail(this.save);
        if (inbox) inbox.querySelector('[data-folder-label]')!.textContent = `Inbox (${delivered.filter(m => !m.read).length})`;
        if (inbox?.classList.contains('selected')) {
            const selected = Number(panel.querySelector('.mail-paper')?.getAttribute('data-message-id'));
            const index = panel.querySelector('.mail-index')!;
            const html = computerMessages(delivered, selected);
            if (index.innerHTML !== html) index.innerHTML = html;
            panel.querySelectorAll<HTMLButtonElement>('[data-mail]').forEach(b => b.onclick = () => this.computer('inbox', Number(b.dataset.mail)));
        }
        const status = panel.querySelector<HTMLElement>('#pc-queue-status');
        if (status)
            status.textContent = `${this.d.mail.filter(m => m.direction === 'in' && m.due > this.save.playSeconds).length} replies queued`;
    }
    computerHome() {
        if (!this.o.atDesk()) { this.o.notify('Visit the computer at your W4 desk.'); return; }
        this.desktopRequest++;
        this.displayComputer('Records Desktop', '', false, null);
        this.bindComputerMenu();
    }
    closeComputerApp() {
        if (!document.querySelector('.pc-app')) return false;
        document.querySelector<HTMLButtonElement>('[data-pc-command="desktop"]')?.click();
        return true;
    }
    computer(tab = 'desktop', selected?: number) {
        if (tab === 'desktop') { this.computerHome(); return; }
        if (!this.o.atDesk()) {
            this.o.notify('Visit the computer at your W4 desk.');
            return;
        }
        const d = this.d, delivered = deliveredMail(this.save), messages = tab === 'sent' ? d.mail.filter(m => m.direction === 'out') : delivered;
        const m = selected ? openMail(this.save, selected) : null;
        if (m)
            this.commit();
        this.displayComputer(tab === 'sent' ? 'Sent items' : 'Inbox', `${computerFolders(tab, delivered.filter(m => !m.read).length)}<div class="mail-layout"><aside class="mail-index" aria-label="Message list">${computerMessages(messages, selected)}</aside><article class="mail-paper" data-message-id="${selected ?? ''}">${m ? `<span class="eyebrow">${m.direction === 'in' ? 'FROM' : 'TO'} ${esc(CONTACTS[m.recipient])}</span><h3>${esc(m.subject)}</h3><div class="mail-body">${esc(m.text || '(No additional message.)')}</div>${m.attachments.map(id => this.save.inspected.includes(id) ? `<p><button data-mail-record="${id}">Enclosure · ${esc(reference(id))}</button></p>` : `<p class="filing-lead">Filing reference: ${esc(reference(id))}. Visit the original to read it.</p>`).join('')}<p class="mail-signature">${esc(CONTACTS[m.recipient])}<br>${({ martin: 'Please keep the context proportionate.', tess: 'Keep the context attached.', facilities: 'Resolved means the ticket, not necessarily the problem.', accounts: 'Please retain this message until further retention advice.' })[m.recipient]}</p><button id="reply-mail">Reply ↗</button>` : '<div class="pc-mail-welcome"><span class="pc-envelope-large" aria-hidden="true">✉</span><span class="pc-welcome-label">ARCHIVE MAIL / PERSONAL FOLDERS</span><h3>Your correspondence, in triplicate.</h3><p>Select a message on the left, or compose a new enquiry.</p><small>Replies arrive during active shift time.<br>The machine has no concept of urgency.</small></div>'}</article></div><p class="pc-mail-help">Four contacts. Optional correspondence. Please retain the awkward replies.</p>`);
        this.bindComputerMenu();
        document.querySelectorAll<HTMLButtonElement>('[data-mail-tab]').forEach(b => b.onclick = () => b.dataset.mailTab === 'compose' || b.dataset.mailTab === 'drafts' ? this.compose() : this.computer(b.dataset.mailTab));
        document.querySelectorAll<HTMLButtonElement>('[data-mail]').forEach(b => b.onclick = () => this.computer(tab, Number(b.dataset.mail)));
        document.querySelectorAll<HTMLButtonElement>('[data-mail-record]').forEach(b => b.onclick = () => this.o.visit(Number(b.dataset.mailRecord)));
        const reply = () => this.compose({ ...defaultDraft(), recipient: m!.recipient, caseId: m!.caseId, topic: m!.topic === 'inquiry' ? 'evidence' : m!.topic, artifact: m!.artifact });
        document.querySelector<HTMLButtonElement>('#reply-mail')?.addEventListener('click', reply);
        if (m) {
            const draft = { ...defaultDraft(), recipient: m.recipient, caseId: m.caseId, topic: m.topic, artifact: m.artifact };
            const node = conversationNode(this.save, this.o.archive(), draft);
            const sheet = document.createElement('details');
            sheet.className = 'pc-reply-choices';
            document.querySelector('.mail-paper')!.append(sheet);
            sheet.innerHTML = `<summary>Response options</summary><span class="eyebrow">YOUR REPLY / ${node.stage.toUpperCase()}</span><h3>What will you say?</h3><p>Choose a response to prepare your reply. Add a personal note or enclosures before sending.</p><div class="pc-response-options">${node.options.map((option, i) => `<button type="button" data-prepare-response="${esc(option.id)}" ${option.locked ? 'disabled' : ''}><small>0${i + 1} / ${option.intent.toUpperCase()}</small><strong>${esc(option.label)}</strong><span>${esc(option.locked ?? 'Prepare this reply ↗')}</span></button>`).join('')}</div>`;
            sheet.querySelectorAll<HTMLButtonElement>('[data-prepare-response]').forEach(b => b.onclick = () => this.compose({ ...draft, choice: b.dataset.prepareResponse }));
        }
    }
    compose(initial?: MailDraft) {
        if (!this.o.atDesk())
            return;
        const draft = structuredClone(initial ?? this.d.drafts[0] ?? defaultDraft());
        let attachmentQuery = '';
        const render = () => {
            const cases = mailCases(this.save,draft.recipient), c = cases.find(c => c.id === draft.caseId);
            if (!c && draft.caseId !== 'martin')
                draft.caseId = cases[0].id;
            if (draft.recipient !== 'martin' && draft.topic === 'martin')
                draft.topic = 'inquiry';
            const current = cases.find(c => c.id === draft.caseId);
            if(threadById(draft.caseId)&&['lead','location'].includes(draft.topic))draft.topic='inquiry';
            const candidates = [...draft.attachments];
            for (let i = this.save.inspected.length - 1; i >= 0 && candidates.length < 100; i--) {
                const id = this.save.inspected[i];
                if (!candidates.includes(id) && (!attachmentQuery || (`${reference(id)} ${this.o.archive().get(id).title}`).toLowerCase().includes(attachmentQuery)))
                    candidates.push(id);
            }
            const node = conversationNode(this.save, this.o.archive(), draft);
            if (draft.choice && !node.options.some(o => o.id === draft.choice && !o.locked)) draft.choice = undefined;
            this.displayComputer('New message', `${computerFolders('compose', deliveredMail(this.save).filter(m => !m.read).length)}<p class="pc-compose-hint">Select a subject so your message reaches the appropriate person.</p><form id="compose-form"><div class="mail-fields"><label>To <select id="mail-recipient">${Object.entries(CONTACTS).map(([id, name]) => `<option value="${id}" ${id === draft.recipient ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label><label>Case <select id="mail-case">${cases.map(c => `<option value="${c.id}" ${c.id === draft.caseId ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}${draft.recipient === 'martin' ? `<option value="martin" ${draft.caseId === 'martin' ? 'selected' : ''}>The revised assessment</option>` : ''}</select></label><label>Subject <select id="mail-topic">${(draft.caseId === 'martin' ? [['martin', 'Challenge the assessment']] : threadById(draft.caseId)?[['inquiry','Ask about the retained records'],['evidence','Request a correction']]:[['inquiry', 'Open an enquiry'], ['evidence', 'Submit a retained comparison'], ['lead', 'Ask for an object lead'], ['location', 'Request the precise drawer']]).map(([id, label]) => `<option value="${id}" ${id === draft.topic ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div>${['lead', 'location'].includes(draft.topic) ? `<label>Object <select id="mail-artifact">${ARTIFACTS.filter(a => a.caseId === current?.id).map((a, i) => `<option value="${a.id}" ${a.id === draft.artifact ? 'selected' : ''}>${this.d.collected.includes(a.id) || this.d.identified.includes(a.id) ? esc(a.name) : `Unidentified keepsake ${i + 1}`}</option>`).join('')}</select></label>` : ''}<label>Personal note (optional) <textarea id="mail-body" rows="7" maxlength="4000" placeholder="Your own words, retained for the correspondence file.">${esc(draft.body)}</textarea></label><fieldset><legend>Attach up to two opened records</legend><label>Find an opened record <input id="attachment-query" maxlength="100" value="${esc(attachmentQuery)}" placeholder="Title or filing reference"></label><button type="button" id="find-attachments">Find records</button><small>Showing up to 100 matches, most recent first.</small>${[0, 1].map(i => `<label>Attachment ${i + 1}<select data-attachment="${i}"><option value="">None</option>${candidates.map(id => `<option value="${id}" ${id === draft.attachments[i] ? 'selected' : ''}>${esc(reference(id))} · ${esc(this.o.archive().get(id).title)}</option>`).join('')}</select></label>`).join('')}</fieldset><div class="panel-foot"><button type="button" id="save-draft">Save draft & close</button><button class="primary">Send message</button></div><p id="mail-status" role="status">The selected response and physical evidence determine the outcome. Your optional note is retained verbatim, not interpreted.</p></form>`);
            const responseHost = document.querySelector<HTMLElement>('.pc-response-panel')!;
            responseHost.innerHTML = `<span class="eyebrow">YOUR REPLY / ${node.stage.toUpperCase()}</span><h3>What will you say?</h3><p>Choose a response. Your note and enclosures stay in the monitor.</p><div class="pc-response-options">${node.options.map((option, i) => `<button type="button" data-response="${esc(option.id)}" aria-pressed="${draft.choice === option.id}" ${option.locked ? 'disabled' : ''}><small>0${i + 1} / ${option.intent.toUpperCase()}</small><strong>${esc(option.label)}</strong><span>${esc(option.locked ?? (draft.choice === option.id ? 'Selected for this message' : 'Select response'))}</span></button>`).join('')}</div><p>Original evidence unlocks stronger replies. There is always a way to keep asking.</p>`;
            responseHost.querySelectorAll<HTMLButtonElement>('[data-response]').forEach(b => b.onclick = () => {
                draft.choice = b.dataset.response; retain();
                responseHost.querySelectorAll<HTMLButtonElement>('[data-response]').forEach(button => { button.setAttribute('aria-pressed', String(button === b)); button.querySelector('span')!.textContent = button === b ? 'Selected for this message' : (node.options.find(o => o.id === button.dataset.response)?.locked ?? 'Select response'); });
            });
            document.querySelectorAll<HTMLButtonElement>('[data-mail-tab]').forEach(b => b.onclick = () => {
                retain();
                b.dataset.mailTab === 'compose' || b.dataset.mailTab === 'drafts' ? this.compose() : this.computer(b.dataset.mailTab);
            });
            const q = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
            const retain = () => {
                this.d.drafts = [structuredClone(draft)];
                this.o.write();
            };
            this.bindComputerMenu(retain);
            let timer: ReturnType<typeof setTimeout> | undefined;
            this.o.cleanup(() => {
                clearTimeout(timer);
                retain();
            });
            q<HTMLSelectElement>('#mail-recipient').onchange = e => {
                draft.choice = undefined;
                draft.recipient = (e.target as HTMLSelectElement).value as Contact;
                const keep=mailCases(this.save,draft.recipient).some(c=>c.id===draft.caseId);
                draft.caseId = keep?draft.caseId:mailCases(this.save,draft.recipient)[0]?.id??'martin';
                draft.topic = 'inquiry';
                draft.artifact = `${draft.caseId}:0`;
                retain();
                render();
            };
            q<HTMLSelectElement>('#mail-case').onchange = e => {
                draft.choice = undefined;
                draft.caseId = (e.target as HTMLSelectElement).value;
                draft.topic = draft.caseId === 'martin' ? 'martin' : 'inquiry';
                draft.artifact = `${draft.caseId}:0`;
                retain();
                render();
            };
            q<HTMLSelectElement>('#mail-topic').onchange = e => {
                draft.choice = undefined;
                draft.topic = (e.target as HTMLSelectElement).value as MailTopic;
                retain();
                render();
            };
            q<HTMLSelectElement>('#mail-artifact')?.addEventListener('change', e => {
                draft.artifact = (e.target as HTMLSelectElement).value;
                retain();
            });
            q<HTMLTextAreaElement>('#mail-body').oninput = e => {
                draft.body = (e.target as HTMLTextAreaElement).value;
                clearTimeout(timer);
                timer = setTimeout(retain, 300);
                this.o.sound('keyboard');
            };
            document.querySelectorAll<HTMLSelectElement>('[data-attachment]').forEach(b => b.onchange = () => {
                draft.attachments = Array.from(document.querySelectorAll<HTMLSelectElement>('[data-attachment]')).filter(s => s.value !== '').map(s => Number(s.value));
                retain();
            });
            q<HTMLButtonElement>('#find-attachments').onclick = () => {
                attachmentQuery = q<HTMLInputElement>('#attachment-query').value.trim().toLowerCase();
                retain();
                render();
            };
            q<HTMLInputElement>('#attachment-query').onkeydown = e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    q<HTMLButtonElement>('#find-attachments').click();
                }
            };
            q<HTMLButtonElement>('#save-draft').onclick = () => {
                retain();
                this.computer('inbox');
            };
            q<HTMLFormElement>('#compose-form').onsubmit = e => {
                e.preventDefault();
                try {
                    if (!draft.choice) throw new Error('Choose one of the three responses before sending.');
                    const result = sendMail(this.save, this.o.archive(), draft);
                    this.o.cleanup(() => {
                    });
                    clearTimeout(timer);
                    this.d.drafts = [];
                    this.commit();
                    this.o.sound('mail');
                    this.computer('sent');
                    this.o.notify(result.duplicate ? 'That enquiry already has a reply or is awaiting one. Check the existing thread.' : 'Message sent. Your reply will arrive during the shift.');
                }
                catch (error) {
                    q('#mail-status').textContent = error instanceof Error ? error.message : 'Message could not be sent.';
                }
            };
        };
        render();
    }
    notices() {
        const stage = Math.min(5, Math.floor((this.save.clues.length + this.d.resolved.length * 3) / 4));
        this.display('notices', 'Notices to all concerned', 'PUBLIC NOTICEBOARD / NOT YOUR PERSONAL BOARD', `<p class="panel-intro">Unusual records, notebook theories and computer correspondence are optional. Martin still wants one sentence; you can keep exploring after finding it.</p><div class="office-outcomes">${threadNotices(this.save).map(t=>`<article data-outcome="${t.id}"><h3>${esc(t.title)}</h3><p>${esc(t.notice)}</p></article>`).join('')}</div><div class="office-notices">${NOTICES.map((n, i) => `<article class="paper-${['cream', 'sage', 'rose', 'blue'][i % 4]}"><span class="eyebrow">NOTICE ${String(i + 1).padStart(2, '0')}</span><p>${esc(n)}</p></article>`).join('')}</div><article class="mug-dispute"><h3>Re: the blue mug</h3>${MUG_DISPUTE.slice(0, stage + 1).map((m, i) => `<p><span class="mono">AMENDMENT ${i + 1}</span><br>${esc(m)}</p>`).join('')}</article>`);
    }
    receipt() { this.notebook('log'); }
    private activityRows(): [string, string][] {
        const d = this.d;
        return [['Time on shift', shiftDuration(this.save.playSeconds)], ['Files inspected', String(this.save.inspected.length)], ['Files marked searched', String(this.save.searched.length)], ['Discoveries retained', String(this.save.clues.length)], ['Archive stories resolved', String(this.save.claimedStories.length)], ['Objects rescued', `${d.collected.length} / 24`], ['Correspondence cases resolved', `${d.resolved.length} / ${this.save.recordPack===1?9:6}`], ['Messages sent since stationery issued', String(d.counters.mailSent)], ['Sheets written since stationery issued', String(d.counters.notesWritten)]];
    }
    private logEntries(): NotebookEntry[] {
        const d = this.d;
        const entries: NotebookEntry[] = [
            { id: 'log-title', title: 'One unusually specific shift', text: `Activity ledger / shift ${this.save.seed}. Stationery issued at ${shiftDuration(d.counters.issuedAt)} on shift. Earlier activity has not been reconstructed.`, className: 'book-introduction' },
            ...this.activityRows().map(([label,value], i) => ({ id: `activity-${i}`, title: '', html: `<dl class="book-ledger"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></dl>` })),
            { id: 'log-amount', title: 'Amount owed: one quiet moment', text: 'Payment status: pending departmental agreement.', html: '<button id="export-receipt">Download receipt</button>' }
        ];
        entries.push(...this.certificateEntries());
        return entries;
    }
    private exportReceipt() {
        const text = ['THE ARCHIVE', 'Statement of incidental activity', '', ...this.activityRows().map(([label,value]) => `${label}: ${value}`), '', `Stationery issued at ${shiftDuration(this.d.counters.issuedAt)} on shift. Earlier activity has not been reconstructed.`, 'Amount owed: one quiet moment.', 'Payment status: pending departmental agreement.'].join('\n');
        const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' })), a = document.createElement('a');
        a.href = url; a.download = 'archive-shift-receipt.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
