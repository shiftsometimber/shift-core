import {createHash} from 'node:crypto';
import {assertCurrentMain} from '../scripts/catalogue-publication-client.mjs';
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {ARTICLE,KNOWLEDGE_CARD} from './oral-public.mjs';
import {verifyOralImage} from './verify-oral-image.mjs';
mkdirSync('babylove-proof',{recursive:true});
const checks=[];
for(const suffix of ['', '/', '.html']){
 const r=await fetch(ARTICLE.proposed_url+suffix,{redirect:'manual'});assert.equal(r.status,suffix?301:200);if(suffix)assert.equal(r.headers.get('location'),ARTICLE.proposed_url);else{const html=await r.text();assert(html.includes(ARTICLE.body));assert.equal((html.match(/rel="canonical"/g)||[]).length,1);assert(html.includes('Matt O’Brien'));writeFileSync('babylove-proof/live.html',html);}checks.push({url:ARTICLE.proposed_url+suffix,status:r.status});
}
for(const [path,expected] of [['/explore-knowledge',KNOWLEDGE_CARD],['/sitemap.xml','<loc>'+ARTICLE.proposed_url+'</loc>']]){const r=await fetch('https://shiftsometimber.co.uk'+path);assert.equal(r.status,200);assert((await r.text()).includes(expected));checks.push({path,status:200});}
checks.push(await verifyOralImage(ARTICLE.proposed_url));
// Attest only after the exact public HTML, aliases, listing, sitemap and image pass.
assert.equal(process.env.GITHUB_EVENT_NAME,'push');assert.equal(process.env.GITHUB_ACTOR_ID,'315011648');await assertCurrentMain();
const quote=v=>"'"+String(v).replace(/'/g,"''")+"'";
const proofSQL="CREATE TABLE IF NOT EXISTS knowledge_publication_live_proof(slug TEXT PRIMARY KEY,body_sha256 TEXT NOT NULL,url TEXT NOT NULL,verified_at TEXT NOT NULL,workflow_sha TEXT NOT NULL); INSERT INTO knowledge_publication_live_proof VALUES("+[ARTICLE.slug,createHash('sha256').update(ARTICLE.body).digest('hex'),ARTICLE.proposed_url,new Date().toISOString(),process.env.GITHUB_SHA].map(quote).join(',')+") ON CONFLICT(slug) DO UPDATE SET body_sha256=excluded.body_sha256,url=excluded.url,verified_at=excluded.verified_at,workflow_sha=excluded.workflow_sha";
execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--command',proofSQL],{stdio:'inherit',timeout:60000});
let notification;
for(let n=0;n<8;n++){
 await fetch(ARTICLE.proposed_url);
 const result=JSON.parse(execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',"SELECT slug,status,recipient,sent_at,provider_message_id,last_error FROM knowledge_publication_email WHERE slug='oral-semaglutide-for-weight-loss'"],{encoding:'utf8',timeout:60000}));notification=result[0].results[0];if(notification?.status==='sent')break;if(notification?.status==='delivery_unknown')break;await new Promise(r=>setTimeout(r,2500));
}
writeFileSync('babylove-proof/live.json',JSON.stringify({checks,notification,checkedAt:new Date().toISOString()},null,2));assert.equal(notification?.status,'sent','Publication email has not been confirmed sent');
console.log(JSON.stringify({checks,notification},null,2));
