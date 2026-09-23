import type {HostState} from '../host/contracts.js';
// Public lifecycle only: no origin, frontier, owner, cell or RNG is disclosed.
// Old painted trails outlive outbreaks and must not keep ambience playing.
export function publicPlagueActive(h:HostState,boards:ReadonlySet<string>=new Set(h.config.players.map(p=>p.boardId))):boolean {
 const outbreaks=[...h.state.plagues,...(h.pendingRoot?.frames.flatMap(f=>f.detachedPlague?[f.detachedPlague]:[])||[])];
 return h.status!=='complete'&&outbreaks.some(p=>boards.has(p.targetBoardId)&&p.outbreaks.some(o=>o.round<5&&(o.round===0?o.infected.length>0:o.frontier.length>0)));
}

// Story progression requires an executed contact, never merely a scheduled outbreak.
export function resolvedStoryPlagueTargets(h:HostState){if(!h.state.storyPlagueTargets.length)return [];const executed=new Set(h.events.filter(({event:e})=>e.kind==='impact'&&e.meta?.source==='plague').map(({event:e})=>e.meta!.targetPlayerId));return h.state.storyPlagueTargets.filter(p=>executed.has(p));}
