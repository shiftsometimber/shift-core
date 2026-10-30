import test from 'node:test';
import assert from 'node:assert/strict';
import {pages,style} from './payload.mjs';
import {transform,wrap,version} from './runtime.mjs';
import {check} from './check.mjs';

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
