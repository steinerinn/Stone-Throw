import type {HostState} from './host/contracts.js';
import type {CombatState,ExplicitRng} from './combat/contracts.js';
// Completed journal records are immutable values. Current boards, counters, pending
// work, and the appendable arrays are always copied. No input record is frozen.
const sealed=new WeakSet<object>();
export function isArchive(value:object):boolean{return sealed.has(value);}
export function archiveValue<T>(value:T):T {
 if(value===null||typeof value!=='object')return value;
 if(sealed.has(value))return value;
 const copy=structuredClone(value);const freeze=(v:unknown):void=>{if(v&&typeof v==='object'){for(const child of Object.values(v))freeze(child);Object.freeze(v);sealed.add(v);}};freeze(copy);return copy;
}
export function archiveRows<T>(rows:readonly T[]):T[]{return rows.map(archiveValue);}
export function cloneRng(rng:ExplicitRng):ExplicitRng{return {...rng,draws:archiveRows(rng.draws)};}
export function cloneCombat(state:CombatState):CombatState {
 const m=state.match,copy=structuredClone({...state,match:{...m,history:[],knowledge:Object.fromEntries(Object.entries(m.knowledge).map(([id,k])=>[id,{...k,events:[],boards:Object.fromEntries(Object.entries(k.boards).map(([owner,b])=>[owner,{...b,cells:[]}]))}]))}}) as CombatState;
 copy.match.history=archiveRows(m.history);for(const [id,k]of Object.entries(m.knowledge)){copy.match.knowledge[id]!.events=archiveRows(k.events);for(const [owner,b]of Object.entries(k.boards))copy.match.knowledge[id]!.boards[owner]!.cells=archiveRows(b.cells);}return copy;
}
export function cloneHost(host:HostState):HostState {
 const copy=structuredClone({...host,state:null,rng:null,history:[],events:[],initial:null,initialRng:null,pendingRoot:host.pendingRoot?{...host.pendingRoot,state:null,rng:null}:null}) as unknown as HostState;
 copy.state=cloneCombat(host.state);copy.rng=cloneRng(host.rng);copy.history=archiveRows(host.history);copy.events=archiveRows(host.events);
 copy.initial=archiveValue(host.initial);copy.initialRng=archiveValue(host.initialRng);
 if(copy.pendingRoot){copy.pendingRoot.state=copy.state;copy.pendingRoot.rng=copy.rng;}return copy;
}

/** Private transport snapshots may seal sequence containers; the first writer takes a mutable copy. */
export function archiveSequence<T>(rows:readonly T[]):T[]{const out=archiveRows(rows);Object.freeze(out);sealed.add(out);return out;}
export function mutableRows<T>(rows:T[]):T[]{return Object.isFrozen(rows)?rows.slice():rows;}
