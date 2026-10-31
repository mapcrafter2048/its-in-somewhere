import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('concrete shoe recordings are locally bundled, pinned, and retain their CC0 provenance',()=>{
 const root='public/audio/footsteps/',manifest=JSON.parse(readFileSync(root+'manifest.json','utf8'));assert.equal(manifest.author,'Kenney');assert.equal(manifest.license,'CC0-1.0');assert.equal(manifest.source,'https://kenney.nl/assets/impact-sounds');assert.equal(manifest.assets.length,5);assert.match(readFileSync(root+'LICENSE.txt','utf8'),/Creative Commons Zero/);
 for(const [i,asset]of manifest.assets.entries()){assert.equal(asset.file,`footstep_concrete_${String(i).padStart(3,'0')}.ogg`);const bytes=readFileSync(root+asset.file);assert.equal(bytes.toString('ascii',0,4),'OggS');assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);}
});
