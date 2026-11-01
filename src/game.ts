import { recordParagraphs } from './ui/record-format';
import { THREADS } from './content/packs/records';
import {StationeryScreens} from './desk/stationery-ui';
import {STATIONERY_BACKUP_KEY,TOOL_NAMES,DRINKS,finishVending,drinkCan,recycleCan} from './desk/stationery';
import {officeTime} from './shift-clock';
import { folderFrame } from './ui/folder';
import type { NotebookEntry } from './ui/notebook';
import { decorateInterface } from './ui/surfaces';
import './styles/surfaces.css';
import { DeskScreens } from './desk/screens';
import { ARTIFACTS } from './desk/content';
import { artifactPlacements, collectArtifact, deliveredMail, updateCorrespondence, deskFor, DESK_BACKUP_KEY, DESKTOP_BACKUP_KEY } from './desk/state';
import './styles/desk.css';
import './styles/physical-life.css';
import { titleScreen, assignmentScreen, tutorialScreen } from './ui/screens';
import { ShiftSession, shiftDuration } from './runtime/shift-session';
import { escapeHtml as esc, panel as shell, setText, setHtml } from './ui/dom';
import { documentClass, documentLetterhead, documentColophon } from './ui/document';
import { carriedDocuments, inventoryCapacity, retainOriginal, equipDocument, stowHeld, takeCopy, storeDocument, printerOriginal, insertOriginal, collectPrinter, shredCopy, availableAtDesk } from './inventory';
import { readableDocument } from './pagination';
import { STORAGE, UNITS_BY_WING, containerFor, parseContainer, isContainer } from './storage';
import { physicalFor, containerFiles, containerLoad, containerLabel, capacity, currentContainer, takeFile, movedNotes, itemName, SURFACES, type Container, type Surface } from './physical';
import { toRoom, toWorld, NOOK } from './hub-layout';
import { EQUIPMENT } from './appliances';
import { loadModels } from './models';
import { officeFor } from './office-state';
import { mountPrintedCopy } from './printed-copy';
import { mountWhiteboard } from './whiteboard';
import './style.css';
import { OfficeWorld, type Target } from './world';
import { OfficeAudio } from './audio';
import { createArchive, getHint, TUTORIAL_ID } from './content/generator';
import { ALL_STORIES as STORIES } from './content/expanded-stories';
import { ensureSource, SOURCE_MANIFEST } from './content/sources';
import { openComparison } from './comparison';
import { UPGRADES, buy, readPage, freshSave, inspect, loadSave, persist, validateSave, collectVoucher, pendingVoucherValue, redeemVouchers, setMarker, backupExpansion, backupLegacy, backupEnvironment, backupInventory, ProgressIndex } from './state';
import { DEPARTMENTS, MONTHS, PHRASE, WINGS, COLUMNS, ROWS, TOTAL, FIRST_ROW_Z, fileId, location, reference } from './archive';
import type { Save, UpgradeId, CabinetMarker, ArchiveDocument } from './types';
export async function mountGame() {
const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const icon = (s: string) => `<span aria-hidden="true">${s}</span>`;
const app = $('#app');
app.innerHTML = '<div class="fatal"><h1>Opening the office…</h1><p>Loading locally bundled furniture.</p></div>';
while (true) {
    try {
        await loadModels();
        break;
    }
    catch {
        app.innerHTML = '<div class="fatal"><h1>Furniture could not load.</h1><p>Check that the local models folder is available.</p><button id="retry-models">Retry local assets</button></div>';
        await new Promise<void>(resolve => {
            $('#retry-models').onclick = () => resolve();
        });
    }
}
app.innerHTML = `<canvas id="world" aria-label="First-person archive. Use WASD to move, mouse to look, and E to interact."></canvas>
 <div class="vignette" aria-hidden="true"></div>
 <div id="hud" hidden>
  <header class="hud-top"><div class="brand"><span class="brand-mark">A</span><div>THE ARCHIVE<span>RECORDS & RETENTION</span></div></div><div class="office-time" aria-label="Office time and active shift duration"><span id="office-day"></span><span id="office-local-time"></span><small>TIME ON SHIFT <span id="shift-time">00:00:00</span></small></div><button id="credits-button" class="credit-button" title="Open supplies catalogue"><span>SUPPLY CREDIT</span><strong id="credits">12</strong></button></header>
  <aside id="assignment" class="assignment"><span class="eyebrow">MARTIN’S REQUEST</span><p>“${PHRASE}”</p><span class="assignment-foot">Find and read the page containing this phrase.</span><button id="hint-button" class="text-button">Filing notes ↗</button></aside>
  <div id="crosshair" aria-hidden="true">+</div>
  <div id="interaction" class="interaction" hidden></div><div id="held-status" hidden></div>
  <footer class="hud-bottom"><div id="area">W4 / WORK NOOK <span>YOUR DESK</span></div><nav aria-label="Archive tools"><button data-tool="inventory"><kbd>I</kbd> Files <span id="inventory-count">0/2</span></button><button data-tool="map"><kbd>M</kbd> Floor plan</button><button data-tool="notebook"><kbd>N</kbd> Notebook <span id="clue-count"></span></button><button data-tool="supplies"><kbd>U</kbd> Supplies</button><button data-tool="pause"><kbd>Esc</kbd> Menu</button></nav></footer>
 </div>
 <aside id="performance-meter" hidden aria-label="Performance meter" aria-live="off"></aside><aside id="mouse-help" hidden role="status"><span id="mouse-status">Mouse capture was denied. You can retry without reloading.</span> <button id="retry-mouse">Retry mouse capture</button> Hold and drag; keep dragging at an edge to turn, or use Q / R. <a id="external-browser" target="_blank" rel="noopener">Open in browser ↗</a><button id="dismiss-mouse-help" aria-label="Dismiss mouse help">×</button></aside><div id="overlay"></div><div id="toasts" role="status" aria-live="polite"></div><div id="storage-alert" role="alert" hidden></div>
 <input id="import-file" type="file" accept="application/json,.json" hidden>`;
$('#external-browser').setAttribute('href', window.location.href);
$('#dismiss-mouse-help').onclick = () => {
    $('#mouse-help').hidden = true;
};
$('#retry-mouse').onclick = e => {
    e.stopPropagation();
    if (mode === 'play') {
        audio.start();
        world.lock();
    }
};
let readerContainer: Container | null = null;
let readerRequest = 0;
let finishBoard: (() => void) | undefined;
let loaded: {
    save: Save;
    error?: string;
    notice?: string;
};
try {
    loaded = loadSave(localStorage);
}
catch {
    loaded = { save: freshSave(), error: 'Browser storage is unavailable. Use exported backups to retain progress.' };
}
let save = loaded.save, archive = createArchive(save.seed, save.legacy, save.earlyVouchers, save.placementVersion, save.recordPack), mode = 'title', pageIndex = 0, sheetIndex = 0, currentId: number | null = null, highlight = '', revealed = new Set<string>(), cellComment = '';
let switchTimer: ReturnType<typeof setTimeout> | undefined, saveTimer = 0, ambientTimer = 0, storageBlocked = !!loaded.error;
addEventListener('blur', () => audio.setSceneState(false, false));
const shiftSession = new ShiftSession();
function accrueShift() {
    save.playSeconds += shiftSession.advance(performance.now(), mode, save.started, windowFocused, document.hidden);
}
let windowFocused = document.hasFocus();
addEventListener('focus', () => {
    shiftSession.reset();
    windowFocused = true;
});
document.addEventListener('visibilitychange', () => {
    accrueShift();
    shiftSession.reset();
    windowFocused = !document.hidden && document.hasFocus();
});
addEventListener('blur', () => {
    accrueShift();
    shiftSession.reset();
    windowFocused = false;
});
const progress = new ProgressIndex();
progress.rebuild(save);
const audio = new OfficeAudio();
let world: OfficeWorld;
try {
    world = new OfficeWorld($('#world'), save);
}
catch (e) {
    app.innerHTML = `<div class="fatal"><span class="eyebrow">THE ARCHIVE IS CLOSED</span><h1>We couldn’t open the office.</h1><p>This game needs a desktop browser with WebGL 2 and hardware acceleration enabled. Try current Chrome, Edge, or Firefox.</p><p>${esc(e instanceof Error ? e.message : 'Renderer unavailable')}</p><button onclick="location.reload()">Try again</button></div>`;
    throw e;
}
function preferences() {
    audio.setVolume(save.settings.volume);
    world.setSettings(save.settings);
    document.documentElement.style.setProperty('--document-size', `${save.settings.textSize}px`);
    document.body.classList.toggle('reduced-motion', save.settings.reducedMotion);
}
preferences();
let placements = artifactPlacements(save.seed);
let deliveredCount = deliveredMail(save).length;
const deskScreens = new DeskScreens({
    save: () => save, archive: () => archive, atDesk: () => world.atWorkNook(),
    show, write, notify, sound: name => audio.sound(name),
    board:()=>stationery.board(),
    printing: () => world.stats().printing,
    printer: () => showPrinter(),
    cleanup: callback => {
        finishBoard = callback;
    }, sync: () => world.syncDesk(save),
    visit: id => void visit(id), discoveryEntries
});
const stationery=new StationeryScreens({save:()=>save,show,commit:()=>{write();world.syncDesk(save);world.syncPhysical();},notify,resume,atDesk:()=>world.atWorkNook(),note:id=>deskScreens.note(id,true),sound:()=>audio.sound('paper')});
function notify(text: string, sound = true) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    $('#toasts').append(el);
    if (sound)
        audio.sound('message');
    setTimeout(() => el.remove(), 6500);
}
function storageWarning(text: string) {
    const el = $('#storage-alert');
    el.hidden = false;
    el.replaceChildren();
    const span = document.createElement('span');
    span.textContent = text;
    el.append(span);
    const b = document.createElement('button');
    b.textContent = 'Export backup';
    b.onclick = exportSave;
    el.append(b);
}
if (loaded.error)
    storageWarning(loaded.error);
if (loaded.notice)
    notify(loaded.notice);
function write() {
    accrueShift();
    updateHUD();
    progress.sync(save);
    world.snapshot(save);
    if (storageBlocked)
        return;
    try {
        const error = persist(save, localStorage);
        if (error) {
            storageBlocked = true;
            storageWarning(error);
        }
    }
    catch {
        storageBlocked = true;
        storageWarning('Storage unavailable. Export a backup before closing the game.');
    }
}
function updateHUD() {
    setText($('#inventory-count'), `${carriedDocuments(physicalFor(save)).length}/${inventoryCapacity(save)}`);
    setText($('#credits'), String(save.credits));
    setText($('#clue-count'), save.clues.length ? `(${save.clues.length})` : '');
    $('#assignment').classList.toggle('completed', save.completed);
    if (save.completed)
        $('#assignment .assignment-foot').textContent = 'Phrase found. The archive is still yours.';
}
const toolHelpShown=new Set<string>();
const toolHelp:Record<string,string>={inventory:'Retain carries an original. F reads it; G places it in aimed storage. Originals and printed copies share your bag.',notebook:'Write notes, sketch or clip a passage from an open record. The pinboard at your desk connects your notes; discoveries stay optional.',map:'Select a filing location for its reference. R marks rear drawers; WC wall cabinets; BX file boxes. Map selection never moves you.',supplies:'Equipment is optional. Collect vouchers in files and redeem them at your W4 desk.',computer:'The computer holds existing digital files, mail and a partial batch catalogue. Reading paper does not digitize it.'};
function show(next: string, html: string) {
    if (!['reader','reader-loading','reader-error'].includes(next)) readerRequest++;
    accrueShift();
    if (next !== mode) {
        if (next === 'notebook')
            audio.sound('notebook');
        else if (mode === 'notebook')
            audio.sound('notebook-close');
    }
    audio.setSceneState(false, !document.hidden && windowFocused);
    $('#mouse-help').hidden = true;
    {
        const finish = finishBoard;
        finishBoard = undefined;
        finish?.();
    }
    clearTimeout(switchTimer);
    mode = next;
    world.unlock();
    $('#hud').hidden = next === 'title';
    $('#overlay').innerHTML = html;
    $('#overlay').className = next === 'title' ? 'title-overlay' : 'modal-overlay';
    $('#overlay').querySelector<HTMLElement>('.panel')?.setAttribute('data-screen', next);
    decorateInterface($('#overlay'), next);
    document.querySelectorAll<HTMLButtonElement>('[data-drawer-back]').forEach(b=>b.onclick=()=>readerContainer?openStorage(readerContainer):resume());
    requestAnimationFrame(() => {const overlay=$('#overlay');if(!overlay.contains(document.activeElement))overlay.querySelector<HTMLElement>('button:not([disabled]),input,[tabindex="0"]')?.focus();});
    updateHUD();
    if(toolHelp[next]&&!toolHelpShown.has(next)){toolHelpShown.add(next);notify(toolHelp[next],false);}
}
function resume() {
    accrueShift();
    if (mode === 'notebook')
        audio.sound('notebook-close');
    audio.start();
    if (mode === 'whiteboard') {
        leaveWhiteboard();
        return;
    }
    {
        const finish = finishBoard;
        finishBoard = undefined;
        finish?.();
    }
    clearTimeout(switchTimer);
    mode = 'play';
    $('#overlay').innerHTML = '';
    $('#overlay').className = '';
    $('#hud').hidden = false;
    world.closeDrawer();
    currentId = null;
    world.lock();
    updateHUD();
    write();
}
function showTitle() {
    show('title', titleScreen(save));
}
function begin() {
    audio.start();
    if (save.started) {
        resume();
        return;
    }
    save.started = true;
    world.deliver();
    write();
    showLetter();
}
function showLetter() {
    show('letter', assignmentScreen());
}
function tutorial() {
    show('tutorial', tutorialScreen());
}
async function visit(id: number, container: Container | null = null) {
    const request = ++readerRequest;
    readerContainer = container;
    currentId = id;
    pageIndex = 0;
    sheetIndex = 0;
    highlight = '';
    cellComment = '';
    const initial = archive.get(id);
    if (initial.source) {
        readerPlaceholder(initial, 'loading', 'Opening the locally bundled reference pack…');
        try {
            await ensureSource(initial.source.id);
        }
        catch (error) {
            if (request !== readerRequest || currentId !== id)
                return;
            readerPlaceholder(initial, 'error', error instanceof Error ? error.message : 'The local content pack could not be loaded.');
            $('#retry-source').onclick = () => void visit(id, readerContainer);
            return;
        }
        if (request !== readerRequest || currentId !== id)
            return;
    }
    if (request !== readerRequest || currentId !== id) return;
    inspect(save, archive, id).forEach(message => notify(message));
    audio.sound('paper');
    write();
    renderReader();
}
function readerIndex(doc: ArchiveDocument) {
    const loc=location(doc.id), physical=physicalFor(save), ids=readerContainer?containerFiles(physical,readerContainer):[doc.id];
    const index = ids.map((id, i) => {
        const d = archive.get(id);
        return `<button class="folder-tab ${id === currentId ? 'active' : ''} ${progress.searched.has(id) ? 'searched' : ''}" data-file="${id}"><span class="folder-number">${String(i + 1).padStart(2, '0')}</span><span>${esc(d.title)}</span><small>${progress.searched.has(id) ? 'CHECKED' : progress.inspected.has(id) ? 'OPENED' : 'FILE'}</small></button>`;
    }).join('') + (readerContainer ? movedNotes(physical, readerContainer).map(n => `<p class="moved-note">Moved: ${esc(n.text)}</p>`).join('') : '');
    return {
        indexHeader: `<span class="eyebrow">${esc(DEPARTMENTS[loc.department])} / FILING INDEX</span><h2>${readerContainer ? esc(containerLabel(readerContainer).toUpperCase()) : esc(loc.label)}<small>${readerContainer ? 'CURRENT STORAGE' : 'ORIGINAL FILING REFERENCE'}</small></h2><span class="retention">${MONTHS[loc.column % 12]} 2023</span>`,
        index,
        indexFooter: readerContainer ? `${containerLoad(physical,readerContainer)} / ${capacity(readerContainer)} spaces · ${esc(containerLabel(readerContainer))}` : (['inventory','held'].includes(currentContainer(physical,doc.id)) ? 'Carried original · I opens your inventory' : 'Reference copy · '+esc(containerLabel(currentContainer(physical,doc.id)))),
        location: readerContainer ? containerLabel(readerContainer) : containerLabel(currentContainer(physical,doc.id))
    };
}
function readerPlaceholder(doc: ArchiveDocument, phase: 'loading'|'error', message: string) {
    show(phase === 'loading' ? 'reader-loading' : 'reader-error', folderFrame({ ...readerIndex(doc), reference: reference(doc.id), phase,
        paper: `<article class="document-paper folder-placeholder"><span class="eyebrow">${phase === 'loading' ? 'RETAINED ATTACHMENT' : 'ATTACHMENT UNAVAILABLE'}</span><h2>${esc(doc.title)}</h2><p role="status">${esc(message)}</p>${phase === 'error' ? '<button id="retry-source">Retry reference load ↗</button>' : ''}</article>`
    }));
    document.querySelectorAll<HTMLButtonElement>('[data-file]').forEach(b => b.onclick = () => switchFile(Number(b.dataset.file)));
}
function renderReader() {
    if (currentId === null)
        return;
    const doc = readableDocument(archive.get(currentId)), physical = physicalFor(save);
    const hasSheets = !!doc.sheets?.length;
    let body = '';
    if (pageIndex < doc.pages.length) {
        body = `<div id="page-text" class="document-text">${recordParagraphs(doc,doc.pages[pageIndex],mark)}</div>`;
    }
    else if (hasSheets) {
        const s = doc.sheets![sheetIndex];
        const key = `${doc.id}:${sheetIndex}`, isRevealed = revealed.has(key);
        body = `<div class="sheet-tabs">${doc.sheets!.map((s, i) => `<button data-sheet="${i}" class="${i === sheetIndex ? 'selected' : ''}">${esc(s.name)}</button>`).join('')}</div><div class="sheet-tools"><span>${esc(s.name)} / ${s.rows.length} rows</span>${s.hiddenRows?.length ? `<button id="reveal-rows">${isRevealed ? 'Hide restored rows' : 'Reveal hidden rows'} ${icon('↕')}</button>` : '<span>Inspect cells for comments</span>'}</div><div class="table-scroll"><table class="sheet"><thead><tr><th scope="col">#</th>${s.columns.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${s.rows.map((row, ri) => !isRevealed && s.hiddenRows?.includes(ri) ? `<tr><td colspan="${s.columns.length + 1}" class="hidden-row">··· hidden row ···</td></tr>` : `<tr class="${s.hiddenRows?.includes(ri) ? 'restored' : ''}"><th scope="row">${ri + 1}</th>${row.map((c, ci) => `<td><button data-cell="${ri},${ci}" class="cell ${c.comment ? 'has-comment' : ''}" title="${c.comment ? 'Has a comment. Click to inspect.' : 'Inspect cell'}">${mark(esc(c.value))}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div><div id="cell-comment" class="cell-comment" role="status">${esc(cellComment || 'Click a cell to inspect its contents. A folded corner indicates a retained comment.')}</div>`;
    }
    const max = doc.pages.length + (hasSheets ? 1 : 0);
    show('reader', folderFrame({ ...readerIndex(doc), reference: reference(doc.id), paper: `<article class="document-paper ${documentClass(doc)}">${documentLetterhead(doc)}<div class="doc-header"><span>RECORDS & RETENTION</span><span>${esc((doc.presentation?.family??doc.kind).toUpperCase())}</span></div><div class="doc-meta"><span>FILED ${esc(doc.date)}</span><span>${esc(doc.author)}</span></div><h2>${esc(doc.title)}</h2><p class="doc-subject">${esc(doc.subject)}</p>${body}${doc.source ? `<div class="source-credit"><span>REFERENCE EXTRACT · ${esc(doc.source.title)}</span><button data-tool="sources" class="text-button">Source & reuse credits ↗</button></div>` : ''}${doc.voucher ? `<aside class="voucher"><span class="eyebrow">SUPPLY ALLOWANCE / ${doc.voucher.value} CREDITS</span><p>${esc(doc.voucher.note)}</p><button id="collect-voucher" ${save.collectedVouchers.includes(doc.id) ? 'disabled' : ''}>${save.collectedVouchers.includes(doc.id) ? 'Voucher collected' : 'Collect voucher ↗'}</button></aside>` : ''}${doc.annotation ? `<aside class="annotation">${esc(doc.annotation)}</aside>` : ''}${doc.story||doc.thread ? `<div class="evidence-status">${save.clues.includes(doc.id) ? '✓ Evidence retained in your notebook' : hasSheets ? 'Inspect the workbook for evidence.' : 'Correspondence retained.'}</div>` : ''}${documentColophon(doc)}</article>`, navigation: `<div class="page-navigation"><button id="prev-page" ${pageIndex === 0 ? 'disabled' : ''} aria-label="Previous page">←</button><span>${pageIndex >= doc.pages.length ? 'WORKBOOK' : `PAGE ${pageIndex + 1}`} / ${max}</span><button id="next-page" ${pageIndex >= max - 1 ? 'disabled' : ''} aria-label="Next page">→</button></div>`, tools: `<button id="bookmark" title="Carry this original" ${!readerContainer || ['inventory','held'].includes(currentContainer(physical,doc.id)) ? 'disabled' : ''}>${['inventory','held'].includes(currentContainer(physical,doc.id)) ? '★ Retained · inventory' : '☆ Retain original'}</button><button id="mark-searched" class="${save.searched.includes(doc.id) ? 'is-checked' : ''}">${save.searched.includes(doc.id) ? '✓ Searched' : 'Mark searched'}</button><button id="take-file" class="primary" ${!readerContainer || !!physical.held || currentContainer(physical, doc.id) !== readerContainer ? 'disabled' : ''}>Pick up original ↗</button>`, extra: `${save.upgrades.includes('highlighter') ? `<form id="highlight-form" class="highlight-bar"><label for="keyword">Keyword lens</label><input id="keyword" maxlength="32" placeholder="One word on this page" value="${esc(highlight)}"><button>Highlight</button></form>` : ''}` }));
    $('.reader-actions').insertAdjacentHTML('afterbegin', '<button id="clip-page">Clip to notebook</button><button id="apply-file-stamp">Stamp file</button>');
    const stamp = deskFor(save).fileStamps[String(doc.id)];
    if (stamp)
        $('.document-paper').insertAdjacentHTML('beforeend', `<div class="cosmetic-file-stamp">${esc(stamp)}</div>`);
    $('#apply-file-stamp').onclick = () => {
        const d = deskFor(save);
        if (!d.stamp) {
            delete d.fileStamps[String(doc.id)];
        }
        else {
            if (!d.fileStamps[String(doc.id)] && Object.keys(d.fileStamps).length >= 10000) {
                notify('The stamp register is full. Select Plain to clear a previous impression.');
                return;
            }
            d.fileStamps[String(doc.id)] = d.stamp;
        }
        audio.sound('stamp');
        write();
        renderReader();
    };
    $('#clip-page').onclick = () => {
        let text: string, label: string;
        if (pageIndex < doc.pages.length) {
            text = doc.pages[pageIndex];
            label = `${reference(doc.id)} / page ${pageIndex + 1}`;
        }
        else {
            const sheet = doc.sheets![sheetIndex], visible = revealed.has(`${doc.id}:${sheetIndex}`);
            text = [sheet.columns.join(' | '), ...sheet.rows.filter((_, i) => visible || !sheet.hiddenRows?.includes(i)).map(row => row.map(c => c.value).join(' | ')), ...(cellComment ? [cellComment] : [])].join('\n');
            label = `${reference(doc.id)} / ${sheet.name} / visible cells`;
        }
        deskScreens.clip(doc.id, text, label);
    };
    $('#collect-voucher')?.addEventListener('click', () => {
        notify(collectVoucher(save, archive, doc.id));
        write();
        renderReader();
    });
    $('#prev-page').onclick = () => {
        if (pageIndex > 0) {
            audio.sound('paper');
            pageIndex--;
            renderReader();
        }
    };
    $('#next-page').onclick = () => {
        if (pageIndex < max - 1) {
            pageIndex++;
            audio.sound('paper');
            renderReader();
        }
    };
    $('#bookmark').onclick = () => {
        if (!readerContainer) {
            notify('Visit the original filing location to retain this original.');
            return;
        }
        const error = retainOriginal(physical, doc.id, readerContainer, inventoryCapacity(save));
        if (error) {
            notify(error);
            return;
        }
        world.syncPhysical();
        audio.sound('satchel');
        write();
        renderReader();
    };
    $('#mark-searched').onclick = () => {
        if (!save.searched.includes(doc.id)) {
            save.searched.push(doc.id);
            audio.sound('stamp');
            write();
            renderReader();
        }
    };
    $('#take-file').onclick = () => {
        if (!readerContainer)
            return;
        const error = takeFile(physicalFor(save), doc.id, readerContainer, inventoryCapacity(save));
        if (error) {
            notify(error);
            return;
        }
        world.syncPhysical();
        write();
        resume();
        notify('Holding the original. I opens your inventory; F reads it and G places it in filing storage.');
    };
    if (readerContainer) {
        $('.folder-list').insertAdjacentHTML('beforeend', storedCopyButtons(readerContainer));
        $('.folder-list').insertAdjacentHTML('beforeend', artifactButton(readerContainer));
        bindArtifactButton(readerContainer);
        bindCopyButtons();
    }
    document.querySelectorAll<HTMLButtonElement>('[data-file]').forEach(b => b.onclick = () => switchFile(Number(b.dataset.file)));
    document.querySelectorAll<HTMLButtonElement>('[data-sheet]').forEach(b => b.onclick = () => {
        sheetIndex = Number(b.dataset.sheet);
        cellComment = '';
        renderReader();
    });
    $('#reveal-rows')?.addEventListener('click', () => {
        const key = `${doc.id}:${sheetIndex}`;
        if (revealed.has(key))
            revealed.delete(key);
        else
            revealed.add(key);
        renderReader();
    });
    document.querySelectorAll<HTMLButtonElement>('[data-cell]').forEach(b => b.onclick = () => {
        const [r, c] = b.dataset.cell!.split(',').map(Number), cell = doc.sheets![sheetIndex].rows[r][c];
        cellComment = cell.comment ?? `Cell value: ${cell.value}. No retained comment.`;
        if (cell.clue) {
            inspect(save, archive, doc.id, true).forEach(message => notify(message));
            write();
        }
        $('#cell-comment').textContent = cellComment;
        if (cell.clue)
            renderReader();
    });
    $('#highlight-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const value = $<HTMLInputElement>('#keyword').value.trim();
        if (value && !/^[\p{L}\p{N}'’-]+$/u.test(value)) {
            notify('Choose one word for the keyword lens.');
            return;
        }
        highlight = value;
        renderReader();
    });
    if (pageIndex < doc.pages.length)
        discoverPhrase(doc.pages[pageIndex]);
}
function mark(text: string) {
    if (!highlight)
        return text;
    const safe = esc(highlight).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(?<![\\p{L}\\p{N}])(${safe})(?![\\p{L}\\p{N}])`, 'giu'), '<mark>$1</mark>');
}
function switchFile(id: number) {
    clearTimeout(switchTimer);
    readerRequest++;
    audio.sound('tab');
    $('.document-paper')?.classList.add('turning');
    switchTimer = setTimeout(() => {
        visit(id, readerContainer);
    }, save.settings.reducedMotion ? 0 : save.upgrades.includes('browsing') ? 160 : 200);
}
function discoverPhrase(text: string) {
    if (!readPage(save, text))
        return;
    write();
    queueMicrotask(() => showEnding());
}
function storedCopyButtons(container: Container | 'legacy-binder') {
    return (physicalFor(save).copies ?? []).filter(c => c.place === container).map(c => `<button data-copy-read="${esc(c.id)}">Printed copy · ${esc(reference(c.file))}</button><button data-copy-take="${esc(c.id)}">Carry copy ↗</button>`).join('');
}
function bindCopyButtons() {
    document.querySelectorAll<HTMLElement>('[data-copy-read]').forEach(b => b.onclick = () => void readCopy(b.dataset.copyRead!));
    document.querySelectorAll<HTMLElement>('[data-copy-take]').forEach(b => b.onclick = () => {
        const copy = physicalFor(save).copies?.find(c => c.id === b.dataset.copyTake), wasOutput = copy?.place === 'printer-output', error = takeCopy(physicalFor(save), b.dataset.copyTake!, inventoryCapacity(save));
        if (error) {
            notify(error);
            return;
        }
        if (wasOutput)
            officeFor(save).printedFile = null;
        world.syncPhysical();
        audio.sound('satchel');
        write();
        showInventory();
    });
}
function artifactButton(container: Container) {
    const id = placements.get(container), artifact = ARTIFACTS.find(a => a.id === id);
    return artifact && !deskFor(save).collected.includes(artifact.id) ? `<div class="drawer-bottom"><button id="collect-artifact" class="drawer-artifact"><small>BENEATH THE LAST FILE</small>${esc(artifact.name)}<br>Retain object ↗</button></div>` : '';
}
function bindArtifactButton(container: Container) {
    $('#collect-artifact')?.addEventListener('click', () => {
        if (readerContainer !== container || !['reader', 'storage'].includes(mode))
            return;
        const artifact = collectArtifact(save, container, placements);
        if (!artifact)
            return;
        audio.sound('collection');
        write();
        world.syncDesk(save);
        $('#collect-artifact')?.closest('.drawer-bottom')?.remove();
        notify(`Retained ${artifact.name}. Your collection catalogue has been updated.`, false);
    });
}
const drawerMemory=new Map<Container,{scroll:number;selected?:number}>();
function openStorage(container: Container) {
    readerContainer=container;currentId=null;
    const p=physicalFor(save),ids=containerFiles(p,container),memory=drawerMemory.get(container);
    const type=parseContainer(container);const backing=type?STORAGE[type.unit].kind:'personal';
    show('storage',shell(containerLabel(container),'OPEN FILING / SELECT A FOLDER',`<div class="drawer-register"><span>${ids.length} originals · ${containerLoad(p,container)} / ${capacity(container)} spaces</span><span>Click a tab to open · brackets switch opened files</span></div><div class="drawer-browser drawer-${backing}" aria-label="Folders in ${esc(containerLabel(container))}"><div class="folder-list drawer-folders">${ids.map((id,i)=>{const d=archive.get(id);return `<button class="drawer-folder ${progress.searched.has(id)?'searched':''}" data-file="${id}" style="--folder-order:${i%4}"><span class="drawer-folder-tab">${String(i+1).padStart(2,'0')} / ${esc(reference(id))}</span><strong>${esc(d.title)}</strong><small>${progress.searched.has(id)?'SEARCHED ✓':progress.inspected.has(id)?'PREVIOUSLY OPENED':'FILED / NOT YET OPENED'}</small></button>`;}).join('')||'<p class="drawer-empty">No originals here. The space is unusually well organised.</p>'}${storedCopyButtons(container)}${movedNotes(p,container).map(n=>`<p class="moved-note">Moved: ${esc(n.text)}</p>`).join('')}${artifactButton(container)}</div></div><div class="panel-foot"><span>Folders remain in their saved storage. Browsing tabs does not inspect their contents.</span><button data-action="resume">Close drawer</button></div>`,true));
    const list=$('.drawer-folders');if(memory)list.scrollTop=memory.scroll;
    document.querySelectorAll<HTMLButtonElement>('[data-file]').forEach(b=>{b.onclick=()=>{drawerMemory.set(container,{scroll:list.scrollTop,selected:Number(b.dataset.file)});switchFile(Number(b.dataset.file));};if(Number(b.dataset.file)===memory?.selected){b.classList.add('last-opened');requestAnimationFrame(()=>b.focus({preventScroll:true}));}});
    bindCopyButtons();bindArtifactButton(container);
}
function showInventory() {
    const p = physicalFor(save), docs = carriedDocuments(p);
    show('inventory', shell('Carried files', 'PERSONAL FILE POCKETS', `<div class="prose"><p>${docs.length} / ${inventoryCapacity(save)} slots used. Originals and printed copies share the bag. Storing a document frees its slot.</p>${world.atDesk() ? `<label>Store in <select id="inventory-storage"><option value="personal:0">Personal drawer 1</option><option value="personal:1">Personal drawer 2</option><option value="desk-tray">Desk tray</option></select></label>` : '<p>Stand near your desk to store files here, or equip one and press G while aiming at filing storage.</p>'}</div><div class="retained-list inventory-files">${docs.map(d => `<article><p><strong>${d.kind === 'original' ? 'Original' : 'Printed copy'} · ${esc(reference(d.file))}</strong><br>${esc(archive.get(d.file).title)}</p><button data-inventory-read="${d.key}">Read</button><button data-equip="${d.key}">Equip</button>${world.atDesk() ? `<button data-store-document="${d.key}">Store ↗</button>` : ''}</article>`).join('') || '<p class="empty-state">Your bag is empty. Retain an original from an opened drawer or box.</p>'}${Array.from({ length: Math.max(0, inventoryCapacity(save) - docs.length) }, (_, i) => `<div class="empty-file-pocket" aria-label="Empty file pocket ${docs.length + i + 1}"><span>POCKET ${String(docs.length + i + 1).padStart(2, '0')}</span><p>Space for an original<br>or a retained copy.</p></div>`).join('')}</div>${stationery.inventoryMarkup()}<div class="panel-foot"><button id="stow-held">Stow held file</button>${world.atDesk() && (p.copies ?? []).some(c => c.place === 'legacy-binder') ? '<button id="legacy-binder">Older retained copies</button>' : ''}<button data-action="resume">Return to archive ↗</button></div>`));
    document.querySelectorAll<HTMLElement>('[data-inventory-read]').forEach(b => b.onclick = () => {
        const d = carriedDocuments(p).find(d => d.key === b.dataset.inventoryRead)!;
        if (d.kind === 'original')
            void visit(d.file);
        else
            void readCopy(d.copy!);
    });
    document.querySelectorAll<HTMLElement>('[data-equip]').forEach(b => b.onclick = () => {
        const error = equipDocument(p, b.dataset.equip!);
        if (error) {
            notify(error);
            return;
        }
        world.syncPhysical();
        audio.sound('satchel');
        write();
        resume();
    });
    document.querySelectorAll<HTMLElement>('[data-store-document]').forEach(b => b.onclick = () => {
        if (!world.atDesk())
            return;
        const error = storeDocument(p, b.dataset.storeDocument!, $<HTMLSelectElement>('#inventory-storage').value as Container);
        if (error) {
            notify(error);
            return;
        }
        world.syncPhysical();
        audio.sound('place');
        write();
        showInventory();
    });
    stationery.bindInventory(showInventory);
    $('#stow-held').onclick = () => {
        const error = stowHeld(p);
        if (error)
            notify(error);
        world.syncPhysical();
        write();
        showInventory();
    };
    $('#legacy-binder')?.addEventListener('click', showLegacyBinder);
}
function showLegacyBinder() {
    if (!world.atDesk()) {
        notify('Older retained copies are in the binder at your W4 desk.');
        return;
    }
    show('legacy-binder', shell('Older retained copies', 'W4 DESK BINDER', `<div class="prose"><p>Retained copies from your earlier shift. Carry a copy to file it elsewhere.</p>${storedCopyButtons('legacy-binder')}</div>`));
    bindCopyButtons();
}
async function readCopy(copyId: string) {
    const copy = physicalFor(save).copies?.find(c => c.id === copyId);
    if (!copy)
        return;
    const token = ++printerRequest;
    show('printed-copy', shell('Printed copy', 'PHYSICAL PAPER COPY', `<div class="panel-foot"><button data-copy-take="${esc(copy.id)}">Carry copy ↗</button></div><div id="printed-host">Opening the attachment…</div>`, true));
    bindCopyButtons();
    try {
        const doc = archive.get(copy.file);
        if (doc.source)
            await ensureSource(doc.source.id);
        if (mode !== 'printed-copy' || token !== printerRequest)
            return;
        mountPrintedCopy($('#printed-host'), archive.get(copy.file), discoverPhrase);
    }
    catch (error) {
        if (mode === 'printed-copy' && token === printerRequest) {
            $('#printed-host').textContent = `Attachment unavailable: ${String(error)}`;
            const retry = document.createElement('button');
            retry.textContent = 'Retry attachment';
            retry.onclick = () => void readCopy(copyId);
            $('#printed-host').append(retry);
        }
    }
}
function showShredder() {
    const p = physicalFor(save), copies = carriedDocuments(p).filter(d => d.kind === 'copy');
    show('shredder', shell('Paper shredder', 'COPIES ONLY / ORIGINALS PROTECTED', `<div class="prose"><p>Shred a carried printed copy. The original and your discoveries remain intact.</p>${world.stats().shredding ? '<p>Shredding…</p>' : copies.map(c => `<p>${esc(reference(c.file))} <button data-shred="${c.copy}">Shred copy</button></p>`).join('') || '<p>No carried copies. Collect a printout first.</p>'}</div>`));
    document.querySelectorAll<HTMLElement>('[data-shred]').forEach(b => b.onclick = () => {
        if (world.stats().shredding)
            return;
        const error = shredCopy(p, b.dataset.shred!);
        if (error) {
            notify(error);
            return;
        }
        world.startShred();
        world.syncPhysical();
        audio.sound('shred', toWorld(NOOK.wing, NOOK.x + EQUIPMENT.shredder.x, NOOK.z + EQUIPMENT.shredder.z));
        write();
        resume();
    });
}
function useHeld() {
    if (mode !== 'play')
        return;
    const held = physicalFor(save).held;
    if(held?.kind==='tool'){if(held.id==='pad')stationery.draft();else if(held.id==='thread')stationery.board();else showWhiteboard();return;}
    if(held?.kind==='sticky'){stationery.board();return;}
    if(held?.kind==='can'){notify(drinkCan(save));audio.sound('water');world.syncPhysical();write();return;}
    if (held?.kind === 'file') {
        void visit(held.id);
        return;
    }
    if (held?.kind === 'copy') {
        void readCopy(held.id);
        return;
    }
    if (held?.kind === 'item') {
        notify(world.consume());
        audio.sound('water');
        write();
    }
}
function interact(target: Target) {
    if (mode !== 'play')
        return;
    if(target.kind==='office-life'){if(target.feature==='stationery')stationery.box();else if(target.feature==='vending')stationery.vending();else{const error=recycleCan(save);notify(error??'Can recycled.');world.syncDesk(save);world.syncPhysical();write();}return;}
    if (target.kind === 'desk-feature') {
        if (target.feature === 'computer')
            deskScreens.computer();
        else if (target.feature === 'pinboard')
            deskScreens.board();
        else if (target.feature === 'collection')
            deskScreens.collection();
        else
            deskScreens.notices();
        return;
    }
    if (target.kind === 'desk') {
        showDesk();
        return;
    }
    if (target.kind === 'door') {
        if (world.toggleDoor(target.side))
            audio.sound('door');
        else
            notify('Step clear of the doorway before closing it.');
        return;
    }
    if (target.kind === 'whiteboard') {
        showWhiteboard(target.board);
        return;
    }
    if (target.kind === 'storage') {
        if (parseContainer(target.container)) {
            world.unlock();
            mode = 'opening';
            world.openContainer(target.container);
            audio.sound('box');
            switchTimer = setTimeout(() => openStorage(target.container), save.settings.reducedMotion ? 0 : 450);
        }
        else
            openStorage(target.container);
        return;
    }
    if (target.kind === 'item') {
        const error = world.pickup(target.id);
        notify(error ?? 'Picked up. Left click to drink; G to place on a suitable surface.');
        write();
        return;
    }
    if (target.kind === 'surface') {
        notify(`${SURFACES[target.surface].name}: press G to place the held object.`);
        return;
    }
    if (target.kind === 'prop') {
        if (target.id.startsWith('chair')) {
            if (world.sit(target.id))
                notify('Seated. E or Escape to stand.');
            return;
        }
        if (target.id === 'shredder') {
            showShredder();
            return;
        }
        if (target.id === 'printer' || target.id === 'printer-input') {
            showPrinter();
            return;
        }
        if (target.id === 'printer-output') {
            void showPrintedCopy();
            return;
        }
        const result = world.propAction(target.id);
        audio.start();
        if (result.sound === 'brew')
            audio.brew(toWorld(NOOK.wing, NOOK.x + EQUIPMENT.coffee.x, NOOK.z + EQUIPMENT.coffee.z));
        else if (result.sound)
            audio.sound(result.sound, target.id === 'water' ? toWorld(NOOK.wing, NOOK.x + EQUIPMENT.water.x, NOOK.z + EQUIPMENT.water.z) : world.camera.position);
        if (result.message)
            notify(result.message);
        write();
        return;
    }
    world.unlock();
    mode = 'opening';
    world.openDrawer(target.cabinet, target.drawer);
    audio.sound('drawer');
    switchTimer = setTimeout(() => openStorage(containerFor(target.cabinet, target.drawer)), save.settings.reducedMotion ? 0 : save.upgrades.includes('drawers') ? 360 : 450);
}
let printerRequest = 0;
function showPrinter() {
    const request = ++printerRequest, p = physicalFor(save), input = printerOriginal(p), output = p.copies?.find(c => c.place === 'printer-output'), originals = carriedDocuments(p).filter(d => d.kind === 'original'), busy = world.stats().printing;
    show('printer', shell('Retained-copy printer', 'INSERT / PRINT / COLLECT', `<div class="printer-console"><p class="machine-instructions">Insert a carried original, print it, then collect the original and its copy. Both use inventory slots.</p><div class="printer-trays"><section class="printer-tray"><span>01 / ORIGINAL FEED</span><strong>${input === null ? 'Tray empty' : esc(reference(input))}</strong><small>${input === null ? 'Insert a carried original below.' : 'Original retained in input tray.'}</small></section><section class="printer-tray"><span>02 / COPY OUTPUT</span><strong>${output ? esc(reference(output.file)) : 'Tray empty'}</strong><small>${output ? 'Printed copy ready to collect.' : 'Copies arrive here.'}</small></section></div><div class="printer-feed"><label>Carried original <select id="print-file">${originals.map(d => `<option value="${d.file}">${esc(reference(d.file) + ' · ' + archive.get(d.file).title)}</option>`).join('')}</select></label><button id="insert-original" ${input !== null || !originals.length || busy ? 'disabled' : ''}>Insert original ↗</button></div><p id="printer-status" role="status">${busy ? 'Printing…' : output ? 'Collect the output before printing again.' : 'Ready.'}</p><div class="printer-controls"><button id="start-print" ${input === null || !!output || busy ? 'disabled' : ''}>Print selected file</button><button id="collect-original" ${input === null || busy ? 'disabled' : ''}>Collect original</button><button id="collect-copy" ${!output || busy ? 'disabled' : ''}>Collect copy</button><button id="collect-both" ${input === null && !output || busy ? 'disabled' : ''}>Collect both trays ↗</button></div></div><div class="panel-foot"><button data-action="resume">Return to printer ↗</button></div>`));
    const finish = (error: string | null) => {
        if (error) {
            notify(error);
            return;
        }
        officeFor(save).printedFile = p.copies?.find(c => c.place === 'printer-output')?.file ?? null;
        world.syncPhysical();
        audio.sound('paper');
        write();
        showPrinter();
    };
    $('#insert-original').onclick = () => {
        if (!busy)
            finish(insertOriginal(p, Number($<HTMLSelectElement>('#print-file').value)));
    };
    $('#collect-original').onclick = () => {
        if (input !== null && !world.stats().printing)
            finish(retainOriginal(p, input, 'printer-input', inventoryCapacity(save)));
    };
    $('#collect-copy').onclick = () => {
        if (output && !world.stats().printing)
            finish(takeCopy(p, output.id, inventoryCapacity(save)));
    };
    $('#collect-both').onclick = () => {
        if (!world.stats().printing)
            finish(collectPrinter(p, inventoryCapacity(save)));
    };
    $('#start-print').onclick = async () => {
        if (input === null)
            return;
        const button = $<HTMLButtonElement>('#start-print');
        button.disabled = true;
        $('#printer-status').textContent = 'Preparing the attachment…';
        try {
            const source = archive.get(input).source;
            if (source)
                await ensureSource(source.id);
            if (mode !== 'printer' || request !== printerRequest)
                return;
            if (!world.startPrint(input)) {
                button.disabled = false;
                $('#printer-status').textContent = 'Printer busy or output occupied. Collect the trays first.';
                return;
            }
            audio.start();
            audio.sound('machine', toWorld(NOOK.wing, NOOK.x + EQUIPMENT.printer.x, NOOK.z + EQUIPMENT.printer.z));
            $('#printer-status').textContent = 'Printing. Your original remains in the input tray.';
            write();
            showPrinter();
        }
        catch (error) {
            if (mode !== 'printer' || request !== printerRequest)
                return;
            button.disabled = false;
            $('#printer-status').textContent = `Attachment unavailable: ${String(error)}. Press Print selected file to retry.`;
        }
    };
}
async function showPrintedCopy() {
    const copy = physicalFor(save).copies?.find(c => c.place === 'printer-output');
    if (!copy) {
        notify('The output tray is empty.');
        return;
    }
    await readCopy(copy.id);
}
function showWhiteboard(board = 0) {
    const wing = board;
    const hasMarker=physicalFor(save).held?.kind==='tool'&&physicalFor(save).held?.id==='marker';
    save.whiteboards ??= [[], [], [], []];
    world.setBoardPage(wing);
    show('whiteboard', shell('Leave yourself a note', `W${wing + 1} / WHITEBOARD`, `<nav class="wing-tabs" aria-label="Whiteboard pages">${WINGS.map((w, i) => `<button data-board-page="${i}" class="${i === wing ? 'selected' : ''}">W${i + 1} · ${w}</button>`).join('')}</nav><div id="whiteboard-host"></div><div class="panel-foot"><span>One board, four saved wing pages.</span>${hasMarker?'':'<button id="take-board-marker">Equip whiteboard marker</button><button data-tool="inventory">Inventory / stow held object</button>'}<button id="leave-board" class="primary">Finish drawing ↗</button></div>`, true));
    finishBoard = mountWhiteboard($('#whiteboard-host'), save.whiteboards[wing], () => {
        audio.sound('pencil');
        world.setWhiteboards(save.whiteboards!);
        write();
    }, () => notify('Board full. Undo strokes or clear the board to make space.'),hasMarker);
    $('#take-board-marker')?.addEventListener('click',()=>{if(physicalFor(save).held){notify('Stow the held object first.');return;}deskFor(save).tools.marker='held';physicalFor(save).held={kind:'tool',id:'marker'};write();world.syncPhysical();showWhiteboard(board);});
    document.querySelectorAll<HTMLButtonElement>('[data-board-page]').forEach(button => button.onclick = () => showWhiteboard(Number(button.dataset.boardPage)));
    $('#leave-board').onclick = leaveWhiteboard;
}
function leaveWhiteboard() {
    show('board-finished', shell('Note retained', 'WHITEBOARD', `<div class="prose"><p>Your drawing has been saved on the work nook whiteboard in W4.</p></div><div class="panel-foot"><button data-action="resume" class="primary">Resume exploring ↗</button></div>`));
}
function showDesk() {
    show('desk', shell('Your desk', 'W4 WORK NOOK / PERSONAL RECORDS', `<div class="desk-grid"><div class="prose"><h3>Your file storage</h3><p>Opening the page with Martin's phrase completes the task. Keep interesting originals here for your own investigations.</p>${(['personal:0', 'personal:1', 'desk-tray'] as Container[]).map(c => `<p><button data-storage="${c}">${esc(containerLabel(c))} · ${containerLoad(physicalFor(save), c)}/${capacity(c)}</button></p>`).join('')}<div class="voucher-desk"><p><strong>${pendingVoucherValue(save, archive)} credits</strong> in collected vouchers.</p><button id="redeem-vouchers" ${!world.atDesk() || !pendingVoucherValue(save, archive) ? 'disabled' : ''}>Redeem vouchers ↗</button></div></div><div class="desk-options"><button id="desk-computer">Records Desktop ↗</button><button id="desk-pinboard">Personal pinboard ↗</button><button id="desk-collection">Collection compartment ↗</button><button id="desk-notices">Public notices ↗</button><button id="desk-receipt">Shift receipt ↗</button><button data-tool="inventory">Carried files / store documents ↗</button><button id="desk-legacy-binder">Older retained copies ↗</button><button data-tool="supplies">Equipment requisitions ↗</button><button data-tool="notebook">Your notebook ↗</button><button id="read-letter">Martin’s request ↗</button><button data-tool="hints">Filing notes ↗</button><button data-tool="comparison">Comparison stand ↗</button></div></div>`));
    $('#desk-computer').onclick = () => deskScreens.computer();
    $('#desk-pinboard').onclick = () => deskScreens.board();
    $('#desk-collection').onclick = () => deskScreens.collection();
    $('#desk-notices').onclick = () => deskScreens.notices();
    $('#desk-receipt').onclick = () => deskScreens.receipt();
    $('#desk-legacy-binder').onclick = showLegacyBinder;
    $('#read-letter').onclick = showLetter;
    $('#redeem-vouchers').onclick = () => {
        if (!world.atDesk())
            return;
        notify(`Redeemed ${redeemVouchers(save, archive)} supply credits.`);
        write();
        showDesk();
    };
    document.querySelectorAll<HTMLButtonElement>('[data-storage]').forEach(b => b.onclick = () => {
        if (!world.atDesk()) {
            notify('Visit your W4 desk to open personal storage.');
            return;
        }
        openStorage(b.dataset.storage as Container);
    });
}
function showEnding() {
    const known = archive.storyLocations.get('martin')!.filter(i => save.clues.includes(i)).length;
    audio.sound('stamp');
    show('ending', shell('Phrase found.', 'REQUEST COMPLETE / PHRASE FOUND', `<div class="ending-copy"><span class="stamp">FOUND</span><h3>You found it.</h3><p>The sentence was there. So was everything around it.</p><blockquote>${known >= 3 ? 'MARTIN: You read the attachments as well? There was no need to… Yes. I understand. Please keep the context attached.' : 'MARTIN: Already? I mean—good. Very efficient. I was certain that would take longer.\n\nPRIYA: Keep the context attached. It matters.'}</blockquote><p>You have located the requested page. The original stays wherever you leave it.</p><div class="ending-stats"><span><strong>${save.inspected.length}</strong>files opened</span><span><strong>${save.claimedStories.length}</strong>stories resolved</span><span><strong>${known}/8</strong>Martin records</span></div><p class="muted">Your shift is complete. Unfinished correspondence and the rest of the archive are still available.</p></div><div class="panel-foot"><button id="ending-receipt">Shift receipt</button><button data-tool="notebook">Review discoveries</button><button data-action="resume" class="primary">Stay a little longer ↗</button></div>`));
    $('#ending-receipt').onclick = () => deskScreens.receipt();
}
function showHints() {
    show('hints', shell('A little direction', 'RETAINED INDEX', `<div class="prose"><p class="large-copy">${esc(getHint(archive, save.hintLevel))}</p><hr><h3>How the filing works</h3><p>Aisle letters identify departments. Each cabinet contains eight drawers, starting with sixteen files and space for twenty. The four large archive rooms form a 2 × 2 warehouse: W1 and W2 above W4 and W3. Shared doors connect them in a loop. Open a door with E, then walk through. Your desk is beside the outer wall in W4. Cabinet labels show the retention month. These dates describe filing batches; the events in a document may be earlier.</p><p>Locations on original documents remain their filing references. If you move a file, a “Moved to…” note at its original drawer points to its current storage.</p><p>Index fragments turn up in ordinary records. The retained records index can narrow the month after you inspect 80 files. Original evidence about Martin can earn more precise hints.</p><div class="hand-note">“W1–A08 / 1.1. I left a welcome note there.” —Tess</div></div>`));
}
function showSupplies() {
    show('supplies', shell('Equipment requisitions', 'SUPPLIES / APPROVAL NOT REQUIRED', `<p class="panel-intro">Useful things. Modest improvements. <strong>${save.credits} credits available.</strong> ${pendingVoucherValue(save, archive)} awaiting voucher redemption.<br><small>Collect vouchers and redeem them at your W4 desk. Discoveries and stories also earn credits; opening ordinary files does not.</small></p><div class="supplies-list">${UPGRADES.map((u, i) => {
        const owned = save.upgrades.includes(u.id), locked = u.id === 'index' && save.inspected.length < 80;
        return `<article><span class="equipment-number">${String(i + 1).padStart(2, '0')}</span><div><h3>${u.name}</h3><p>${u.description}</p></div><button data-buy="${u.id}" ${owned || save.credits < u.cost || locked ? 'disabled' : ''}>${owned ? 'Installed' : locked ? `${save.inspected.length}/80 files` : `${u.cost} cr ↗`}</button></article>`;
    }).join('')}</div>`));
    document.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach(b => b.onclick = () => {
        notify(buy(save, b.dataset.buy as UpgradeId));
        if (b.dataset.buy === 'pinboard')
            world.syncDesk(save);
        write();
        showSupplies();
    });
}
function showNotebook(tab?: string) {
    if (tab === 'bookmarks') {
        showInventory();
        return;
    }
    deskScreens.notebook(tab === 'stories' ? 'discoveries' : tab === 'messages' ? 'log' : tab);
}
function discoveryEntries(): NotebookEntry[] {
    const entries: NotebookEntry[] = [{ id: 'discoveries-intro', title: 'Small discrepancies. Interesting people.', text: 'Evidence notes are retained automatically when you uncover them. Keep the context attached.', className: 'book-introduction' }];
    const retained = STORIES.filter(s => archive.storyLocations.get(s.id)!.some(id => save.clues.includes(id)));
    for (const story of retained) {
        const ids = archive.storyLocations.get(story.id)!, found = ids.filter(id => save.clues.includes(id));
        entries.push({ id: `case-${story.id}`, title: story.title, className:'scrapbook-case', text: `${story.description}\n\n${found.length} / ${ids.length} records retained${save.claimedStories.includes(story.id) ? ' · resolved ✓' : ''}` });
        for (const id of found) {
            const doc = archive.get(id);
            entries.push({ id: `evidence-${id}`, title: reference(id), text: doc.evidence ?? '', className: 'book-evidence scrapbook-clipping', html: `<div class="book-actions"><button data-retained="${id}">Read retained copy ↗</button></div>${doc.next !== undefined ? `<p class="book-caption">Follow-up: ${esc(reference(doc.next))} · ${esc(DEPARTMENTS[location(doc.next).department])}</p>` : ''}` });
        }
        if (save.claimedStories.includes(story.id)) entries.push({ id: `ending-${story.id}`, title: `${story.title} / conclusion`, className:'scrapbook-conclusion', text: story.ending });
    }
    for(const thread of THREADS){
        const ids=archive.threadLocations?.get(thread.id)??[],found=ids.filter(id=>save.clues.includes(id));
        if(!found.length)continue;
        entries.push({id:`thread-${thread.id}`,title:thread.title,text:`Optional correspondence · ${found.length} / 6 records retained. Ask about these accounts at the desk computer.`,className:'scrapbook-case'});
        for(const id of found){const d=archive.get(id);entries.push({id:`evidence-${id}`,title:reference(id),text:d.evidence??'',className:'book-evidence scrapbook-clipping',html:`<div class="book-actions"><button data-retained="${id}">Read retained copy ↗</button></div><p>Enclosure: ${esc(reference(d.next!))}</p>`});}
        if(save.deskLife?.resolved.includes(thread.id))entries.push({id:`outcome-${thread.id}`,title:'Correspondence received',text:thread.notice,className:'scrapbook-conclusion'});
    }
    if (!retained.length&&!THREADS.some(t=>archive.threadLocations?.get(t.id)?.some(id=>save.clues.includes(id)))) entries.push({ id: 'no-discoveries', title: 'Nothing unusual. Yet.', text: 'Read the files. Inspect spreadsheet comments and hidden rows. The office has excellent recordkeeping and questionable judgement.' });
    entries.push({ id: 'discovery-tools', title: 'Keep investigating', html: '<div class="book-actions"><button data-tool="comparison">Compare documents</button><button data-tool="inventory">Carried files</button></div><p class="book-introduction">Visit the desk computer for correspondence.</p>' });
    return entries;
}
function showMap(wing = world.wing, kind: 'front' | 'rear' | 'wall' | 'box' = 'front') {
    progress.sync(save);
    const physical = physicalFor(save), currentTotals = new Uint16Array(STORAGE.length), currentSearched = new Uint16Array(progress.counts);
    STORAGE.forEach(u => currentTotals[u.id] = u.drawers * u.initial);
    for (const [key, to] of Object.entries(physical.files)) {
        const id = Number(key), home = location(id).cabinet;
        currentTotals[home]--;
        if (progress.searched.has(id))
            currentSearched[home]--;
        const dest = parseContainer(to);
        if (dest) {
            currentTotals[dest.unit]++;
            if (progress.searched.has(id))
                currentSearched[dest.unit]++;
        }
    }
    const units = UNITS_BY_WING[wing].filter(u => u.kind === kind);
    const button = (cabinet: number) => {
        const u = STORAGE[cabinet], count = currentSearched[cabinet], total = currentTotals[cabinet], marker = save.markers.find(m => m.cabinet === cabinet);
        return `<button data-mapcab="${cabinet}" class="${count === total ? 'fully-searched' : progress.visited[cabinet] ? 'visited' : ''} ${marker ? 'tab-' + marker.color : ''}" title="${esc(u.label + (marker ? ' · ' + marker.label : ''))}" aria-label="${esc(u.label)}">${kind === 'front' || kind === 'rear' ? String(u.index % 16 + 1).padStart(2, '0') : esc(location(fileId(cabinet)).shortLabel)}${save.upgrades.includes('summaries') ? `<small>${count}/${total}</small>` : ''}</button>`;
    };
    const grid = kind === 'front' || kind === 'rear' ? `<div class="floor-map">${Array.from({ length: ROWS }, (_, r) => `<div class="map-row"><div><strong>${String.fromCharCode(65 + r)}</strong><span>${DEPARTMENTS[r]}</span></div><div class="map-cabinets">${units.slice(r * COLUMNS, (r + 1) * COLUMNS).map(u => button(u.id)).join('')}</div></div>`).join('')}</div>` : `<div class="storage-map-grid">${units.map(u => button(u.id)).join('')}</div>`;
    show('map', shell('The floor plan', `${TOTAL.toLocaleString()} FILES / FOUR WINGS`, `<div class="warehouse-plan" aria-label="Four connected rooms in a 2 by 2 warehouse"><span>W1 · Administration<small>↔ W2 · ↕ W4</small></span><span>W2 · Commercial<small>↔ W1 · ↕ W3</small></span><span>W4 · Executive<small>YOUR WORK NOOK · ↕ W1 · ↔ W3</small></span><span>W3 · Technical<small>↕ W2 · ↔ W4</small></span></div><nav class="wing-tabs">${WINGS.map((w, i) => `<button data-mapwing="${i}" class="${wing === i ? 'selected' : ''}">W${i + 1} · ${w}</button>`).join('')}</nav><nav class="wing-tabs" aria-label="Storage types">${(['front', 'rear', 'wall', 'box'] as const).map(k => `<button data-mapkind="${k}" class="${k === kind ? 'selected' : ''}">${({ front: 'Front drawers', rear: 'Rear drawers', wall: 'Wall cabinets', box: 'File boxes' })[k]}</button>`).join('')}</nav><p class="panel-intro">You are in W${world.wing + 1}, ${WINGS[world.wing]}. Shared doors connect W1 ↔ W2 ↔ W3 ↔ W4 ↔ W1. Your desk is in W4. Map selection does not move you or remotely open storage.</p>${grid}<div id="map-detail" class="map-detail" role="status">Select a filing location to see its reference${save.upgrades.includes('tabs') ? ' or place a coloured tab' : ''}.</div>`, true));
    document.querySelectorAll<HTMLButtonElement>('[data-mapwing]').forEach(b => b.onclick = () => showMap(Number(b.dataset.mapwing), kind));
    document.querySelectorAll<HTMLButtonElement>('[data-mapkind]').forEach(b => b.onclick = () => showMap(wing, b.dataset.mapkind as typeof kind));
    document.querySelectorAll<HTMLButtonElement>('[data-mapcab]').forEach(b => b.onclick = () => {
        const c = Number(b.dataset.mapcab), u = STORAGE[c], l = location(fileId(c)), marker = save.markers.find(m => m.cabinet === c);
        $('#map-detail').innerHTML = `<p>${esc(u.label)} · ${DEPARTMENTS[l.department]} · ${kind === 'rear' ? 'Independent rear bank' : kind === 'wall' ? 'Along the side wall' : kind === 'box' ? 'Front-access archive box' : 'Front bank'}.</p>${save.upgrades.includes('summaries') ? `<p>${Array.from({ length: u.drawers }, (_, d) => {
            const ids = containerFiles(physical, containerFor(c, d));
            return `${u.kind === 'box' ? 'Box' : 'Drawer ' + (d + 1)}: ${ids.filter(id => progress.searched.has(id)).length}/${ids.length} searched · ${ids.length}/${u.capacity} spaces`;
        }).join(' · ')}</p>` : ''}${save.upgrades.includes('tabs') ? `<form id="marker-form"><label>Filing note <input id="marker-label" maxlength="32" required value="${esc(marker?.label ?? '')}"></label><label>Colour <select id="marker-color">${['gold', 'blue', 'rose', 'green'].map(color => `<option ${marker?.color === color ? 'selected' : ''}>${color}</option>`).join('')}</select></label><button>Save tab</button>${marker ? '<button type="button" id="remove-marker">Remove tab</button>' : ''}</form>` : ''}`;
        $('#marker-form')?.addEventListener('submit', e => {
            e.preventDefault();
            try {
                setMarker(save, { cabinet: c, label: $<HTMLInputElement>('#marker-label').value, color: $<HTMLSelectElement>('#marker-color').value as CabinetMarker['color'] });
                world.setMarkers(save.markers);
                write();
                showMap(wing, kind);
                notify('Filing tab saved.');
            }
            catch (error) {
                notify(error instanceof Error ? error.message : 'Could not place tab.');
            }
        });
        $('#remove-marker')?.addEventListener('click', () => {
            save.markers = save.markers.filter(m => m.cabinet !== c);
            world.setMarkers(save.markers);
            write();
            showMap(wing, kind);
        });
    });
}
function showSources() {
    show('sources', shell('Reference collection', 'SOURCES / REUSE & ATTRIBUTION', `<p class="panel-intro">These extracts are real reference works. Office cover sheets and annotations are fictional. Some historical passages reflect outdated views. Reading them is optional.</p><div class="source-list">${SOURCE_MANIFEST.map(s => `<article><h3>${esc(s.title)}</h3><p>${esc(s.author)} · ${esc(s.edition)}</p><p>${esc(s.license)}</p><p class="small">${esc(s.notice)}</p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Original source ↗</a> · <a href="${esc(s.licenseUrl)}" target="_blank" rel="noopener noreferrer">Reuse terms ↗</a>${s.id === 'python' ? ` · <a href="/content/python-license.txt" target="_blank" rel="noopener">Bundled license notices ↗</a>` : ''}</article>`).join('')}<article><h3>Shoe footsteps · Kenney</h3><p>Five concrete-footstep recordings from Impact Sounds 1.0, CC0. Bundled locally with a short room response.</p><a href="https://kenney.nl/assets/impact-sounds" target="_blank" rel="noopener noreferrer">Original sound pack</a> · <a href="/audio/footsteps/LICENSE.txt">Bundled license</a></article><article><h3>Office models · Kenney</h3><p>Selected furniture and food models are bundled locally under CC0 1.0.</p><a href="https://kenney.nl/assets/furniture-kit" target="_blank" rel="noopener noreferrer">Furniture Kit</a> · <a href="https://kenney.nl/assets/food-kit" target="_blank" rel="noopener noreferrer">Food Kit</a> · <a href="/models/manifest.json" target="_blank" rel="noopener noreferrer">Bundled asset manifest</a></article></div>`));
}
function showComparison() {
    if (!save.upgrades.includes('comparison')) {
        notify('Order the comparison stand from Supplies first.');
        return;
    }
    show('comparison', '');
    openComparison({ ...save, bookmarks: world.atDesk() ? availableAtDesk(physicalFor(save)) : carriedDocuments(physicalFor(save)).map(d => d.file) }, archive, html => show('comparison', html), () => mode === 'comparison', id => {
        if (['inventory', 'held', 'personal:0', 'personal:1', 'desk-tray'].includes(currentContainer(physicalFor(save), id))) {
            inspect(save, archive, id, true).forEach(message => notify(message));
            write();
        }
    }, discoverPhrase);
}
function showPause() {
    const s = save.settings;
    show('pause', shell('A short break', 'YOUR SHIFT IS SAVED AUTOMATICALLY', `<div class="pause-grid"><div class="settings"><label>Mouse sensitivity <output>${s.sensitivity.toFixed(1)}</output><input id="sensitivity" type="range" min="0.2" max="3" step="0.1" value="${s.sensitivity}"></label><label>Office volume <output>${Math.round(s.volume * 100)}%</output><input id="volume" type="range" min="0" max="1" step="0.05" value="${s.volume}"></label><label>Document text <output>${s.textSize}px</output><input id="textSize" type="range" min="14" max="26" step="1" value="${s.textSize}"></label><label>Rendering quality<select id="quality"><option value="low" ${s.quality === 'low' ? 'selected' : ''}>Low · reduced resolution, static shading</option><option value="medium" ${s.quality === 'medium' ? 'selected' : ''}>Medium · balanced, desk shadows</option><option value="high" ${s.quality === 'high' ? 'selected' : ''}>High · sharper rendering and shadows</option></select></label><label class="check-label"><input id="reducedMotion" type="checkbox" ${s.reducedMotion ? 'checked' : ''}> Reduce interface motion</label></div><div class="save-options"><h3>Your records</h3><p>${save.inspected.length} files opened<br>${save.searched.length} marked searched<br>${save.claimedStories.length} stories resolved</p><button id="export-save">Export backup ↓</button><button id="import-save">Import backup ↑</button><button data-tool="sources">Reference sources & credits</button><button id="new-game" class="danger">Start a new shift</button><p class="small">WASD move · mouse look · E interact<br>I carried files · G place · F read · click drink<br>Shift walk faster · Q/R turn · M map · N notebook<br>U supplies · Esc pause / close</p><p class="small">If mouse capture is unavailable, drag across the office to look. Browser zoom remains available in document views.</p></div></div><div class="panel-foot"><span id="save-status">${storageBlocked ? 'Export a backup to keep your progress.' : 'Progress saved on this browser.'}</span><button id="pause-resume" class="primary">${save.started ? 'Click to resume looking ↗' : 'Back to clock-in ↗'}</button></div>`));
    for (const key of ['sensitivity', 'volume', 'textSize'] as const) {
        $<HTMLInputElement>('#' + key).oninput = e => {
            const input = e.target as HTMLInputElement;
            save.settings[key] = Number(input.value);
            input.previousElementSibling!.textContent = key === 'volume' ? `${Math.round(Number(input.value) * 100)}%` : key === 'textSize' ? `${input.value}px` : Number(input.value).toFixed(1);
            preferences();
            write();
        };
    }
    $<HTMLSelectElement>('#quality').onchange = e => {
        save.settings.quality = (e.target as HTMLSelectElement).value as Save['settings']['quality'];
        preferences();
        write();
    };
    $<HTMLInputElement>('#reducedMotion').onchange = e => {
        save.settings.reducedMotion = (e.target as HTMLInputElement).checked;
        preferences();
        write();
    };
    $('#export-save').onclick = exportSave;
    $('#import-save').onclick = () => $<HTMLInputElement>('#import-file').click();
    $('#new-game').onclick = showReset;
    $('#pause-resume').onclick = () => save.started ? resume() : showTitle();
    write();
}
function showReset() {
    show('reset', shell('Start a new shift?', 'THIS REPLACES LOCAL PROGRESS', `<div class="prose"><p>Your discoveries, upgrades, and search markings will be cleared. The new archive will have different file placements.</p><p>New shifts include the expanded record collection. Your current shift keeps its original contents. Export a backup if you want to return to it.</p></div><div class="panel-foot"><button id="cancel-reset">Keep this shift</button><button id="export-reset">Export backup and start new shift</button><button id="confirm-reset" class="danger">Replace progress</button></div>`));
    $('#cancel-reset').onclick = showPause;
    const replaceShift = () => {
        const settings = { ...save.settings };
        accrueShift();
        shiftSession.reset();
        save = freshSave(crypto.getRandomValues(new Uint32Array(1))[0]);
        save.settings = settings;
        archive = createArchive(save.seed, save.legacy, save.earlyVouchers, save.placementVersion, save.recordPack);
        storageBlocked = false;
        $('#storage-alert').hidden = true;
        audio.stopMachines();
        world.closeDrawer();
        world.restore(save);
        deskScreens.reset();
        placements = artifactPlacements(save.seed);
        deliveredCount = deliveredMail(save).length;
        progress.rebuild(save);
        revealed.clear();
        preferences();
        write();
        showTitle();
    };
    $('#confirm-reset').onclick=replaceShift;
    $('#export-reset').onclick=()=>{try{exportSave();replaceShift();}catch{notify('Backup could not be exported. Your current shift is still open.');}};
}
function exportSave() {
    accrueShift();
    finishBoard?.();
    world.snapshot(save);
    const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url;
    a.download = `archive-shift-${save.seed}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$<HTMLInputElement>('#import-file').onchange = async (e) => {
    const input = e.target as HTMLInputElement, file = input.files?.[0];
    if (!file)
        return;
    try {
        if (file.size > 32 * 1024 * 1024)
            throw new Error('Backup is too large.');
        const rawImport = await file.text(), inputImport = JSON.parse(rawImport), imported = validateSave(inputImport);
        show('import', shell('Restore this shift?', 'REPLACES CURRENT LOCAL PROGRESS', `<div class="prose"><p>This backup contains ${imported.inspected.length} inspected files and ${imported.claimedStories.length} resolved stories.</p><p>Export your current shift before replacing it if you want to keep both.</p></div><div class="panel-foot"><button id="cancel-import">Keep current shift</button><button id="confirm-import" class="primary">Restore backup ↗</button></div>`));
        $('#cancel-import').onclick = showPause;
        $('#confirm-import').onclick = () => {
            try {
                if(inputImport.deskLife?.version!==3&&!localStorage.getItem(STATIONERY_BACKUP_KEY))localStorage.setItem(STATIONERY_BACKUP_KEY,rawImport);
                if (inputImport.deskLife?.version === 1 && !localStorage.getItem(DESKTOP_BACKUP_KEY)) localStorage.setItem(DESKTOP_BACKUP_KEY, rawImport);
                if (!inputImport.deskLife && !localStorage.getItem(DESK_BACKUP_KEY))
                    localStorage.setItem(DESK_BACKUP_KEY, rawImport);
                if (inputImport.inventoryVersion !== 1)
                    backupInventory(localStorage, rawImport);
                if (inputImport.version !== 3 || inputImport.environmentVersion !== 2)
                    backupExpansion(localStorage, rawImport);
                if (inputImport.version === 1)
                    backupLegacy(localStorage, rawImport);
                if (inputImport.environmentVersion === undefined)
                    backupEnvironment(localStorage, rawImport);
            }
            catch {
                notify('Could not preserve the original backup. Export your current shift and try again.');
                return;
            }
            accrueShift();
            shiftSession.reset();
            save = imported;
            archive = createArchive(save.seed, save.legacy, save.earlyVouchers, save.placementVersion, save.recordPack);
            storageBlocked = false;
            $('#storage-alert').hidden = true;
            audio.stopMachines();
            world.closeDrawer();
            world.restore(save);
            deskScreens.reset();
            placements = artifactPlacements(save.seed);
            deliveredCount = deliveredMail(save).length;
            progress.rebuild(save);
            revealed.clear();
            preferences();
            write();
            showPause();
            notify('Backup restored.');
        };
    }
    catch (error) {
        notify(`Import refused: ${error instanceof Error ? error.message : 'invalid save'}`);
    }
    input.value = '';
};
function tool(name: string) {
    audio.start();
    if (name === 'pause')
        showPause();
    else if (name === 'inventory')
        showInventory();
    else if (name === 'map')
        showMap();
    else if (name === 'notebook')
        showNotebook();
    else if (name === 'supplies')
        showSupplies();
    else if (name === 'hints')
        showHints();
    else if (name === 'sources')
        showSources();
    else if (name === 'comparison')
        showComparison();
}
document.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest('button');
    if (!button)
        return;
    if (button.matches('[data-compare-page],#print-prev,#print-next'))
        audio.sound('paper');
    else if (button.matches('[data-compare-select],[data-compare-sheet],[data-print-sheet],[data-sheet],[data-notetab]'))
        audio.sound('tab');
    else if (button.matches('[data-cell],[data-compare-cell],[data-print-cell],#mark-searched'))
        audio.sound('pencil');
});
// Delegation keeps modal replacement free of stale event listeners.
document.addEventListener('click', e => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tool],[data-action],#start,#accept-letter');
    if (!el)
        return;
    if (el.id === 'start')
        begin();
    else if (el.id === 'accept-letter')
        tutorial();
    else if (el.dataset.tool)
        tool(el.dataset.tool);
    else if (el.dataset.action === 'resume') {
        if (!save.started)
            showTitle();
        else
            resume();
    }
});
$('#credits-button').onclick = showSupplies;
$('#hint-button').onclick = showHints;
document.addEventListener('keydown', e => {
    const input = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);
    if (e.code === 'F9' && !e.repeat) { e.preventDefault(); togglePerformanceMeter(); return; }
    if (e.key === 'Tab' && mode !== 'play') {
        const focusable = Array.from($('#overlay').querySelectorAll<HTMLElement>('button:not([disabled]),summary,a[href],input:not([hidden]):not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex="0"]')).filter(el => el.offsetParent !== null);
        if (focusable.length) {
            const first = focusable[0], last = focusable[focusable.length - 1];
            if (!focusable.includes(document.activeElement as HTMLElement)) {
                e.preventDefault();
                (e.shiftKey ? last : first).focus();
            }
            else if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
            else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
    if (input && e.key !== 'Escape')
        return;
    if(e.key==='Escape'&&mode==='pinboard'&&stationery.cancelThread()){e.preventDefault();return;}
    if (e.key === 'Escape' && mode === 'play' && world.isSeated) {
        e.preventDefault();
        if (!world.stand())
            notify('There is no clear place to stand.');
        else
            audio.sound('chair', world.camera.position);
        write();
        return;
    }
    if (e.key==='Escape'&&['reader','reader-loading','reader-error'].includes(mode)&&readerContainer){e.preventDefault();openStorage(readerContainer);return;}
    if (e.key === 'Escape' && mode === 'whiteboard') {
        e.preventDefault();
        leaveWhiteboard();
        return;
    }
    if (e.key === 'Escape') {
        e.preventDefault();
        if (mode === 'play')
            showPause();
        else if (mode === 'title')
            return;
        else if (!save.started)
            showTitle();
        else
            resume();
        return;
    }
    if (mode === 'play') {
        if (e.code === 'KeyE') {
            e.preventDefault();
            if (e.repeat)
                return;
            if (world.isSeated) {
                if (!world.stand())
                    notify('There is no clear place to stand.');
                else
                    audio.sound('chair', world.camera.position);
                write();
                return;
            }
            if (world.target)
                interact(world.target);
        }
        if (e.code === 'KeyG' && !e.repeat) {
            e.preventDefault();
            const placingMug = physicalFor(save).held?.kind === 'item';
            if (!physicalFor(save).held) {
                const first = carriedDocuments(physicalFor(save))[0];
                if (first) {
                    equipDocument(physicalFor(save), first.key);
                    world.syncPhysical();
                }
            }
            const error = world.placeHeld();
            notify(error ?? 'Placed.');
            if (!error)
                audio.sound(placingMug ? 'mug' : 'place', world.camera.position);
            write();
        }
        if (e.code === 'KeyF' && !e.repeat) {
            e.preventDefault();
            const held = physicalFor(save).held;
            if(held&&['tool','sticky','can'].includes(held.kind)){useHeld();return;}
            if (held?.kind === 'file')
                void visit(held.id);
            else if (held?.kind === 'copy')
                void readCopy(held.id);
            else {
                const first = carriedDocuments(physicalFor(save))[0];
                if (first) {
                    if (first.kind === 'original')
                        void visit(first.file);
                    else
                        void readCopy(first.copy!);
                }
            }
        }
        if (e.code === 'KeyI') {
            e.preventDefault();
            showInventory();
        }
        if (e.code === 'KeyM') {
            e.preventDefault();
            showMap();
        }
        if (e.code === 'KeyN') {
            e.preventDefault();
            showNotebook();
        }
        if (e.code === 'KeyU') {
            e.preventDefault();
            showSupplies();
        }
    }
    else if (mode === 'reader' && !input && currentId !== null && readerContainer) {
        const ids = containerFiles(physicalFor(save), readerContainer), i = ids.indexOf(currentId);
        if (e.code === 'BracketRight' && i < ids.length - 1)
            switchFile(ids[i + 1]);
        if (e.code === 'BracketLeft' && i > 0)
            switchFile(ids[i - 1]);
    }
});
document.addEventListener('contextmenu',e=>{if(mode==='play'&&physicalFor(save).held?.kind==='tool'&&physicalFor(save).held?.id==='pad'){e.preventDefault();stationery.draft();}});
world.onUseHeld = useHeld;
world.onTravel = () => {
    write();
    notify(`W${world.wing + 1} · ${WINGS[world.wing]}`);
};
world.onStorageClose = (point, kind) => audio.sound(kind, point);
world.onOfficeChange = () => write();
world.onMachineComplete = message => {
    audio.sound('complete', world.camera.position);
    notify(message, false);
    if (mode === 'printer')
        showPrinter();
};
world.onWingUnload = () => {
    audio.stopBrew();
    printerRequest++;
};
world.onInteract = interact;
world.onPause = () => {
    if (mode === 'play')
        showPause();
    audio.setSceneState(false, false);
};
world.onStep = running => audio.footstep(running);
world.onLightSwitch = () => audio.sound('switch');
world.onPointerError = reason => {
    if (mode === 'play') {
        $('#mouse-status').textContent = reason === 'pending' ? 'Mouse capture is taking longer than expected. You can retry.' : 'Mouse capture was denied. You can retry without reloading.';
        $('#mouse-help').hidden = false;
    }
};
const fanPoint = toWorld(NOOK.wing, NOOK.x + EQUIPMENT.fan.x, NOOK.z + EQUIPMENT.fan.z);
let areaTimer = 0, timeSecond = -1, nextAmbient = 18 + Math.random() * 29;
function updateTime() {
    const second = Math.floor(Date.now() / 1000);
    if (second === timeSecond)
        return;
    timeSecond = second;
    if (updateCorrespondence(save)) write();
    const count = deliveredMail(save).length;
    if (count !== deliveredCount) {
        if (count > deliveredCount && world.atDesk() && windowFocused && !document.hidden && !['pause', 'title'].includes(mode))
            audio.sound('mail', world.camera.position);
        deliveredCount = count;
        world.updateMailIndicator(save);
        if (mode === 'computer')
            deskScreens.refreshMail();
    }
    if(finishVending(save)){audio.sound('machine');write();world.syncDesk(save);stationery.refreshVending();}
    const local = officeTime(save.playSeconds);
    setText($('#office-day'), local.day);
    $('#office-day').title=local.date;
    setText($('#office-local-time'), local.time);
    setText($('#shift-time'), shiftDuration(save.playSeconds));
    if (mode === 'play' && windowFocused) {
        const point = world.clockPoint();
        if (point)
            audio.sound('tick', point);
    }
}
// Sample the existing frame loop only while the optional meter is visible.
let performanceMeterEnabled = false, performanceWindowStart = 0, performanceLastFrame = 0, performanceLastRender = 0;
let performanceIntervals: number[] = [];
function togglePerformanceMeter() {
    performanceMeterEnabled = !performanceMeterEnabled;
    const meter = $('#performance-meter');
    meter.hidden = !performanceMeterEnabled;
    if (performanceMeterEnabled) {
        const now = performance.now();
        performanceWindowStart = performanceLastFrame = now;
        performanceLastRender = world.stats().renderedFrames;
        performanceIntervals = [];
        meter.textContent = 'Measuring…';
    }
}
function updatePerformanceMeter() {
    if (!performanceMeterEnabled) return;
    const now = performance.now(), interval = now - performanceLastFrame;
    performanceLastFrame = now;
    // Hidden tabs and debugger stops are not gameplay frame times.
    if (interval > 2000) { performanceWindowStart = now; performanceLastRender = world.stats().renderedFrames; performanceIntervals = []; return; }
    performanceIntervals.push(interval);
    const duration = now - performanceWindowStart;
    if (duration < 1000) return;
    const stats = world.stats(), ordered = [...performanceIntervals].sort((a, b) => a - b);
    const fps = performanceIntervals.length * 1000 / duration;
    const p95 = ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * .95))] ?? 0;
    const renders = (stats.renderedFrames - performanceLastRender) * 1000 / duration;
    $('#performance-meter').textContent = `FPS ${fps.toFixed(0)} · 95% frame ${p95.toFixed(1)} ms | 3D ${renders.toFixed(1)}/s · last frame ${stats.calls} draws / ${(stats.triangles / 1000).toFixed(0)}k triangles | ${save.settings.quality} · F9 hide`;
    performanceWindowStart = now;
    performanceLastRender = stats.renderedFrames;
    performanceIntervals = [];
}
world.run(dt => {
    updatePerformanceMeter();
    audio.setFan(!!officeFor(save).fanOn, fanPoint);
    audio.setSceneState(mode === 'play', !document.hidden && windowFocused);
    audio.setListener(world.camera.position.x, world.camera.position.z, world.camera.rotation.y);
    accrueShift();
    updateTime();
    saveTimer += dt;
    if (mode === 'play' && windowFocused)
        ambientTimer += dt;
    areaTimer += dt;
    if (saveTimer > 15) {
        saveTimer = 0;
        if (save.started)
            write();
    }
    if (ambientTimer > nextAmbient) {
        ambientTimer = 0;
        nextAmbient = 18 + Math.random() * 37;
        const point = world.clockPoint();
        audio.sound(Math.random() < .5 ? 'distant' : 'building', point ?? undefined);
    }
    if (areaTimer > 0.15) {
        areaTimer = 0;
        const z = toRoom(world.wing, world.camera.position.x, world.camera.position.z).z, row = Math.max(0, Math.min(7, Math.round((FIRST_ROW_Z - z) / 6)));
        setHtml($('#area'), world.atDesk() ? 'W4 / WORK NOOK <span>YOUR DESK / EXECUTIVE</span>' : z > 2 ? `W${world.wing + 1} <span>${WINGS[world.wing].toUpperCase()}</span>` : `W${world.wing + 1} / AISLE ${String.fromCharCode(65 + row)} <span>${WINGS[world.wing].toUpperCase()} / ${DEPARTMENTS[row].toUpperCase()}</span>`);
        const target = world.target, el = $('#interaction');
        el.hidden = mode !== 'play' || (!target && !world.isSeated);
        $('#crosshair').hidden = mode !== 'play';
        const held = physicalFor(save).held, heldEl = $('#held-status');
        heldEl.hidden = mode !== 'play' || !held;
        if (held) {
            const label = held.kind === 'file' ? `Original ${reference(held.id)} · F read` : held.kind === 'copy' ? `Printed copy · F read / I store` : held.kind==='tool'?`${TOOL_NAMES[held.id]} · F use / I stow`:held.kind==='sticky'?'Sticky note · E board / I store or recycle':held.kind==='can'?`${DRINKS[deskFor(save).vending.drink!]} · click drink / I stow`:itemName(physicalFor(save).items.find(i => i.id === held.id)!) + ' · click drink';
            const destination = world.placement();
            let placement = ['tool','sticky','can'].includes(held.kind)?'I opens inventory':'Aim at a suitable surface';
            if (destination && destination !== 'held'&&!['tool','sticky','can'].includes(held.kind)) {
                if (destination === 'printer-input')
                    placement = 'G insert original';
                else if (isContainer(destination))
                    placement = `G place · ${containerLoad(physicalFor(save), destination as Container)}/${capacity(destination as Container)} files`;
                else
                    placement = `G place · ${physicalFor(save).items.filter(i => i.place === destination).length}/${SURFACES[destination as Surface].capacity} spaces`;
            }
            setText(heldEl, label + ' — ' + placement);
        }
        if (world.isSeated)
            setHtml(el, '<kbd>E</kbd><div>Stand up<small>OR PRESS ESCAPE</small></div>');
        if (world.captureState === 'locked')
            $('#mouse-help').hidden = true;
        if (target && !world.isSeated) {
            if(target.kind==='office-life')setHtml(el,`<kbd>E</kbd><div>${target.feature==='stationery'?'Open stationery box':target.feature==='vending'?'Staff drinks · FREE':'Recycle can'}<small>OFFICE EQUIPMENT</small></div>`);
            else if (target.kind === 'desk-feature')
                setHtml(el, `<kbd>E</kbd><div>${({ computer: 'Records Desktop', pinboard: 'Your pinboard', collection: 'Collection compartment', notices: 'Public notices' })[target.feature]}<small>W4 / WORK NOOK</small></div>`);
            else if (target.kind === 'desk')
                setHtml(el, '<kbd>E</kbd><div>Your desk<small>SUBMISSIONS & CORRESPONDENCE</small></div>');
            else if (target.kind === 'door') {
                setHtml(el, `<kbd>E</kbd><div>${target.open ? 'Close' : 'Open'} archive door<small>W${target.destination + 1} · ${esc(WINGS[target.destination].toUpperCase())}</small></div>`);
            }
            else if (target.kind === 'prop') {
                setHtml(el, `<kbd>E</kbd><div>${esc(target.label)}<small>OFFICE EQUIPMENT</small></div>`);
            }
            else if (target.kind === 'whiteboard') {
                setHtml(el, '<kbd>E</kbd><div>Whiteboard<small>DRAW / ERASE / LEAVE YOURSELF A NOTE</small></div>');
            }
            else if (target.kind === 'storage') {
                const address = parseContainer(target.container), note = address ? save.markers.find(m => m.cabinet === address.unit)?.label : undefined;
                setHtml(el, `<kbd>E</kbd><div>${esc(containerLabel(target.container))}<small>${containerLoad(physicalFor(save), target.container)}/${capacity(target.container)} FILES · G TO PLACE${note ? ' · ' + esc(note) : ''}</small></div>`);
            }
            else if (target.kind === 'item') {
                const item = physicalFor(save).items.find(i => i.id === target.id)!;
                setHtml(el, `<kbd>E</kbd><div>Pick up ${esc(itemName(item))}<small>ONE OBJECT AT A TIME</small></div>`);
            }
            else if (target.kind === 'surface') {
                setHtml(el, `<kbd>G</kbd><div>Place on ${SURFACES[target.surface].name}<small>${physicalFor(save).items.filter(i => i.place === target.surface).length}/${SURFACES[target.surface].capacity} SPACES</small></div>`);
            }
            else if (target.kind === 'drawer') {
                const l = location(fileId(target.cabinet, target.drawer)), tab = save.markers.find(m => m.cabinet === target.cabinet);
                setHtml(el, `<kbd>E</kbd><div>Open ${l.label} · drawer ${target.drawer + 1}<small>${DEPARTMENTS[l.department].toUpperCase()} / ${MONTHS[l.column % 12].toUpperCase()} 2023${tab ? ' · ' + esc(tab.label) : ''}</small></div>`);
            }
        }
    }
}, () => save.upgrades.includes('drawers'));
addEventListener('beforeunload', () => {
    accrueShift();
    finishBoard?.();
    if (save.started)
        write();
});
if (process.env.NODE_ENV === 'development' && new URLSearchParams(locationSearch()).has('test')) {
    const { modules } = await import('./dev-tools');
    (window as unknown as {
        __GAME__: unknown;
    }).__GAME__ = { get save() {
            return save;
        }, get archive() {
            return archive;
        }, modules, world, audio, deskScreens, stationery, placements: () => placements, visit, openStorage, showMap, showNotebook, showSupplies, showDesk, showComparison, showSources, showWhiteboard, showPrinter, showPrintedCopy, showInventory, showShredder, resume, showEnding, write, get mode() {
            return mode;
        }, stats: () => world.stats(), tutorialId: TUTORIAL_ID, PHRASE };
}
function locationSearch() {
    return window.location.search;
}

showTitle();
}
