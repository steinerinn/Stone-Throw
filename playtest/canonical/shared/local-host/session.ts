import {createLocalAuthority} from './authority.js';
import {createHost} from '../host/initialization.js';
import {deserializeHost,serializeHost} from '../host/serialization.js';
import {refreshHost} from '../host/refresh.js';
import {emptyNormalMemory} from './normal-policy.js';
import type {HostConfiguration} from '../host/contracts.js';
import type {ClientTransport,Request,PresentationFrame} from '../client-contract/public.js';

/** Bootstrap-owned battle handoff. The renderer receives only client.
 * Configuration is not a public intent or a writable global capability.
 * Replacing a battle preserves the private entropy stream and increments the
 * public battle epoch so delayed commands cannot target the replacement. */
export function createLocalSession(config:HostConfiguration,checkpoint?:string,development=false){
 let current=createLocalAuthority(config,checkpoint,development),queue=Promise.resolve();
 function ordered<T>(operation:()=>Promise<T>|T):Promise<T>{
  const task=queue.then(operation);queue=task.then(()=>{},()=>{});return task;
 }
 const client:ClientTransport=Object.freeze({
  read:(after=0)=>ordered(()=>current.client.read(after)),
  dispatch:(request:Request)=>ordered(()=>current.client.dispatch(request))
 });
 return Object.freeze({...(development?{dev:Object.freeze({inspect:()=>ordered(()=>current.dev!.inspect()),takeover:(enabled:boolean)=>ordered(()=>current.dev!.takeover(enabled)),shoot:(cell:{x:number;y:number})=>ordered(()=>current.dev!.shoot(cell))})}:{}),client,
  dispatchWithProgress:(request:Request,notify:(frame:PresentationFrame)=>Promise<void>)=>ordered(()=>current.dispatchWithProgress(request,notify)),
  serializePrivate:()=>ordered(()=>current.serializePrivate()),
  configure:(next:HostConfiguration)=>ordered(async()=>{
   const previous=JSON.parse(current.serializePrivate()),old=deserializeHost(previous.host),host=createHost(next);
   host.rng=structuredClone(old.rng);host.initialRng=structuredClone(old.rng);
   refreshHost(host);host.initial=structuredClone(host.state);
   const saved=JSON.stringify({contract:'local-authority-checkpoint-v1',host:serializeHost(host),normalMemory:emptyNormalMemory(),revision:0,epoch:previous.epoch+1,serial:previous.serial,unitHandles:[],choiceHandles:[]});
   const replacement=createLocalAuthority(next,saved,development);
   const update=await replacement.client.read();current=replacement;return update;
  })
 });
}
