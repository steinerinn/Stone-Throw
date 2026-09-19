import {createLocalSession} from '../canonical/compiled/local-host/session.js';
import {mountStoryBrowser} from './story-browser.js';
// Preserve the accepted read-only production mode mirrors. They are not
// capability switches; the production transport has no development entries.
for(const name of ['__stoneThrowAutoMatchMode','__stoneThrowStoryAutoResolveMode'])Object.defineProperty(window,name,{get:()=>false,configurable:false});
const roster={inf:5,cav:3,archer:3,monk:1,castle:2,dwarf:1,goblin:1,catapult:2,elf:1,cleric:1,demon:1,dragon:1,wizard:1,necro:2,hero:1};
const seed=crypto.getRandomValues(new Uint32Array(1))[0];
const config={matchId:'local-private-match',rulesVersion:'stone-throw-v1.427',size:15,players:[{id:'local-private-human',boardId:'local-private-home',roster,decisionMode:'interactive'},{id:'local-private-ai',boardId:'local-private-away',roster,decisionMode:'policy'}],story:false,seed};
const session=createLocalSession(config,undefined,true);
const browserClient=await mountStoryBrowser(session.client,{replaceConfiguration:next=>session.configure({...config,size:next.size,story:next.story,players:config.players.map((p,i)=>({...p,roster:Object.fromEntries(Object.entries(i?next.enemy:next.player).filter(([key])=>key!=='size'))}))})});

const {installDevelopmentAdapter}=await import("./development-adapter.js");installDevelopmentAdapter(session,browserClient);
