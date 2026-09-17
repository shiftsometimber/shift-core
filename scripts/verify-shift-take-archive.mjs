import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {collectorD1} from './radar-collector-d1.mjs';
import {radarNewsPageRoutes,NEWSROOM_ROWS_SQL} from '../radar-news-pages-v1.js';
const all=collectorD1(['--command',NEWSROOM_ROWS_SQL]).flatMap(x=>x.results||[]);
const candidates=all.filter(r=>JSON.parse(r.content_package_json||'{}').destinations?.includes('medicine_news'));
const linkedGuides=candidates.filter(r=>!String(JSON.parse(r.content_package_json).seo?.slug||'').startsWith('medicine-news/')).map(r=>({id:r.id,slug:JSON.parse(r.content_package_json).seo?.slug}));
const rows=candidates.filter(r=>String(JSON.parse(r.content_package_json).seo?.slug||'').startsWith('medicine-news/')).filter((r,i,list)=>list.findIndex(x=>JSON.parse(x.content_package_json).seo.slug===JSON.parse(r.content_package_json).seo.slug)===i);
const missing=rows.filter(r=>{const p=JSON.parse(r.content_package_json);return !String(p.shift_take||p.why_it_matters_to_uk||'').trim()});
console.log(JSON.stringify({articles:rows.length,linkedGuides,missing:missing.map(r=>({id:r.id,title:r.headline}))}));
assert.equal(missing.length,0,'Every existing story needs its own retained interpretation');
const shellFetch=globalThis.fetch;
const sample=await shellFetch('https://shiftsometimber.co.uk/programme');
assert.equal(sample.status,200);const shell=await sample.text();
globalThis.fetch=async()=>new Response(shell,{headers:{'content-type':'text/html'}});
const proof=[];
try{for(const row of rows){
 const p=JSON.parse(row.content_package_json),slug=String(p.seo.slug).split('/').filter(Boolean).join('/');
 const path=slug.startsWith('medicine-news/')?'/'+slug:'/medicine-news/'+slug;
 const response=await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk'+path),{DB:{prepare:()=>({all:async()=>({results:rows})})}});
 assert.equal(response.status,200,path);const html=await response.text();
 assert.equal((html.match(/data-shift-take/g)||[]).length,1,path);
 assert.ok(!html.includes('A separate SHIFT interpretation has not been added'),path);
 assert.ok(html.includes('SHIFT’s take'),path);
 proof.push({id:row.id,path,retainedInterpretation:true,firstPublished:row.first_published_at});
}}finally{globalThis.fetch=shellFetch}
writeFileSync('shift-take-archive-proof.json',JSON.stringify({commit:process.env.GITHUB_SHA,articles:proof.length,productionWrites:false,proof},null,2));
console.log('PASS: '+proof.length+' published articles render one labelled SHIFT take with retained interpretation.');
