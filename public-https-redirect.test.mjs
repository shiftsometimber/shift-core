import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {publicHttpsRedirect} from './public-https-redirect.mjs';
test('public HTTP guide, sitemap and article requests redirect before fallbacks preserving path and query',()=>{
 for(const host of ['shiftsometimber.co.uk','www.shiftsometimber.co.uk'])for(const path of ['/male-obesity?source=seo&x=1','/articles/glp-1-constipation','/sitemap-articles.xml'])for(const method of ['GET','HEAD']){
  const r=publicHttpsRedirect(new Request('http://'+host+path,{method}));assert.equal(r.status,301);assert.equal(r.headers.get('Location'),'https://'+host+path);
 }
 for(const url of ['https://shiftsometimber.co.uk/male-obesity','http://api.shiftsometimber.co.uk/v1/auth/login','http://unrelated.example/male-obesity'])assert.equal(publicHttpsRedirect(new Request(url)),null);
 assert.equal(publicHttpsRedirect(new Request('http://shiftsometimber.co.uk/male-obesity',{method:'POST'})),null);
});
test('actual public entry dispatches HTTPS redirect before guide, sitemap or database routes',()=>{
 const source=readFileSync(new URL('./worker-entry-v6.js',import.meta.url),'utf8');
 const outer=source.slice(source.lastIndexOf('fetch: async function publicFetch(request, env, ctx) {'));
 assert.match(outer,/^fetch: async function publicFetch\(request, env, ctx\) \{\s*const httpsRedirect=publicHttpsRedirect\(request\);if\(httpsRedirect\)return httpsRedirect;/);
 assert(source.includes("import {publicHttpsRedirect} from './public-https-redirect.mjs';"));
});

// The deployed entrypoint wraps the guide outside worker-entry-v6. Exercise
// that actual outer policy wrapper so a guide 503 cannot pre-empt redirect.
import {withPublicResponsePolicyWorker} from './public-response-policy.mjs';
test('outer public response worker redirects before any wrapped guide or binding access',async()=>{
 let calls=0;const scheduled=()=>{},worker=withPublicResponsePolicyWorker({scheduled,fetch:async()=>{calls++;return new Response('guide fallback',{status:503});}});
 assert.equal(worker.scheduled,scheduled);
 for(const host of ['shiftsometimber.co.uk','www.shiftsometimber.co.uk'])for(const method of ['GET','HEAD'])for(const path of ['/male-obesity?source=seo&x=1','/articles/glp-1-dosage-guide?source=seo&x=1']){
  const response=await worker.fetch(new Request('http://'+host+path,{method}),new Proxy({},{get(){throw Error('No binding may be read before HTTPS redirect');}}),{});
  assert.equal(response.status,301);assert.equal(response.headers.get('location'),'https://'+host+path);
 }
 assert.equal(calls,0);
 for(const request of [new Request('https://shiftsometimber.co.uk/male-obesity'),new Request('http://api.shiftsometimber.co.uk/v1/auth/login'),new Request('http://shiftsometimber.co.uk/male-obesity',{method:'POST'})])assert.equal((await worker.fetch(request,{},{})).status,503);
 assert.equal(calls,3);
});
