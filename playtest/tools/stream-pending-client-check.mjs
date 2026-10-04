import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Exercise the real client parser with only its logger and network boundary stubbed.
const source=fs.readFileSync(new URL('../client-v13/transport.js',import.meta.url),'utf8').replace(/^import[^\n]*\n/,'').replaceAll('export ','');
for(const ending of ['result','error','missing-result']){
 let controller,settled=false,previews=0;
 const context={TextDecoder,Uint8Array,performance,Date,serverMetrics(){},requestLog(){},responseLog(){},logEvent(){},gameLogEnabled:()=>false,
  fetch:async()=>new Response(new ReadableStream({start(c){controller=c;}}),{headers:{'Content-Type':'application/x-ndjson'}})};
 vm.createContext(context);vm.runInContext(source+'\nthis.session=createHttpSession();',context);
 const operation=context.session.client.dispatch({intent:{kind:'shoot'}},()=>previews++);
 const outcome=operation.then(value=>{settled=true;return {value};},error=>{settled=true;return {error};});
 await new Promise(resolve=>setImmediate(resolve));
 const send=value=>controller.enqueue(new TextEncoder().encode(JSON.stringify(value)+'\n'));
 for(let i=0;i<4;i++)send({type:'pending'});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(settled,false,'Pending records cannot acknowledge a command');assert.equal(previews,0,'Pending records cannot mutate presentation');
 if(ending==='result')send({type:'result',update:{accepted:true,snapshot:{revision:2}}});
 if(ending==='error')send({type:'error',error:'save-failed'});
 controller.close();const result=await outcome;
 if(ending==='result')assert.equal(result.value.accepted,true);
 else assert.equal(result.error.code,ending==='error'?'save-failed':'invalid-response');
}
console.log(JSON.stringify({passed:true,pendingDoesNotAcknowledgeOrPaint:true,durableFailureRejected:true,missingResultRejected:true}));
