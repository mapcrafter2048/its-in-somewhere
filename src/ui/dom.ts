const htmlValues = new WeakMap<HTMLElement, string>();
/** Shared escaping and idempotent DOM writes for the HUD and document screens. */
export const escapeHtml = (value: unknown): string => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
export function setText(element: HTMLElement, text: string) {
    if (element.textContent !== text)
        element.textContent = text;
}
export function setHtml(element: HTMLElement, html: string) {
    if (htmlValues.get(element) !== html) {
        element.innerHTML = html;
        htmlValues.set(element, html);
    }
}
export function panel(title: string, eyebrow: string, content: string, wide = false) {
    return `<section class="panel ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><header class="panel-head"><div><span class="eyebrow">${escapeHtml(eyebrow)}</span><h2>${escapeHtml(title)}</h2></div><button class="close" data-action="resume" aria-label="Close and return to archive">×</button></header>${content}</section>`;
}
