import assert from 'node:assert/strict';
import {archiveEncoder,archiveDecoder} from '../server/archive-wire.mjs';

const encode=archiveEncoder({prune:true}),decode=archiveDecoder();
let host={contract:'stone-throw-host-v1',state:{match:{history:[],knowledge:{}}},rng:{draws:[{value:1}]},events:[{value:{n:1}}],history:[],initial:{},initialRng:{},pendingRoot:null};
let packet=encode({host});assert.deepEqual(decode(packet),{host});
const ref=packet.value.host.$host.events.$archive;
const retained=encode.checkpoint().updates.find(u=>u.id===ref).rows[0];
host=structuredClone(host);host.events.push({value:{n:2}});
packet=encode({host});assert.deepEqual(decode(packet),{host});
assert.equal(encode.checkpoint().updates.find(u=>u.id===ref).rows[0],retained,'Validated immutable prefix must be reused');
host.events[0].value.n=99;
packet=encode({host});assert.notEqual(packet.value.host.$host.events.$archive,ref);assert.equal(retained.value.n,1);assert.deepEqual(decode(packet),{host});
host.events.length=1;packet=encode({host});assert.deepEqual(decode(packet),{host});
for(let n=0;n<64;n++){
 host=structuredClone(host);host.events.push({value:{n}});host.rng.draws.push({value:n});
 if(n%9===0)host.events[0].value.n=n;
 if(n%13===0)host.events.splice(1,1);
 assert.deepEqual(decode(encode({host})),{host});
 assert.deepEqual(archiveDecoder()(encode.checkpoint()),{host});
}
console.log(JSON.stringify({passed:true,unchangedPrefixReused:true,inPlaceMutationDetected:true,truncationPreserved:true,incrementalAndResetExact:true}));
