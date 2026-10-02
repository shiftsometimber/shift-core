import test from 'node:test';import assert from 'node:assert/strict';
import {css} from '../home-route-banner.mjs';import {fontData} from '../home-route-font.mjs';
import {subsetFontData,fontProof} from './home-font-subset.mjs';
import {optimiseHomeFont,restoreHomeFont,withPublicFontDelivery} from './public-font-delivery.mjs';
test('only the exact approved homepage font payload changes and round-trips byte for byte',()=>{
 const html='<html><head>'+css+'</head><body>Keep every word and layout.</body></html>',after=optimiseHomeFont('/',html);
 assert(after.includes(subsetFontData));assert(!after.includes(fontData));assert.equal(restoreHomeFont('/',after),html);
 assert.equal(optimiseHomeFont('/',after),after);assert.equal(optimiseHomeFont('/member/dashboard',html),html);
 const unknown=html.replace('sst-home-route-css','unknown-css');assert.equal(optimiseHomeFont('/',unknown),unknown);
 assert.equal(optimiseHomeFont('/',html+fontData),html+fontData);
 assert.throws(()=>restoreHomeFont('/',after.replace('sst-home-route-css','unknown-css')),/Unknown homepage/);
 assert(fontProof.subsetBytes<fontProof.sourceBytes*.45);assert(fontProof.metricsAndOutlinesEqual);
});
test('homepage delivery preserves other response metadata and leaves other routes untouched',async()=>{
 const original=new Response('<head>'+css+'</head>',{headers:{'Content-Type':'text/html','ETag':'old',Link:'</keep>; rel=preload'}});
 const untouched=await withPublicFontDelivery(new Request('https://shiftsometimber.co.uk/help'),original);assert.equal(untouched,original);
 const changed=await withPublicFontDelivery(new Request('https://shiftsometimber.co.uk/'),original);
 assert.equal(changed.headers.get('Link'),'</keep>; rel=preload');assert.equal(changed.headers.get('ETag'),null);
 assert.equal(changed.headers.get('X-Shift-Font-Delivery'),'approved-glyph-subset-v1');assert((await changed.text()).includes(subsetFontData));
});
