import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {verifyOralImage} from './verify-oral-image.mjs';
const dir='babylove/generated',configPath=dir+'/preview.json';
mkdirSync(dir,{recursive:true});
const cli='node_modules/wrangler/bin/wrangler.js';
const run=args=>execFileSync(process.execPath,[cli,...args],{encoding:'utf8',maxBuffer:10e6});
const name='shift-babylove-preview-20260919';
let databases=JSON.parse(run(['d1','list','--json']));
if(!databases.some(d=>d.name===name)){run(['d1','create',name,'--location','weur']);databases=JSON.parse(run(['d1','list','--json']));}
const found=databases.filter(d=>d.name===name);assert.equal(found.length,1);
const id=found[0].uuid??found[0].database_id??found[0].id;
assert.match(id,/^[a-f0-9-]{36}$/);assert(!readFileSync('wrangler.jsonc','utf8').includes(id),'Preview must not bind any production database');
const token=randomBytes(32).toString('base64url');console.log('::add-mask::'+token);
const config={name:'shift-babylove-preview',main:'../repair-preview-worker.mjs',compatibility_date:'2026-08-09',compatibility_flags:['nodejs_compat'],workers_dev:true,preview_urls:false,assets:{directory:'../../frontend/member',binding:'MEMBER_ASSETS',run_worker_first:true},vars:{BABYLOVE_WEBHOOK_TOKEN_SHA256:createHash('sha256').update(token).digest('hex')},d1_databases:[{binding:'DB',database_name:name,database_id:id}]};
assert(!config.routes&&!config.triggers&&!config.send_email);
writeFileSync(configPath,JSON.stringify(config,null,2));
const sql=`CREATE TABLE IF NOT EXISTS knowledge_articles(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,category TEXT,author TEXT,status TEXT NOT NULL DEFAULT 'draft',summary TEXT,body TEXT,seo_title TEXT,publish_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); INSERT OR IGNORE INTO knowledge_articles(title,slug,status,body) VALUES('Preserved fixture','preserved-existing','published','Unchanged fixture body');`;
run(['d1','execute','DB','--remote','--config',configPath,'--command',sql]);
const output=run(['deploy','--config',configPath]);
const origin=output.match(/https:\/\/shift-babylove-preview\.[a-z0-9-]+\.workers\.dev/)?.[0];assert(origin,'Preview deployment URL missing');
const url=origin+'/v1/integrations/babylovegrowth';
console.log('Preview receiver:',url); console.log('Article preview:',origin+'/articles/oral-semaglutide-for-weight-loss');
// Newly created workers.dev routes can return an HTML 404 while propagating.
// Wait for this exact receiver's method response before sending fixture writes.
let ready=false;
for(let attempt=0;attempt<12;attempt++){
  const response=await fetch(url,{redirect:'manual'}),body=await response.text();
  if(response.status===405&&body.includes('method_not_allowed')){ready=true;break;}
  console.log(JSON.stringify({attempt,http:response.status,type:response.headers.get('content-type'),body:body.slice(0,350)}));
  if(response.status!==404&&response.status!==503)throw Error('Unexpected preview readiness response');
  await new Promise(resolve=>setTimeout(resolve,2500));
}
assert(ready,'Preview receiver did not become ready');
const report={source_sha:process.env.GITHUB_SHA,checked_at:new Date().toISOString(),preview_url:url,production_writes:0,checks:[]};
const suffix=Date.now().toString(),slug='babylove-preview-'+suffix;
const payload={id:'preview-'+suffix,title:'SHIFT integration fixture',slug,metaDescription:'Fictional preview only',content_html:'<h1>Fixture</h1><script type="application/ld+json">{"@type":"Article"}</script>',content_markdown:'# Fixture\n\nPreview only.',heroImageUrl:'https://example.invalid/fixture.jpg',jsonLd:{'@type':'Article'},status:'published'};
async function post(body,auth=token){
  // Different edge locations can briefly serve the preceding preview token.
  // Retry only a rejected, known fixture credential: 401 cannot write anything.
  // Invalid-credential assertions and every other response remain untouched.
  for(let attempt=0;attempt<12;attempt++){
    const start=performance.now();const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+auth,'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result={http:response.status,body:await response.json(),ms:Math.round(performance.now()-start)};
    if(result.http!==401||auth!==token||attempt===11)return result;
    await new Promise(resolve=>setTimeout(resolve,2500));
  }
}
function record(label,result,code){assert.equal(result.http,code,label+': '+JSON.stringify(result));report.checks.push({label,...result});}
record('unauthorised request',await post(payload,'invalid'),401);
const first=await post(payload);
record('new article auto-published',first,200);assert.equal(first.body.published,true);
for(const result of await Promise.all([post(payload),post(payload),post(payload)])){record('concurrent exact retry',result,200);assert.equal(result.body.duplicate,true);assert.equal(result.body.published,true);assert.equal(result.body.link,'/articles/'+slug);}
record('changed delivery cannot overwrite',await post({...payload,title:'Changed'}),409);
record('existing article preserved',await post({...payload,id:'collision-'+suffix,slug:'preserved-existing'}),409);
record('invalid path cannot become a slug',await post({...payload,slug:'../home'}),400);
record('malformed body rejected',await post({...payload,content_markdown:''}),400);
const rows=JSON.parse(run(['d1','execute','DB','--remote','--config',configPath,'--json','--command',`SELECT slug,status,title,body FROM knowledge_articles WHERE slug IN ('${slug}','preserved-existing'); SELECT count(*) AS receipt_count FROM babylove_receipts WHERE source_id='preview-${suffix}';`]));
const results=rows.flatMap(x=>x.results||[]);const saved=results.find(x=>x.slug===slug),kept=results.find(x=>x.slug==='preserved-existing');
assert.equal(saved.status,'published');assert.equal(saved.body,payload.content_markdown);assert.equal(kept.status,'published');assert.equal(kept.body,'Unchanged fixture body');assert.equal(results.find(x=>x.receipt_count!=null).receipt_count,1);
assert(report.checks.every(x=>x.ms<5000),'Webhook request exceeded the wizard five-second target');
report.persistence={one_receipt:true,auto_published:true,existing_article_unchanged:true};
report.image=await verifyOralImage(origin);
report.receiver_sha256=createHash('sha256').update(readFileSync('babylove/webhook.mjs')).digest('hex');
writeFileSync(dir+'/preview-proof.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
