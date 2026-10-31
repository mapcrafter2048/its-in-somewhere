import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
test('bundled models have pinned provenance, valid GLB payloads and no runtime network references',()=>{
 const manifest=JSON.parse(readFileSync('public/models/manifest.json','utf8'));assert.equal(manifest.author,'Kenney');assert.equal(manifest.assets.length,7);
 for(const entry of manifest.assets){assert.equal(entry.license,'CC0-1.0');assert.match(entry.source,/^https:\/\/kenney\.nl\/assets\/(furniture-kit|food-kit)$/);const bytes=readFileSync('public/models/'+entry.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);assert.equal(bytes.toString('utf8',0,4),'glTF');assert.equal(bytes.readUInt32LE(4),2);const length=bytes.readUInt32LE(12),json=JSON.parse(bytes.toString('utf8',20,20+length));for(const resource of [...(json.buffers??[]),...(json.images??[])])if(resource.uri){if(resource.uri.startsWith('data:'))continue;const path=resolve('public/models',resource.uri);assert.ok(path.startsWith(resolve('public/models')+sep));assert.ok(existsSync(path));}}
 for(const entry of manifest.resources){assert.equal(entry.license,'CC0-1.0');assert.equal(createHash('sha256').update(readFileSync('public/models/'+entry.file)).digest('hex'),entry.sha256);}
 for(const name of ['food-kit','furniture-kit'])assert.match(readFileSync('public/models/'+name+'-license.txt','utf8'),/CC0/);
});
