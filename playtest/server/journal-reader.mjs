import fs from 'node:fs';
// Bounded reads: never decode the entire journal into a JavaScript string.
// Only newline-terminated, acknowledged records are yielded.
export function* journalRecords(file,start=0){
 const fd=fs.openSync(file,'r'),buffer=Buffer.alloc(64*1024);let position=start,recordStart=start,parts=[],length=0;
 try{for(;;){const count=fs.readSync(fd,buffer,0,buffer.length,position);if(!count)break;let from=0;
  for(let i=0;i<count;i++)if(buffer[i]===10){const part=buffer.subarray(from,i);const bytes=parts.length?Buffer.concat([...parts,part],length+part.length):part;
   yield {line:bytes.toString('utf8'),start:recordStart,end:position+i+1};parts=[];length=0;from=i+1;recordStart=position+i+1;
  }
  if(from<count){const part=Buffer.from(buffer.subarray(from,count));parts.push(part);length+=part.length;}position+=count;
 }}finally{fs.closeSync(fd);}
}
