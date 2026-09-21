import assert from 'node:assert/strict';
import {demonPresentationRunes} from '../server/demon-presentation.mjs';
const event=(root,unit,board)=>({rootId:root,kind:'attack-started',reason:'demon',meta:{sourceUnitId:unit,targetBoardId:board}});
const events=[event('r1','d1','b3'),event('r2','d2','b1'),event('r3','d3','b0'),event('r4','d4','b2')];
const host={events:events.map(event=>({event}))},memory={demonRunes:events.map((e,i)=>({boardId:e.meta.targetBoardId,runes:[{cell:{x:8,y:4},glyph:String(i),rotation:i*45}]}))},before=JSON.stringify({host,memory}),cache=new Map();
for(let i=0;i<4;i++)assert.deepEqual(demonPresentationRunes(host,memory,events[i],cache),memory.demonRunes[i].runes);
// A resumed earlier attack gets its own reservation, even after later attacks
// and a visible-target change. No observer-local sequence counter is consumed.
assert.deepEqual(demonPresentationRunes(host,memory,events[1],cache),memory.demonRunes[1].runes);
assert.deepEqual(demonPresentationRunes(host,memory,events[1],new Map()),memory.demonRunes[1].runes);
assert.equal(JSON.stringify({host,memory}),before);
assert.deepEqual(Object.keys(demonPresentationRunes(host,memory,events[3],cache)[0]).sort(),['cell','glyph','rotation']);
assert.throws(()=>demonPresentationRunes(host,{demonRunes:[]},events[0],new Map()),/Missing authoritative/);
console.log('PASS: 4 activation bindings, resumed/rebuilt binding, no mutation, public-only fields, missing-reservation validation');
