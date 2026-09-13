import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json'))),sha=b=>createHash('sha256').update(b).digest('hex');
for(const [name,expected]of Object.entries(manifest.files)){const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||sha(fs.readFileSync(file))!==expected)throw Error('Build mismatch: '+name);}
console.log(JSON.stringify({verified:true,checkpoint:manifest.checkpoint,files:Object.keys(manifest.files).length,manifestSha256:sha(fs.readFileSync(path.join(root,'build-manifest.json')))},null,2));
