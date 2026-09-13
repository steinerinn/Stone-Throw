export class TransportError extends Error {constructor(code){super(code);this.code=code;}}
export function createHttpSession(){
 let latest=null;
 async function request(route,body={}){let response;try{response=await fetch('/api/'+route,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(body)});}catch{throw new TransportError('server-unavailable');}let result;try{result=await response.json();}catch{throw new TransportError('invalid-response');}if(!response.ok)throw new TransportError(result.error||'server-unavailable');if(result.snapshot)latest=result.snapshot;if(result.update?.snapshot)latest=result.update.snapshot;return result;}
 const client=Object.freeze({read:after=>request('read',{after:after??0}),dispatch:command=>request('command',command)});
 return Object.freeze({client,open:fresh=>request('open',fresh?{fresh:true}:{}),configure:async configuration=>{if(!latest)await client.read();return request('configure',{battle:latest.battle,revision:latest.revision,configuration});},request});
}
