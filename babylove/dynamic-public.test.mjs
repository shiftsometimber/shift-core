import assert from 'node:assert/strict';
import test from 'node:test';
import {renderMarkdown,dynamicBabyLovePublicRoute,withDynamicBabyLoveDiscovery,articleModifiedDate} from './dynamic-public.mjs';

function env(row){
 return {DB:{prepare(sql){return{args:[],bind(...v){this.args=v;return this},async first(){return sql.includes("a.status='published'")&&row?.status==='published'?row:null},async all(){return{results:row?.status==='published'?[row]:[]}}}}}};
}
const row={id:4,title:'NICE List vs Private Prices: Mounjaro Cost in the UK',slug:'mounjaro-cost-uk',category:'Knowledge',author:'SHIFT Team',status:'published',summary:'A useful summary',body:'# NICE List vs Private Prices: Mounjaro Cost in the UK\n\n![Title card](https://csuxjmfbwmkxiegfpljm.supabase.co/storage/v1/object/public/blog-images/organization-55073/title-card.jpeg)\n\n## Costs\n\n| Dose | Price |\n|---|---|\n| 2.5mg | £133 |\n\n<script>alert(1)</script>\n\n[Official](https://www.nice.org.uk/)',seo_title:'Mounjaro cost UK',publish_at:'2026-09-21T16:00:00Z',source_id:'876303'};

test('safe markdown renderer handles headings tables links and escapes raw html',()=>{
 const html=renderMarkdown(row.body+'\n\n- [Jump to costs](#costs)',row.title);assert.match(html,/<h2 id="costs">/);assert.match(html,/<table>/);assert.match(html,/nice\.org\.uk/);assert.match(html,/href="#costs"/);assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);
});
test('published BabyLove receipt renders on generic article route',async()=>{
 const r=await dynamicBabyLovePublicRoute(new Request('https://shiftsometimber.co.uk/articles/mounjaro-cost-uk'),env(row));assert.equal(r.status,200);const html=await r.text();assert.match(html,/Mounjaro Cost in the UK/);assert.match(html,/canonical/);assert.match(html,/X-Shift-Article-Source|Published/);
});
test('drafts and unrelated paths are not claimed',async()=>{
 assert.equal(await dynamicBabyLovePublicRoute(new Request('https://shiftsometimber.co.uk/articles/mounjaro-cost-uk'),env({...row,status:'draft'})),null);
 assert.equal(await dynamicBabyLovePublicRoute(new Request('https://shiftsometimber.co.uk/about'),env(row)),null);
});
test('published imported articles are added to sitemap discovery',async()=>{
 const input=new Response('<?xml version="1.0"?><urlset></urlset>',{headers:{'Content-Type':'application/xml'}});
 const out=await withDynamicBabyLoveDiscovery(input,new Request('https://shiftsometimber.co.uk/sitemap.xml'),env(row));const xml=await out.text();assert.match(xml,/articles\/mounjaro-cost-uk/);
});

test('trusted BabyLove images are rewritten to a same-origin proxy',async()=>{
 const r=await dynamicBabyLovePublicRoute(new Request('https://shiftsometimber.co.uk/articles/mounjaro-cost-uk'),env(row));
 const html=await r.text();assert.match(html,/\/articles\/mounjaro-cost-uk\/image\?src=/);assert.doesNotMatch(html,/img loading="lazy" src="https:\/\/csuxjmfbwmkxiegfpljm\.supabase\.co/);
});
test('image proxy rejects arbitrary sources before fetching',async()=>{
 const r=await dynamicBabyLovePublicRoute(new Request('https://shiftsometimber.co.uk/articles/mounjaro-cost-uk/image?src=https%3A%2F%2Fevil.example%2Fx.jpg'),env(row));
 assert.equal(r.status,404);
});


test('editorial updates preserve publication date and use the real later modification date',async()=>{
 const revised={...row,updated_at:'2026-10-03 19:00:00'};
 const response=await dynamicBabyLovePublicRoute(new Request('https://shiftsometimber.co.uk/articles/'+row.slug),env(revised));
 const html=await response.text();const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema.datePublished,row.publish_at);assert.equal(schema.dateModified,'2026-10-03T19:00:00.000Z');
 for(const updated_at of [null,'invalid','2020-01-01T00:00:00Z'])assert.equal(articleModifiedDate({...row,updated_at}),row.publish_at);
 const xml=await (await withDynamicBabyLoveDiscovery(new Response('<urlset></urlset>'),new Request('https://shiftsometimber.co.uk/sitemap.xml'),env(revised))).text();assert.match(xml,/<lastmod>2026-10-03<\/lastmod>/);
});
