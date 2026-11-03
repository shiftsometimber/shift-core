// Pure source preparation: no provider calls, publication, bindings or normal traffic changes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function preparePrecompiledMemberCandidate(version,manifest,owner,{runtime}={}){
 assert(['shift-programme-member-20261023','shift-hq-member-comms-20261023'].includes(owner));
 assert.equal(manifest.proof,'EXACT_CURRENT_MEMBER_DOCUMENT_PRECOMPILATION_PROOF');assert.equal(manifest.verified,true);
 const anchor=manifest.sourceOwners.find(x=>x.name===owner);assert(anchor);
 assert.equal(version.id,anchor.version,'Serving version advanced');
 assert.equal(version.main_module,anchor.main,'Entrypoint advanced');
 const before=Object.fromEntries(version.modules.map(m=>[m.name,sha(Buffer.from(m.content_base64,'base64'))]));
 assert.deepEqual(before,anchor.moduleHashes,'Source module changed');
 assert(runtime&&typeof runtime==='string'&&runtime.includes('export function wrapPrecompiledMemberDocuments'));
 const prefix='member-precompiled-documents-20261102/';
 assert(!version.modules.some(m=>m.name.startsWith(prefix)),'Do not layer a second document wrapper');
 const documents=Object.fromEntries(Object.entries(manifest.documents).filter(([,e])=>e.owner===owner));
 assert.equal(Object.keys(documents).length,owner==='shift-hq-member-comms-20261023'?4:2);
 for(const e of Object.values(documents)){assert.equal(sha(e.html),e.sha256,'Compiled document changed');if(e.appView)assert.equal(sha(e.appView.html),e.appView.sha256,'App-view document changed');}
 const ownManifest={...manifest,documents};
 const added=[
  {name:prefix+'runtime.mjs',body:runtime},
  {name:prefix+'documents.mjs',body:'export const manifest='+JSON.stringify(ownManifest)+';\n'},
  {name:prefix+'entry.mjs',body:'import original from "../'+version.main_module+'";\nexport * from "../'+version.main_module+'";\nimport {wrapPrecompiledMemberDocuments} from "./runtime.mjs";\nimport {manifest} from "./documents.mjs";\nexport default wrapPrecompiledMemberDocuments(original,manifest,'+JSON.stringify(owner)+',{enabled:true});\n'}
 ].map(m=>({name:m.name,content_type:'application/javascript+module',content_base64:Buffer.from(m.body).toString('base64')}));
 // Preserve original module identity and every provider setting; the guarded release manager owns uploads and publication.
 return {owner,previousVersion:version.id,previousMain:version.main_module,main_module:prefix+'entry.mjs',
  modules:[...version.modules,...added],addedModuleHashes:Object.fromEntries(added.map(m=>[m.name,sha(Buffer.from(m.content_base64,'base64'))])),
  changedOriginalModules:[],compatibility_date:version.compatibility_date,compatibility_flags:version.compatibility_flags||[],
  bindings:version.bindings,assets:version.assets,usage_model:version.usage_model,
  sourceOwners:manifest.sourceOwners,normalTrafficPromoted:false,rollbackVersion:version.id};
}
if(process.argv[1]&&import.meta.url==='file://'+process.argv[1]){
 throw Error('Import this pure preparer from the existing guarded release controller; it does not publish standalone');
}