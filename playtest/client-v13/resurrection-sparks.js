// Authorized exception: this generator belongs only to this cursor decoration.
// No gameplay seed, host, transport or global Math.random is used.
export function createSparkRandom(seed=crypto.getRandomValues(new Uint32Array(1))[0]){
 let word=seed>>>0;
 return ()=>((word=(Math.imul(1664525,word)+1013904223)>>>0)/4294967296);
}
export function mountResurrectionSparks({active,random=createSparkRandom(),document:doc=document,now=()=>performance.now(),schedule=setTimeout,cancel=clearTimeout}){
 let last=0,disposed=false;const particles=new Map();
 function move(e){if(disposed||!active())return;const time=now();if(time-last<34)return;last=time;
  const count=1+Math.floor(random()*2);
  for(let i=0;i<count;i++){
   const s=doc.createElement('i');s.className='rez-spark';
   s.style.left=(e.clientX-2+(random()*8-4))+'px';s.style.top=(e.clientY-2+(random()*8-4))+'px';
   s.style.setProperty('--dx',(random()*16-8).toFixed(1)+'px');s.style.setProperty('--dy',(4+random()*12).toFixed(1)+'px');
   doc.body.appendChild(s);const timer=schedule(()=>{s.remove();particles.delete(s);},460);particles.set(s,timer);
  }
 }
 doc.addEventListener('mousemove',move);
 return ()=>{disposed=true;doc.removeEventListener('mousemove',move);for(const [particle,timer]of particles){cancel(timer);particle.remove();}particles.clear();};
}
