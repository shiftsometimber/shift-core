import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import worker from './worker.js';
import { radarRoutes } from './radar-integration-v1.js';
import { radarPublicRoutes } from './radar-public-v1.js';

class D1Statement {
  constructor(db, sql, params=[]) { this.db=db; this.sql=sql; this.params=params; }
  bind(...params) { return new D1Statement(this.db,this.sql,params.map(v=>v===undefined?null:v)); }
  async run() { const r=this.db.prepare(this.sql).run(...this.params); return {success:true,meta:{last_row_id:Number(r.lastInsertRowid||0),changes:Number(r.changes||0)}}; }
  async first() { return this.db.prepare(this.sql).get(...this.params) || null; }
  async all() { return {results:this.db.prepare(this.sql).all(...this.params)}; }
}
class D1Database {
  constructor() { this.sqlite=new DatabaseSync(':memory:'); this.sqlite.exec('PRAGMA foreign_keys = ON'); }
  prepare(sql) { return new D1Statement(this.sqlite,sql); }
  async batch(statements) { const out=[]; this.sqlite.exec('BEGIN'); try { for(const s of statements) out.push(await s.run()); this.sqlite.exec('COMMIT'); return out; } catch(e) { this.sqlite.exec('ROLLBACK'); throw e; } }
  exec(sql) { return this.sqlite.exec(sql); }
}
const sha256=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const body=async r=>{const t=await r.text();try{return JSON.parse(t)}catch{return{raw:t}}};
const request=(path,options={})=>new Request(`https://api.shiftsometimber.co.uk${path}`,options);

const DB=new D1Database();
// The live Worker is additive over Shift's original production D1 schema. Seed only
// those foundational tables a blank in-memory database lacks before ensureSchema runs.
DB.exec(`
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE,first_name TEXT,last_name TEXT,phone TEXT,date_of_birth TEXT,postcode TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE user_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,token_hash TEXT NOT NULL UNIQUE,expires_at TEXT NOT NULL,revoked_at TEXT,last_used_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE cases (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,reference TEXT,status TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE pharmacy_orders (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,case_id INTEGER,status TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);
const calls=[];
const sitePublishes=[];
const searchRefreshes=[];
const brainIngests=[];
const medicinePatch={medicine_id:'stage-medicine',brand:'Stage Medicine',generic_name:'stagegeneric',developer:'Stage Labs',mechanism:['test pathway'],formulation:'injection',global_stage:'US regulator approved in staged evidence',uk_regulatory_status:'Not established by staged evidence',uk_commercial_status:'Not established by staged evidence',nice_status:'Not established by staged evidence',nhs_status:'Not established by staged evidence',latest_update_text:'Stage Medicine received a test-only US regulatory update.',radar_score:86,regions:['US'],unknowns:['UK position'],review_flags:[]};
const contentPackage={headline:'Stage Medicine: test-only regulatory update',standfirst:'A staged Radar package used only to commission the Shift publication chain.',what_changed:'A test-only US regulator update was detected and verified.',why_it_matters_to_uk:'It does not establish UK approval, availability, NICE guidance or NHS access.',known_facts:[{claim:'A test-only US regulatory update exists.',source_url:'https://regulator.test/stage-medicine'}],unknowns:['UK regulatory position','UK commercial availability'],article_markdown:'# Stage Medicine\n\nThis is staging-only content.',existing_page_updates:[{content_key:'medicines.stage-medicine',change:'Refresh related medicine card and dossier.'}],faqs:[{q:'Is this available in the UK?',a:'The staged evidence does not establish UK availability.'}],comparisons:[{with:'current-options',note:'Staging related-content hook only.'}],seo:{title:'Stage Medicine test update',description:'Staging-only Radar commissioning page.',slug:'knowledge-hub/stage-medicine-test',keywords:['stage medicine']},social:{facebook:'Staging only',instagram:'Staging only',x:'Staging only'},shift_brain:{summary:'Staging-only verified Radar update for Stage Medicine.',facts:[{fact:'Test-only US regulatory update.',source_url:'https://regulator.test/stage-medicine'}]},review_flags:[]};
let aiCalls=0;
const env={
  DB,
  AUTO_VERIFY_EMAIL:'true',
  RADAR_ADMIN_TOKEN:'stage-ingest-token',
  SHIFT_SITE_PUBLISH_ENDPOINT:'https://staging.test/site-publish',
  SHIFT_SITE_PUBLISH_TOKEN:'site-stage-token',
  SHIFT_BRAIN_INGEST_ENDPOINT:'https://staging.test/brain-ingest',
  SHIFT_BRAIN_INGEST_TOKEN:'brain-stage-token',
  SHIFT_SEARCH_REFRESH_ENDPOINT:'https://staging.test/search-refresh',
  SHIFT_SEARCH_REFRESH_TOKEN:'search-stage-token',
  AI:{async run(_model,{messages}){aiCalls++;const system=messages?.[0]?.content||'';return{response:JSON.stringify(system.includes('medicine registry editor')?medicinePatch:contentPackage)}}}
};

const nativeFetch=globalThis.fetch;
globalThis.fetch=async (url,opts={})=>{
  const u=String(url),payload=JSON.parse(String(opts.body||'{}')); calls.push({url:u,payload,headers:opts.headers||{}});
  if(u===env.SHIFT_SITE_PUBLISH_ENDPOINT){sitePublishes.push(payload);DB.exec('CREATE TABLE IF NOT EXISTS staging_site_publications(event_id INTEGER,payload_json TEXT)');DB.sqlite.prepare('INSERT INTO staging_site_publications(event_id,payload_json) VALUES(?,?)').run(payload.event_id,JSON.stringify(payload));return new Response(JSON.stringify({ok:true,staging:true,articleUrl:`https://staging.test/${payload.seo?.slug||'radar'}`} ),{status:200,headers:{'content-type':'application/json'}})}
  if(u===env.SHIFT_BRAIN_INGEST_ENDPOINT){brainIngests.push(payload);const checksum=await sha256(JSON.stringify(payload));DB.sqlite.prepare(`INSERT INTO ai_knowledge_documents(title,source_uri,category,trust_tier,status,checksum) VALUES(?,?,?,?,?,?)`).run('Radar staging ingest',`radar://event/${payload.event_id}`,'health',1,'approved',checksum);const doc=DB.sqlite.prepare('SELECT id FROM ai_knowledge_documents WHERE checksum=?').get(checksum);DB.sqlite.prepare(`INSERT INTO ai_knowledge_chunks(document_id,chunk_index,content,search_text) VALUES(?,?,?,?)`).run(doc.id,0,payload.summary||'',String(payload.summary||'').toLowerCase());return new Response(JSON.stringify({ok:true,staging:true,documentId:doc.id}),{status:200,headers:{'content-type':'application/json'}})}
  if(u===env.SHIFT_SEARCH_REFRESH_ENDPOINT){searchRefreshes.push(payload);DB.exec('CREATE TABLE IF NOT EXISTS staging_search_refreshes(event_id INTEGER,payload_json TEXT)');DB.sqlite.prepare('INSERT INTO staging_search_refreshes(event_id,payload_json) VALUES(?,?)').run(payload.event_id,JSON.stringify(payload));return new Response(JSON.stringify({ok:true,staging:true,refreshed:true}),{status:200,headers:{'content-type':'application/json'}})}
  throw new Error(`Unexpected external fetch in staging test: ${u}`);
};

try {
  // Build the real live additive Core/HQ schema over the known production baseline.
  const health=await worker.fetch(request('/health'),env,{}); assert.equal(health.status,200);
  const hqToken='radar-stage-hq-session',hqHash=await sha256(hqToken),future=new Date(Date.now()+3600_000).toISOString();
  await DB.prepare(`INSERT INTO hq_users(email,name,password_hash,role,status) VALUES(?,?,?,?,?)`).bind('radar-stage@shift.test','Radar Stage Reviewer','unused-test-hash','owner','active').run();
  const hqUser=await DB.prepare('SELECT id FROM hq_users WHERE email=?').bind('radar-stage@shift.test').first();
  await DB.prepare(`INSERT INTO hq_sessions(hq_user_id,token_hash,expires_at,last_used_at) VALUES(?,?,?,?)`).bind(hqUser.id,hqHash,future,new Date().toISOString()).run();
  const hqHeaders={'content-type':'application/json','cookie':`sst_hq_session=${hqToken}`};

  // 1) DETECT + VERIFY.
  const evidence={source_tier:1,title:'Stage Regulator Notice',url:'https://regulator.test/stage-medicine',source_date:'2026-08-11',region:'US'};
  let r=await radarRoutes(request('/v1/radar/ingest',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer stage-ingest-token'},body:JSON.stringify({development:{title:'Stage Medicine test regulatory update',url:evidence.url,source_date:evidence.source_date,event_type:'regulatory_update',region:'US',regulator:'Stage Regulator',relevance_score:88,urgency_score:82},evidence:[evidence]})}),env,{});
  assert.equal(r.status,201);let d=await body(r);assert.equal(d.verification.verified,true);const eventId=d.event.id;

  // 2) PACKAGE via the authenticated HQ review route.
  r=await radarRoutes(request(`/v1/hq/radar/events/${eventId}/process`,{method:'POST',headers:hqHeaders,body:'{}'}),env,{});assert.equal(r.status,200);d=await body(r);assert.equal(d.status,'ready_for_review');assert.equal(aiCalls,2);assert.equal(d.medicinePatch.medicine_id,'stage-medicine');

  // 3) HUMAN APPROVAL creates registry, graph, freshness and publication job.
  r=await radarRoutes(request(`/v1/hq/radar/events/${eventId}/approve`,{method:'POST',headers:hqHeaders,body:JSON.stringify({note:'Staging E2E approval'})}),env,{});assert.equal(r.status,200);d=await body(r);assert.equal(d.status,'approved');assert.ok(d.publicationJob?.id);
  assert.equal((await DB.prepare('SELECT status FROM radar_events WHERE id=?').bind(eventId).first()).status,'approved');
  assert.equal((await DB.prepare('SELECT id FROM radar_medicines WHERE id=?').bind('stage-medicine').first()).id,'stage-medicine');
  assert.ok(Number((await DB.prepare('SELECT COUNT(*) c FROM radar_freshness_claims WHERE event_id=? AND status=?').bind(eventId,'active').first()).c)>=1);
  assert.ok(await DB.prepare('SELECT id FROM shift_knowledge_nodes WHERE id=?').bind(`radar:${eventId}`).first());
  assert.ok(await DB.prepare('SELECT id FROM shift_knowledge_nodes WHERE id=?').bind('medicine:stage-medicine').first());

  // 4) PUBLICATION to safe staging adapters only.
  r=await radarRoutes(request(`/v1/hq/radar/events/${eventId}/publish`,{method:'POST',headers:hqHeaders,body:'{}'}),env,{});assert.equal(r.status,200);d=await body(r);assert.equal(d.status,'published');
  assert.equal(sitePublishes.length,1);assert.equal(brainIngests.length,1);assert.equal(searchRefreshes.length,1);
  assert.equal(sitePublishes[0].medicine_registry_patch.medicine_id,'stage-medicine');assert.ok(sitePublishes[0].existing_page_updates.length>0);assert.ok(sitePublishes[0].comparisons.length>0);
  assert.ok(searchRefreshes[0].actions.includes('refresh_sitemap'));assert.ok(searchRefreshes[0].actions.includes('refresh_internal_search'));assert.ok(searchRefreshes[0].actions.includes('submit_changed_urls'));
  assert.ok(await DB.prepare('SELECT id FROM ai_knowledge_documents WHERE source_uri=?').bind(`radar://event/${eventId}`).first());
  assert.equal((await DB.prepare('SELECT status FROM radar_publication_jobs WHERE event_id=? ORDER BY id DESC LIMIT 1').bind(eventId).first()).status,'complete');
  assert.equal((await DB.prepare('SELECT status FROM radar_events WHERE id=?').bind(eventId).first()).status,'published');

  // 5) Public/mobile products reflect the approved/published living data.
  r=await radarPublicRoutes(request('/v1/radar/cards'),env);d=await body(r);assert.ok(d.cards.some(x=>x.id==='stage-medicine'));
  r=await radarPublicRoutes(request('/v1/radar/medicines/stage-medicine'),env);d=await body(r);assert.equal(d.dossier.id,'stage-medicine');assert.ok(d.updates.some(x=>x.id===eventId));
  r=await radarPublicRoutes(request('/v1/radar/ticker'),env);d=await body(r);assert.ok(d.items.some(x=>x.id===eventId));

  // 6) Audit the staging-only adapter commissioning boundary.
  assert.deepEqual(calls.map(x=>x.url),['https://staging.test/site-publish','https://staging.test/brain-ingest','https://staging.test/search-refresh']);
  console.log(JSON.stringify({ok:true,eventId,aiCalls,adapters:calls.map(x=>x.url),medicine:'stage-medicine',publicProducts:['cards','dossier','ticker'],relatedContent:'site-payload-verified',freshness:'registered',knowledgeGraph:'updated',shiftBrain:'staging-ingested',searchSitemap:'staging-refreshed'},null,2));
} finally {
  globalThis.fetch=nativeFetch;
}
