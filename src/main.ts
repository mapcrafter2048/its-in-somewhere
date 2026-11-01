// The game owns a single document for its lifetime. Cache startup so React's
// development effect replay cannot create a second renderer or event loop.
let startup: Promise<unknown> | undefined;
export function startGame() {
 return startup ??= (async () => {
  if (process.env.NODE_ENV === 'development' && new URLSearchParams(window.location.search).has('models')) {
   const { mountModelViewer } = await import('./model-viewer');
   mountModelViewer(document.querySelector('#app')!);
  } else {
   const { mountGame } = await import('./game');
   await mountGame();
  }
 })();
}
