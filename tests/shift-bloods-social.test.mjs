import test from 'node:test';
import assert from 'node:assert/strict';
import {marketingResponse} from '../shift-bloods-marketing-worker.mjs';
import {INDEXABLE_BLOODS_PATHS,PUBLIC_BLOODS_PATHS} from '../shift-bloods-public.mjs';
const card='<meta name="twitter:card" content="summary_large_image">\n';
const html='<html><head><meta property="og:image" content="https://shiftsometimber.co.uk/assets/og-default.jpg"><link rel="canonical" href="CANONICAL"></head><body><main>Ordering is not open.</main></body></html>';
test('Only the four indexable Bloods pages receive one card; all other response bytes and security headers survive',async()=>{
 for(const p of PUBLIC_BLOODS_PATHS)for(const slash of ['', '/']){
  const original=html.replace('CANONICAL','https://shiftsometimber.co.uk'+p);
  const r=await marketingResponse(new Request('https://shiftsometimber.co.uk'+p+slash),{},async()=>new Response(original,{headers:{'Content-Security-Policy':"default-src 'self'",'X-Robots-Tag':'index,follow'}}));
  const actual=await r.text();assert.equal(actual,INDEXABLE_BLOODS_PATHS.includes(p)?original.replace('</head>',card+'</head>'):original);
  assert.equal(r.headers.get('content-security-policy'),"default-src 'self'");assert.equal(r.headers.get('x-robots-tag'),'index,follow');
 }
});
test('Existing Twitter cards and unsuccessful responses are preserved exactly',async()=>{
 for(const name of ['name="twitter:card"','property = \'twitter:card\'']){
  const original=html.replace('</head>','<meta '+name+' content="summary"></head>');
  const r=await marketingResponse(new Request('https://shiftsometimber.co.uk/shift-health/blood-tests'),{},async()=>new Response(original));assert.equal(await r.text(),original);
 }
 const r=await marketingResponse(new Request('https://shiftsometimber.co.uk/shift-health/blood-tests'),{},async()=>new Response(html,{status:503}));assert.equal(r.status,503);assert.equal(await r.text(),html);
});
test('HEAD retains an empty body and Health retains the existing content path',async()=>{
 const r=await marketingResponse(new Request('https://shiftsometimber.co.uk/shift-health/blood-tests',{method:'HEAD'}),{},async()=>new Response(html));assert.equal(r.status,200);assert.equal(await r.text(),'');
 const h=await marketingResponse(new Request('https://shiftsometimber.co.uk/shift-health'),{},async()=>new Response(html));assert.equal(await h.text(),html);
});
