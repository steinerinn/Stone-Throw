
(()=>{
const born=performance.now();const hideLoader=()=>{
const el=document.getElementById('stLoadingScreen');if(!el) return;const wait=Math.max(0,650-(performance.now()-born));setTimeout(()=>{
el.classList.add('st-loading-done');setTimeout(()=>{ if(el && el.parentNode) el.remove(); },300);},wait);};if(document.readyState==='complete') hideLoader();else window.addEventListener('load',hideLoader,{once:true});setTimeout(hideLoader,4000);})();