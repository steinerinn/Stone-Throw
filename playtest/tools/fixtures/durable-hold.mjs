// Test-only worker preload: hold the real fsync boundary, never an HTTP timer.
import fs from 'node:fs';
import path from 'node:path';
import {isMainThread,workerData} from 'node:worker_threads';
const directory=process.env.ST_TEST_DURABLE_HOLD;
if(!isMainThread&&directory&&Array.isArray(workerData)&&workerData[0]===directory){
 const sync=fs.fsyncSync;let held=false;
 fs.fsyncSync=fd=>{
  if(!held&&fs.existsSync(path.join(directory,'hold'))){
   held=true;fs.writeFileSync(path.join(directory,'entered'),String(Date.now()));
   Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,22000);
   if(process.env.ST_TEST_DURABLE_FAIL==='1')throw Error('injected-fsync-failure');
  }
  return sync(fd);
 };
}
