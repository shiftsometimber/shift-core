import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {wrapPrecompiledMemberDocuments} from './performance-precompiled-documents-runtime.mjs';
const manifest=JSON.parse(readFileSync(new URL('./performance-precompiled-documents.json',import.meta.url)));
const hash=b=>createHash('sha256').update(b).digest('hex');
const owner='shift-hq-member-comms-20261023',programme='shift-programme-member-20261023';
const env={MY_TIMBER_V6_RELEASE_ENABLED:'true'};
const request=(p,opts)=>new Request('https://shiftsometimber.co.uk'+p,opts);
test('every compiled body exactly preserves its proven current source',async()=>{
 for(const [path,e]of Object.entries(manifest.documents)){
  assert.equal(hash(e.html),e.sha256);
  let calls=0;const original={fetch(){++calls;throw Error('The expensive chain must not run for this exact document')}};
  const w=wrapPrecompiledMemberDocuments(original,manifest,e.owner,{enabled:true});
  for(const cookie of ['', 'sst_session=offline-A', 'sst_session=offline-B; shift_app_view=1', 'sst_session=expired']){
   const r=await w.fetch(request(path,{headers:{Cookie:cookie}}),env,{});
   assert.equal(r.status,200);assert.equal(await r.text(),e.html);
   assert.equal(r.headers.get('Cache-Control'),'no-store, private');assert.match(r.headers.get('Vary'),/\bCookie\b/);
   assert(!r.headers.has('ETag'));assert(!r.headers.has('Content-Encoding'));assert(!r.headers.has('Content-Length'));
   assert.equal(r.headers.get('Content-Security-Policy'),new Headers(e.headers).get('Content-Security-Policy'));
   assert.equal(r.headers.get('Set-Cookie'),new Headers(e.headers).get('Set-Cookie'));
   assert.equal(r.headers.get('X-Robots-Tag'),new Headers(e.headers).get('X-Robots-Tag'));
  }assert.equal(calls,0);
 }
});
test('homepage, private APIs, commerce, unknown views, methods and rollout hold are exact pass-through',async()=>{
 const expected=new Response('existing private or public behaviour',{status:403,headers:{'Set-Cookie':'fixture=private','Cache-Control':'no-store'}});
 const calls=[];const original={fetch(...args){calls.push(args);return expected},scheduled(){return 'preserved'}};
 const w=wrapPrecompiledMemberDocuments(original,manifest,owner,{enabled:true});
 assert.equal(w.scheduled(), 'preserved');
 assert.equal(await wrapPrecompiledMemberDocuments(original,manifest,owner).fetch(request('/member/dashboard?view=app'),env,{}),expected);
 const cases=[
  ['/',{}],['/v1/me',{}],['/v1/life-back/journey',{}],['/cart',{}],['/checkout',{}],
  ['/member/dashboard',{}],['/member/dashboard?view=web',{}],['/member/dashboard?view=app&app_panel=1',{}],
  ['/member/dashboard?view=app&from=someone-who-cares',{}],['/member/dashboard?view=app',{method:'HEAD'}],
  ['/member/dashboard?view=app',{method:'POST',body:'fixture'}],['/member/grub',{}],
  ['/member/dashboard?view=app',{headers:{Authorization:'Bearer offline-fixture'}}],
  ['/member/dashboard?view=app',{headers:{'X-My-Timber-Profile-Original':'1'}}]
 ];
 for(const [p,opts]of cases){const req=request(p,opts),ctx={case:p};assert.equal(await w.fetch(req,env,ctx),expected);assert.equal(calls.at(-1)[0],req);assert.equal(calls.at(-1)[2],ctx);}
 for(const flags of [{},{MY_TIMBER_V6_RELEASE_ENABLED:'false'},{...env,WORK_V1_ENABLED:'true'},{...env,PROGRAMME_V1_ENABLED:'true'}]){
  assert.equal(await w.fetch(request('/member/dashboard?view=app'),flags,{}),expected);
 }
 assert.equal(await w.fetch(new Request('https://hq.shiftsometimber.co.uk/member/dashboard?view=app'),env,{}),expected);
 assert.equal(await w.fetch(new Request('http://shiftsometimber.co.uk/member/dashboard?view=app'),env,{}),expected);
});
test('wrong source, route and embedded private cookies are refused',()=>{
 const original={fetch(){throw Error('not invoked')}};
 assert.throws(()=>wrapPrecompiledMemberDocuments(original,{...manifest,verified:false},owner));
 assert.throws(()=>wrapPrecompiledMemberDocuments(original,manifest,'unknown-owner'));
 const e=manifest.documents['/member/dashboard?view=app'];
 assert.throws(()=>wrapPrecompiledMemberDocuments(original,{...manifest,documents:{'/':e}},owner));
 assert.throws(()=>wrapPrecompiledMemberDocuments(original,{...manifest,documents:{'/member/dashboard?view=app':{...e,headers:{...e.headers,'Set-Cookie':'sst_session=never-retain'}}}},owner));
});
test('response and account headers are not shared mutably between requests',async()=>{
 const w=wrapPrecompiledMemberDocuments({fetch(){throw Error('not invoked')}},manifest,owner,{enabled:true});
 const a=await w.fetch(request('/member/dashboard?view=app'),env,{});
 a.headers.set('Set-Cookie','private-only-in-this-test');
 const b=await w.fetch(request('/member/dashboard?view=app'),env,{});
 assert.notEqual(b.headers.get('Set-Cookie'),'private-only-in-this-test');
});
