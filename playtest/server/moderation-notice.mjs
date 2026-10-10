// Private owner notices; reasons never enter public identity or multiplayer projections.
export function moderationNotice(db,id){
 const account=db.prepare('SELECT status FROM accounts WHERE id=?').get(id);if(!account)return null;
 if(account.status==='flagged'){
  const row=db.prepare("SELECT new_value AS reason FROM dev_player_corrections WHERE player_id=? AND field='Scores flagged' ORDER BY id DESC LIMIT 1").get(id);
  return {kind:'FLAG',reason:row?.reason||'Your public scores have been hidden by the game administrator.'};
 }
 const row=db.prepare("SELECT field,new_value AS reason FROM dev_player_corrections WHERE player_id=? AND field IN ('Player warned','Warning removed') ORDER BY id DESC LIMIT 1").get(id);
 return row?.field==='Player warned'?{kind:'WARNING',reason:row.reason}:null;
}
export function validateModerationReason(reason){
 if(typeof reason!=='string'||!reason.trim()||[...reason].length>500||/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(reason))throw Object.assign(Error('Enter a plain-text reason (1–500 characters).'),{status:400});return reason.trim();
}
