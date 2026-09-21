import assert from 'node:assert/strict';
import test from 'node:test';
import {renderMarkdown,dynamicBabyLovePublicRoute,withDynamicBabyLoveDiscovery} from './dynamic-public.mjs';

function env(row){
 return {DB:{prepare(sql){return{args:[],bind(...v){this.args=v;return this},async first(){return sql.includes("a.status='published'")&&row?.status==='published'?row:null},async all(){return{results:row?.status==='published'?[row]:[]}}}}}};
}
const row={id:4,title:'NICE List vs Private Prices: Mounjaro Cost in the UK',slug:'mounjaro-cost-uk',category:'Knowledge',author:'SHIFT Team',status:'published',summary:'A useful summary',body:'# NICE List vs Private Prices: Mounjaro Cost in the UK\n\n![Title card](https://csuxjmfbwmkxiegfpljm.supabase.co/storage/v1/object/public/blog-images/organization-55073/title-card.jpeg)\n\n## Costs\n\n| Dose | Price |\n|---|---|\n| 2.5mg | £133 |\n\n<script>alert(1)</script>\n\n[Official](https://www.nice.org.uk/)',seo_title:'Mounjaro cost UK',publish_at:'2026-09-21T16:00:00Z',source_id:'876303'};

test('safe markdown renderer handles headings tables links and escapes raw html',()=>{
 const html=renderMarkdown(row.body,row.title);assert.match(html,/<h2 id="costs">/);assert.match(html,/<table>/);assert.match(html,/nice\.org\.uk/);assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);
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
