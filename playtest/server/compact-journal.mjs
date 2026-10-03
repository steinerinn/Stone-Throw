import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {journalJson,journalBuffers,appendBuffers} from './journal-json.mjs';
import {journalRecords} from './journal-reader.mjs';
import {archiveDecoder} from './archive-wire.mjs';
import {retryFile} from './durable-file.mjs';

// One atomic journal replacement, never a checkpoint/journal two-file swap.
// Before rename the old journal is authoritative; afterwards the complete reset
// record is authoritative. Both are readable by the existing v2 reader.
export function compactJournal(journal,entry,expectedValue,beforePublish){
 const temporary=journal+'.compact.tmp',encoded=journalJson()()(entry);
 const buffers=journalBuffers(1,'',encoded),fd=fs.openSync(temporary,'w',0o600);
 let bytes;
 try{bytes=appendBuffers(fs,fd,buffers);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 const rows=journalRecords(temporary);let row;
 try{row=rows.next().value;if(!row||rows.next().done!==true||row.end!==bytes)throw Error('Invalid compact journal length');}finally{rows.return();}
 const record=JSON.parse(row.line);
 if(record.sequence!==1||record.previous!==''||record.sha256!==encoded.sha256||createHash('sha256').update(record.payload).digest('hex')!==record.sha256)throw Error('Compact journal checksum failure');
 const restored=JSON.parse(record.payload),expected=JSON.parse(JSON.stringify(expectedValue,(_,v)=>v instanceof Map?{$map:[...v]}:v),(_,v)=>v&&v.$map?new Map(v.$map):v);
 if(restored.reset!==true||!isDeepStrictEqual(archiveDecoder()(restored.packet),expected))throw Error('Compact journal recovery mismatch');
 beforePublish();
 retryFile('compact-rename',journal,()=>fs.renameSync(temporary,journal));
 // On Unix persist the directory entry, in addition to the already-fsynced file.
 if(process.platform!=='win32'){const directory=fs.openSync(path.dirname(journal),'r');try{fs.fsyncSync(directory);}finally{fs.closeSync(directory);}}
 return {sequence:1,previous:encoded.sha256,start:0,end:bytes};
}
