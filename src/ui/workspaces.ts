/** Keep the object clear, with its supplies and selection controls on the right. */
export function arrangeWorkspace(panel: HTMLElement, mode: string) {
 if(mode==='pinboard'){
  const surface=panel.querySelector('.personal-board')!;
  const layout=document.createElement('div');layout.className='object-workspace pinboard-workspace';
  const rail=document.createElement('aside');rail.className='object-rail';rail.setAttribute('aria-label','Pinboard supplies and selected note');
  surface.before(layout);layout.append(surface,rail);
  for(const selector of ['.board-toolbar','#pin-actions','.board-connection-tools','.board-connections']){const el=panel.querySelector(selector);if(el)rail.append(el);}
 }
 if(mode==='inventory'){
  const files=panel.querySelector<HTMLElement>('.inventory-files')!,stationery=panel.querySelector<HTMLElement>('.stationery-inventory')!,intro=panel.querySelector<HTMLElement>(':scope>.prose')!;
  const layout=document.createElement('div');layout.className='object-workspace inventory-workspace';
  const main=document.createElement('div');main.className='inventory-main';const rail=document.createElement('aside');rail.className='object-rail';rail.setAttribute('aria-label','Inventory actions');
  const tabs=document.createElement('nav');tabs.className='inventory-tabs';tabs.setAttribute('aria-label','Inventory compartments');tabs.innerHTML='<button data-inventory-tab="files" aria-pressed="true">Files</button><button data-inventory-tab="stationery" aria-pressed="false">Stationery</button>';
  files.before(tabs,layout);layout.append(main,rail);main.append(files,stationery);stationery.hidden=true;
  const destination=intro.querySelector('[data-choice-for="inventory-storage"]');const select=intro.querySelector('label');if(select)rail.append(select);if(destination)rail.append(destination);
  const selection=document.createElement('div');selection.className='inventory-selection';selection.setAttribute('role','region');selection.setAttribute('aria-label','Selected file actions');selection.innerHTML='<p>Select a file to read, carry or store it.</p>';rail.append(selection);
  files.querySelectorAll<HTMLElement>('article').forEach((article,i)=>{const actions=[...article.querySelectorAll<HTMLButtonElement>('button')];const label=article.querySelector('p')?.textContent??`File ${i+1}`;const choose=document.createElement('button');choose.className='inventory-file-select';choose.setAttribute('aria-pressed','false');choose.textContent=label;article.prepend(choose);article.querySelector('p')?.remove();actions.forEach(action=>{action.hidden=true;article.append(action);});choose.onclick=()=>{files.querySelectorAll('article').forEach(el=>{el.classList.toggle('selected',el===article);el.querySelector('.inventory-file-select')?.setAttribute('aria-pressed',String(el===article));});selection.replaceChildren();const title=document.createElement('p');title.textContent=label;selection.append(title);actions.forEach(action=>{action.hidden=false;selection.append(action);});};});
  const foot=panel.querySelector('.panel-foot');if(foot)rail.append(foot);
  tabs.querySelectorAll<HTMLButtonElement>('button').forEach(button=>button.onclick=()=>{const isFiles=button.dataset.inventoryTab==='files';files.hidden=!isFiles;stationery.hidden=isFiles;selection.hidden=!isFiles;rail.querySelectorAll<HTMLElement>('[data-choice-for="inventory-storage"]').forEach(el=>el.hidden=!isFiles);tabs.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));});
 }
}
export function arrangeWhiteboard(host:HTMLElement){
 const panel=host.closest('.panel')!;host.classList.add('object-workspace','whiteboard-workspace');
 const drawing=document.createElement('div');drawing.className='whiteboard-drawing';
 const rail=document.createElement('aside');rail.className='object-rail';rail.setAttribute('aria-label','Whiteboard tools');
 host.append(drawing,rail);drawing.append(host.querySelector('canvas')!);
 for(const el of [panel.querySelector('.wing-tabs'),host.querySelector('.board-tools'),host.querySelector('#board-confirm'),host.querySelector('.board-status'),panel.querySelector('.panel-foot')])if(el)rail.append(el);
}
