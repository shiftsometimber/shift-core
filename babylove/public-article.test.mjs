import test from 'node:test';
import assert from 'node:assert/strict';
import {ARTICLE,KNOWLEDGE_CARD,articleHTML,babyLovePublicRoute,withBabyLoveDiscovery,preserveBabyLoveKnowledge} from './public-article.mjs';
const publishedAt='2026-09-19T21:00:00.000Z';
const row={...ARTICLE,status:'published',publish_at:publishedAt,decision:'approved'};
const env=overrides=>({DB:{prepare(){return{bind(slug){assert.equal(slug,ARTICLE.slug);return this},async first(){return overrides===null?null:{...row,...overrides}}}}}});
const request=(path=ARTICLE.path,method='GET')=>new Request('https://shiftsometimber.co.uk'+path,{method});
test('publication requires approved status and the exact owner-approved copy',async()=>{
 for(const change of [null,{status:'draft'},{decision:'changes_requested'},{body:'Changed draft'},{title:'Other title'},{author:'SHIFT Team'},{publish_at:null}]){
  const response=await babyLovePublicRoute(request(),env(change));assert.equal(response.status,404);assert.equal(response.headers.get('X-Robots-Tag'),'noindex');
 }
 const response=await babyLovePublicRoute(request(),env());assert.equal(response.status,200);assert.match(await response.text(),/Wegovy cost in the UK: look beyond the first pen/);
});
test('article routing is bounded with working HEAD and canonical redirects',async()=>{
 for(const r of [request('/other'),request(ARTICLE.path,'POST'),new Request('https://api.shiftsometimber.co.uk'+ARTICLE.path)])assert.equal(await babyLovePublicRoute(r,env()),null);
 const head=await babyLovePublicRoute(request(ARTICLE.path,'HEAD'),env());assert.equal(head.status,200);assert.equal(await head.text(),'');
 for(const path of [ARTICLE.path+'/',ARTICLE.path+'.html']){const r=await babyLovePublicRoute(request(path),env());assert.equal(r.status,301);assert.equal(r.headers.get('Location'),ARTICLE.proposed_url)}
});
test('public document contains named author, publication schema, three images and the contrast fix',()=>{
 const html=articleHTML(publishedAt);assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((html.match(/rel="canonical"/g)||[]).length,1);assert.match(html,/index,follow,max-image-preview:large/);assert.doesNotMatch(html,/noindex|data:image|preview only/i);
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);assert.equal(schema.author['@type'],'Person');assert.equal(schema.author.name,'Matt O’Brien');assert.equal(schema.datePublished,publishedAt);
 assert(html.includes(ARTICLE.authorBio));assert.match(html,/Published 19 September 2026/);assert(html.includes('id="shift-article-contrast"'));
 assert.match(html,/#main-content\.sg :is\(\.sg-quick,\s*\.sg-math,\s*\.sg-table,\s*\.sg-end\) \*\s*\{\s*color: #050505 !important;/);
 const main=html.match(/<main[\s\S]*?<\/main>/)[0];assert.equal((main.match(/<img\b/g)||[]).length,3);for(const image of ARTICLE.images){assert(main.includes(image.url));assert(main.includes(image.alt))}
 assert.match(main,/No stock available today/);assert.match(main,/not current pharmacy quotes/);
});
test('the two infographic URLs serve actual accessible SVG images',async()=>{
 for(const asset of ARTICLE.publication_assets){const r=await babyLovePublicRoute(request(asset.public_path),env());assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/^image\/svg\+xml/);assert.match(await r.text(),/<title/)}
});
test('Knowledge discovery adds exactly one searchable card and preserves all other content',async()=>{
 const base='<html><main><div class="knowledge-results" id="knowledgeResults"><article data-kitem="">Existing article</article></div></main></html>';
 const response=await withBabyLoveDiscovery(new Response(base,{headers:{'Content-Type':'text/html'}}),request('/explore-knowledge'),env());const html=await response.text();
 assert.equal(html.replace(KNOWLEDGE_CARD,''),base);assert.match(KNOWLEDGE_CARD,/data-topic="GLP-1"/);assert.match(KNOWLEDGE_CARD,/data-type="Article"/);
 assert.equal(preserveBabyLoveKnowledge('/explore-knowledge',Buffer.from(html),{required:true}).toString(),base);
 assert.throws(()=>preserveBabyLoveKnowledge('/explore-knowledge',Buffer.from(base),{required:true}),/missing/);
 assert.throws(()=>preserveBabyLoveKnowledge('/explore-knowledge',Buffer.from(html.replace('Open →','Unexpected change'))),/differs/);
 const again=await withBabyLoveDiscovery(new Response(html,{headers:{'Content-Type':'text/html'}}),request('/explore-knowledge'),env());assert.equal(await again.text(),html);
 const draft=await withBabyLoveDiscovery(new Response(base,{headers:{'Content-Type':'text/html'}}),request('/explore-knowledge'),env({status:'draft'}));assert.equal(await draft.text(),base);
});
test('sitemap gains only the approved canonical article once',async()=>{
 const base='<?xml version="1.0"?><urlset><url><loc>https://shiftsometimber.co.uk/</loc></url></urlset>';
 const response=await withBabyLoveDiscovery(new Response(base,{headers:{'Content-Type':'application/xml'}}),request('/sitemap.xml'),env());const xml=await response.text();
 assert(xml.includes('<loc>'+ARTICLE.proposed_url+'</loc>'));assert.equal((xml.match(/<url>/g)||[]).length,2);assert(xml.includes('<url><loc>https://shiftsometimber.co.uk/</loc></url>'));
 const again=await withBabyLoveDiscovery(new Response(xml,{headers:{'Content-Type':'application/xml'}}),request('/sitemap.xml'),env());assert.equal(await again.text(),xml);
});
