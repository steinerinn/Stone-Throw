export const shortMatchId=id=>String(id||'').slice(0,8).toUpperCase();
export function flagReason({reason,measurements:m={}}){
 const number=v=>Number.isFinite(v)?String(v):null;
 switch(reason){
 case 'two-independent-unknown-core-openers':return 'Two hidden core hits in first 2 shots';
 case 'early-blind-hero':return m.shot===1?'Hero hit on first blind shot':number(m.shot)?'Hero hit on blind shot '+m.shot:'Hero hit on an early blind shot';
 case 'high-ordinary-accuracy':return number(m.ratio)&&number(m.shots)?Math.round(m.ratio*100)+'% hit rate over '+m.shots+' shots':'Unusually high hit rate';
 case 'long-hidden-hit-streak':return number(m.length)?m.length+' blind hits in a row':'Long run of blind hits';
 case 'long-core-hit-streak':return number(m.length)?m.length+' core hits in a row':'Long run of core hits';
 case 'high-score-observation':return number(m.score)?'Match score of '+m.score.toLocaleString():'Unusually high match score';
 case 'large-chain-observation':return number(m.cells)?m.cells+' cells in one chain':'Unusually large chain';
 case 'fresh-off-board-shot':return 'Invalid off-board shot request';
 default:return 'Flag needs a closer look';
 }
}
