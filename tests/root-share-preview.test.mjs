import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {replaceRootShareImage,withRootShareWorker,LEGACY_SHARE_URL,APPROVED_SHARE_URL} from '../share-preview/metadata.mjs';
import {SHARE_PREVIEW_PATH,SHARE_PREVIEW_SHA256,SHARE_PREVIEW_APPROVED_LOGO_SHA256,sharePreviewBytes} from '../share-preview/asset.mjs';
const html=`<!doctype html><html><head><title>Existing approved title</title><meta property="og:image" content="${LEGACY_SHARE_URL}"><meta name="twitter:image" content="${LEGACY_SHARE_URL}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="description" content="Existing approved description"><link rel="icon" href="/assets/favicon-32.png?v=104e"><script type="application/ld+json">{"retained":true}</script></head><body><main>Every approved homepage body byte stays the same.</main></body></html>`;
test('only the two root sharing-image URLs change; all other bytes and repeated application are preserved',()=>{
 const result=replaceRootShareImage(html);
 assert.equal(result.split(APPROVED_SHARE_URL).length,3);
 assert.equal(result.replaceAll(APPROVED_SHARE_URL,LEGACY_SHARE_URL),html);
 assert.equal(replaceRootShareImage(result),result);
 for(const broken of [html.replace('property="og:image"','property="unrelated"'),html.replace('</head>',`<meta name="twitter:image" content="${LEGACY_SHARE_URL}"></head>`),html.replace(LEGACY_SHARE_URL,'https://other.example/image.jpg')])assert.throws(()=>replaceRootShareImage(broken));
});
test('prepared JPEG is exactly pinned,1200×630, and uses the immutable approved logo',()=>{
 const bytes=sharePreviewBytes();assert.equal(createHash('sha256').update(bytes).digest('hex'),SHARE_PREVIEW_SHA256);
 assert.deepEqual([...bytes.slice(0,3)],[255,216,255]);
 const actual=readFileSync(new URL('../share-preview/shift-share-20261013.jpg',import.meta.url));assert.deepEqual(bytes,new Uint8Array(actual));
 const logo=readFileSync(new URL('../frontend/member/sst-logo-official.png',import.meta.url));assert.equal(createHash('sha256').update(logo).digest('hex'),SHARE_PREVIEW_APPROVED_LOGO_SHA256);
 const svg=readFileSync(new URL('../share-preview/shift-share-20261013.svg',import.meta.url),'utf8');assert(svg.includes(logo.toString('base64')));assert.match(svg,/width="1200" height="630"/);
});
test('root GET and HEAD retain policy/security while invalidated body validators are removed',async()=>{
 const security={'Content-Type':'text/html','Cache-Control':'public, max-age=60, must-revalidate','Content-Security-Policy':"default-src 'self'",'Referrer-Policy':'no-referrer','ETag':'old','Content-Length':'999'};
 const worker=withRootShareWorker({fetch:async()=>new Response(html,{headers:security})});
 const response=await worker.fetch(new Request('https://shiftsometimber.co.uk/'));
 assert.equal(await response.text(),replaceRootShareImage(html));
 for(const key of ['Cache-Control','Content-Security-Policy','Referrer-Policy'])assert.equal(response.headers.get(key),security[key]);
 assert.equal(response.headers.get('ETag'),null);assert.equal(response.headers.get('Content-Length'),null);
 const head=await worker.fetch(new Request('https://shiftsometimber.co.uk/',{method:'HEAD'}));assert.equal(await head.text(),'');assert.equal(head.headers.get('Cache-Control'),security['Cache-Control']);
});
test('new image route is versioned and exact; legacy artwork and every unrelated route delegate unchanged',async()=>{
 let calls=0;const original=new Response('original response',{status:404});const scheduled=()=>{};
 const worker=withRootShareWorker({scheduled,fetch:async()=>{calls++;return original}});assert.equal(worker.scheduled,scheduled);
 const image=await worker.fetch(new Request('https://shiftsometimber.co.uk'+SHARE_PREVIEW_PATH));assert.equal(image.status,200);assert.equal(image.headers.get('Content-Type'),'image/jpeg');assert.deepEqual(new Uint8Array(await image.arrayBuffer()),sharePreviewBytes());assert.equal(calls,0);
 const head=await worker.fetch(new Request('https://shiftsometimber.co.uk'+SHARE_PREVIEW_PATH,{method:'HEAD'}));assert.equal(await head.text(),'');assert.equal(head.headers.get('Content-Length'),String(sharePreviewBytes().length));
 const post=await worker.fetch(new Request('https://shiftsometimber.co.uk'+SHARE_PREVIEW_PATH,{method:'POST'}));assert.equal(post.status,405);assert.equal(calls,0);
 for(const path of ['/programme','/v1/me','/assets/og-default.jpg','/member/dashboard'])assert.equal(await worker.fetch(new Request('https://shiftsometimber.co.uk'+path)),original);
 assert.equal(calls,4);
});
test('the prepared Worker hook is exactly additive; every original handler/cron/route remains byte-identical',()=>{
 const current=readFileSync(new URL('../shift-coach/worker.mjs',import.meta.url),'utf8');
 const importHook="import {withRootShareWorker} from '../share-preview/metadata.mjs';\n",wrapperHook='withPublicResponsePolicyWorker(withRootShareWorker(withMaleObesity(composedWorker)))';
 assert.equal(current.split(importHook).length,2);assert.equal(current.split(wrapperHook).length,2);
 const prepared=execFileSync('git',['show','da67872e84109577d5c6e6eff5cb9a85206c537f:shift-coach/worker.mjs'],{encoding:'utf8'});
 const inverse=prepared.replace(importHook,'').replace(wrapperHook,'withPublicResponsePolicyWorker(withMaleObesity(composedWorker))');
 assert.equal(inverse,execFileSync('git',['show','7a74a7d4:shift-coach/worker.mjs'],{encoding:'utf8'}));
});
