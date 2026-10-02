import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export const hash=s=>createHash('sha256').update(String(s)).digest('hex');
export function correctionPlan(spec,row,body){
 assert.equal(row?.id,spec.id,'Article identity changed');
 assert.equal(row.slug,spec.slug,'Article slug changed');
 assert.equal(row.status,'published','Only existing published information may be corrected');
 assert(row.publish_at,'Original publication date is required');
 assert.equal(hash(body),spec.bodySha256,'Reviewed corrective payload changed');
 const done=hash(row.body)===spec.bodySha256;
 if(!done){assert.equal(hash(row.body),spec.expectedBodySha256,'Stored content changed since review');assert.equal(row.title,spec.expectedTitle);assert.equal(row.updated_at,spec.expectedUpdatedAt,'Concurrent article update');}
 else{assert.equal(row.title,spec.title);assert.equal(row.seo_title,spec.seoTitle);assert.equal(row.summary,spec.summary);}
 return {done,id:row.id,slug:row.slug,beforeHash:hash(row.body),afterHash:spec.bodySha256,originalPublishedAt:row.publish_at};
}
const literal=v=>v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'";
export function interpolate(sql,values){let i=0;const result=sql.replace(/\?/g,()=>literal(values[i++]));assert.equal(i,values.length);return result;}
export const UPDATE="UPDATE knowledge_articles SET title=?,seo_title=?,summary=?,body=?,updated_at=? WHERE id=? AND slug=? AND status='published' AND body=? AND updated_at=?;";
async function main(){
 assert.equal(process.env.GITHUB_ACTOR_ID,'315011648','Require established owner account');
 assert.equal(process.env.GITHUB_EVENT_NAME,'push');
 assert.equal(process.env.GITHUB_REF,'refs/heads/codex/full-website-content-20261002');
 const payload=JSON.parse(readFileSync('editorial/content-audit/approved-corrections.json'));
 const response=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/branches/main',{headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+process.env.GITHUB_TOKEN}});
 assert(response.ok,'Current source cannot be verified');assert.equal((await response.json()).commit.sha,payload.baselineMain,'Current main changed; reconcile before publication');
 const query=(sql,values=[])=>{const result=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',interpolate(sql,values)],{encoding:'utf8',maxBuffer:8*1024*1024,timeout:60000}));assert(result.length===1&&result[0].success===true);return result[0];};
 const read=spec=>query('SELECT id,title,slug,author,status,summary,body,seo_title,publish_at,updated_at FROM knowledge_articles WHERE id=? AND slug=?',[spec.id,spec.slug]).results[0];
 const prepared=payload.articles.map(spec=>{const body=readFileSync(spec.bodyPath,'utf8'),row=read(spec);return {spec,body,row,plan:correctionPlan(spec,row,body)};});
 mkdirSync('content-correction-proof',{recursive:true});
 writeFileSync('content-correction-proof/before.json',JSON.stringify(prepared.map(x=>({id:x.row.id,slug:x.row.slug,title:x.row.title,body:x.row.body,publish_at:x.row.publish_at,updated_at:x.row.updated_at}))));
 const receipts=[];
 for(const {spec,body,row,plan} of prepared){
  if(!plan.done){const result=query(UPDATE,[spec.title,spec.seoTitle,spec.summary,body,new Date().toISOString(),row.id,row.slug,row.body,row.updated_at]);assert.equal(result.meta?.changes,1,'Concurrent change prevented the editorial update');}
  const after=read(spec);assert.equal(hash(after.body),spec.bodySha256);assert.equal(after.publish_at,row.publish_at,'Original publication date must be retained');assert.equal(after.author,row.author,'Author identity must be retained');assert.equal(after.status,'published');
  const url='https://shiftsometimber.co.uk/articles/'+spec.slug,r=await fetch(url,{signal:AbortSignal.timeout(25000)});assert(r.ok);const html=await r.text();assert(html.includes(spec.title));for(const text of spec.expectedVisible)assert(html.includes(text),'Missing published correction: '+text);for(const text of spec.forbiddenVisible)assert(!html.includes(text),'Unsupported claim remains: '+text);
  writeFileSync('content-correction-proof/'+spec.slug+'.html',html);
  receipts.push({...plan,url,title:after.title,afterHash:hash(after.body),workflowSha:process.env.GITHUB_SHA,at:new Date().toISOString(),runtimeDeployed:false,customerRecordsChanged:false,medicineStockPricesChanged:false,clinicalReviewClaimed:false});
 }
 writeFileSync('content-correction-proof/receipt.json',JSON.stringify(receipts,null,2));console.log(JSON.stringify(receipts));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1});
