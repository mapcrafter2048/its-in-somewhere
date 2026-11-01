/** Native disclosures keep controls accessible without imposing application-menu roles on forms. */
export function dismissDisclosure(host: HTMLElement): boolean {
    const contents = host.querySelector<HTMLElement>('#book-index:not([hidden])');
    const open = [...host.querySelectorAll<HTMLDetailsElement>('details[open]')].at(-1);
    if (open) {
        open.open = false;
        open.querySelector<HTMLElement>('summary')?.focus({ preventScroll: true });
        return true;
    }
    if (contents) {
        const trigger = host.querySelector<HTMLElement>('#book-contents');
        if (trigger?.getAttribute('aria-expanded') === 'true') trigger.click();
        else contents.hidden = true;
        trigger?.focus({ preventScroll: true });
        return true;
    }
    return false;
}

export function installContextMenus(host: HTMLElement) {
    const closeOthers = (target: Element) => {
        host.querySelectorAll<HTMLDetailsElement>('.context-menu[open]').forEach(menu => {
            if (!menu.contains(target)) menu.open = false;
        });
    };
    document.addEventListener('pointerdown', e => {
        if (e.target instanceof Element) closeOthers(e.target);
    });
    host.addEventListener('focusin', e => {
        if (e.target instanceof Element) closeOthers(e.target);
    });
    host.addEventListener('click', e => {
        const target = e.target as Element;
        const button = target.closest<HTMLButtonElement>('.context-menu button');
        const menu = button?.closest<HTMLDetailsElement>('.context-menu');
        if (menu && button && !button.disabled) {
            menu.open = false;
            // Leave focus in new screens, confirmations and editors opened by the action.
            if (button === document.activeElement && menu.isConnected)
                menu.querySelector<HTMLElement>('summary')?.focus({ preventScroll: true });
        }
    });
    host.addEventListener('keydown', e => {
        if (!(e.target instanceof Element)) return;
        const menu = e.target.closest<HTMLDetailsElement>('.context-menu');
        if (!menu || !['ArrowDown', 'ArrowUp'].includes(e.key) || e.target.matches('input,select,textarea')) return;
        e.preventDefault();
        menu.open = true;
        const controls = [...menu.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')].filter(el => el.offsetParent !== null);
        const index = controls.indexOf(document.activeElement as HTMLElement);
        controls[(index + (e.key === 'ArrowDown' ? 1 : controls.length - 1) + controls.length) % controls.length]?.focus();
    });
}
