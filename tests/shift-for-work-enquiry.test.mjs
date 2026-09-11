import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {gunzipSync} from 'node:zlib';
const core=process.env.SST_WORK_TEST_CORE || resolve(import.meta.dirname,'..');
const release=process.env.SST_WORK_RELEASE_DIR || join(core,'release/public-pages-20260911');
const publicSource=JSON.parse(gunzipSync(readFileSync(join(release,'source.json.gz'))));
const temporary=mkdtempSync(join(tmpdir(),'sst-work-test-'));
const clientPath=join(temporary,'client.mjs');
writeFileSync(clientPath,publicSource.overrides['assets/shift-for-work-v1.js']);
after(()=>rmSync(temporary,{recursive:true,force:true}));
const {buildWorkEnquiry,submitWorkEnquiry}=await import(pathToFileURL(clientPath));
const {continuityInterestRoutes}=await import(pathToFileURL(join(core,'continuity-interest-v1.js')));
const values={name:'Alex Example',email:'alex@example.invalid',company:'Example Logistics',role:'People lead',sector:'Haulage and logistics',workforce:'76–250',cohort:'50–100',timing:'Within 3 months',consent:true};
const payload=buildWorkEnquiry(values);
test('business enquiry uses the existing partner route and drops unsolicited health and employee fields',()=>{
  const result=buildWorkEnquiry({...values,employee_names:['Private Person'],weight:123,diagnosis:'SECRET',notes:'SECRET'});
  assert.equal(result.type,'partner');assert.equal(result.consent,true);assert.match(result.message,/Company: Example Logistics/);
  assert.doesNotMatch(JSON.stringify(result),/SECRET|Private Person|diagnosis|employee_names|123/);
  assert.deepEqual(Object.keys(result).sort(),['consent','email','message','name','type']);
});
test('consent, valid contact details and recognised business choices are required',()=>{
  for(const change of [{consent:false},{email:'invalid'},{name:''},{company:''},{sector:'PRIVATE HEALTH DATA'},{cohort:''}])assert.throws(()=>buildWorkEnquiry({...values,...change}));
});
test('header-like newlines are removed from business fields',()=>assert.match(buildWorkEnquiry({...values,company:'Example\r\nBcc: anything'}).message,/Company: Example Bcc: anything\n/));
test('preview and untrusted hosts cannot send or pretend to send',async()=>{
  for(const hostname of ['preview.projectshift.pages.dev','localhost','shiftsometimber.co.uk.attacker.test']){
    let called=false;const result=await submitWorkEnquiry(payload,{hostname,send:async()=>{called=true;throw new Error('must not send')}});
    assert.equal(called,false);assert.equal(result.preview,true);assert.match(result.message,/has not been sent/);
  }
});
test('success requires the live API sent contract and posts no data to a third-party host',async()=>{
  let observed;const result=await submitWorkEnquiry(payload,{hostname:'shiftsometimber.co.uk',send:async(url,options)=>{
    observed={url,options};return Response.json({ok:true,status:'sent'},{status:201});
  }});
  assert.equal(result.preview,false);assert.equal(observed.url,'/v1/contact');assert.equal(observed.options.credentials,'same-origin');assert.deepEqual(JSON.parse(observed.options.body),payload);
});
test('HTTP and application failures cannot become a false success',async()=>{
  for(const response of [Response.json({ok:false},{status:200}),Response.json({ok:true},{status:200}),Response.json({ok:false},{status:503}),new Response('bad-json',{status:200})])
    await assert.rejects(submitWorkEnquiry(payload,{hostname:'shiftsometimber.co.uk',send:async()=>response}),/could not confirm delivery/);
});
test('rate limits and uncertain timeout have useful, truthful recovery messages',async()=>{
  await assert.rejects(submitWorkEnquiry(payload,{hostname:'shiftsometimber.co.uk',send:async()=>Response.json({ok:false},{status:429})}),/Too many attempts/);
  await assert.rejects(submitWorkEnquiry(payload,{hostname:'shiftsometimber.co.uk',timeout:5,send:async(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('timeout','AbortError'))))}),/Check your email before retrying/);
});
function fakeDB(){return {exec:async()=>{},batch:async()=>[],prepare(){return {bind(){return this},first:async()=>({count:0}),run:async()=>({success:true})}}}}
test('actual existing contact module routes a simulated employer enquiry to partners and the enquirer only',async()=>{
  const sent=[];const env={DB:fakeDB(),EMAIL:{send:async(message)=>{sent.push(message);return {id:'SIMULATED-NOT-SENT'}}}};
  const result=await continuityInterestRoutes(new Request('https://shiftsometimber.co.uk/v1/contact',{method:'POST',body:JSON.stringify(payload),headers:{'content-type':'application/json'}}),env);
  assert.equal(result.status,201);assert.equal((await result.json()).status,'sent');
  assert.deepEqual(sent.map(x=>x.to).sort(),['alex@example.invalid','partners@shiftsometimber.co.uk']);
  assert.ok(sent.every(x=>x.text.includes('SHIFT for Work')));
});
test('actual contact module rejects absent consent without calling the simulated mail provider',async()=>{
  let sent=0;const result=await continuityInterestRoutes(new Request('https://shiftsometimber.co.uk/v1/contact',{method:'POST',body:JSON.stringify({...payload,consent:false})}),{DB:fakeDB(),EMAIL:{send:async()=>{sent++}}});
  assert.equal(result.status,400);assert.equal(sent,0);
});
test('missing production mail binding is surfaced by the actual contact module',async()=>{
  const result=await continuityInterestRoutes(new Request('https://shiftsometimber.co.uk/v1/contact',{method:'POST',body:JSON.stringify(payload)}),{DB:fakeDB()});
  assert.equal(result.status,503);assert.equal((await result.json()).ok,false);
});
