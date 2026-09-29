const PHOTO='assets/about/early-paper-game.jpeg';
const CAPTION="Matti, age 5, testing a miniature version of the game at our summer house in 2013. He would later become one of CHAIN SIEGE's main designers and playtesters.";
export function aboutPhoto(){
 const figure=document.createElement('figure');figure.className='cs-history-photo';
 const button=document.createElement('button');button.type='button';button.className='cs-history-open';button.setAttribute('aria-label','Open historical photograph in full resolution');
 const image=document.createElement('img');image.src=PHOTO;image.alt='Hand-drawn battlefield on squared paper';image.width=3325;image.height=2494;image.loading='lazy';image.decoding='async';button.append(image);
 const caption=document.createElement('figcaption');caption.textContent=CAPTION;figure.append(button,caption);button.onclick=()=>openPhoto(button);return figure;
}
function openPhoto(trigger){
 const content=trigger.closest('.cs-about-content'),scroll=content.scrollTop,viewer=document.createElement('dialog');viewer.className='cs-photo-viewer';viewer.setAttribute('aria-label','Historical game photograph');
 const bar=document.createElement('div');bar.className='cs-photo-controls';const controls=[];
 const make=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=action;bar.append(b);controls.push(b);return b;};
 const stage=document.createElement('div');stage.className='cs-photo-stage';stage.tabIndex=0;stage.setAttribute('aria-label','Photograph. Use zoom controls, mouse wheel or pinch to zoom; drag to pan.');
 const img=document.createElement('img');img.src=PHOTO;img.alt='Full-resolution photograph of an early paper battlefield';img.draggable=false;stage.append(img);
 let scale=1,x=0,y=0,fit=1,closed=false;const pointers=new Map();let gesture=null,moved=false;
 const draw=()=>{const w=img.naturalWidth*fit*scale,h=img.naturalHeight*fit*scale;x=Math.max(-Math.max(0,(w-stage.clientWidth)/2),Math.min(Math.max(0,(w-stage.clientWidth)/2),x));y=Math.max(-Math.max(0,(h-stage.clientHeight)/2),Math.min(Math.max(0,(h-stage.clientHeight)/2),y));img.style.width=img.naturalWidth*fit+'px';img.style.height=img.naturalHeight*fit+'px';img.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px) scale(${scale})`;stage.classList.toggle('zoomed',scale>1);controls[0].disabled=scale>=8;controls[1].disabled=scale<=1;};
 const reset=()=>{scale=1;x=y=0;fit=Math.min(stage.clientWidth/img.naturalWidth,stage.clientHeight/img.naturalHeight,1);if(Number.isFinite(fit))draw();};
 const zoom=(next,px=0,py=0)=>{next=Math.max(1,Math.min(8,next));const ratio=next/scale;x=px-(px-x)*ratio;y=py-(py-y)*ratio;scale=next;draw();};
 const close=()=>{if(closed)return;closed=true;observer.disconnect();viewer.close();viewer.remove();trigger.focus({preventScroll:true});content.scrollTop=scroll;};
 make('ZOOM IN',()=>zoom(scale*1.4));make('ZOOM OUT',()=>zoom(scale/1.4));make('RESET',reset);make('CLOSE',close);
 viewer.append(bar,stage);document.body.append(viewer);viewer.showModal();
 viewer.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();close();});viewer.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='+'||e.key==='='){e.preventDefault();zoom(scale*1.4);}else if(e.key==='-'){e.preventDefault();zoom(scale/1.4);}else if(e.key==='0'){e.preventDefault();reset();}});
 stage.addEventListener('wheel',e=>{e.preventDefault();const r=stage.getBoundingClientRect();zoom(scale*Math.exp(-e.deltaY*.002),e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2);},{passive:false});
 const baseline=()=>{const a=[...pointers.values()];if(!a.length){gesture=null;return;}gesture={x,y,scale,cx:a.reduce((s,p)=>s+p.x,0)/a.length,cy:a.reduce((s,p)=>s+p.y,0)/a.length,d:a.length===2?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0};};
 stage.onpointerdown=e=>{if(e.button&&e.pointerType==='mouse')return;if(!pointers.size)moved=false;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});stage.setPointerCapture(e.pointerId);baseline();};
 stage.onpointermove=e=>{if(!pointers.has(e.pointerId)||!gesture)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const a=[...pointers.values()],cx=a.reduce((s,p)=>s+p.x,0)/a.length,cy=a.reduce((s,p)=>s+p.y,0)/a.length,dx=cx-gesture.cx,dy=cy-gesture.cy;if(Math.abs(dx)+Math.abs(dy)>4||a.length>1)moved=true;const next=a.length===2&&gesture.d?Math.max(1,Math.min(8,gesture.scale*Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)/gesture.d)):gesture.scale,r=stage.getBoundingClientRect(),ratio=next/gesture.scale;scale=next;x=dx+(gesture.cx-r.left-r.width/2)*(1-ratio)+gesture.x*ratio;y=dy+(gesture.cy-r.top-r.height/2)*(1-ratio)+gesture.y*ratio;draw();};
 const release=e=>{pointers.delete(e.pointerId);baseline();};stage.onpointerup=e=>{const outside=document.elementFromPoint(e.clientX,e.clientY)===stage;release(e);if(!pointers.size&&!moved&&outside)close();};stage.onpointercancel=release;stage.onlostpointercapture=release;
 const observer=new ResizeObserver(reset);observer.observe(stage);img.onload=reset;if(img.complete&&img.naturalWidth)reset();
}
