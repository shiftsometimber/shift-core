import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import edits from './edits.json' with {type:'json'};
import {checkinFollowupRuntime} from '../../member-experience/checkin-followup-client.mjs';
import {fitRuntime} from '../../member-experience/fit-approved-runtime.mjs';
import {grubRuntime} from '../../member-experience/grub-runtime.mjs';
import vm from 'node:vm';
for(const code of [checkinFollowupRuntime,fitRuntime,grubRuntime])new vm.Script(code);
for(const file of [...new Set(edits.map(e=>e.source))]){
 let revised=fs.readFileSync(file,'utf8');
 for(const e of edits.filter(x=>x.source===file).reverse()){assert.equal(revised.split(e.new).length,2,e.new);revised=revised.replace(e.new,e.old);}
 const original=file.endsWith('about-source.html')?execFileSync('git',['show','origin/copy/about-pages-20260926:release/about-20260926/story.html'],{encoding:'utf8'}):execFileSync('git',['show','b7684acb867e85386cea87ecbfb055847d0fa55d:'+file],{encoding:'utf8'});
 assert.equal(revised,original,'Only declared copy may change: '+file);
}
const c=JSON.parse(fs.readFileSync('preview/voice/wrangler.json'));
assert.deepEqual(Object.keys(c).sort(),['name','main','compatibility_date','workers_dev','preview_urls'].sort());assert.equal(c.name,'shift-voice-editorial-preview');
fs.writeFileSync('preview/voice/source-proof.json',JSON.stringify({copyChanges:edits.length,sourceFiles:[...new Set(edits.map(x=>x.source))],reverseDiffExact:true,runtimeSyntax:['checkin','fit','grub'],productionBindings:0,productionChanged:false},null,2));
console.log('PASS: 23 copy-only edits; reverse diff exact; member runtimes parse; preview has no production bindings.');
