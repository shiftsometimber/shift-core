import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {preparePrecompiledMemberCandidate} from './performance-precompiled-documents-prepare.mjs';
const manifest=JSON.parse(readFileSync('performance-precompiled-documents.json')),runtime=readFileSync('performance-precompiled-documents-runtime.mjs','utf8');
for(const owner of ['shift-programme-member-20261023','shift-hq-member-comms-20261023']){
 test(owner+' preserves every existing module, binding and version setting',()=>{
  const version=JSON.parse(gunzipSync(readFileSync('performance-static-text-current-'+owner+'.json.gz')));
  const result=preparePrecompiledMemberCandidate(version,manifest,owner,{runtime});
  assert.equal(result.modules.length,version.modules.length+3);
  for(let n=0;n<version.modules.length;n++)assert.equal(result.modules[n],version.modules[n]);
  assert.equal(result.bindings,version.bindings);assert.equal(result.assets,version.assets);
  assert.equal(result.compatibility_date,version.compatibility_date);
  assert.deepEqual(result.compatibility_flags,version.compatibility_flags||[]);
  assert.equal(result.rollbackVersion,version.id);assert.equal(result.normalTrafficPromoted,false);
  assert.deepEqual(result.changedOriginalModules,[]);
  assert.throws(()=>preparePrecompiledMemberCandidate({...version,id:'advanced-version'},manifest,owner,{runtime}),/Serving version advanced/);
  const changed={...version,modules:version.modules.map((m,n)=>n===0?{...m,content_base64:Buffer.from('changed').toString('base64')}:m)};
  assert.throws(()=>preparePrecompiledMemberCandidate(changed,manifest,owner,{runtime}),/Source module changed/);
 });
}
