import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('assets/story/audio/narration-manifest.json',root)));
const chapters=Object.values(manifest);
assert.equal(chapters.length,21);assert.equal(new Set(chapters.map(c=>c.wav)).size,21);
assert.ok(manifest.assassin_reveal);assert.ok(manifest.phase4_open);
for(const chapter of chapters){
 const bytes=fs.readFileSync(new URL(chapter.wav,root));
 assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');
 assert.equal(bytes.length,chapter.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),chapter.sha256);
 assert.ok(chapter.title.trim());assert.ok(chapter.paragraphs.length);assert.ok(chapter.paragraphs.every(p=>typeof p==='string'&&p.trim()));
}
console.log(JSON.stringify({passed:true,currentChapters:21,exactManifestAudioHashes:true,wavHeaders:true,narrativeTextPresent:true}));
