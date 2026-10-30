import test from 'node:test';
import assert from 'node:assert/strict';
import {pages,style} from './payload.mjs';
import {transform,wrap,version} from './runtime.mjs';
import {check,waitForHero} from './check.mjs';

const page=pages.find(p=>p.id==='mot');
const original='<!doctype html><html><head><style data-existing>body{color:inherit}</style></head><body><header>Existing navigation</header><main id="main-content"><section class="productHero"><h1>Existing Health MOT</h1><div class="availability">Ordering is not open</div><div class="actions"><a href="/contact">Ask about availability</a></div></section><section id="included"><h2>Included</h2><p>Existing information</p></section></main><footer>Existing footer</footer></body></html>';
const ownStyle='<style data-hero-set-style="'+version+'">'+style+'</style>';
const outerStyle='<style data-outer-page>.productHero{display:grid}</style>';

test('an inherited hero stylesheet is moved after existing page styles without changing content',()=>{
 const inherited=original.replace('<head>','<head>'+ownStyle);
 const result=transform(inherited,page).html;
 assert.equal(result,transform(original,page).html);
 check(original,result,page);
 assert.equal(transform(result,page).html,result);
});

test('an outer page renderer can add its stylesheet after an inner hero renderer',async()=>{
 const inner=transform(original,page).html;
 const layered=inner.replace('</head>',outerStyle+'</head>');
 const expected=transform(original.replace('</head>',outerStyle+'</head>'),page).html;
 const worker=wrap({fetch:async()=>new Response(layered,{headers:{'Content-Type':'text/html'}})});
 const response=await worker.fetch(new Request('https://shiftsometimber.co.uk'+page.path),{},{});
 assert.equal(await response.text(),expected);
 assert.equal(response.headers.get('X-Shift-Hero-Set'),version);
 assert(expected.indexOf(outerStyle)<expected.indexOf(ownStyle));
 assert.equal((expected.match(/data-hero-set-style=/g)||[]).length,1);
});

test('exact-delivery checks still reject a changed approved hero',()=>{
 const result=transform(original,page).html;
 assert.throws(()=>check(original,result.replace('aria-labelledby="nhh-title-mot"','aria-labelledby="wrong-title"'),page),/Delivered bytes differ/);
});

test('a nested unowned page remains intact until its final renderer has added article metadata',async()=>{
 const metadata='<script type="application/ld+json">{"@type":"Article","author":"Original author","datePublished":"2026-05-04"}</script>';
 const inner=wrap({fetch:async()=>new Response(original,{headers:{'Content-Type':'text/html'}})},null,[]);
 const renderer={async fetch(request,env,ctx){
  const body=await (await inner.fetch(request,env,ctx)).text();
  const preserved=body.includes('<h1>Existing Health MOT</h1>');
  return new Response(body.replace('</head>',(preserved?metadata:'<script type="application/ld+json">{"author":"Changed"}</script>')+'</head>'),{headers:{'Content-Type':'text/html'}});
 }};
 const outer=wrap(renderer,null,[page.path]);
 const response=await outer.fetch(new Request('https://shiftsometimber.co.uk'+page.path),{},{});
 const actual=await response.text(),baseline=original.replace('</head>',metadata+'</head>');
 check(baseline,actual,page);
 assert(actual.includes(metadata));
});

test('a query alias is rendered only by the component assigned to that alias',async()=>{
 const worker=wrap({fetch:async()=>new Response(original,{headers:{'Content-Type':'text/html'}})},null,[page.path+'?']);
 const plain=await worker.fetch(new Request('https://shiftsometimber.co.uk'+page.path),{},{});
 assert.equal(await plain.text(),original);assert.equal(plain.headers.get('X-Shift-Hero-Set'),null);
 const query=await worker.fetch(new Request('https://shiftsometimber.co.uk'+page.path+'?source=member'),{},{});
 check(original,await query.text(),page);
});

test('rollout verification waits through previous edge responses and still checks the exact page',async()=>{
 const candidate=transform(original,page).html;let reads=0,pauses=0;
 const result=await waitForHero(async()=>({html:++reads<3?original:candidate,headers:new Headers(reads<3?{}:{'X-Shift-Hero-Set':version})}),version,page.path,{maxAttempts:4,pause:async()=>{pauses++;}});
 assert.equal(result.attempts,3);assert.equal(pauses,2);check(original,result.response.html,page);
});

test('rollout verification fails if the expected version never arrives',async()=>{
 let reads=0;
 await assert.rejects(()=>waitForHero(async()=>{reads++;return {html:original,headers:new Headers()};},version,page.path,{maxAttempts:3,pause:async()=>{}}),/Hero marker missing.*bounded propagation wait/);
 assert.equal(reads,3);
});
