import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {contentPackage,evidence,primaryUrl,mhraUrl,releaseId} from '../editorial/glp1-anaesthesia-20260918.mjs';
import {ensureRadarSchema,verifyEvidence,radarSeoPackage,reviewRadarActionCore} from '../radar-integration-v1.js';
import {sourceReviewEvent,pendingSourceChange} from '../radar-source-review-v1.js';

const remote=process.argv.includes('--publish');
const actor=remote?`github-actions:shiftsometimber/shift-core@${process.env.GITHUB_SHA}`:'local-publication-verification';
const eventKey=createHash('sha256').update(releaseId+'|'+primaryUrl).digest('hex');
// The multi-statement request preserves the core publisher's atomic D1 batch.
// Parameters are encoded as SQL literals only for that batch; ordinary queries
// use the REST API's parameter binding.
export function boundSql(sql,params){
 let i=0,quote=false,out='';
 for(let n=0;n<sql.length;n++){
  const c=sql[n];
  if(c==="'") {out+=c;if(quote&&sql[n+1]==="'"){out+=sql[++n];continue}quote=!quote;continue}
  if(c==='?'&&!quote){assert.ok(i<params.length);const v=params[i++];assert.ok(v===null||typeof v==='string'||(typeof v==='number'&&Number.isFinite(v)));out+=v===null?'NULL':typeof v==='number'?String(v):"'"+v.replaceAll("'","''")+"'";}else out+=c;
 }
 assert.equal(i,params.length);return out;
}
async function remoteDB(){
 assert.equal(process.env.GITHUB_REPOSITORY,'shiftsometimber/shift-core');
 assert.equal(process.env.GITHUB_REF,'refs/heads/content/glp1-anaesthesia-20260918');
 assert.equal(process.env.GITHUB_EVENT_NAME,'push');
 assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
 const token=process.env.CLOUDFLARE_API_TOKEN;assert.ok(token,'Cloudflare credential required');
 const endpoint='https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847/query';
 async function query(sql,params=[]){
  const r=await fetch(endpoint,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({sql,params})});
  const b=await r.json();assert.ok(r.ok&&b.success,'D1 query failed: '+JSON.stringify(b.errors));
  assert.ok(b.result.every(x=>x.success!==false));return b.result;
 }
 return {prepare(sql){let params=[];return {sql,get params(){return params},bind(...v){params=v;return this},async run(){return(await query(sql,params))[0]},async all(){return(await query(sql,params))[0]},async first(){return(await query(sql,params))[0].results?.[0]||null}}},async batch(statements){const results=await query(statements.map(s=>boundSql(s.sql,s.params)).join(';\n'));assert.equal(results.length,statements.length);return results}};
}
async function verifySources(){
 for(const [url,checks] of [[primaryUrl,['47,039','1,348','1.41%','0.12%','September 16, 2026']],[mhraUrl,['do not stop your treatment','28 January 2025']]]){
  const r=await fetch(url,{signal:AbortSignal.timeout(30000)});assert.ok(r.ok,'Source unavailable: '+url);const html=await r.text();for(const term of checks)assert.ok(html.includes(term),'Source no longer supports retained fact: '+term);
 }
}
async function responseData(response){const b=await response.json();assert.ok(response.ok&&b.ok,JSON.stringify(b));return b}
async function publish(DB){
 const env={DB}; // Use the existing publisher and its evidence/state/duplicate gates.
 const all=(await DB.prepare('SELECT id,event_key,headline,status,source_evidence_json,content_package_json FROM radar_events').all()).results;
 const matching=all.filter(r=>r.event_key===eventKey||JSON.parse(r.content_package_json||'{}').seo?.slug===contentPackage.seo.slug||JSON.parse(r.source_evidence_json||'[]')[0]?.url===primaryUrl);
 assert.ok(matching.length<=1,'Ambiguous existing story; review required');
 let row=matching[0];
 if(row){
  assert.equal(row.event_key,eventKey,'Existing independently prepared story; review required');
  const saved=JSON.parse(row.content_package_json);assert.equal(saved.article_markdown,contentPackage.article_markdown);assert.equal(saved.shift_take,contentPackage.shift_take);
  assert.equal(saved.release_provenance?.release_id,releaseId);assert.ok(['ready_for_review','approved','publish_failed','published'].includes(row.status),'Existing decision must not be overridden');
 }else{
  const stamp=new Date().toISOString();
  const verification={...verifyEvidence(evidence),regulator_confirmed:false,reason:'AI source check: new study announcement and existing MHRA patient guidance are distinct. No clinical review claimed.'};
  const pkg=structuredClone(contentPackage);pkg.seo=radarSeoPackage(pkg,{headline:pkg.headline,source_evidence_json:JSON.stringify(evidence)}).seo;
  const result=await DB.prepare("INSERT INTO radar_events(event_key,status,headline,region,regulator,event_type,relevance_score,urgency_score,confidence_score,clinical,requires_review,source_evidence_json,verification_json,medicine_patch_json,content_package_json,review_note,created_at,updated_at) VALUES(?,'ready_for_review',?,'UK','Association of Anaesthetists','research_update',85,70,88,1,1,?,?,'{}',?,?,?,?)").bind(eventKey,pkg.headline,JSON.stringify(evidence),JSON.stringify(verification),JSON.stringify(pkg),'Owner requested publication with SHIFT take; AI source-checked, no clinical-review attestation.',stamp,stamp).run();
  assert.equal(result.meta.changes,1);
  row=await DB.prepare('SELECT * FROM radar_events WHERE event_key=?').bind(eventKey).first();
  await DB.prepare('INSERT INTO radar_audit(event_id,action,actor,detail_json,created_at) VALUES(?,?,?,?,?)').bind(row.id,'owner_article_prepared',actor,JSON.stringify(pkg.release_provenance),stamp).run();
 }
 const state=async()=>{const current=await sourceReviewEvent(DB,row.id);assert.equal(await pendingSourceChange(DB,row.id),null,'New source observation requires review');return{row:current,pending_source_change_id:null}};
 let current=await state();
 if(current.row.status==='ready_for_review')await responseData(await reviewRadarActionCore(env,row.id,'approve',{note:'Owner instruction: Go. Publish this article with SHIFT interpretation. AI source check; no clinical review claimed.',destinations:contentPackage.destinations},actor,current));
 current=await state();
 if(current.row.status!=='published')await responseData(await reviewRadarActionCore(env,row.id,'publish',{},actor,current));
 current=await state();assert.equal(current.row.status,'published');
 const proof={release_id:releaseId,event_id:row.id,status:'published',url:JSON.parse(current.row.content_package_json).seo.canonical,workflow_sha:process.env.GITHUB_SHA||null,checked_at:new Date().toISOString()};
 return proof;
}

const seo=radarSeoPackage(contentPackage,{source_evidence_json:JSON.stringify(evidence)});assert.deepEqual(seo.errors,[]);
assert.ok(verifyEvidence(evidence).verified);assert.ok(contentPackage.article_markdown.includes('17 regurgitations and two aspirations'));
if(remote){
 await verifySources();const DB=await remoteDB();const proof=await publish(DB);
 fs.writeFileSync('glp1-anaesthesia-publication-proof.json',JSON.stringify(proof,null,2));
 const r=await fetch(proof.url+'?publication-check='+Date.now(),{headers:{'Cache-Control':'no-cache'}});assert.ok(r.ok);const html=await r.text();
 const text=html.replace(/<[^>]*>/g,' ').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/\s+/g,' ');
 for(const value of [contentPackage.headline,...contentPackage.article_markdown.split('\n\n'),...contentPackage.shift_take.split('\n\n'),contentPackage.safety])assert.ok(text.includes(value),'Public copy mismatch');
 assert.ok(html.includes('data-shift-take'));for(const e of evidence)assert.ok(html.includes(e.url));
 const index=await(await fetch('https://shiftsometimber.co.uk/shift-newsroom?publication-check='+Date.now())).text();assert.ok(index.includes(contentPackage.seo.slug));
 proof.public_page_verified=true;proof.index_verified=true;fs.writeFileSync('glp1-anaesthesia-publication-proof.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
}else{
 const {memoryDB}=await import('../preview/newsroom-discovery/memory-db.mjs');const DB=memoryDB();await ensureRadarSchema(DB);
 const first=await publish(DB),again=await publish(DB);assert.equal(first.event_id,again.event_id);
 const n=await DB.prepare("SELECT COUNT(*) n FROM radar_audit WHERE action='published'").first();assert.equal(n.n,1);
 assert.equal(boundSql("SELECT '?' AS q,?,?",["it's safe",null]),"SELECT '?' AS q,'it''s safe',NULL");
 console.log('PASS: source package, SEO, governed publication and idempotent retry in isolated SQLite. No production writes.');
}
