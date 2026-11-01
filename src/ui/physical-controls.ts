import { escapeHtml as esc } from './dom';

let choiceSequence = 0;
const paperStocks: Record<string, string> = { cream: '#eee5cc', rose: '#ecd6cb', blue: '#d8e2df', sage: '#dce2c8', yellow: '#eee4a2' };
const inks: Record<string, string> = { black: '#28382f', blue: '#285e99', red: '#ae3e38', green: '#48744d', gold: '#bd9b47', rose: '#bd8075' };

/** Keep the existing form value and change handlers; expose physical samples instead of a dropdown. */
export function integratePhysicalChoices(host: HTMLElement) {
    host.querySelectorAll<HTMLSelectElement>('select:not([data-physical-choice])').forEach(select => {
        // A turning page is a visual snapshot, not another interactive form.
        if (select.closest('.pc-terminal,.book-animation-layer')) return;
        select.dataset.physicalChoice = 'true';
        const sequence = ++choiceSequence;
        const id = select.id || (select.id = `physical-choice-${sequence}`);
        const label = select.closest('label');
        const labelCopy = label?.cloneNode(true) as HTMLElement | undefined;
        labelCopy?.querySelectorAll('select').forEach(el => el.remove());
        const title = labelCopy?.textContent?.trim() || select.getAttribute('aria-label') || 'Choose';
        const options = [...select.options];
        const palette = /paper|sticky-colour/.test(id) ? paperStocks : /ink|color|colour/.test(id) ? inks : undefined;
        const samples = palette && options.every(option => option.value in palette);
        const tools = id === 'note-tool';
        const group = document.createElement('fieldset');
        group.className = `physical-choices ${samples ? 'material-samples' : tools ? 'drawing-instruments' : options.length > 4 ? 'paper-choice-list' : 'printed-choices'}`;
        group.dataset.choiceFor = id;
        group.disabled = select.disabled;
        group.innerHTML = `<legend>${esc(title)}</legend><div class="physical-choice-options">${options.map((option, i) => `<label class="physical-choice ${samples ? /paper|sticky/.test(id) ? 'stock-sample' : 'ink-sample' : tools ? `instrument-${esc(option.value)}` : ''}" ${samples ? `style="--sample:${palette![option.value]}"` : ''}><input type="radio" name="physical-${sequence}" value="${esc(option.value)}" ${option.selected ? 'checked' : ''} ${option.disabled || option.parentElement instanceof HTMLOptGroupElement && option.parentElement.disabled ? 'disabled' : ''}><span ${samples || tools ? 'class="choice-object" aria-hidden="true"' : 'class="choice-mark" aria-hidden="true"'}>${samples || tools ? '' : String(i + 1).padStart(2, '0')}</span><span class="choice-label">${esc(option.label)}</span></label>`).join('') || '<span class="physical-choice-empty">Nothing filed here yet.</span>'}</div>`;
        group.addEventListener('change', event => {
            if (!(event.target instanceof HTMLInputElement)) return;
            select.value = event.target.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        // A select inside a label keeps its form semantics, but its replacement owns the accessible name.
        select.hidden = true;
        if (label) { label.hidden = true; label.after(group); }
        else select.after(group);
    });
}

/** Later inserts (map labels and selected records) get the same controls as the initial surface. */
export function observePhysicalChoices(host: HTMLElement) {
    const observer = new MutationObserver(() => integratePhysicalChoices(host));
    observer.observe(host, { childList: true, subtree: true });
    return () => observer.disconnect();
}
