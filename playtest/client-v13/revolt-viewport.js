// Presentation-only viewport guard, shared by concurrent Revolt playback instances.
let depth=0,restore=null;
export function lockRevoltViewport(){
 if(depth++===0){const root=document.documentElement,body=document.body,x=scrollX,y=scrollY,old=[root.style.overflow,root.style.scrollbarGutter,root.style.scrollBehavior,body.style.overflow];
  const prevent=e=>e.preventDefault(),key=e=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key))e.preventDefault();},hold=()=>{if(scrollX!==x||scrollY!==y)scrollTo(x,y);};
  root.style.scrollbarGutter='stable';root.style.scrollBehavior='auto';root.style.overflow='hidden';body.style.overflow='hidden';
  addEventListener('wheel',prevent,{passive:false});addEventListener('touchmove',prevent,{passive:false});addEventListener('keydown',key,true);addEventListener('scroll',hold);hold();
  restore=()=>{removeEventListener('wheel',prevent);removeEventListener('touchmove',prevent);removeEventListener('keydown',key,true);removeEventListener('scroll',hold);root.style.overflow=old[0];root.style.scrollbarGutter=old[1];body.style.overflow=old[3];scrollTo(x,y);root.style.scrollBehavior=old[2];};
 }
 let released=false;return ()=>{if(released)return;released=true;if(--depth===0){restore?.();restore=null;}};
}
