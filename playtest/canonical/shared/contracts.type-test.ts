import type {MatchState,ObserverSnapshot,UnitId,PlayerId} from './model.js';
function contracts(full:MatchState,publicView:ObserverSnapshot,unit:UnitId,player:PlayerId){
 // @ts-expect-error Full state is not a public response.
 const unsafe:ObserverSnapshot=full;
 // @ts-expect-error Public responses do not carry private AI.
 publicView.privateAi;
 // @ts-expect-error Unit and player IDs are distinct.
 const wrong:PlayerId=unit;
 // @ts-expect-error Player IDs cannot identify units.
 const bad:UnitId=player;
 return [unsafe,wrong,bad];
}
void contracts;
