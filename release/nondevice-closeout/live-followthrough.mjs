import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {extractPublicPage,publicKnowledgeUrl,sitemapUrls,storePublicPage,publishedSiteQuery} from '../../member-experience/ai-site-knowledge.mjs';
import {activationScorecard} from '../../activation-measurement/scorecard.mjs';
assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(process.env.GITHUB_ACTOR_ID,'315011648');assert.equal(process.env.GITHUB_REF,'refs/heads/codex/nondevice-completion-20261003');
const dir='nondevice-proof';mkdirSync(dir,{recursive:true});const save=(name,v)=>writeFileSync(dir+'/'+name,JSON.stringify(v,null,2));
const account='9e5386dcf455be34c582d93f8bfc79e6',db='88f40aed-cb23-4372-8c94-8a73f48bc847',origin='https://shiftsometimber.co.uk';
const cf=async(path,method='GET',body)=>{const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)}),j=await r.json();assert(r.ok&&j.success,'Cloudflare request failed: '+r.status);return j.result;};
const select=async(sql,params=[])=>{assert((/^(SELECT|WITH)\b/.test(sql)||sql==='PRAGMA table_info(audit_log)')&&!sql.includes(';'));const r=await cf('/d1/database/'+db+'/query','POST',{sql,params});assert(r.every(x=>x.success));return r.flatMap(x=>x.results||[]);};
const gitHeaders={Authorization:'Bearer '+process.env.GITHUB_TOKEN};
const expected=process.env.REVIEWED_RELEASE_SOURCE;assert(/^[a-f0-9]{40}$/.test(expected));let runs=[];
for(let i=0;i<24;i++){
 const r=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/actions/runs?head_sha='+expected+'&per_page=30',{headers:gitHeaders});assert(r.ok);runs=(await r.json()).workflow_runs;
 const release=runs.find(x=>x.path==='.github/workflows/everyday-content-closeout.yml');
 if(release?.status==='completed'){assert.equal(release.conclusion,'success','No refresh from a failed release');break;}
 assert(i<23,'Publication did not complete');await new Promise(r=>setTimeout(r,15000));
}
const project=await cf('/pages/projects/projectshift');assert.equal(project.canonical_deployment.deployment_trigger.metadata.commit_hash,expected,'Public release changed; refresh scope needs review');
const fp=await fetch(origin+'/DEPLOYMENT-FINGERPRINT.json');assert(fp.ok);assert.equal((await fp.json()).aggregate_sha256,'173acd3123ba68ea39f30af5744986e0bc5da24ab41977a3e5a9e86872834c79');
const implementation=readFileSync('member-experience/ai-site-knowledge.mjs'),hash=createHash('sha256').update(implementation).digest('hex');
const current=await fetch('https://api.github.com/repos/shiftsometimber/shift-core/contents/member-experience/ai-site-knowledge.mjs?ref=main',{headers:gitHeaders});assert(current.ok);const code=await current.json();assert.equal(createHash('sha256').update(Buffer.from(code.content,'base64')).digest('hex'),hash);
const sm=await fetch(origin+'/sitemap.xml');assert(sm.ok);const allowed=new Set(sitemapUrls(await sm.text()));const specs=JSON.parse(readFileSync('editorial/content-audit/everyday-articles.json')).articles,pages=[];
for(const spec of specs){const url=origin+'/articles/'+spec.slug;assert(allowed.has(url)&&publicKnowledgeUrl(url));const r=await fetch(url,{headers:{'Cache-Control':'no-cache'},redirect:'error'});assert(r.ok);const page=extractPublicPage(await r.text(),url);assert(page);const text=page.chunks.join(' ');assert(text.includes(spec.intro));for(const [heading]of spec.sections)assert(text.includes(heading),'Section lost during extraction: '+heading);assert(!text.includes('wet Wednesday'));pages.push(page);}
const DB={prepare(sql){return{bind(...params){return{sql,params}}}},async batch(statements){for(const s of statements){assert(/^(INSERT INTO ai_knowledge_(documents|chunks)\b|DELETE FROM ai_knowledge_chunks\b)/.test(s.sql));if(s.sql.startsWith('INSERT INTO ai_knowledge_documents')){assert.equal(s.params[2],'shift_public_site');assert(pages.some(p=>p.url===s.params[1]));}}const r=await cf('/d1/database/'+db+'/query','POST',{batch:statements});assert(r.every(x=>x.success));}};
for(const p of pages)await storePublicPage(DB,p);
const refresh=[];
for(const p of pages){const rows=await select('SELECT c.chunk_index,c.content FROM ai_knowledge_documents d JOIN ai_knowledge_chunks c ON c.document_id=d.id WHERE d.checksum=? ORDER BY c.chunk_index',['shift-public:'+p.url]);assert.deepEqual(rows.map(r=>r.content),p.chunks);refresh.push({url:p.url,chunks:rows.length,exactCopy:true});}
save('knowledge-refresh.json',{at:new Date().toISOString(),source:process.env.GITHUB_SHA,releaseSource:expected,refresh,modelsCalled:0,customerRecordsRead:false,customerRecordsChanged:false});
const readDB={prepare(sql){let params=[];return{bind(...v){params=v;return this},async all(){return{results:await select(sql,params)}},async first(){return(await select(sql,params))[0]||null}}}};
const scorecard=await activationScorecard(readDB,{days:90});assert(scorecard.available&&scorecard.acquisition.available);assert.equal(scorecard.acquisition.sources.reduce((n,s)=>n+s.registered,0),scorecard.stages[0].members);save('activation-aggregate.json',scorecard);
const settings=await cf('/workers/scripts/shift-core/settings');save('binding-inventory.json',{at:new Date().toISOString(),bindings:(settings.bindings||[]).map(b=>({name:b.name,type:b.type,databaseId:b.id??b.database_id??null,className:b.class_name??null,namespaceId:b.namespace_id??null})),secretValuesExported:false,processorContractsVerified:false});
save('source-access-state.json',{at:new Date().toISOString(),mode:'Existing diagnostics only; no source refusal bypass or repeat scan',latest:await select("SELECT source_id,authority,source_url,status,item_count,detail_json,completed_at FROM radar_scan_runs WHERE id IN (SELECT MAX(id) FROM radar_scan_runs GROUP BY source_id) AND (lower(authority) LIKE '%nice%' OR lower(authority) LIKE '%pharmaceutical%' OR lower(source_id) LIKE '%gphc%')")});
save('knowledge-status.json',await select("SELECT category,status,COUNT(*) documents,SUM(CASE WHEN julianday(updated_at)<julianday('now','-2 days') THEN 1 ELSE 0 END) stale FROM ai_knowledge_documents GROUP BY category,status"));
const retrieval=[];
for(const query of ['alcohol withdrawal','calories serving size','healthy habits minimum version','weight after 40','sleep breathing pauses','stress eating food','walking joint problems']){const st=publishedSiteQuery(query);assert(st);const started=performance.now(),rows=await select(st.sql,st.args);retrieval.push({query,ms:performance.now()-started,passages:rows.length,citations:rows.map(r=>r.source_uri),bytes:Buffer.byteLength(JSON.stringify(rows))});assert(rows.length>0,'Relevant query returned no evidence: '+query);}
save('retrieval-live.json',{at:new Date().toISOString(),checks:retrieval,scope:'Seven serial read-only public-index queries; not a production load test or generated-answer review',modelsCalled:0});
console.log('PASS public-derived refresh, actual aggregate funnel and bounded retrieval checks');
