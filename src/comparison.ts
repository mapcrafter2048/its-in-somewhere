import { recordParagraphs } from './ui/record-format';
import { documentClass, documentLetterhead, documentColophon } from './ui/document';
import { escapeHtml as esc } from './ui/dom';
import { readableDocument } from './pagination';
import type { Save, ArchiveDocument } from './types';
import type { Archive } from './content/generator';
import { reference } from './archive';
import { ensureSource } from './content/sources';
interface Side {
    id: number | null;
    page: number;
    sheet: number;
    revealed: Set<string>;
    comment: string;
}
export function openComparison(save: Save, archive: Archive, show: (html: string) => void, isActive: () => boolean, evidence: (id: number) => void, onPage?: (text: string) => void) {
    const sides: Side[] = [{ id: save.bookmarks[0] ?? null, page: 0, sheet: 0, revealed: new Set(), comment: '' }, { id: save.bookmarks[1] ?? null, page: 0, sheet: 0, revealed: new Set(), comment: '' }];
    let request = 0;
    async function paint() {
        const token = ++request;
        const sources = sides.map(s => s.id === null ? null : archive.get(s.id).source?.id).filter((id): id is string => !!id);
        if (sources.length) {
            show('<div class="comparison-loading" role="status">Setting out the retained copies…</div>');
            try {
                await Promise.all(sources.map(ensureSource));
            }
            catch (e) {
                if (token !== request || !isActive())
                    return;
                show(`<div class="prose"><p>${esc(e instanceof Error ? e.message : 'Reference pack unavailable.')}</p><button id="compare-retry">Retry reference load</button><button data-action="resume">Return to archive</button></div>`);
                document.querySelector('#compare-retry')?.addEventListener('click', () => void paint());
                return;
            }
        }
        if (token !== request || !isActive())
            return;
        show(`<section class="comparison panel wide" role="dialog" aria-modal="true" aria-label="Comparison stand"><header class="panel-head"><div><span class="eyebrow">RETAINED COPIES / YOUR CONCLUSIONS</span><h2>The comparison stand</h2></div><button data-action="resume" class="close" aria-label="Close comparison">×</button></header><div class="comparison-columns">${sides.map((s, index) => {
            const d = s.id === null ? null : readableDocument(archive.get(s.id));
            return `<section class="comparison-side"><label>Document ${index + 1}<select data-compare-select="${index}"><option value="">Choose an available document</option>${save.bookmarks.map(id => `<option value="${id}" ${id === s.id ? 'selected' : ''}>${esc(reference(id) + ' · ' + archive.get(id).title)}</option>`).join('')}</select></label>${d ? `<article class="comparison-paper ${documentClass(d)}">${documentLetterhead(d)}<span class="eyebrow">${esc(reference(d.id))}</span><h3>${esc(d.title)}</h3>${body(d, s, index)}${documentColophon(d)}</article><footer><button data-compare-page="${index},-1" ${s.page === 0 ? 'disabled' : ''}>←</button><span>${s.page < d.pages.length ? `PAGE ${s.page + 1}` : 'WORKBOOK'}</span><button data-compare-page="${index},1" ${s.page >= d.pages.length + (d.sheets?.length ? 1 : 0) - 1 ? 'disabled' : ''}>→</button></footer>` : '<div class="empty-state">Choose a carried document, or one in personal storage while at your desk.</div>'}</section>`;
        }).join('')}</div></section>`);
        document.querySelectorAll<HTMLSelectElement>('[data-compare-select]').forEach(el => el.onchange = () => {
            const side = sides[Number(el.dataset.compareSelect)];
            side.id = el.value === '' ? null : Number(el.value);
            side.page = 0;
            side.sheet = 0;
            side.comment = '';
            void paint();
        });
        document.querySelectorAll<HTMLButtonElement>('[data-compare-page]').forEach(el => el.onclick = () => {
            const [index, delta] = el.dataset.comparePage!.split(',').map(Number);
            sides[index].page += delta;
            void paint();
        });
        document.querySelectorAll<HTMLButtonElement>('[data-compare-sheet]').forEach(el => el.onclick = () => {
            const [index, sheet] = el.dataset.compareSheet!.split(',').map(Number);
            sides[index].sheet = sheet;
            sides[index].comment = '';
            void paint();
        });
        document.querySelectorAll<HTMLButtonElement>('[data-compare-reveal]').forEach(el => el.onclick = () => {
            const side = sides[Number(el.dataset.compareReveal)], key = `${side.id}:${side.sheet}`;
            if (side.revealed.has(key))
                side.revealed.delete(key);
            else
                side.revealed.add(key);
            void paint();
        });
        document.querySelectorAll<HTMLButtonElement>('[data-compare-cell]').forEach(el => el.onclick = () => {
            const [index, row, col] = el.dataset.compareCell!.split(',').map(Number), s = sides[index], cell = archive.get(s.id!).sheets![s.sheet].rows[row][col];
            s.comment = cell.comment ?? cell.value;
            if (cell.clue)
                evidence(s.id!);
            void paint();
        });
    }
    function body(d: ArchiveDocument, s: Side, index: number) {
        if (s.page < d.pages.length)
            onPage?.(d.pages[s.page]);
        if (s.page < d.pages.length)
            return `<div class="document-text">${recordParagraphs(d,d.pages[s.page])}</div>`;
        const sheet = d.sheets![s.sheet], key = `${d.id}:${s.sheet}`;
        return `<nav class="sheet-tabs">${d.sheets!.map((sh, i) => `<button data-compare-sheet="${index},${i}" class="${i === s.sheet ? 'selected' : ''}">${esc(sh.name)}</button>`).join('')}</nav>${sheet.hiddenRows?.length ? `<button data-compare-reveal="${index}">${s.revealed.has(key) ? 'Hide restored rows' : 'Reveal hidden rows'}</button>` : ''}<div class="table-scroll"><table class="sheet"><thead><tr>${sheet.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${sheet.rows.map((row, r) => !s.revealed.has(key) && sheet.hiddenRows?.includes(r) ? `<tr><td colspan="${sheet.columns.length}" class="hidden-row">··· hidden row ···</td></tr>` : `<tr>${row.map((c, col) => `<td><button class="cell ${c.comment ? 'has-comment' : ''}" data-compare-cell="${index},${r},${col}">${esc(c.value)}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="cell-comment" role="status">${esc(s.comment || 'Inspect cells to read retained comments.')}</div>`;
    }
    void paint();
}
