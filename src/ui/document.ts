import { DEPARTMENTS, location, reference } from '../archive';
import type { ArchiveDocument } from '../types';
import { escapeHtml as esc } from './dom';
export type DocumentTreatment = 'correspondence' | 'report' | 'form' | 'reference' | 'workbook';
export function documentTreatment(doc: ArchiveDocument): DocumentTreatment {
    if (doc.kind === 'spreadsheet')
        return 'workbook';
    if (doc.kind === 'reference' || doc.kind === 'research')
        return 'reference';
    if (['memo', 'email', 'letter', 'resignation', 'complaint'].includes(doc.kind))
        return 'correspondence';
    if (['report', 'proposal', 'training', 'transcript'].includes(doc.kind))
        return 'report';
    return 'form';
}
export function documentClass(doc: ArchiveDocument) {
    return `archive-paper treatment-${documentTreatment(doc)} wear-${doc.id % 3}`;
}
/** Decorative metadata only. The body and evidence remain the original document text. */
export function documentLetterhead(doc: ArchiveDocument) {
    const department = DEPARTMENTS[location(doc.id).department];
    return `<div class="document-letterhead"><span>${esc(department)}<small>RECORDS & RETENTION</small></span><span class="document-register">${esc(doc.kind.toUpperCase())}<small>${esc(reference(doc.id))}</small></span></div>`;
}
export function documentColophon(doc: ArchiveDocument) {
    return `<div class="document-colophon" aria-hidden="true"><span>RETAINED AS RECEIVED</span><span>${String(doc.id + 1).padStart(6, '0')}</span></div>`;
}
