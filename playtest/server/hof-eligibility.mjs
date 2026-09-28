// Account-wide server-authoritative eligibility; never a per-format requirement.
export const HOF_FULL_GAMES=10;
export function hofEligibility(db){
 const result=new Map(db.prepare("SELECT id FROM accounts WHERE status='active'").all().map(r=>[r.id,{full:0,storyFinished:false,eligible:false}]));
 for(const r of db.prepare("SELECT p.player_id,p.match_id,m.descriptor FROM stat_participants p JOIN stat_matches m ON m.id=p.match_id WHERE p.kind='account' AND p.reliability='Full' AND m.finalized=1 AND m.mode<>'Story' AND NOT EXISTS(SELECT 1 FROM review_pending h WHERE h.player_id=p.player_id AND h.match_id=m.id AND h.status='PENDING REVIEW') GROUP BY p.player_id,p.match_id").all()){const q=result.get(r.player_id),d=JSON.parse(r.descriptor),p=d.participants?.find(p=>p.playerId===r.player_id);if(q&&p&&p.cutoff===undefined&&!p.takeover)q.full++;}
 for(const r of db.prepare('SELECT player_id,lifetime_json AS value FROM story_runs UNION ALL SELECT player_id,progress_json AS value FROM story_progress').all()){const q=result.get(r.player_id);if(q&&JSON.parse(r.value||'null')?.finished===true)q.storyFinished=true;}
 for(const q of result.values())q.eligible=q.full>=HOF_FULL_GAMES||q.storyFinished;
 return result;
}
