import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {extractPublicPage,plainText,sitemapUrls,storePublicPage,publishedSiteQuery} from '../../member-experience/ai-site-knowledge.mjs';
assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(process.env.GITHUB_ACTOR_ID,'315011648');
assert.equal(process.env.GITHUB_REF,'refs/heads/codex/nondevice-completion-20261003');
const main=process.env.LOSSLESS_MAIN_SOURCE;assert.match(main||'',/^[a-f0-9]{40}$/);
const origin='https://shiftsometimber.co.uk',repo='https://api.github.com/repos/shiftsometimber/shift-core',dir='lossless-live-proof';mkdirSync(dir,{recursive:true});
const git=async path=>{const r=await fetch(repo+path,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok);return r.json()};
assert.equal((await git('/git/ref/heads/main')).object.sha,main,'Main moved; reconcile reviewed source');
let production;
for(let attempt=0;attempt<90;attempt++){const runs=(await git('/actions/runs?head_sha='+main+'&per_page=50')).workflow_runs;production=runs.find(r=>r.path==='.github/workflows/cloudflare-production-promote.yml');if(production?.status==='completed')break;assert(attempt<89,'Runtime promotion did not complete');await new Promise(r=>setTimeout(r,10000));}
assert.equal(production?.conclusion,'success','Exact runtime promotion must pass first');
const code=await git('/contents/member-experience/ai-site-knowledge.mjs?ref='+main),hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(hash(readFileSync('member-experience/ai-site-knowledge.mjs')),hash(Buffer.from(code.content,'base64')),'Proof parser differs from released parser');
const account='9e5386dcf455be34c582d93f8bfc79e6',db='88f40aed-cb23-4372-8c94-8a73f48bc847';
const query=async body=>{const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/d1/database/'+db+'/query',{method:'POST',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)}),j=await r.json();assert(r.ok&&j.success&&j.result.every(x=>x.success));return j.result.flatMap(x=>x.results||[])};
const select=async(sql,params=[])=>{assert(/^SELECT\b/.test(sql)&&!sql.includes(';'));return query({sql,params})};
const sitemap=await fetch(origin+'/sitemap.xml');assert(sitemap.ok);const urls=sitemapUrls(await sitemap.text());assert(urls.length>=200);
const pages=[],skipped=[];
for(const url of urls){const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)});assert(r.ok,'Public source unavailable: '+url);const html=await r.text(),page=extractPublicPage(html,url);
 if(!page){assert(/\bnoindex\b/i.test(html.match(/<meta\b[^>]*name=["']robots["'][^>]*>/i)?.[0]||''),'Unexpected extraction rejection: '+url);skipped.push({url,reason:'noindex'});continue;}
 assert.equal(page.chunks.join(' '),plainText(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]),'Source words lost: '+url);pages.push(page);
}
const before=await select("SELECT d.title,d.source_uri,d.checksum,d.status,c.chunk_index,c.content,c.search_text FROM ai_knowledge_documents d LEFT JOIN ai_knowledge_chunks c ON c.document_id=d.id WHERE d.category='shift_public_site' ORDER BY d.source_uri,c.chunk_index");
writeFileSync(dir+'/public-index-before.json',JSON.stringify(before));
const DB={prepare(sql){return{bind(...params){return{sql,params}}}},async batch(statements){for(const s of statements){assert(/^(INSERT INTO ai_knowledge_(documents|chunks)\b|DELETE FROM ai_knowledge_chunks\b)/.test(s.sql));if(s.sql.startsWith('INSERT INTO ai_knowledge_documents')){assert.equal(s.params[2],'shift_public_site');assert(pages.some(p=>p.url===s.params[1]));}}await query({batch:statements});}};
let updated=0;const receipts=[];
for(const page of pages){const old=before.filter(r=>r.source_uri===page.url&&r.content!==null);if(JSON.stringify(old.map(r=>r.content))!==JSON.stringify(page.chunks)||old.some(r=>r.status!=='published_site')){await storePublicPage(DB,page);updated++;}
 const rows=await select('SELECT c.chunk_index,c.content FROM ai_knowledge_documents d JOIN ai_knowledge_chunks c ON c.document_id=d.id WHERE d.checksum=? AND d.status=? ORDER BY c.chunk_index',['shift-public:'+page.url,'published_site']);assert.deepEqual(rows.map(r=>r.content),page.chunks);receipts.push({url:page.url,chunks:rows.length,sourceTextSha256:hash(page.chunks.join(' ')),exactCopy:true});
}
const request=publishedSiteQuery('weight after 40'),results=await select(request.sql,request.args);assert.equal(results[0]?.source_uri,origin+'/articles/men-weight-loss-after-40');
writeFileSync(dir+'/age-retrieval.json',JSON.stringify({at:new Date().toISOString(),query:'weight after 40',citations:results.map(r=>r.source_uri),dedicatedPageFirst:true,modelsCalled:0,scope:'Read-only production SQL using the exact deployed implementation'}));
const expiry=await select("SELECT COUNT(*) expiredOrInvalid FROM audit_log WHERE action='auth.register' AND CASE WHEN json_valid(metadata) THEN json_type(metadata,'$.acquisition') IS NOT NULL AND (julianday(json_extract(metadata,'$.acquisition.expiresAt'))<=julianday('now') OR julianday(json_extract(metadata,'$.acquisition.expiresAt')) IS NULL) ELSE 0 END");
writeFileSync(dir+'/acquisition-expiry.json',JSON.stringify({at:new Date().toISOString(),aggregate:expiry,scope:'Read-only expiry backlog count; no account identifiers or metadata exported'}));
assert.equal(Number(expiry[0]?.expiredOrInvalid),0,'Expired acquisition metadata remains; retained expiry job needs repair');
assert.equal((await git('/git/ref/heads/main')).object.sha,main,'Main moved during proof');
writeFileSync(dir+'/receipt.json',JSON.stringify({at:new Date().toISOString(),source:process.env.GITHUB_SHA,runtimeSource:main,productionRun:production.id,discovered:urls.length,verified:receipts.length,updated,skipped,receipts,modelsCalled:0,customerRecordsRead:false,customerRecordsChanged:false,scope:'Exact live public source reconstruction and public-derived D1 index comparison; no generated-answer or independent clinical acceptance claim.'},null,2));
console.log('PASS complete public source text and exact stored chunks: '+receipts.length+' pages; '+updated+' updated');
