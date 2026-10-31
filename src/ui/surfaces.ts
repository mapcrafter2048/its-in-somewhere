/** Physical UI objects share navigation contracts, not a single paper-panel appearance. */
const kinds: Record<string, string> = { notebook: 'notebook', note: 'notebook', inventory: 'wallet', supplies: 'requisition', map: 'plan', desk: 'blotter', printer: 'printer', shredder: 'shredder', whiteboard: 'whiteboard', 'board-finished': 'whiteboard', pinboard: 'pinboard', notices: 'notices', comparison: 'comparison', 'printed-copy': 'printout', 'legacy-binder': 'binder', letter: 'letter', tutorial: 'memo', hints: 'index', sources: 'catalogue', pause: 'shift-card', reset: 'routing', import: 'routing', ending: 'completion', storage: 'drawer', 'reader-loading': 'drawer', 'reader-error': 'drawer' };
export function decorateInterface(host: HTMLElement, mode: string) {
    if (mode === 'computer' || host.querySelector('.notebook-book'))
        return;
    const reader = host.querySelector<HTMLElement>('.reader');
    if (reader) {
        reader.dataset.surface = 'folder';
        reader.classList.add('surface-folder');
        return;
    }
    if (mode === 'title') {
        host.querySelector('.title-screen')?.classList.add('surface-clockin');
        return;
    }
    const panel = host.querySelector<HTMLElement>('.panel');
    if (!panel)
        return;
    const kind = kinds[mode] ?? 'dossier';
    panel.dataset.surface = kind;
    panel.classList.add('surface', `surface-${kind}`);
    const head = panel.querySelector<HTMLElement>(':scope > .panel-head');
    head?.classList.add('surface-head');
    const hardware = document.createElement('div');
    hardware.className = 'surface-hardware';
    hardware.setAttribute('aria-hidden', 'true');
    panel.prepend(hardware);
    if (kind === 'requisition') {
        const register = document.createElement('div');
        register.className = 'requisition-register';
        register.setAttribute('aria-hidden', 'true');
        register.innerHTML = '<span>STORES / EQUIPMENT</span><span>QTY: ONE OF EACH</span><span>APPROVAL: YOURS</span>';
        head?.after(register);
    }
    if (kind === 'printer' || kind === 'shredder') {
        const plate = document.createElement('div');
        plate.className = 'machine-rating';
        plate.setAttribute('aria-hidden', 'true');
        plate.textContent = kind === 'printer' ? 'R&R DUPLICATOR / MODEL 02' : 'R&R DOCUMENT DISPOSAL / MODEL 01';
        panel.append(plate);
    }
    if (kind === 'wallet') {
        panel.querySelectorAll<HTMLElement>('.inventory-files article').forEach((pocket, i) => {
            pocket.dataset.pocket = String(i + 1).padStart(2, '0');
        });
    }
}
