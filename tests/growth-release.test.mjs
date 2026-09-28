import test from 'node:test';
import assert from 'node:assert/strict';
import {withGrowthPublicCopy} from '../growth-member-public.mjs';
import {improvePublicCopy} from '../preview/growth-member/public-copy.mjs';
import {preserveGrowthCopy} from '../release/growth-preservation.mjs';
const before={
 '/programme':'<p class="eyebrow">THE MODEL</p><h2>Weight is the front door. Getting your life back is the journey.</h2><p>Use what helps now. Keep the useful parts connected as your needs change.</p>',
 '/help':'<p class="lead">Choose the route that best matches what you need. We keep help straightforward and private.</p>'
};
for(const path of Object.keys(before))test('production adapter delivers exactly the approved preview and preserves all other bytes: '+path,async()=>{
 const source='<html><head><title>Keep</title></head><body><header>Keep nav</header><main><h1>Keep heading</h1>'+before[path]+'<p>Keep body</p></main><footer>Keep footer</footer></body></html>';
 const response=await withGrowthPublicCopy(new Request('https://shiftsometimber.co.uk'+path),new Response(source,{headers:{'Content-Type':'text/html','ETag':'old','Cache-Control':'public'}}));
 const actual=await response.text();assert.equal(actual,improvePublicCopy(source,path));assert.equal(response.headers.get('ETag'),null);assert.equal(response.headers.get('Cache-Control'),'public');
 assert.deepEqual(preserveGrowthCopy(path,Buffer.from(actual),{required:true}),Buffer.from(source));
 for(const altered of [actual.replace('Keep body','Unapproved'),actual.replace('Keep nav','Lost nav')])assert.notDeepEqual(preserveGrowthCopy(path,Buffer.from(altered),{required:true}),Buffer.from(source));
 assert.throws(()=>preserveGrowthCopy(path,Buffer.from(actual.replace('#707762','#ffffff')),{required:true}));
 assert.throws(()=>preserveGrowthCopy(path,Buffer.from(source),{required:true}));
 assert.equal(improvePublicCopy(actual,path),actual);
});
test('unknown source, private pages, errors and non-HTML remain unchanged',async()=>{
 for(const [path,status,type]of [['/programme',200,'text/html'],['/member/dashboard',200,'text/html'],['/help',503,'text/html'],['/help',200,'application/json']]){
  const r=await withGrowthPublicCopy(new Request('https://shiftsometimber.co.uk'+path),new Response('Unchanged',{status,headers:{'Content-Type':type,'ETag':'keep'}}));assert.equal(await r.text(),'Unchanged');assert.equal(r.headers.get('ETag'),'keep');assert.equal(r.status,status);
 }
});

import {validateGrowthEntry} from '../release/growth-scope.mjs';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
test('release entry pin accepts only the reviewed adapter around the existing entry',()=>{
 const original=execFileSync('git',['show','90b1e29db85591b84dec642c3304641bc9545529:worker-entry-v6.js'],{encoding:'utf8'}),actual=readFileSync('worker-entry-v6.js','utf8');
 assert.doesNotThrow(()=>validateGrowthEntry(original,actual));
 assert.throws(()=>validateGrowthEntry(original,actual.replace('const MEMBER_ORIGINS','const UNAPPROVED_ORIGINS')));
});
