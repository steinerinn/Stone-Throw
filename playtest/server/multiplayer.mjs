import {createPvpService as createTwoSeatService} from './pvp.mjs';
import {createRingService} from './ring-pvp.mjs';
export function createPvpService(roster,options){
 const two=createTwoSeatService(roster,options),ring=createRingService(roster,options),owners=new Map();
 return {
  exportState:()=>({two:two.exportState(),ring:ring.exportState()}),
  restoreState(saved){two.restoreState(saved.two);ring.restoreState(saved.ring);for(const service of [two,ring])for(const r of service.rooms.values())for(const s of r.seats)if(s?.token)owners.set(s.token,service);},
  get rooms(){return new Map([...two.rooms,...ring.rooms]);},
  async lobby(action,body,binding){const code=String(body.code||'').trim().toUpperCase(),service=action==='make'?(body.seats===undefined||body.seats===2?two:ring):(ring.rooms.has(code)?ring:two);const result=await service.lobby(action,body,binding);owners.set(result.token,service);return result;},
  route(token,...args){const service=owners.get(token);if(!service)throw Error('unknown-seat');return service.route(token,...args);},
  checkpoint(token){return owners.get(token)?.checkpoint(token)??null;}
 };
}
