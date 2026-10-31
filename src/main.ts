import './style.css';
if(import.meta.env.DEV&&new URLSearchParams(window.location.search).has('models')){
 const {mountModelViewer}=await import('./model-viewer');mountModelViewer(document.querySelector('#app')!);
}else{await import('./game');}
