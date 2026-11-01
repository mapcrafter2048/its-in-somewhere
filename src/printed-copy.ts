import { recordParagraphs } from './ui/record-format';
import { documentClass, documentLetterhead, documentColophon } from './ui/document';
import { escapeHtml as esc } from './ui/dom';
import { reference } from './archive';
import { readableDocument } from './pagination';
import type { ArchiveDocument } from './types';
/** Read a physical copy without changing inspection, voucher, or evidence progress. */
export function mountPrintedCopy(host: HTMLElement, doc: ArchiveDocument, onPage?: (text: string) => void) {
    doc = readableDocument(doc);
    let page = 0, sheet = 0, comment = '';
    const revealed = new Set<number>();
    function paint() {
        const workbook = page === doc.pages.length && !!doc.sheets?.length, s = doc.sheets?.[sheet], max = doc.pages.length + (doc.sheets?.length ? 1 : 0);
        const body = !workbook ? recordParagraphs(doc,doc.pages[page]) : `<nav class="sheet-tabs">${doc.sheets!.map((s, i) => `<button data-print-sheet="${i}" aria-pressed="${i === sheet}">${esc(s.name)}</button>`).join('')}</nav>${s?.hiddenRows?.length ? `<button id="print-hidden">${revealed.has(sheet) ? 'Hide restored rows' : 'Reveal hidden rows'}</button>` : ''}<div class="table-scroll"><table class="sheet"><thead><tr>${s!.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${s!.rows.map((row, r) => !revealed.has(sheet) && s!.hiddenRows?.includes(r) ? `<tr><td class="hidden-row" colspan="${s!.columns.length}">··· hidden row ···</td></tr>` : `<tr>${row.map((c, i) => `<td><button class="cell ${c.comment ? 'has-comment' : ''}" data-print-cell="${r},${i}">${esc(c.value)}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="cell-comment" role="status">${esc(comment || 'Inspect a cell to read its retained comment.')}</p>`;
        host.innerHTML = `<article class="printed-document ${documentClass(doc)}">${documentLetterhead(doc)}<div class="eyebrow">PRINTED COPY · FILE ${esc(reference(doc.id))}</div><h3>${esc(doc.title)}</h3><p>${esc(doc.date)} / ${esc(doc.author)}</p><div class="document-text">${body}</div>${documentColophon(doc)}</article><footer class="panel-foot"><button id="print-prev" ${page === 0 ? 'disabled' : ''}>Previous page</button><span>${workbook ? 'WORKBOOK' : `PAGE ${page + 1}`} / ${max}</span><button id="print-next" ${page >= max - 1 ? 'disabled' : ''}>Next page</button></footer>`;
        host.querySelector<HTMLButtonElement>('#print-prev')!.onclick = () => {
            page--;
            paint();
        };
        host.querySelector<HTMLButtonElement>('#print-next')!.onclick = () => {
            page++;
            paint();
        };
        host.querySelectorAll<HTMLButtonElement>('[data-print-sheet]').forEach(b => b.onclick = () => {
            sheet = Number(b.dataset.printSheet);
            comment = '';
            paint();
        });
        host.querySelector<HTMLButtonElement>('#print-hidden')?.addEventListener('click', () => {
            if (revealed.has(sheet))
                revealed.delete(sheet);
            else
                revealed.add(sheet);
            paint();
        });
        host.querySelectorAll<HTMLButtonElement>('[data-print-cell]').forEach(b => b.onclick = () => {
            const [r, c] = b.dataset.printCell!.split(',').map(Number);
            comment = s!.rows[r][c].comment ?? s!.rows[r][c].value;
            paint();
        });
        if (!workbook)
            onPage?.(doc.pages[page]);
    }
    paint();
}
