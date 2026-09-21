import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {connectedMemberRoutes} from './connected.mjs';
import {currentToolAssets} from './tool-assets.mjs';
const origin='https://shift-core-work-staging.test.workers.dev';
const html='<html><head></head><body><nav class="sst-member-tabs"></nav><main><div id="previewMember" hidden class="preview-member"><section id="panel-today"><h2 id="todayTitle">Today</h2><div id="todayActions"></div></section><section id="panel-journey"></section></div></main></body></html>';
const requests=[];
const env={STAGING_ASSETS:{fetch:async request=>{const path=new URL(request.url).pathname;requests.push(path);if(path==='/staging/member-source/member/dashboard.html')return new Response(html);if(path.startsWith('/staging/member-current/'))return new Response(readFileSync('frontend/member/'+path.slice('/staging/member-current/'.length)));return new Response('Missing',{status:404})}}};
await test('Canonical isolated dashboard renders the actual restored tools and same-origin bootstrap',async()=>{
 const response=await connectedMemberRoutes(new Request(origin+'/member/dashboard'),env);assert.equal(response.status,200);const body=await response.text();
 for(const marker of ['data-member-tools="v1"','id="panel-visualise"','id="panel-plans"','/assets/member-experience/tools.mjs','id="todayActions"','Checking fictional account'])assert(body.includes(marker),marker);
 assert.match(response.headers.get('Content-Security-Policy'),/img-src 'self' data: blob:/);
 const bootstrap=await connectedMemberRoutes(new Request(origin+'/staging/member-connected/bootstrap.js'),env);assert.equal(await bootstrap.text(),'window.SST_API_BASE=location.origin;');
});
await test('Staging returns exact checked-out tool assets, and no arbitrary repository path',async()=>{
 for(const name of currentToolAssets){const r=await connectedMemberRoutes(new Request(origin+'/'+name+'?v=anything'),env);assert.equal(r.status,200);assert.equal(await r.text(),readFileSync('frontend/member/'+name,'utf8'));}
 assert.equal(await connectedMemberRoutes(new Request(origin+'/worker.js'),env),null);
 assert.equal(await connectedMemberRoutes(new Request(origin+'/member-product-v33d.js',{method:'POST'}),env),null);
 assert(requests.every(p=>p.startsWith('/staging/member-current/')||p==='/staging/member-source/member/dashboard.html'));
});
await test('Old connected dashboard link redirects onto isolated canonical path without external host',async()=>{
 const r=await connectedMemberRoutes(new Request(origin+'/staging/member-connected/dashboard'),env);assert.equal(r.status,302);assert.equal(r.headers.get('Location'),'/member/dashboard');
 assert.equal(await connectedMemberRoutes(new Request(origin+'/member/unknown'),env),null);
});
