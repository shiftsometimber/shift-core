import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {originalBookVoiceGate,BOOK_VOICE_PREVIEW} from '../release/book-voice-scope.mjs';
import {validateRolloutSafetyComposition} from '../release/fit-300-scope.mjs';
const show=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'});
test('photo comparison reverses only the exact withdrawn option change and preserves all old book-source bytes',()=>{
 const path='member-experience/public-preservation.mjs',current=readFileSync(path,'utf8'),original=show(BOOK_VOICE_PREVIEW,path);
 assert.equal(originalBookVoiceGate(path,current),original);
 for(const drift of [current.replace("if(path==='/member-login')preserved=","if(path==='/member-register')preserved="),current.replace('preserved.toString','preserved.toJSON'),current+'\n// unrelated change\n'])assert.notEqual(originalBookVoiceGate(path,drift),original);
});
test('finite rollout pin rejects altered proof, base, scope and every current payload blob',()=>{
 const c=JSON.parse(readFileSync('shift-coach/release-manifest.json')).rolloutSafetyComposition;
 assert(c);validateRolloutSafetyComposition(c);
 for(const patch of [{proof:'unknown'},{base:'f'.repeat(40)},{paths:[...c.paths,'worker-entry-v6.js']}])assert.throws(()=>validateRolloutSafetyComposition({...c,...patch}));
 const read=(ref,p)=>execFileSync('git',['rev-parse',ref+':'+p],{encoding:'utf8'}).trim();
 for(const changed of c.paths)assert.throws(()=>validateRolloutSafetyComposition(c,(ref,p)=>ref==='HEAD'&&p===changed?'drift':read(ref,p)),/source drift/);
});
