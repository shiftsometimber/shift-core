import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {BOOK_VOICE_EDITS,applyBookVoiceCopy,restoreBookVoiceCopy,withBookVoice} from '../book-voice.mjs';
import {grubRuntime} from '../member-experience/grub-runtime.mjs';
import {fitRuntime} from '../member-experience/fit-approved-runtime.mjs';
import {checkinFollowupRuntime} from '../member-experience/checkin-followup-client.mjs';
const assets=[['grub',grubRuntime,3],['fit',fitRuntime,3],['checkin-followup',checkinFollowupRuntime,2]];
test('Exact approved 23 edits; rendered JS retains every byte outside the reviewed literals',()=>{
 assert.equal(BOOK_VOICE_EDITS.length,23);
 assert.deepEqual(BOOK_VOICE_EDITS,JSON.parse(execFileSync('git',['show','83da3fca:preview/voice/edits.json'],{encoding:'utf8'})));
 for(const [name,before,count] of assets){
  const path='/assets/member-experience/'+name+'.mjs',after=applyBookVoiceCopy(path,before);
  assert.equal(BOOK_VOICE_EDITS.filter(e=>after.includes(e.new)&&!before.includes(e.new)).length,count,name);
  assert.equal(restoreBookVoiceCopy(path,after),before,'Full runtime comparison: '+name);
  assert.equal(applyBookVoiceCopy(path,after),after,'Idempotent: '+name);
  new vm.Script(after);
 }
});
test('Public wording preserves markup, URLs, metadata and clinical information byte for byte',()=>{
 for(const e of BOOK_VOICE_EDITS.filter(e=>e.kind!=='member')){
  const path=e.kind==='news'?'/medicine-news/example':e.route;
  const before='<html><head><script type="application/ld+json">{"source":"unchanged"}</script></head><body><main class="sst-service-bridge"><p>'+e.old+'</p><a href="/shift-health">Clinical help</a><form action="/v1/contact"><input name="message"></form></main><p>Urgent symptoms need urgent care. No stock available today.</p></body></html>';
  const after=applyBookVoiceCopy(path,before);
  assert(after.includes(e.new));assert(!after.includes(e.old));assert.equal(restoreBookVoiceCopy(path,after),before);
  assert.equal(applyBookVoiceCopy('/unrelated',before.replace('sst-service-bridge','ordinary')),before.replace('sst-service-bridge','ordinary'));
 }
 assert.throws(()=>restoreBookVoiceCopy('/member/saved',BOOK_VOICE_EDITS.at(-1).new.repeat(2)),/repeated/);
});
test('Only successful GET documents and named scripts change; auth, privacy and cookie headers survive',async()=>{
 const e=BOOK_VOICE_EDITS.at(-1);
 const request=new Request('https://example.invalid/member/saved');
 const headers={'Content-Type':'text/html','Cache-Control':'private, no-store','Set-Cookie':'fixture=1; HttpOnly; Secure','Content-Security-Policy':"default-src 'self'",ETag:'old','Content-Length':'1','X-Shift-Test':'preserved'};
 const response=await withBookVoice(request,new Response(e.old,{headers}));assert.equal(await response.text(),e.new);
 for(const h of ['Cache-Control','Set-Cookie','Content-Security-Policy','X-Shift-Test'])assert.equal(response.headers.get(h),headers[h]);
 assert.equal(response.headers.get('ETag'),null);assert.equal(response.headers.get('Content-Length'),null);
 for(const [method,status,type]of [['POST',200,'text/html'],['GET',401,'text/html'],['GET',200,'application/json'],['HEAD',200,'text/html']]){
  const original=new Response(e.old,{status,headers:{'Content-Type':type}});assert.equal(await withBookVoice(new Request(request.url,{method}),original),original);
 }
 const unknown=new Response(grubRuntime,{headers:{'Content-Type':'text/javascript'}});assert.equal(await withBookVoice(new Request('https://example.invalid/unrelated.mjs'),unknown),unknown);
});
test('Isolated preview inherits existing host logic with only exact hostname/import changes',()=>{
 const host=readFileSync('preview/stabilisation/worker.mjs','utf8').replace("'../../work/staging/worker.mjs'","'./member-host.mjs'").replace('^shift-stabilisation-preview(?:-v2)?\\.','^shift-book-voice-a9c990\\.');
 assert.equal(readFileSync('preview/book-voice/host.mjs','utf8'),host);
 const member=readFileSync('work/staging/worker.mjs','utf8').replace("'./account-capacity.mjs'","'../../work/staging/account-capacity.mjs'").replace("'./layout.mjs'","'../../work/staging/layout.mjs'").replace("'../screen.mjs'","'../../work/screen.mjs'").replace('^shift-stabilisation-preview(?:-v2)?\\.','^shift-book-voice-a9c990\\.');
 assert.equal(readFileSync('preview/book-voice/member-host.mjs','utf8'),member);
 const provision=readFileSync('preview/book-voice/provision.mjs','utf8');assert(provision.includes('shift-book-voice-auth-'));assert(provision.includes('shift-book-voice-data-'));assert(!provision.includes('shift-stabilisation-preview-auth-20260917'));assert(provision.includes('assert(!production.includes(id))'));
});
