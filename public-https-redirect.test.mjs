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
