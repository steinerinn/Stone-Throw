import assert from 'node:assert/strict';
import {recordEliminationScores} from '../canonical/compiled/host/elimination-score.js';
import {calculateScores,numeric} from '../server/match-score.mjs';
let checks=0;
for(const source of ['direct-human','dragon','plague'])for(const alive of [false,true]){
 const event={kind:'unit-destroyed',unitId:'final-core',meta:{ownerId:'a',targetPlayerId:'b',source},statistics:{unitType:'inf',unitOwner:'b'},cells:[],rootId:'r'};
 const h={events:[{event}],state:{match:{units:alive?[{ownerId:'b',type:'hero',lifecycle:'present',hero:{activated:false,currentCell:{x:2,y:2}}}]:[]}}};
 recordEliminationScores(h,['b']);assert.deepEqual(h.events[0].event.statistics.eliminationAwards,[{target:'b',actor:'a',heroAlive:alive}]);
 const d={id:'test',endedAt:2,participants:[{actor:'a',kind:'account',reliability:'Full',outcome:'Win'},{actor:'b',kind:'ai',outcome:'Loss'}],finalResult:{placements:{a:1,b:2}}};
 const f={index:0,event:h.events[0].event};const result=calculateScores(d,[f]);assert.equal(numeric(result.scores[0].components.eliminations),alive?50:30);assert.equal(result.scores[0].formulaVersion,'MATCH_SCORE_V2_ELIMINATION');
 assert.equal(numeric(calculateScores(d,[f,{...f,index:1}]).scores[0].components.eliminations),alive?50:30);
 f.event.statistics.eliminationBoundary={revolt:true};assert.equal(numeric(calculateScores(d,[f]).scores[0].components.eliminations),0);delete f.event.statistics.eliminationBoundary;
 d.participants[0].cutoff=0;assert.equal(numeric(calculateScores(d,[f]).scores[0].components.eliminations),0);checks+=5;
}
for(const owner of ['b',null]){const h={events:[{event:{kind:'unit-destroyed',unitId:'core',meta:{ownerId:owner},statistics:{unitOwner:'b',unitType:'inf'},cells:[]}}],state:{match:{units:[]}}};recordEliminationScores(h,['b']);assert.equal(h.events[0].event.statistics.eliminationAwards[0].actor,null);checks++;}
console.log(JSON.stringify({passed:true,checks,directAndChain:true,heroAlive50Total:true,deduplication:true,noSelfOrEnvironmentalBonus:true}));
