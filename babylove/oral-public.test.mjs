import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {imageSHA256} from './verify-oral-image.mjs';
import {ARTICLE,KNOWLEDGE_CARD,oralHTML,oralPublicRoute,withOralDiscovery,preserveOralKnowledge} from './oral-public.mjs';
const row={...ARTICLE,status:'published',decision:'approved',publish_at:'2026-09-20T16:00:00Z'};
const env=(changes={})=>({DB:{prepare(){return{bind(){return this},async first(){return{...row,...changes}}}}}});
const request=p=>new Request('https://shiftsometimber.co.uk'+p);
test('article and sharing artwork use the exact packaged first-party image',()=>{
 const image=new URL(ARTICLE.images[0].url);assert.equal(image.origin,'https://shiftsometimber.co.uk');
 const asset=readFileSync(new URL('../frontend/member'+image.pathname,import.meta.url));
 assert.equal(createHash('sha256').update(asset).digest('hex'),imageSHA256);
 const html=oralHTML(row.publish_at);assert(html.includes('<figure class="sg-figure"><img src="'+image.href+'"'));
 assert(!html.includes('supabase.co'));assert(readFileSync(new URL('../worker-entry-v6.js',import.meta.url),'utf8').includes('["'+image.pathname+'", "image/jpeg"]'));
});
test('only exact reviewed content goes live, with canonical aliases',async()=>{for(const change of [{status:'draft'},{decision:'changes_requested'},{body:'unreviewed'},{title:'changed'}])assert.equal((await oralPublicRoute(request(ARTICLE.path),env(change))).status,404);assert.equal((await oralPublicRoute(request(ARTICLE.path),env())).status,200);for(const ending of ['/','.html'])assert.equal((await oralPublicRoute(request(ARTICLE.path+ending),env())).status,301);const h=oralHTML(row.publish_at);assert(h.includes(ARTICLE.body));assert.equal((h.match(/<h1>/g)||[]).length,1);assert(h.includes('Sources checked 20 September 2026'));assert(h.includes('No stock available today'));assert(!h.includes('means-tested'));});
test('discovery and preservation allow precisely the new article card',async()=>{const base='<div id="knowledgeResults">Existing</div>';const r=await withOralDiscovery(new Response(base),request('/explore-knowledge'),env());const h=await r.text();assert.equal(h.replace(KNOWLEDGE_CARD,''),base);assert.equal(preserveOralKnowledge('/explore-knowledge',Buffer.from(h)).toString(),base);assert.throws(()=>preserveOralKnowledge('/explore-knowledge',Buffer.from(h.replace('Open →','Changed'))));const draft=await withOralDiscovery(new Response(base),request('/explore-knowledge'),env({status:'draft'}));assert.equal(await draft.text(),base);});
