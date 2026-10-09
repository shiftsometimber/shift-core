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

import {continuityPages} from '../public-continuity.mjs';
import {improveContinuityArrival} from '../preview/growth-member/continuity-journey.mjs';
for(const path of ['/mens-mental-health','/clinic-gone-quiet','/provider-switch'])test('approved new route retains exact surrounding source: '+path,async()=>{
 const source='<html><head></head><body><header>locked</header><main class="template-mens-mental-health">'+(continuityPages[path]?.body||'<h1>Good to Talk</h1>')+'</main><footer>locked</footer></body></html>';
 const r=await withGrowthPublicCopy(new Request('https://example.invalid'+path),new Response(source,{headers:{'Content-Type':'text/html'}}));
 const after=await r.text();assert.equal(after,improvePublicCopy(source,path));assert.deepEqual(preserveGrowthCopy(path,Buffer.from(after),{required:true}),Buffer.from(source));
 assert.throws(()=>preserveGrowthCopy(path,Buffer.from(after.replace(path==='/mens-mental-health'?'text-align:center':'My Timber is free', 'UNAPPROVED')),{required:true}));
});
test('production arrival applies exact reviewed fragment and retains private response headers',async()=>{
 const html='<html><head></head><body><section id="memberDayGuide">Existing</section></body></html>';
 for(const path of ['/member/dashboard?entry=continuity','/member/dashboard','/member/dashboard?entry=other']){
 const url='https://example.invalid'+path,r=await withGrowthPublicCopy(new Request(url),new Response(html,{headers:{'Content-Type':'text/html','Cache-Control':'no-store, must-revalidate',Vary:'Cookie','X-Robots-Tag':'noindex, nofollow'}}));
 assert.equal(await r.text(),improveContinuityArrival(html,url));assert.equal(r.headers.get('Cache-Control'),'no-store, must-revalidate');assert.equal(r.headers.get('Vary'),'Cookie');assert.equal(r.headers.get('X-Robots-Tag'),'noindex, nofollow');
 }
});
