import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {compareNews,NEWSROOM_SORTS} from '../radar-newsroom-sort-v1.js';
const base=process.env.NEWSROOM_BASE||'https://shiftsometimber.co.uk';
const response=await fetch(base+'/shift-newsroom?verify='+process.env.GITHUB_SHA,{cache:'no-store',signal:AbortSignal.timeout(30000)});
assert.equal(response.status,200);const html=await response.text();
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const cards=[...html.matchAll(/<article class="radar-news-card" data-news-card data-date="([^"]*)" data-title="([^"]*)" data-id="([^"]*)"/g)].map(([,date,title,id])=>({date,title:decode(title),id:decode(id)}));
assert.ok(cards.length>0,'Published articles are rendered');assert.equal(new Set(cards.map(x=>x.id)).size,cards.length);
assert.deepEqual(cards,[...cards].sort((a,b)=>compareNews(a,b)),'Initial HTML is globally newest first');
for(const [value,label]of NEWSROOM_SORTS)assert.ok(html.includes('<option value="'+value+'">'+label+'</option>'));
assert.equal((html.match(/<div class="radar-news-grid" data-news-list>/g)||[]).length,1);
assert.ok(html.includes('data-shift-news-ticker'),'Newsroom ticker retained');
const proof={checkedAt:new Date().toISOString(),url:response.url,articles:cards.length,undated:cards.filter(x=>!x.date).length,first:cards.slice(0,5),orders:NEWSROOM_SORTS,defaultOrderVerified:true};
writeFileSync('newsroom-order-proof.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof,null,2));
if(process.env.NEWSROOM_BASE){const report=await(await fetch(base+'/report.json',{cache:'no-store'})).json();assert.equal(report.commit,process.env.GITHUB_SHA);assert.equal(report.productionChanged,false);}
