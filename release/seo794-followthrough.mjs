import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {NEWSROOM_ROWS_SQL} from '../radar-news-pages-v1.js';
import {correctionSQL} from '../scripts/seo-repairs-20260923/build-news.mjs';
const mode=process.argv[2],out='seo794-release-proof',origin='https://shiftsometimber.co.uk';
assert(['before','apply','after'].includes(mode));mkdirSync(out,{recursive:true});
const save=(n,v)=>writeFileSync(out+'/'+n,JSON.stringify(v,null,2)+'\n');
const sha=v=>createHash('sha256').update(v).digest('hex');
const changes=JSON.parse(readFileSync('preview/seo-repairs/generated/changes.json'));
assert.equal(changes.length,13);const ids=changes.map(x=>x.id),modifiedAt=changes[0].after.updated_at;
const fields=['content_package_json','source_evidence_json','updated_at','reviewed_at','created_at','first_published_at'];
const equal=(row,expected)=>fields.every(k=>row[k]===expected[k]);
function query(sql){assert(/^SELECT\b/i.test(sql));const r=JSON.parse(execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command',sql],{encoding:'utf8',maxBuffer:24e6}));assert(r.every(x=>x.success));return r.flatMap(x=>x.results||[]);}
async function cf(path){const r=await fetch('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/'+path,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN}});assert(r.ok,'Control-plane read failed: '+r.status);const d=await r.json();assert(d.success);return d.result;}
async function publicRead(path){const r=await fetch(origin+path,{headers:{'User-Agent':'SHIFT-owner-approved-SEO-release','Cache-Control':'no-cache'}});assert.equal(r.status,200,path);return {status:r.status,headers:Object.fromEntries(r.headers),body:await r.text()};}
async function snapshot(phase){
 const news=query(NEWSROOM_ROWS_SQL);save(phase+'-public-news.json',news);
 const protectedTables={};for(const t of ['medicine_products','medicine_variants','medicine_inventory']){const rows=query('SELECT * FROM '+t+' ORDER BY '+(t==='medicine_inventory'?'variant_id':'id'));protectedTables[t]={rows:rows.length,sha256:sha(JSON.stringify(rows))};}
 const pages=(await cf('pages/projects/projectshift')).canonical_deployment;assert.equal(pages.id,'036d3a83-2a22-4d52-8e83-b29ad6905898','Unexpected Pages deployment');
 const workers=await cf('workers/scripts/shift-core/deployments');
 const fp=JSON.parse((await publicRead('/DEPLOYMENT-FINGERPRINT.json')).body);assert.equal(fp.aggregate_sha256,'e8e9697b90eb1d91cbe10897a6858a672a26d3e219308f97c8d508dc6f9f9496');
 const sitemap=await publicRead('/sitemap.xml');writeFileSync(out+'/'+phase+'-sitemap.xml',sitemap.body);const sitemapUrls=[...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);
 const r={at:new Date().toISOString(),phase,source:process.env.GITHUB_SHA,pages:{id:pages.id,url:pages.url},workers,protectedTables,configurationSha256:sha(readFileSync('wrangler.jsonc')),sitemapUrls,fingerprint:fp.aggregate_sha256,customerRowsRead:0};save(phase+'-state.json',r);return {news,state:r};
}
if(mode==='before'){
 const {news,state}=await snapshot('before');for(const x of changes){const r=news.find(y=>y.id===x.id);assert(r,'Missing public record '+x.id);assert(equal(r,x.before),'Stale approved record '+x.id);}
 save('exact-approved-records-backup.json',news.filter(x=>ids.includes(x.id)));writeFileSync(out+'/approved-correction.sql',correctionSQL(changes,modifiedAt));
 const q=v=>v==null?'NULL':"'"+String(v).replaceAll("'","''")+"'";
 const guard=changes.map(x=>'EXISTS(SELECT 1 FROM radar_events WHERE id='+x.id+" AND status='published' AND content_package_json="+q(x.after.content_package_json)+' AND source_evidence_json='+q(x.after.source_evidence_json)+' AND updated_at IS '+q(x.after.updated_at)+' AND reviewed_at IS '+q(x.after.reviewed_at)+')').join(' AND ');
 const set=f=>'CASE id '+changes.map(x=>'WHEN '+x.id+' THEN '+q(x.before[f])).join(' ')+' ELSE '+f+' END';
 writeFileSync(out+'/rollback-editorial.sql','-- Manual rollback only after reviewing current source; preserve audit history.\nUPDATE radar_events SET '+['content_package_json','source_evidence_json','updated_at'].map(f=>f+'='+set(f)).join(',')+' WHERE id IN('+ids.join(',')+') AND '+guard+';\n');
 save('preflight.json',{passed:true,approvedCandidate:'f4052fff7670609f37e86f6324023cdf4baaea9a',records:ids,modifiedAt,sitemapCount:state.sitemapUrls.length,productionWrites:0});console.log('Preflight passed: 13 exact source rows backed up; sitemap '+state.sitemapUrls.length+'; zero writes.');
}
if(mode==='apply'){
 assert.equal(process.env.APPROVED_MERGE_SHA,process.env.EXPECTED_MAIN_SHA,'Exact approved merge required');
 const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/git/ref/heads/main',{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,'User-Agent':'SHIFT-release'}});assert(r.ok);assert.equal((await r.json()).object.sha,process.env.APPROVED_MERGE_SHA,'Main advanced; stop stale release');
 const live=query(NEWSROOM_ROWS_SQL),allBefore=changes.every(x=>equal(live.find(r=>r.id===x.id)||{},x.before)),allAfter=changes.every(x=>equal(live.find(r=>r.id===x.id)||{},x.after));assert(allBefore||allAfter,'Mixed or stale source; no writes performed');
 save('immediate-prewrite-public-news.json',live);
 if(allBefore){const sql=correctionSQL(changes,modifiedAt);assert.equal(sql,readFileSync('seo794-preflight/approved-correction.sql','utf8'));writeFileSync(out+'/executed-correction.sql',sql);const log=execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config','wrangler.jsonc','--file',out+'/executed-correction.sql'],{encoding:'utf8',maxBuffer:3e6});writeFileSync(out+'/editorial-apply.log',log);}
 const after=query(NEWSROOM_ROWS_SQL);save('immediate-postwrite-public-news.json',after);for(const x of changes)assert(equal(after.find(r=>r.id===x.id)||{},x.after),'Correction missing '+x.id);
 for(const row of live.filter(x=>!ids.includes(x.id)))assert.deepEqual(after.find(x=>x.id===row.id),row,'Unrelated public article changed');
 const audit=query("SELECT event_id,action,actor,detail_json FROM radar_audit WHERE action='editorial_correction' AND actor='owner-authorised-seo-20260923' AND event_id IN ("+ids.join(',')+") ORDER BY event_id").filter(x=>JSON.parse(x.detail_json).candidate_modified_at===modifiedAt);assert.equal(audit.length,13);save('editorial-audit.json',audit);
 save('editorial-apply.json',{passed:true,at:new Date().toISOString(),records:ids,alreadyApplied:allAfter,updatedRecords:allBefore?13:0,modifiedAt,unrelatedPublicRowsPreserved:true,customerRowsRead:0,customerRowsChanged:0});console.log('Thirteen approved records verified; unrelated public rows preserved.');
}
if(mode==='after'){
 const {news,state}=await snapshot('after'),before=JSON.parse(readFileSync('seo794-preflight/before-state.json'));assert.deepEqual(state.protectedTables,before.protectedTables);assert.notEqual(state.workers.deployments[0].id,before.workers.deployments[0].id,'No new Worker deployment observed');assert.equal(state.workers.deployments[1].id,before.workers.deployments[0].id,'Concurrent Worker release observed; inspect before claiming one deployment');assert.equal(state.configurationSha256,before.configurationSha256);assert.deepEqual(state.pages,before.pages);assert.deepEqual(state.sitemapUrls,before.sitemapUrls,'Sitemap URLs changed');for(const x of changes)assert(equal(news.find(r=>r.id===x.id)||{},x.after));
 const routes=JSON.parse(readFileSync('preview/seo-repairs/generated/render-manifest.json')).records.map(x=>x.path);mkdirSync(out+'/http',{recursive:true});const checks=[];
 for(const path of routes){const r=await publicRead(path),html=r.body;assert(!/noindex/i.test(r.headers['x-robots-tag']||''),path);const f=(path==='/'?'home':path.slice(1).replaceAll('/','_'))+'.html';writeFileSync(out+'/http/'+f,html);checks.push({path,status:r.status,sha256:sha(html),headers:r.headers});}
 save('live-http.json',checks);save('preservation.json',{passed:true,sitemapBefore:before.sitemapUrls.length,sitemapAfter:state.sitemapUrls.length,protectedPricesStockServicesUnchanged:true,pagesUnchanged:true,configurationUnchanged:true,customerRowsRead:0});console.log('Production preservation and '+checks.length+' live responses verified.');
}
