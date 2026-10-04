import {parentPort,workerData} from 'node:worker_threads';
import {prepareCompactJournal} from './compact-journal.mjs';
try{
 const started=performance.now();
 const anchor=prepareCompactJournal(workerData.file,workerData.entry,workerData.expected);
 parentPort.postMessage({ok:true,anchor,ms:performance.now()-started});
}catch{parentPort.postMessage({ok:false});}
