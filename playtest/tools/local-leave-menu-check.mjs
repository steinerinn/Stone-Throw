import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../client-v13/bootstrap-production.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('let leavingMatch=false;'),source.indexOf("window.addEventListener('click',async e=>{if(localContext"));
assert.ok(handler.includes('window.__stoneThrowLeaveMatch='));
let checks=0;
for(const localContext of [true,false])for(const fromResult of [true,false]){
 const calls=[],overlay={style:{display:'block'}},savedBattle={round:7,shots:2,board:['hit','miss']};
 const before=structuredClone(savedBattle);
 const context={localContext,document:{getElementById:id=>{assert.equal(id,'resultOverlay');return overlay;}},window:{__stoneThrowOpenMainMenu:()=>calls.push('menu'),alert:()=>calls.push('alert')},session:{request:async action=>calls.push(action)},browserClient:{unmount:()=>calls.push('unmount')},reloadToMainMenu:()=>calls.push('reload'),confirmLeave:async()=>{calls.push('confirm');return true;},coverRematch:()=>{calls.push('cover');return ()=>calls.push('uncover');}};
 vm.runInNewContext(handler,context);
 await context.window.__stoneThrowLeaveMatch({fromResult});
 if(localContext){
  assert.deepEqual(calls,['menu']);
  assert.equal(overlay.style.display,fromResult?'none':'block');
  // Leaving and returning again must not leave navigation permanently locked.
  await context.window.__stoneThrowLeaveMatch({fromResult});
  assert.deepEqual(calls,['menu','menu']);
 }else{
  assert.deepEqual(calls,[fromResult?'cover':'confirm','leave-match','unmount','reload']);
 }
 assert.deepEqual(savedBattle,before);
 checks++;
}
console.log('PASS '+checks+' Leave paths: local active/Result use in-page menu without reload, unmount or leave-match request; repeated local navigation works; online paths unchanged.');
