import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {HQ_HISTORICAL,HQ_ORIGINAL_PATHS,HQ_GATE_IMPORT,HQ_GATE_OLD,HQ_GATE_NEW,HQ_DEPLOY_IMPORT,HQ_DEPLOY_PRE,HQ_DEPLOY_POST,HQ_PUBLIC_IMPORT,HQ_PUBLIC_POST,originalHqGitArgs,originalCombinedHqMaintenance,assertHqProviderSnapshot} from '../release/combined-hq-preservation-20261014.mjs';
const read=p=>readFileSync(p,'utf8'),prior=p=>execFileSync('git',['show',HQ_HISTORICAL+':'+p],{encoding:'utf8',maxBuffer:64e6});
test('all original HQ assertions and release workflow bytes survive only exact guarded hooks',()=>{
 for(const path of ['hq-management-release-gate.mjs','hq-management-deploy.mjs','hq-management-public-preservation.mjs'])assert.equal(originalCombinedHqMaintenance(path,read(path)),prior(path));
 assert.equal(read('.github/workflows/hq-management-release.yml'),prior('.github/workflows/hq-management-release.yml'));
 for(const path of ['hq-management-release-gate.mjs','hq-management-deploy.mjs','hq-management-public-preservation.mjs'])assert.notEqual(originalCombinedHqMaintenance(path,read(path).replace('assert.equal(','assert.strictEqual(')),prior(path));
});
test('only original HQ ancestor/blob/whole-scope queries project; live working and unknown queries stay raw',()=>{
 assert.deepEqual(originalHqGitArgs(['merge-base','--is-ancestor','e9d8ca70','HEAD']),['merge-base','--is-ancestor','e9d8ca70',HQ_HISTORICAL]);
 for(const p of HQ_ORIGINAL_PATHS)assert.deepEqual(originalHqGitArgs(['rev-parse','HEAD:'+p]),['rev-parse',HQ_HISTORICAL+':'+p]);
 for(const args of [['diff','--name-only'],['diff','--name-only','HEAD'],['rev-parse','HEAD:unknown.mjs'],['merge-base','--is-ancestor','unapproved','HEAD'],['diff','--name-only','e9d8ca70','HEAD','--','worker.js']])assert.strictEqual(originalHqGitArgs(args),args);
 const whole=['diff','--name-only','e9d8ca70','HEAD','--','wrangler.jsonc','package.json','package-lock.json','frontend','public','assets','shift-coach','worker-entry-v6.js'];assert.equal(originalHqGitArgs(whole)[3],HQ_HISTORICAL);
});
const fixture=()=>{const bundle=Buffer.from('Actual synthetic immutable source');const expected={deployment:'d',version:'v',sha256:createHash('sha256').update(bundle).digest('hex'),bytes:bundle.length};return{expected,data:{deployment:{id:'d',versions:[{version_id:'v',percentage:100}]},version:{id:'v',resources:{bindings:[{type:'plain_text',name:'HQ_PARTNERS_ENABLED',text:'true'}]}},bundle}}};
test('exact provider predecessor requires full rollout, unchanged live partners, GP off and byte-identical source',()=>{
 const {expected,data}=fixture();assert(assertHqProviderSnapshot(data,expected));
 const patches=[d=>d.deployment.id='new',d=>d.deployment.versions[0].version_id='other',d=>d.deployment.versions.push({version_id:'other',percentage:0}),d=>d.deployment.versions[0].percentage=99,d=>d.version.id='other',d=>d.version.resources.bindings[0].text='false',d=>d.version.resources.bindings.push({type:'plain_text',name:'MEMBER_GP_DIRECTORY_V2_ENABLED',text:'true'}),d=>d.bundle=Buffer.from('Changed synthetic immutable source'),d=>d.bundle=Buffer.concat([d.bundle,Buffer.from('x')]),d=>d.version.resources.bindings.push({type:'secret_text',name:'MEMBER_GP_DIRECTORY_V2_ENABLED'}),d=>d.version.resources.bindings.push({type:'plain_text',name:'HQ_PARTNERS_ENABLED',text:'true'})];
 for(const patch of patches){const f=fixture();patch(f.data);assert.throws(()=>assertHqProviderSnapshot(f.data,f.expected));}
 const f=fixture();f.data.version.resources.bindings.push({type:'plain_text',name:'MEMBER_GP_DIRECTORY_V2_ENABLED',text:'false'});assert(assertHqProviderSnapshot(f.data,f.expected));
});
test('predecessor guards run after private dry-run and before deployment; post checks retain owned workflow rollback',()=>{
 const s=read('hq-management-deploy.mjs');assert(s.indexOf('await captureCombinedHqCandidate')<s.indexOf('await assertCombinedHqStartingPoint'));assert(s.indexOf('await assertCombinedHqStartingPoint')<s.indexOf("const output=cli('deploy','--keep-vars')"));
 assert(s.includes("active.versions[0].version_id,receipt.versionId"));assert(s.includes("cli('rollback',receipt.before.versions[0].version_id"));
 assert(!s.includes('verifyCombinedHqLiveBoundaries('));const after=read('hq-management-public-preservation.mjs');assert(after.includes('if(before)await verifyCombinedHqLiveBoundaries'));
});
