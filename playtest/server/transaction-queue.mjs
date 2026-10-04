// Independent worker-backed rooms may compute together. Every unclassified
// operation remains an exclusive barrier, and a room keeps its lane through
// durable save and response construction. This is not a lock-free mutation path.
export function transactionQueue(maxRooms=2){
 if(!Number.isSafeInteger(maxRooms)||maxRooms<1)throw Error('Invalid room concurrency');
 const waiting=[],active=new Set(),idle=[];let exclusive=false;
 function pump(){
  if(exclusive)return;
  while(waiting.length){
   const index=waiting.findIndex(task=>task.key===null||!active.has(task.key));
   if(index<0)return;const next=waiting[index];
   if(next.key===null){if(index!==0||active.size)return;waiting.shift();exclusive=true;start(next);return;}
   if(active.size>=maxRooms)return;
   waiting.splice(index,1);active.add(next.key);start(next);
  }
  if(!active.size)for(const resolve of idle.splice(0))resolve();
 }
 function start(task){
  Promise.resolve().then(task.fn).then(task.resolve,task.reject).finally(()=>{
   if(task.key===null)exclusive=false;else active.delete(task.key);pump();
  });
 }
 return {
  run:(fn,key=null)=>new Promise((resolve,reject)=>{waiting.push({fn,key,resolve,reject});pump();}),
  idle:()=>!exclusive&&!active.size&&!waiting.length?Promise.resolve():new Promise(resolve=>idle.push(resolve)),
  busy:key=>exclusive||active.has(key),
  get pending(){return waiting.length+active.size+Number(exclusive);}
 };
}

// Durable writes stay ordered, but allow socket/heartbeat I/O between completed
// saves. Chaining synchronous saves only through microtasks can starve the poll
// phase long enough to look like a disconnect when several rooms finish at once.
export function serialDurableQueue(){
 let tail=Promise.resolve();
 return operation=>{const work=tail.then(()=>new Promise(resolve=>setImmediate(resolve))).then(operation);tail=work.catch(()=>{});return work;};
}
