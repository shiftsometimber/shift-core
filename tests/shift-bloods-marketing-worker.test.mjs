import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{marketingResponse} from '../shift-bloods-marketing-worker.mjs';
import {PUBLIC_BLOODS_PATHS,BLOODS_ENTRY,BLOODS_ENTRY_STYLE} from '../shift-bloods-public.mjs';
const shell='<html><head><title>Existing Health</title></head><body><header>Existing header</header><main data-shift-health><h1>SHIFT Health</h1><section class="wrap intro" id="routes">Existing Health catalogue</section></main><footer>Existing footer</footer></body></html>';
test('The Health entry preserves every byte outside the exact approved insertion and style',async()=>{
 let observed;
 const r=await marketingResponse(new Request('https://shiftsometimber.co.uk/shift-health?private=do-not-forward',{headers:{Cookie:'session=do-not-forward',Authorization:'do-not-forward'}}),{},async(u,options)=>{observed={u,options};return new Response(shell,{headers:{'Content-Type':'text/html','Content-Security-Policy':"default-src 'self'",ETag:'old','Set-Cookie':'ignore'}});});
 const body=await r.text();assert.equal(r.status,200);assert(body.includes(BLOODS_ENTRY));assert.equal(body.replace(BLOODS_ENTRY,'').replace('<style data-shift-bloods-entry>'+BLOODS_ENTRY_STYLE+'</style>',''),shell);
 assert.equal(observed.u,'https://api.shiftsometimber.co.uk/shift-health');assert.deepEqual(observed.options.headers,{Accept:'text/html'});assert.equal(r.headers.get('content-security-policy'),"default-src 'self'");assert.equal(r.headers.get('set-cookie'),null);assert.equal(r.headers.get('etag'),null);
});
test('All nine approved Bloods information pages support GET and HEAD without a questionnaire or ordering API',async()=>{
 for(const p of PUBLIC_BLOODS_PATHS)for(const method of ['GET','HEAD']){
  let seen;const r=await marketingResponse(new Request('https://shiftsometimber.co.uk'+p+'?utm_source=health',{method}),{},async u=>{seen=u;return new Response('<main>Coming soon. Ordering is not open.</main>');});
  assert.equal(r.status,200);assert.equal(seen,'https://projectshift.pages.dev'+p);assert.equal(await r.text(),method==='HEAD'?'':'<main>Coming soon. Ordering is not open.</main>');
 }
});
test('Ordering methods, clinical and member routes never reach an upstream',async()=>{
 const nope=()=>{throw Error('Unexpected upstream call');};
 for(const p of ['/member/dashboard','/v1/blood-tests','/shift-health/blood-tests/order','/shift-health/other'])assert.equal((await marketingResponse(new Request('https://shiftsometimber.co.uk'+p),{},nope)).status,404);
 for(const p of ['/shift-health',...PUBLIC_BLOODS_PATHS])for(const method of ['POST','PUT','DELETE'])assert([404,405].includes((await marketingResponse(new Request('https://shiftsometimber.co.uk'+p,{method}),{},nope)).status));
});
test('Existing Core content and error boundaries remain unchanged if its template changes',async()=>{
 for(const body of ['<html>Different public template</html>',shell.replace('<h1>SHIFT Health</h1>',BLOODS_ENTRY+'<h1>SHIFT Health</h1>')])assert.equal(await (await marketingResponse(new Request('https://shiftsometimber.co.uk/shift-health'),{},async()=>new Response(body))).text(),body);
 const response=await marketingResponse(new Request('https://shiftsometimber.co.uk/shift-health'),{},async()=>new Response('Temporarily unavailable',{status:503}));assert.equal(response.status,503);
 assert.equal((await marketingResponse(new Request('https://shiftsometimber.co.uk/shift-health/'),{},()=>{throw Error('No upstream for redirect');})).status,301);
 assert.equal((await marketingResponse(new Request('https://shiftsometimber.co.uk/shift-health/blood-tests'),{PAGES_ORIGIN:'https://unapproved.example'},()=>{throw Error('No unapproved upstream');})).status,503);
});
test('The Cloudflare adapter does not mistake its execution context for the fetch client',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response(shell);
 try{const r=await worker.fetch(new Request('https://shiftsometimber.co.uk/shift-health'),{}, {waitUntil(){}});assert.equal(r.status,200);assert((await r.text()).includes(BLOODS_ENTRY));}finally{globalThis.fetch=original;}
});
