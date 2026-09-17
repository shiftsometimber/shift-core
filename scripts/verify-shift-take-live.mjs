import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const archive=JSON.parse(readFileSync('shift-take-archive-proof.json','utf8')),pending=[...archive.proof],results=[];
await Promise.all(Array.from({length:4},async()=>{while(pending.length){
 const item=pending.shift();let response;
 for(let attempt=0;attempt<3;attempt++){response=await fetch('https://shiftsometimber.co.uk'+item.path+'?take-check='+process.env.GITHUB_SHA,{cache:'no-store',signal:AbortSignal.timeout(30000)});if(response.ok)break;if(attempt<2)await new Promise(r=>setTimeout(r,3000))}
 assert.equal(response.status,200,item.path);const html=await response.text();
 assert.equal((html.match(/data-shift-take/g)||[]).length,1,item.path);
 assert.ok(html.includes('<h2>SHIFT’s take</h2>'),item.path);
 assert.ok(!html.includes('A separate SHIFT interpretation has not been added'),item.path);
 const blocks=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
 const article=blocks.find(x=>x['@type']==='Article');assert.ok(article,item.path);
 if(item.firstPublished){const original=new Date(item.firstPublished.includes('T')?item.firstPublished:item.firstPublished.replace(' ','T')+'Z').toISOString();assert.equal(article.datePublished,original,item.path)}
 results.push({path:item.path,status:response.status,oneShiftTake:true,publicationDate:article.datePublished});
}}));
writeFileSync('shift-take-live-proof.json',JSON.stringify({commit:process.env.GITHUB_SHA,checkedAt:new Date().toISOString(),articles:results.length,results},null,2));
console.log('PASS: '+results.length+' live news articles have one SHIFT take and retain their original publication dates.');
