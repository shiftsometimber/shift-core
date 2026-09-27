import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {validateAiRelease,AI_CANDIDATE,AI_FLAGS} from '../release/shift-ai-scope.mjs';
const manifest=JSON.parse(readFileSync('release/shift-ai-live.json'));
const base=execFileSync('git',['show',AI_CANDIDATE+':wrangler.jsonc'],{encoding:'utf8'});
const config=readFileSync('wrangler.jsonc','utf8');
test('exact approved AI candidate and two backend flags pass release scope',()=>assert.equal(validateAiRelease(manifest,['wrangler.jsonc'],config,base).runtimeOnly,true));
test('application drift, frontend changes, missing flags and unrelated config changes block release',()=>{
 for(const p of ['frontend/member/index.html','ask-timber-v1.js','member-experience/ai-context.mjs','migrations/new.sql'])assert.throws(()=>validateAiRelease(manifest,[p],config,base));
 for(const c of [base,config.replace('true','false'),config+'\n'])assert.throws(()=>validateAiRelease(manifest,[],c,base));
 assert.throws(()=>validateAiRelease({...manifest,applicationCommit:'f'.repeat(40)},[],config,base));
 assert.throws(()=>validateAiRelease({...manifest,productionActivationAuthorised:false},[],config,base));
 assert.equal(config.replace(AI_FLAGS,''),base);
});
