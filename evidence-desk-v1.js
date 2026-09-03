import hq from './hq-ai-v2.js';
import {fetchMhraGlp1Guidance,MHRA_GLP1_R11} from './evidence-adapter-mhra-glp1-v1.js';

const JSON_HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const HQ_ORIGINS=new Set(['https://hq.shiftsometimber.co.uk']);
const WRITE_ROLES=new Set(['owner','admin','marketing','content']);
const CONTROL_ROLES=new Set(['owner','admin']);
const CLINICAL_ROLES=new Set(['clinical']);
const SOURCE_FAMILIES=new Set(['mhra','nice','nhs','emc','manufacturer','clinical_trials','uk_provider']);
const EXTRACTION_METHODS=new Set(['official_feed','structured_json','manual_structured','licensed_feed']);
const RISK_LANES=new Set(['green','amber','red']);
const COMMUNICATION_CLASSES=new Set(['general_information','service_information','medicine_information','clinical_safety']);
const DECISIONS=new Set(['approve_web_only','amend','return','reject','hold','no_publication_justified','send_for_qualified_review','qualified_review_approved','communications_approved']);
const ALLOWED_SOURCE_HOSTS={
  mhra:['gov.uk','mhra.gov.uk'],nice:['nice.org.uk'],nhs:['nhs.uk'],emc:['medicines.org.uk'],
  clinical_trials:['clinicaltrials.gov'],manufacturer:[],uk_provider:[]
};

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const now=()=>new Date().toISOString();
const safe=(value,fallback={})=>{try{return typeof value==='string'?JSON.parse(value):value??fallback}catch{return fallback}};
const clean=(value,max=5000)=>String(value??'').trim().slice(0,max);
const bool=value=>value===true||value===1||value==='1'||value==='true';

function corsHeaders(request,env){
  const origin=request.headers.get('Origin')||'';
  const allowed=new Set([...HQ_ORIGINS,...String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean)]);
  const headers={...JSON_HEADERS,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, PATCH, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};
  if(allowed.has(origin))headers['Access-Control-Allow-Origin']=origin;
  return headers;
}
function cors(response,request,env){const headers=new Headers(response.headers);for(const [key,value]of Object.entries(corsHeaders(request,env)))headers.set(key,value);return new Response(response.body,{status:response.status,statusText:response.statusText,headers})}

function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));
  return value;
}
async function sha256(value){const bytes=new TextEncoder().encode(String(value));const digest=await crypto.subtle.digest('SHA-256',bytes);return[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function secureEqual(left,right){const [a,b]=await Promise.all([left,right].map(value=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value||'')))));const aa=new Uint8Array(a),bb=new Uint8Array(b);let diff=0;for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];return diff===0}
function slug(value){return clean(value,120).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function riskRank(lane){return lane==='red'?3:lane==='amber'?2:1}
function maxRisk(rows){return rows.reduce((lane,row)=>riskRank(row.risk_lane)>riskRank(lane)?row.risk_lane:lane,'green')}
function sourceHostAllowed(family,url,extraHosts=[]){
  let host;try{const parsed=new URL(url);if(parsed.protocol!=='https:')return false;host=parsed.hostname.toLowerCase()}catch{return false}
  const allowed=[...(ALLOWED_SOURCE_HOSTS[family]||[]),...extraHosts.map(x=>String(x).toLowerCase())];
  return allowed.some(item=>host===item||host.endsWith(`.${item}`));
}
async function readJson(request){try{return await request.json()}catch{return{}}}

export async function ensureEvidenceDeskSchema(DB){
  const schema=`
    CREATE TABLE IF NOT EXISTS evidence_desk_control (
      id INTEGER PRIMARY KEY CHECK(id=1),enabled INTEGER NOT NULL DEFAULT 0,ingestion_enabled INTEGER NOT NULL DEFAULT 0,
      decision_email_enabled INTEGER NOT NULL DEFAULT 0,website_publish_enabled INTEGER NOT NULL DEFAULT 0,
      newsletter_enabled INTEGER NOT NULL DEFAULT 0,social_enabled INTEGER NOT NULL DEFAULT 0,
      stopped_at TEXT,stop_reason TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT OR IGNORE INTO evidence_desk_control(id,enabled,ingestion_enabled,decision_email_enabled,website_publish_enabled,newsletter_enabled,social_enabled) VALUES(1,0,0,0,0,0,0);
    CREATE TABLE IF NOT EXISTS evidence_desk_sources (
      id TEXT PRIMARY KEY,family TEXT NOT NULL,name TEXT NOT NULL,canonical_url TEXT NOT NULL,authority_name TEXT NOT NULL,
      extraction_method TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft',trust_tier INTEGER NOT NULL DEFAULT 1,
      cadence_minutes INTEGER NOT NULL DEFAULT 1440,allowed_hosts_json TEXT NOT NULL DEFAULT '[]',config_json TEXT NOT NULL DEFAULT '{}',
      last_checked_at TEXT,last_material_change_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,source_id TEXT NOT NULL,fetched_at TEXT NOT NULL,http_status INTEGER,
      content_hash TEXT NOT NULL,structured_hash TEXT NOT NULL,facts_json TEXT NOT NULL,source_published_at TEXT,
      raw_locator TEXT,material_state TEXT NOT NULL,change_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,source_id TEXT NOT NULL,fact_key TEXT NOT NULL,value_json TEXT NOT NULL,value_hash TEXT NOT NULL,
      snapshot_id INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'current',source_published_at TEXT,first_seen_at TEXT NOT NULL,last_seen_at TEXT NOT NULL,
      UNIQUE(source_id,fact_key)
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_claims (
      id TEXT PRIMARY KEY,claim_text TEXT NOT NULL,claim_type TEXT NOT NULL DEFAULT 'factual',risk_lane TEXT NOT NULL,
      communication_class TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',owner TEXT,freshness_days INTEGER NOT NULL DEFAULT 90,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_claim_dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,claim_id TEXT NOT NULL,source_id TEXT NOT NULL,fact_key TEXT NOT NULL,
      relation TEXT NOT NULL DEFAULT 'supports',required INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(claim_id,source_id,fact_key)
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_page_dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,claim_id TEXT NOT NULL,page_path TEXT NOT NULL,content_key TEXT NOT NULL,
      placement_type TEXT NOT NULL DEFAULT 'body',channel TEXT NOT NULL DEFAULT 'web',status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(claim_id,page_path,content_key,channel)
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,source_id TEXT NOT NULL,snapshot_id INTEGER NOT NULL,status TEXT NOT NULL,
      materiality TEXT NOT NULL,risk_lane TEXT NOT NULL,headline TEXT NOT NULL,change_json TEXT NOT NULL,
      impacted_claims_json TEXT NOT NULL DEFAULT '[]',assigned_to TEXT,due_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,event_id INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'draft',title TEXT NOT NULL,
      summary TEXT NOT NULL,proposed_changes_json TEXT NOT NULL DEFAULT '[]',evidence_json TEXT NOT NULL DEFAULT '[]',
      risk_lane TEXT NOT NULL,communication_class TEXT NOT NULL,web_eligible INTEGER NOT NULL DEFAULT 0,
      newsletter_eligible INTEGER NOT NULL DEFAULT 0,social_eligible INTEGER NOT NULL DEFAULT 0,
      qualified_review_required INTEGER NOT NULL DEFAULT 0,qualified_reviewer TEXT,qualified_review_ref TEXT,qualified_reviewed_at TEXT,
      communications_review_required INTEGER NOT NULL DEFAULT 0,communications_reviewer TEXT,communications_review_ref TEXT,communications_reviewed_at TEXT,
      editorial_reviewer TEXT,editorial_reviewed_at TEXT,decision_note TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(event_id)
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,package_id INTEGER,event_id INTEGER,decision TEXT NOT NULL,actor_id INTEGER,
      actor_name TEXT NOT NULL,actor_email TEXT,actor_role TEXT NOT NULL,note TEXT,authority_ref TEXT,
      detail_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,package_id INTEGER,event_id INTEGER,notification_type TEXT NOT NULL,
      recipient TEXT,status TEXT NOT NULL DEFAULT 'queued',dedupe_key TEXT NOT NULL UNIQUE,provider_id TEXT,error_code TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,sent_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_evidence_sources_status ON evidence_desk_sources(status,family);
    CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_source ON evidence_desk_snapshots(source_id,id DESC);
    CREATE INDEX IF NOT EXISTS idx_evidence_facts_source ON evidence_desk_facts(source_id,fact_key);
    CREATE INDEX IF NOT EXISTS idx_evidence_claim_source ON evidence_desk_claim_dependencies(source_id,fact_key,claim_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_page_claim ON evidence_desk_page_dependencies(claim_id,status);
    CREATE INDEX IF NOT EXISTS idx_evidence_events_queue ON evidence_desk_events(status,risk_lane,id DESC);
    CREATE INDEX IF NOT EXISTS idx_evidence_packages_queue ON evidence_desk_packages(status,risk_lane,id DESC);
    CREATE INDEX IF NOT EXISTS idx_evidence_notifications_queue ON evidence_desk_notifications(status,id);
  `;
  const statements=schema.split(';').map(statement=>statement.trim()).filter(Boolean);
  if(typeof DB.batch==='function')await DB.batch(statements.map(statement=>DB.prepare(statement)));
  else for(const statement of statements)await DB.prepare(statement).run();
}

const DEFAULT_SOURCES=[
  {id:'mhra-safety-communications',family:'mhra',name:'MHRA safety communications',authorityName:'Medicines and Healthcare products Regulatory Agency',url:'https://www.gov.uk/drug-device-alerts',method:'official_feed'},
  {id:'nice-guidance',family:'nice',name:'NICE guidance and consultations',authorityName:'National Institute for Health and Care Excellence',url:'https://www.nice.org.uk/guidance',method:'official_feed'},
  {id:'nhs-medicines-guidance',family:'nhs',name:'NHS medicines and availability guidance',authorityName:'NHS',url:'https://www.nhs.uk/medicines/',method:'manual_structured'}
];

export async function seedEvidenceDeskSources(DB){
  await ensureEvidenceDeskSchema(DB);
  let seeded=0;
  for(const source of DEFAULT_SOURCES){
    const result=await DB.prepare(`INSERT OR IGNORE INTO evidence_desk_sources(id,family,name,canonical_url,authority_name,extraction_method,status,trust_tier,cadence_minutes,allowed_hosts_json,config_json) VALUES(?,?,?,?,?,?,'draft',1,1440,'[]','{}')`).bind(source.id,source.family,source.name,source.url,source.authorityName,source.method).run();
    seeded+=Number(result?.meta?.changes??result?.changes??0);
  }
  return{ok:true,seeded};
}

export async function upsertEvidenceSource(DB,input={},options={}){
  if(options.ensureSchema!==false)await ensureEvidenceDeskSchema(DB);
  const family=clean(input.family,40).toLowerCase(),method=clean(input.extractionMethod||input.extraction_method,40).toLowerCase();
  const allowedHosts=Array.isArray(input.allowedHosts)?input.allowedHosts.map(x=>clean(x,200).toLowerCase()).filter(Boolean):[];
  if(!SOURCE_FAMILIES.has(family))return{ok:false,status:400,error:'invalid_source_family'};
  if(!EXTRACTION_METHODS.has(method))return{ok:false,status:400,error:'invalid_extraction_method'};
  const url=clean(input.canonicalUrl||input.canonical_url,2000);
  if(!sourceHostAllowed(family,url,allowedHosts))return{ok:false,status:400,error:'source_not_allowlisted'};
  if(method==='licensed_feed'&&!clean(input.licenceRef||input.licenseRef,500))return{ok:false,status:409,error:'licence_reference_required'};
  const id=slug(input.id||input.name);if(!id||!clean(input.name,200)||!clean(input.authorityName||input.authority_name,200))return{ok:false,status:400,error:'source_identity_required'};
  const status=clean(input.status||'draft',30).toLowerCase();if(!['draft','active','paused'].includes(status))return{ok:false,status:400,error:'invalid_source_status'};
  await DB.prepare(`INSERT INTO evidence_desk_sources(id,family,name,canonical_url,authority_name,extraction_method,status,trust_tier,cadence_minutes,allowed_hosts_json,config_json,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET family=excluded.family,name=excluded.name,canonical_url=excluded.canonical_url,authority_name=excluded.authority_name,extraction_method=excluded.extraction_method,status=excluded.status,trust_tier=excluded.trust_tier,cadence_minutes=excluded.cadence_minutes,allowed_hosts_json=excluded.allowed_hosts_json,config_json=excluded.config_json,updated_at=excluded.updated_at`).bind(id,family,clean(input.name,200),url,clean(input.authorityName||input.authority_name,200),method,status,Math.max(1,Math.min(5,Number(input.trustTier||1))),Math.max(15,Math.min(10080,Number(input.cadenceMinutes||1440))),JSON.stringify(allowedHosts),JSON.stringify(input.config||{}).slice(0,20000),now()).run();
  return{ok:true,status:200,id};
}

export async function upsertEvidenceClaim(DB,input={},options={}){
  if(options.ensureSchema!==false)await ensureEvidenceDeskSchema(DB);
  const id=slug(input.id),riskLane=clean(input.riskLane||input.risk_lane,20).toLowerCase(),communicationClass=clean(input.communicationClass||input.communication_class,50).toLowerCase();
  if(!id||!clean(input.claimText||input.claim_text,5000))return{ok:false,status:400,error:'claim_identity_required'};
  if(!RISK_LANES.has(riskLane))return{ok:false,status:400,error:'invalid_risk_lane'};
  if(!COMMUNICATION_CLASSES.has(communicationClass))return{ok:false,status:400,error:'invalid_communication_class'};
  const dependencies=Array.isArray(input.dependencies)?input.dependencies:[],pages=Array.isArray(input.pages)?input.pages:[];
  if(!dependencies.length||!pages.length)return{ok:false,status:400,error:'claim_dependencies_and_pages_required'};
  for(const dep of dependencies){const source=await DB.prepare(`SELECT id FROM evidence_desk_sources WHERE id=?`).bind(clean(dep.sourceId||dep.source_id,120)).first();if(!source)return{ok:false,status:409,error:'unknown_claim_source',sourceId:dep.sourceId||dep.source_id};if(!clean(dep.factKey||dep.fact_key,160))return{ok:false,status:400,error:'fact_key_required'}}
  await DB.prepare(`INSERT INTO evidence_desk_claims(id,claim_text,claim_type,risk_lane,communication_class,status,owner,freshness_days,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET claim_text=excluded.claim_text,claim_type=excluded.claim_type,risk_lane=excluded.risk_lane,communication_class=excluded.communication_class,status=excluded.status,owner=excluded.owner,freshness_days=excluded.freshness_days,updated_at=excluded.updated_at`).bind(id,clean(input.claimText||input.claim_text,5000),clean(input.claimType||'factual',50),riskLane,communicationClass,clean(input.status||'active',30),clean(input.owner,200)||null,Math.max(1,Math.min(3650,Number(input.freshnessDays||90))),now()).run();
  await DB.prepare(`DELETE FROM evidence_desk_claim_dependencies WHERE claim_id=?`).bind(id).run();
  await DB.prepare(`DELETE FROM evidence_desk_page_dependencies WHERE claim_id=?`).bind(id).run();
  for(const dep of dependencies)await DB.prepare(`INSERT INTO evidence_desk_claim_dependencies(claim_id,source_id,fact_key,relation,required) VALUES(?,?,?,?,?)`).bind(id,clean(dep.sourceId||dep.source_id,120),clean(dep.factKey||dep.fact_key,160),clean(dep.relation||'supports',40),dep.required===false?0:1).run();
  for(const page of pages){const pagePath=clean(page.pagePath||page.page_path,500),contentKey=clean(page.contentKey||page.content_key,200);if(!pagePath.startsWith('/')||!contentKey)return{ok:false,status:400,error:'invalid_page_dependency'};await DB.prepare(`INSERT INTO evidence_desk_page_dependencies(claim_id,page_path,content_key,placement_type,channel,status) VALUES(?,?,?,?,?,'active')`).bind(id,pagePath,contentKey,clean(page.placementType||'body',50),clean(page.channel||'web',30)).run()}
  return{ok:true,status:200,id,dependencyCount:dependencies.length,pageCount:pages.length};
}

function deltaFacts(previous,current){
  const before=previous||{},after=current||{},keys=[...new Set([...Object.keys(before),...Object.keys(after)])].sort(),changes=[];
  for(const key of keys){const oldValue=before[key],newValue=after[key];if(JSON.stringify(stable(oldValue))!==JSON.stringify(stable(newValue)))changes.push({factKey:key,before:oldValue===undefined?null:oldValue,after:newValue===undefined?null:newValue,changeType:oldValue===undefined?'added':newValue===undefined?'removed':'changed'})}
  return changes;
}

export async function recordEvidenceObservation(DB,sourceId,input={},options={}){
  if(options.ensureSchema!==false)await ensureEvidenceDeskSchema(DB);
  const source=await DB.prepare(`SELECT * FROM evidence_desk_sources WHERE id=?`).bind(clean(sourceId,120)).first();
  if(!source)return{ok:false,status:404,error:'source_not_found'};
  if(source.status!=='active'&&!bool(input.allowDraft))return{ok:false,status:409,error:'source_not_active'};
  const facts=input.facts;if(!facts||Array.isArray(facts)||typeof facts!=='object')return{ok:false,status:400,error:'structured_facts_required'};
  const factKeys=Object.keys(facts);if(!factKeys.length||factKeys.length>200)return{ok:false,status:400,error:'structured_fact_count_invalid'};
  const encoded=JSON.stringify(stable(facts));if(encoded.length>100000)return{ok:false,status:413,error:'structured_facts_too_large'};
  const structuredHash=await sha256(encoded),contentHash=clean(input.contentHash||input.content_hash,128)||await sha256(clean(input.rawFingerprint||input.raw_fingerprint,100000)||encoded);
  const previous=await DB.prepare(`SELECT * FROM evidence_desk_snapshots WHERE source_id=? ORDER BY id DESC LIMIT 1`).bind(source.id).first();
  const previousFacts=safe(previous?.facts_json,{}),changes=previous?deltaFacts(previousFacts,facts):[];
  const materialState=!previous?'baseline_recorded':previous.structured_hash===structuredHash?'no_material_change':'material_change';
  const at=clean(input.fetchedAt||input.fetched_at,50)||now(),publishedAt=clean(input.sourcePublishedAt||input.source_published_at,50)||null;
  const inserted=await DB.prepare(`INSERT INTO evidence_desk_snapshots(source_id,fetched_at,http_status,content_hash,structured_hash,facts_json,source_published_at,raw_locator,material_state,change_json) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(source.id,at,Number(input.httpStatus||200),contentHash,structuredHash,encoded,publishedAt,clean(input.rawLocator||input.raw_locator,2000)||source.canonical_url,materialState,JSON.stringify({changes})).run();
  const snapshotId=Number(inserted?.meta?.last_row_id??inserted?.lastInsertRowid??inserted?.last_row_id??0);
  for(const key of factKeys){const valueJson=JSON.stringify(stable(facts[key])),valueHash=await sha256(valueJson);await DB.prepare(`INSERT INTO evidence_desk_facts(source_id,fact_key,value_json,value_hash,snapshot_id,status,source_published_at,first_seen_at,last_seen_at) VALUES(?,?,?,?,?,'current',?,?,?) ON CONFLICT(source_id,fact_key) DO UPDATE SET value_json=excluded.value_json,value_hash=excluded.value_hash,snapshot_id=excluded.snapshot_id,status='current',source_published_at=excluded.source_published_at,last_seen_at=excluded.last_seen_at`).bind(source.id,key,valueJson,valueHash,snapshotId,publishedAt,at,at).run()}
  for(const removed of changes.filter(change=>change.changeType==='removed'))await DB.prepare(`UPDATE evidence_desk_facts SET status='withdrawn',snapshot_id=?,last_seen_at=? WHERE source_id=? AND fact_key=?`).bind(snapshotId,at,source.id,removed.factKey).run();
  await DB.prepare(`UPDATE evidence_desk_sources SET last_checked_at=?,last_material_change_at=CASE WHEN ?='material_change' THEN ? ELSE last_material_change_at END,updated_at=? WHERE id=?`).bind(at,materialState,at,at,source.id).run();
  if(materialState!=='material_change')return{ok:true,status:200,sourceId:source.id,snapshotId,materialState,event:null};
  const changedKeys=changes.map(change=>change.factKey);const placeholders=changedKeys.map(()=>'?').join(',');
  let claims=[];
  if(changedKeys.length){({results:claims=[]}=await DB.prepare(`SELECT DISTINCT c.* FROM evidence_desk_claim_dependencies d JOIN evidence_desk_claims c ON c.id=d.claim_id WHERE d.source_id=? AND d.fact_key IN (${placeholders}) AND c.status='active'`).bind(source.id,...changedKeys).all())}
  const impacted=[];
  for(const claim of claims){const {results:pages=[]}=await DB.prepare(`SELECT page_path,content_key,placement_type,channel FROM evidence_desk_page_dependencies WHERE claim_id=? AND status='active' ORDER BY channel,page_path`).bind(claim.id).all();impacted.push({id:claim.id,claimText:claim.claim_text,riskLane:claim.risk_lane,communicationClass:claim.communication_class,pages})}
  const riskLane=maxRisk(claims),materiality=impacted.length?'mapped_material_change':'unmapped_material_change',eventStatus=impacted.length?'draft_required':'mapping_required';
  const dueAt=new Date(Date.parse(at)+(riskLane==='red'?0:riskLane==='amber'?24:48)*3600000).toISOString();
  const eventResult=await DB.prepare(`INSERT INTO evidence_desk_events(source_id,snapshot_id,status,materiality,risk_lane,headline,change_json,impacted_claims_json,due_at) VALUES(?,?,?,?,?,?,?,?,?)`).bind(source.id,snapshotId,eventStatus,materiality,riskLane,`${source.name}: ${changes.length} structured fact${changes.length===1?'':'s'} changed`,JSON.stringify({changes}),JSON.stringify(impacted),dueAt).run();
  const eventId=Number(eventResult?.meta?.last_row_id??eventResult?.lastInsertRowid??eventResult?.last_row_id??0);
  return{ok:true,status:201,sourceId:source.id,snapshotId,materialState,event:{id:eventId,status:eventStatus,materiality,riskLane,impactedClaims:impacted,changes}};
}

export async function createEvidencePackage(DB,eventId,input={},actor={},options={}){
  if(options.ensureSchema!==false)await ensureEvidenceDeskSchema(DB);
  const event=await DB.prepare(`SELECT * FROM evidence_desk_events WHERE id=?`).bind(Number(eventId)).first();if(!event)return{ok:false,status:404,error:'evidence_event_not_found'};
  if(event.materiality!=='mapped_material_change')return{ok:false,status:409,error:'claim_mapping_required'};
  const existing=await DB.prepare(`SELECT id,status FROM evidence_desk_packages WHERE event_id=?`).bind(Number(eventId)).first();
  if(existing&&!['draft','awaiting_decision','changes_required','held'].includes(existing.status))return{ok:false,status:409,error:'evidence_package_finalised',packageId:Number(existing.id),state:existing.status};
  const impacted=safe(event.impacted_claims_json,[]),classes=[...new Set(impacted.map(x=>x.communicationClass))];
  const communicationClass=classes.includes('clinical_safety')?'clinical_safety':classes.includes('medicine_information')?'medicine_information':classes.includes('service_information')?'service_information':'general_information';
  const proposed=Array.isArray(input.proposedChanges)?input.proposedChanges:[];
  if(!clean(input.title,300)||!clean(input.summary,5000)||!proposed.length)return{ok:false,status:400,error:'package_content_required'};
  const evidence=Array.isArray(input.evidence)?input.evidence:[];
  const qualifiedRequired=event.risk_lane==='red'?1:0,communicationsRequired=['medicine_information','clinical_safety'].includes(communicationClass)?1:0;
  const result=await DB.prepare(`INSERT INTO evidence_desk_packages(event_id,status,title,summary,proposed_changes_json,evidence_json,risk_lane,communication_class,web_eligible,newsletter_eligible,social_eligible,qualified_review_required,communications_review_required,updated_at) VALUES(?,'awaiting_decision',?,?,?,?,?,?,0,0,0,?,?,?) ON CONFLICT(event_id) DO UPDATE SET status='awaiting_decision',title=excluded.title,summary=excluded.summary,proposed_changes_json=excluded.proposed_changes_json,evidence_json=excluded.evidence_json,risk_lane=excluded.risk_lane,communication_class=excluded.communication_class,web_eligible=0,newsletter_eligible=0,social_eligible=0,qualified_review_required=excluded.qualified_review_required,qualified_reviewer=NULL,qualified_review_ref=NULL,qualified_reviewed_at=NULL,communications_review_required=excluded.communications_review_required,communications_reviewer=NULL,communications_review_ref=NULL,communications_reviewed_at=NULL,editorial_reviewer=NULL,editorial_reviewed_at=NULL,decision_note=NULL,updated_at=excluded.updated_at RETURNING id`).bind(Number(eventId),clean(input.title,300),clean(input.summary,5000),JSON.stringify(proposed).slice(0,100000),JSON.stringify(evidence).slice(0,100000),event.risk_lane,communicationClass,qualifiedRequired,communicationsRequired,now()).first();
  const packageId=Number(result?.id||0);await DB.prepare(`UPDATE evidence_desk_events SET status='awaiting_decision',assigned_to=?,updated_at=? WHERE id=?`).bind(clean(input.assignedTo||actor.name||actor.email,200)||null,now(),Number(eventId)).run();
  await auditDecision(DB,{packageId,eventId,decision:'package_created',actor,note:input.note,detail:{riskLane:event.risk_lane,communicationClass,qualifiedRequired:!!qualifiedRequired,communicationsRequired:!!communicationsRequired}});
  await queueDecisionNotification(DB,{packageId,eventId,riskLane:event.risk_lane,title:clean(input.title,300)});
  return{ok:true,status:201,packageId,eventId:Number(eventId),state:'awaiting_decision',riskLane:event.risk_lane,communicationClass,qualifiedReviewRequired:!!qualifiedRequired,communicationsReviewRequired:!!communicationsRequired,distribution:{web:'locked_pending_decision',newsletter:'locked',social:'locked'}};
}

async function auditDecision(DB,{packageId=null,eventId=null,decision,actor={},note=null,authorityRef=null,detail={}}){
  await DB.prepare(`INSERT INTO evidence_desk_decisions(package_id,event_id,decision,actor_id,actor_name,actor_email,actor_role,note,authority_ref,detail_json) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(packageId,eventId,decision,Number(actor.id)||null,clean(actor.name||'System',200),clean(actor.email,254)||null,clean(actor.role||'system',50),clean(note,5000)||null,clean(authorityRef,1000)||null,JSON.stringify(detail).slice(0,20000)).run();
}
async function queueDecisionNotification(DB,{packageId,eventId,riskLane,title}){const key=`package:${packageId}:decision`;await DB.prepare(`INSERT OR IGNORE INTO evidence_desk_notifications(package_id,event_id,notification_type,status,dedupe_key) VALUES(?,?,'decision_required','queued',?)`).bind(packageId,eventId,key).run();return{queued:true,riskLane,title}}

export async function decideEvidencePackage(DB,packageId,input={},actor={},options={}){
  if(options.ensureSchema!==false)await ensureEvidenceDeskSchema(DB);
  const row=await DB.prepare(`SELECT * FROM evidence_desk_packages WHERE id=?`).bind(Number(packageId)).first();if(!row)return{ok:false,status:404,error:'evidence_package_not_found'};
  const decision=clean(input.decision,60).toLowerCase();if(!DECISIONS.has(decision))return{ok:false,status:400,error:'invalid_evidence_decision'};
  if(['approved_web_pending_publish','closed_no_publication','rejected'].includes(row.status))return{ok:false,status:409,error:'evidence_package_finalised',state:row.status};
  if(decision==='approve_web_only'&&!WRITE_ROLES.has(clean(actor.role,50)))return{ok:false,status:403,error:'editorial_authority_required'};
  if(decision==='communications_approved'&&!CONTROL_ROLES.has(clean(actor.role,50)))return{ok:false,status:403,error:'medicines_communications_authority_required'};
  if(['qualified_review_approved'].includes(decision)&&!CLINICAL_ROLES.has(clean(actor.role,50)))return{ok:false,status:403,error:'qualified_reviewer_role_required'};
  const authorityRef=clean(input.authorityRef||input.authority_ref,1000);
  if(['qualified_review_approved','communications_approved'].includes(decision)&&!authorityRef)return{ok:false,status:400,error:'authority_reference_required'};
  let nextStatus=row.status,updates={};
  if(decision==='qualified_review_approved'){nextStatus='awaiting_decision';updates={qualified_reviewer:clean(actor.name||actor.email,200),qualified_review_ref:authorityRef,qualified_reviewed_at:now()}}
  else if(decision==='communications_approved'){nextStatus='awaiting_decision';updates={communications_reviewer:clean(actor.name||actor.email,200),communications_review_ref:authorityRef,communications_reviewed_at:now()}}
  else if(decision==='send_for_qualified_review')nextStatus='qualified_review_required';
  else if(decision==='approve_web_only'){
    if(Number(row.qualified_review_required)===1&&!row.qualified_reviewed_at)return{ok:false,status:409,error:'qualified_review_required'};
    if(Number(row.communications_review_required)===1&&!row.communications_reviewed_at)return{ok:false,status:409,error:'medicines_communications_review_required'};
    nextStatus='approved_web_pending_publish';updates={web_eligible:1,newsletter_eligible:0,social_eligible:0,editorial_reviewer:clean(actor.name||actor.email,200),editorial_reviewed_at:now()};
  }else if(decision==='no_publication_justified')nextStatus='closed_no_publication';
  else if(decision==='reject')nextStatus='rejected';
  else if(decision==='hold')nextStatus='held';
  else if(decision==='return'||decision==='amend')nextStatus='changes_required';
  const columns=Object.keys(updates),set=['status=?','decision_note=?','updated_at=?',...columns.map(key=>`${key}=?`)];
  await DB.prepare(`UPDATE evidence_desk_packages SET ${set.join(',')} WHERE id=?`).bind(nextStatus,clean(input.note,5000)||null,now(),...columns.map(key=>updates[key]),Number(packageId)).run();
  const eventStatus=nextStatus==='closed_no_publication'?'closed_no_publication':nextStatus==='approved_web_pending_publish'?'approved_web_pending_publish':nextStatus;
  await DB.prepare(`UPDATE evidence_desk_events SET status=?,updated_at=? WHERE id=?`).bind(eventStatus,now(),row.event_id).run();
  await auditDecision(DB,{packageId:Number(packageId),eventId:row.event_id,decision,actor,note:input.note,authorityRef,detail:{from:row.status,to:nextStatus,webEligible:updates.web_eligible===1,newsletterEligible:false,socialEligible:false}});
  return{ok:true,status:200,packageId:Number(packageId),decision,state:nextStatus,publication:{web:updates.web_eligible===1?'approved_but_not_published':'locked',newsletter:'locked',social:'locked'}};
}

export async function deliverEvidenceDecisionEmails(env){
  await ensureEvidenceDeskSchema(env.DB);
  const control=await env.DB.prepare(`SELECT * FROM evidence_desk_control WHERE id=1`).first();
  if(!Number(control?.enabled)||!Number(control?.decision_email_enabled))return{ok:true,sent:0,reason:'evidence_desk_email_off'};
  const recipients=String(env.EVIDENCE_DESK_ALERT_TO||env.ADMIN_NOTIFICATION_EMAIL||'shiftsometimber@gmail.com').split(',').map(x=>x.trim()).filter(x=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));
  const {results:pending=[]}=await env.DB.prepare(`SELECT n.*,p.title,p.summary,p.risk_lane FROM evidence_desk_notifications n JOIN evidence_desk_packages p ON p.id=n.package_id WHERE n.status='queued' ORDER BY CASE p.risk_lane WHEN 'red' THEN 1 WHEN 'amber' THEN 2 ELSE 3 END,n.id LIMIT 25`).all();
  if(!pending.length)return{ok:true,sent:0,reason:'nothing_needs_decision'};
  if(!env.EMAIL||!recipients.length){for(const item of pending)await env.DB.prepare(`UPDATE evidence_desk_notifications SET error_code=? WHERE id=?`).bind(!env.EMAIL?'email_binding_missing':'recipient_missing',item.id).run();return{ok:false,sent:0,reason:!env.EMAIL?'email_binding_missing':'recipient_missing'};}
  let sent=0;
  for(const item of pending){
    try{
      const subject=`ST INTERNAL — SIGN OFF — Evidence Desk: ${String(item.risk_lane).toUpperCase()}`;
      const text=`${item.title}\n\n${item.summary}\n\nOpen Shift HQ to approve web only, hold, return, reject or record that no publication is justified. Social and newsletter distribution remain locked.`;
      const result=await env.EMAIL.send({from:{email:String(env.ADMIN_EMAIL_FROM||env.EVIDENCE_DESK_EMAIL_FROM||'hq@shiftsometimber.co.uk'),name:'Shift HQ'},to:recipients[0],subject,text,html:`<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;background:#050505;color:#E7E3DA;padding:32px"><p style="color:#707762;font-weight:800">SHIFT EVIDENCE DESK · ${clean(item.risk_lane,20).toUpperCase()}</p><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.summary)}</p><p><strong>Decision required in Shift HQ.</strong></p><p>Website, newsletter and social publishing remain locked until the recorded gates are complete.</p></div>`});
      await env.DB.prepare(`UPDATE evidence_desk_notifications SET status='sent',recipient=?,provider_id=?,sent_at=? WHERE id=?`).bind(recipients[0],clean(result?.id||result?.messageId,500)||null,now(),item.id).run();sent++;
    }catch(error){await env.DB.prepare(`UPDATE evidence_desk_notifications SET status='failed',error_code=? WHERE id=?`).bind(clean(error?.message||error,500),item.id).run()}
  }
  return{ok:true,sent};
}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}

export async function runEvidenceDeskScheduled(env){
  await ensureEvidenceDeskSchema(env.DB);
  const control=await env.DB.prepare(`SELECT * FROM evidence_desk_control WHERE id=1`).first();
  if(!Number(control?.enabled))return{ok:true,state:'sealed',sourcesChecked:0,emailsSent:0};
  let adapter={state:'ingestion_locked',sourcesChecked:0};
  if(Number(control?.ingestion_enabled))adapter=await runMhraGlp1R11(env);
  const email=await deliverEvidenceDecisionEmails(env);
  return{ok:adapter.ok!==false,state:adapter.ok===false?'failed_closed':'controlled',sourcesChecked:Number(adapter.sourcesChecked||0),adapter,emailsSent:Number(email.sent||0),publication:{website:false,newsletter:false,social:false}};
}

export async function commissionMhraGlp1R11(DB,actor={},options={}){
  if(options.ensureSchema!==false)await ensureEvidenceDeskSchema(DB);
  const source=await upsertEvidenceSource(DB,{id:MHRA_GLP1_R11.sourceId,family:'mhra',name:'MHRA GLP-1 medicines safety guidance',canonicalUrl:`https://www.gov.uk${MHRA_GLP1_R11.basePath}`,authorityName:'Medicines and Healthcare products Regulatory Agency',extractionMethod:'structured_json',status:'active',cadenceMinutes:1440,config:{adapter:'mhra_glp1_guidance_r11',apiUrl:MHRA_GLP1_R11.apiUrl,contentId:MHRA_GLP1_R11.contentId}},{ensureSchema:false});
  if(!source.ok)return source;
  const claim=await upsertEvidenceClaim(DB,{id:'mhra-glp1-latest-safety-guidance',claimText:'The latest MHRA safety update affecting GLP-1 medicines is accurately reflected on Shift.',riskLane:'red',communicationClass:'clinical_safety',owner:'Evidence Desk',freshnessDays:1,dependencies:[{sourceId:MHRA_GLP1_R11.sourceId,factKey:'latest_update'}],pages:[{pagePath:MHRA_GLP1_R11.pagePath,contentKey:MHRA_GLP1_R11.contentKey}]},{ensureSchema:false});
  if(!claim.ok)return claim;
  await DB.prepare(`UPDATE evidence_desk_control SET enabled=1,ingestion_enabled=1,decision_email_enabled=0,website_publish_enabled=0,newsletter_enabled=0,social_enabled=0,stopped_at=NULL,stop_reason=NULL,updated_at=? WHERE id=1`).bind(now()).run();
  await auditDecision(DB,{decision:'mhra_glp1_r11_commissioned',actor,note:'One non-production structured adapter commissioned; every publication destination remains locked.',detail:{sourceId:source.id,claimId:claim.id,pagePath:MHRA_GLP1_R11.pagePath}});
  return{ok:true,status:200,sourceId:source.id,claimId:claim.id,pagePath:MHRA_GLP1_R11.pagePath,publication:{website:false,newsletter:false,social:false}};
}

export async function runMhraGlp1R11(env,{fetchImpl=fetch,force=false,ensureSchema=true}={}){
  if(ensureSchema)await ensureEvidenceDeskSchema(env.DB);
  const source=await env.DB.prepare(`SELECT * FROM evidence_desk_sources WHERE id=? AND status='active'`).bind(MHRA_GLP1_R11.sourceId).first();
  if(!source)return{ok:true,state:'not_commissioned',sourcesChecked:0};
  if(!force&&source.last_checked_at&&Date.now()-Date.parse(source.last_checked_at)<Number(source.cadence_minutes||1440)*60000)return{ok:true,state:'not_due',sourcesChecked:0};
  try{
    const fetched=await fetchMhraGlp1Guidance({fetchImpl});
    const liveControl=await env.DB.prepare(`SELECT enabled,ingestion_enabled FROM evidence_desk_control WHERE id=1`).first();
    if(!Number(liveControl?.enabled)||!Number(liveControl?.ingestion_enabled))return{ok:true,state:'sealed_during_fetch',sourcesChecked:1,eventId:null,packageId:null};
    const observation=await recordEvidenceObservation(env.DB,source.id,{facts:fetched.facts,fetchedAt:fetched.fetchedAt,sourcePublishedAt:fetched.sourcePublishedAt,contentHash:fetched.contentHash,rawLocator:fetched.apiUrl},{ensureSchema:false});
    if(!observation.ok)throw new Error(`mhra_adapter_observation_${observation.error||'failed'}`);
    let packageResult=null;
    if(observation.event){
      const latest=fetched.facts.latest_update;
      packageResult=await createEvidencePackage(env.DB,observation.event.id,{title:'MHRA GLP-1 safety guidance changed',summary:`MHRA recorded a new GLP-1 guidance update: ${latest.note}`,proposedChanges:[{claimId:'mhra-glp1-latest-safety-guidance',pagePath:MHRA_GLP1_R11.pagePath,contentKey:MHRA_GLP1_R11.contentKey,instruction:'Review the exact MHRA change and draft the smallest evidenced correction. Do not publish.'}],evidence:[{sourceId:source.id,snapshotId:observation.snapshotId,sourcePublishedAt:fetched.sourcePublishedAt,apiUrl:fetched.apiUrl}]},{name:'Shift Evidence Desk',role:'system'},{ensureSchema:false});
      if(!packageResult.ok)throw new Error(`mhra_adapter_package_${packageResult.error||'failed'}`);
    }
    console.log(JSON.stringify({event:'evidence_adapter_run',adapter:'mhra_glp1_guidance_r11',state:observation.materialState,eventCreated:!!observation.event,packageCreated:!!packageResult?.ok}));
    return{ok:true,state:observation.materialState,sourcesChecked:1,eventId:observation.event?.id||null,packageId:packageResult?.packageId||null};
  }catch(error){
    const code=clean(error?.message||error,300);console.error(JSON.stringify({event:'evidence_adapter_failed',adapter:'mhra_glp1_guidance_r11',error:code}));
    await auditDecision(env.DB,{decision:'source_adapter_failed',actor:{name:'Shift Evidence Desk',role:'system'},note:code,detail:{sourceId:source.id}});
    return{ok:false,state:'failed_closed',sourcesChecked:1,error:code};
  }
}

async function evidenceInbox(DB){
  const control=await DB.prepare(`SELECT enabled,ingestion_enabled,decision_email_enabled,website_publish_enabled,newsletter_enabled,social_enabled,stopped_at,stop_reason,updated_at FROM evidence_desk_control WHERE id=1`).first();
  const source=await DB.prepare(`SELECT id,name,canonical_url,authority_name,status,last_checked_at,last_material_change_at FROM evidence_desk_sources WHERE id=?`).bind(MHRA_GLP1_R11.sourceId).first();
  const claim=await DB.prepare(`SELECT c.id,c.claim_text,c.risk_lane,c.communication_class,p.page_path,p.content_key FROM evidence_desk_claims c JOIN evidence_desk_page_dependencies p ON p.claim_id=c.id WHERE c.id='mhra-glp1-latest-safety-guidance'`).first();
  const {results:snapshots=[]}=await DB.prepare(`SELECT id,fetched_at,source_published_at,material_state,change_json FROM evidence_desk_snapshots WHERE source_id=? ORDER BY id`).bind(MHRA_GLP1_R11.sourceId).all();
  const {results:events=[]}=await DB.prepare(`SELECT id,status,materiality,risk_lane,headline,impacted_claims_json,created_at FROM evidence_desk_events WHERE source_id=? ORDER BY id`).bind(MHRA_GLP1_R11.sourceId).all();
  const {results:packages=[]}=await DB.prepare(`SELECT p.id,p.status,p.risk_lane,p.communication_class,p.web_eligible,p.newsletter_eligible,p.social_eligible,p.qualified_review_required,p.communications_review_required,p.created_at FROM evidence_desk_packages p JOIN evidence_desk_events e ON e.id=p.event_id WHERE e.source_id=? ORDER BY p.id`).bind(MHRA_GLP1_R11.sourceId).all();
  const {results:audit=[]}=await DB.prepare(`SELECT decision,actor_name,actor_role,note,detail_json,created_at FROM evidence_desk_decisions ORDER BY id`).all();
  const notification=await DB.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN status='queued' THEN 1 ELSE 0 END) queued FROM evidence_desk_notifications`).first();
  return{ok:true,mode:'read_only',source,claim,snapshots:snapshots.map(row=>({...row,change:safe(row.change_json,{})})),events:events.map(row=>({...row,impactedClaims:safe(row.impacted_claims_json,[])})),packages,notification,audit:audit.map(row=>({...row,detail:safe(row.detail_json,{})})),control,capabilities:{compose:false,approve:false,publish:false,newsletter:false,social:false,model:false}};
}

async function evidenceReviewChecklist(DB){
  const control=await DB.prepare(`SELECT enabled,ingestion_enabled,decision_email_enabled,website_publish_enabled,newsletter_enabled,social_enabled,stopped_at,stop_reason FROM evidence_desk_control WHERE id=1`).first();
  const row=await DB.prepare(`SELECT p.*,e.source_id,e.snapshot_id,e.status event_status,e.materiality,e.impacted_claims_json,s.authority_name,s.canonical_url,ss.source_published_at,ss.change_json FROM evidence_desk_packages p JOIN evidence_desk_events e ON e.id=p.event_id JOIN evidence_desk_sources s ON s.id=e.source_id JOIN evidence_desk_snapshots ss ON ss.id=e.snapshot_id WHERE e.source_id=? ORDER BY p.id DESC LIMIT 1`).bind(MHRA_GLP1_R11.sourceId).first();
  if(!row)return{ok:false,status:404,error:'r1_3_package_not_found'};
  const proposed=safe(row.proposed_changes_json,[]),evidence=safe(row.evidence_json,[]),impacted=safe(row.impacted_claims_json,[]),change=safe(row.change_json,{});
  const target=proposed.find(item=>item?.claimId==='mhra-glp1-latest-safety-guidance'&&item?.pagePath===MHRA_GLP1_R11.pagePath&&item?.contentKey===MHRA_GLP1_R11.contentKey);
  const mapped=impacted.some(item=>item?.id==='mhra-glp1-latest-safety-guidance'&&item?.pages?.some(page=>page?.page_path===MHRA_GLP1_R11.pagePath&&page?.content_key===MHRA_GLP1_R11.contentKey));
  const trace=evidence.some(item=>item?.sourceId===MHRA_GLP1_R11.sourceId&&Number(item?.snapshotId)===Number(row.snapshot_id)&&item?.sourcePublishedAt&&item?.apiUrl===MHRA_GLP1_R11.apiUrl);
  const destinationsLocked=Number(row.web_eligible)===0&&Number(row.newsletter_eligible)===0&&Number(row.social_eligible)===0&&Number(control?.website_publish_enabled)===0&&Number(control?.newsletter_enabled)===0&&Number(control?.social_enabled)===0;
  const checks=[
    {id:'authoritative_source',pass:row.authority_name==='Medicines and Healthcare products Regulatory Agency'&&row.canonical_url===`https://www.gov.uk${MHRA_GLP1_R11.basePath}`},
    {id:'structured_material_change',pass:row.materiality==='mapped_material_change'&&change?.changes?.some(item=>item?.factKey==='latest_update')},
    {id:'exact_claim_page_dependency',pass:mapped},
    {id:'red_clinical_safety_lane',pass:row.risk_lane==='red'&&row.communication_class==='clinical_safety'},
    {id:'evidence_trace_complete',pass:!!trace},
    {id:'qualified_and_communications_gates',pass:Number(row.qualified_review_required)===1&&Number(row.communications_review_required)===1},
    {id:'all_destinations_locked',pass:destinationsLocked},
    {id:'exact_proposed_page_copy',pass:!!target&&!!clean(target.proposedText||target.replacementText,10000)}
  ];
  const missing=checks.filter(item=>!item.pass).map(item=>item.id),recommendedDecision=missing.length?'amend':'send_for_qualified_review';
  return{ok:true,status:200,mode:'read_only_review',package:{id:Number(row.id),status:row.status,eventId:Number(row.event_id),eventStatus:row.event_status,riskLane:row.risk_lane,communicationClass:row.communication_class,pagePath:MHRA_GLP1_R11.pagePath,contentKey:MHRA_GLP1_R11.contentKey,sourcePublishedAt:row.source_published_at},checks,complete:missing.length===0,missing,recommendedDecision,controls:{enabled:Number(control?.enabled)===1,ingestionEnabled:Number(control?.ingestion_enabled)===1,website:false,newsletter:false,social:false,model:false},capabilities:{reviewOutcomes:['amend','no_publication_justified'],qualifiedApproval:false,communicationsApproval:false,publish:false,compose:false,social:false,model:false}};
}

async function stopEvidenceDesk(DB,reason,actor){
  const stoppedAt=now();await DB.prepare(`UPDATE evidence_desk_control SET enabled=0,ingestion_enabled=0,decision_email_enabled=0,website_publish_enabled=0,newsletter_enabled=0,social_enabled=0,stopped_at=?,stop_reason=?,updated_at=? WHERE id=1`).bind(stoppedAt,reason,stoppedAt).run();await auditDecision(DB,{decision:'global_kill_switch',actor,note:reason,detail:{allDestinationsLocked:true}});return{ok:true,state:'sealed',allDestinationsLocked:true,stoppedAt};
}

async function evidenceR12CommissionRoute(request,env,path,method){
  if(!path.startsWith('/v1/evidence-desk/r1-2')&&!path.startsWith('/v1/evidence-desk/r1-3'))return null;
  if(clean(env.EVIDENCE_DESK_ENV,50)!=='non-production')return json({ok:false,error:'non_production_commissioning_only'},409);
  const expected=clean(env.EVIDENCE_DESK_COMMISSION_TOKEN,500),provided=clean(request.headers.get('Authorization'),600).replace(/^Bearer\s+/i,'');
  if(!expected||!provided||!await secureEqual(provided,expected))return json({ok:false,error:'unauthorised'},401);
  const actor={name:'R1.2 commissioning operator',role:'owner'};
  if(path==='/v1/evidence-desk/r1-3/checklist'&&method==='GET')return json(await evidenceReviewChecklist(env.DB));
  if(path==='/v1/evidence-desk/r1-3/review'&&method==='POST'){
    const body=await readJson(request),checklist=await evidenceReviewChecklist(env.DB);if(!checklist.ok)return json(checklist,checklist.status||409);
    const decision=clean(body.decision,60).toLowerCase(),note=clean(body.note,5000),attestation=clean(body.attestation,100);
    if(!['amend','no_publication_justified'].includes(decision))return json({ok:false,error:'r1_3_decision_not_permitted'},403);
    if(attestation!=='human_editorial_review'||note.length<30)return json({ok:false,error:'recorded_human_review_required'},400);
    if(checklist.missing.length&&decision!=='amend')return json({ok:false,error:'r1_3_amend_required',missing:checklist.missing},409);
    const reviewer={name:clean(env.EVIDENCE_DESK_R13_REVIEWER_NAME,200)||"Matt O'Brien",role:'owner'};
    const existing=await env.DB.prepare(`SELECT id FROM evidence_desk_decisions WHERE package_id=? AND decision=? AND authority_ref='R1.3-EDITORIAL-REVIEW' LIMIT 1`).bind(checklist.package.id,decision).first();
    if(existing)return json({ok:true,status:200,packageId:checklist.package.id,decision,state:checklist.package.status,idempotent:true,publication:{web:'locked',newsletter:'locked',social:'locked'}});
    await auditDecision(env.DB,{packageId:checklist.package.id,eventId:checklist.package.eventId,decision:'r1_3_review_checklist',actor:reviewer,note:'R1.3 human editorial review recorded against the persisted package.',authorityRef:'R1.3-EDITORIAL-REVIEW',detail:{checks:checklist.checks,missing:checklist.missing,recommendedDecision:checklist.recommendedDecision}});
    return json(await decideEvidencePackage(env.DB,checklist.package.id,{decision,note,authorityRef:'R1.3-EDITORIAL-REVIEW'},reviewer,{ensureSchema:false}));
  }
  if(method==='GET'&&path==='/v1/evidence-desk/r1-2/inbox')return json(await evidenceInbox(env.DB));
  if(method!=='POST')return json({ok:false,error:'method_not_allowed'},405);
  if(path==='/v1/evidence-desk/r1-2/commission')return json(await commissionMhraGlp1R11(env.DB,actor,{ensureSchema:false}));
  if(path==='/v1/evidence-desk/r1-2/baseline'){
    const existing=await env.DB.prepare(`SELECT COUNT(*) total FROM evidence_desk_snapshots WHERE source_id=?`).bind(MHRA_GLP1_R11.sourceId).first();if(Number(existing?.total))return json({ok:false,error:'baseline_requires_empty_source'},409);
    const result=await recordEvidenceObservation(env.DB,MHRA_GLP1_R11.sourceId,{facts:{guidance_identity:{contentId:MHRA_GLP1_R11.contentId,basePath:MHRA_GLP1_R11.basePath},guidance_summary:'Guidance on the safe and effective use of GLP-1 medicines for weight loss and diabetes.',latest_update:{publicTimestamp:'2026-01-29T14:20:34Z',note:"Updated attachment with new documents 'MHRA urges public to avoid illegal online weight-loss medicines this New Year' AND 'DSU: GLP-1 receptor agonists and dual GLP-1/ GIP receptor agonists: strengthened warnings on acute pancreatitis, including necrotising and fatal cases'"}},sourcePublishedAt:'2026-01-29T14:20:34Z',contentHash:'documented-official-state-2026-01-29'},{ensureSchema:false});
    if(result.ok)await auditDecision(env.DB,{decision:'r1_2_persisted_baseline',actor,detail:{sourceId:MHRA_GLP1_R11.sourceId,snapshotId:result.snapshotId,materialState:result.materialState}});return json(result,result.status||200);
  }
  if(path==='/v1/evidence-desk/r1-2/fetch'){
    const control=await env.DB.prepare(`SELECT enabled,ingestion_enabled FROM evidence_desk_control WHERE id=1`).first();if(!Number(control?.enabled)||!Number(control?.ingestion_enabled))return json({ok:true,state:'sealed',sourcesChecked:0});
    return json(await runMhraGlp1R11(env,{force:true,ensureSchema:false}));
  }
  if(path==='/v1/evidence-desk/r1-2/stop'){const body=await readJson(request),reason=clean(body.reason,1000);if(!reason)return json({ok:false,error:'stop_reason_required'},400);return json(await stopEvidenceDesk(env.DB,reason,actor))}
  return json({ok:false,error:'not_found'},404);
}

async function authActor(request,env,ctx){const response=await hq.fetch(new Request(new URL('/v1/hq/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!response.ok)return{response};const body=await response.json();return{user:body.user||{}}}
async function overview(DB){
  const control=await DB.prepare(`SELECT * FROM evidence_desk_control WHERE id=1`).first();
  const [sources,claims,events,packages,notifications]=await Promise.all([
    DB.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) active FROM evidence_desk_sources`).first(),
    DB.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) active FROM evidence_desk_claims`).first(),
    DB.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN status IN ('draft_required','mapping_required','awaiting_decision','qualified_review_required','changes_required','held') THEN 1 ELSE 0 END) open FROM evidence_desk_events`).first(),
    DB.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN status='awaiting_decision' THEN 1 ELSE 0 END) awaiting_decision,SUM(CASE WHEN status='closed_no_publication' THEN 1 ELSE 0 END) no_publication FROM evidence_desk_packages`).first(),
    DB.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN status='queued' THEN 1 ELSE 0 END) queued FROM evidence_desk_notifications`).first()
  ]);
  return{ok:true,control,counts:{sources,claims,events,packages,notifications},locks:{websitePublish:!Number(control?.website_publish_enabled),newsletter:!Number(control?.newsletter_enabled),social:!Number(control?.social_enabled),model:true}};
}
async function listRows(DB,kind){
  if(kind==='sources'){const{results=[]}=await DB.prepare(`SELECT * FROM evidence_desk_sources ORDER BY family,name`).all();return{ok:true,sources:results.map(row=>({...row,allowedHosts:safe(row.allowed_hosts_json,[]),config:safe(row.config_json,{})}))}}
  if(kind==='claims'){const{results=[]}=await DB.prepare(`SELECT c.*,COUNT(DISTINCT d.id) dependency_count,COUNT(DISTINCT p.id) page_count FROM evidence_desk_claims c LEFT JOIN evidence_desk_claim_dependencies d ON d.claim_id=c.id LEFT JOIN evidence_desk_page_dependencies p ON p.claim_id=c.id GROUP BY c.id ORDER BY CASE c.risk_lane WHEN 'red' THEN 1 WHEN 'amber' THEN 2 ELSE 3 END,c.id`).all();return{ok:true,claims:results}}
  if(kind==='events'){const{results=[]}=await DB.prepare(`SELECT e.*,s.name source_name,p.id package_id,p.status package_status FROM evidence_desk_events e JOIN evidence_desk_sources s ON s.id=e.source_id LEFT JOIN evidence_desk_packages p ON p.event_id=e.id ORDER BY e.id DESC LIMIT 250`).all();return{ok:true,events:results.map(row=>({...row,change:safe(row.change_json,{}),impactedClaims:safe(row.impacted_claims_json,[])}))}}
  if(kind==='packages'){const{results=[]}=await DB.prepare(`SELECT * FROM evidence_desk_packages ORDER BY id DESC LIMIT 250`).all();return{ok:true,packages:results.map(row=>({...row,proposedChanges:safe(row.proposed_changes_json,[]),evidence:safe(row.evidence_json,[])}))}}
  if(kind==='audit'){const{results=[]}=await DB.prepare(`SELECT * FROM evidence_desk_decisions ORDER BY id DESC LIMIT 500`).all();return{ok:true,decisions:results.map(row=>({...row,detail:safe(row.detail_json,{})}))}}
  return{ok:false,error:'not_found'};
}

export async function evidenceDeskRoutes(request,env,ctx){
  const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/',method=request.method.toUpperCase();
  const commission=await evidenceR12CommissionRoute(request,env,path,method);if(commission)return commission;
  if(!path.startsWith('/v1/hq/evidence-desk'))return null;
  if(method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders(request,env)});
  await ensureEvidenceDeskSchema(env.DB);const auth=await authActor(request,env,ctx);if(auth.response)return cors(auth.response,request,env);const actor=auth.user;
  const respond=(value,status=200)=>cors(json(value,status),request,env);
  if(method==='GET'&&path==='/v1/hq/evidence-desk/overview')return respond(await overview(env.DB));
  for(const kind of ['sources','claims','events','packages','audit'])if(method==='GET'&&path===`/v1/hq/evidence-desk/${kind}`)return respond(await listRows(env.DB,kind));
  if(!WRITE_ROLES.has(clean(actor.role,50))&&!CLINICAL_ROLES.has(clean(actor.role,50)))return respond({ok:false,error:'forbidden'},403);
  if(method==='POST'&&path==='/v1/hq/evidence-desk/sources'){if(!WRITE_ROLES.has(clean(actor.role,50)))return respond({ok:false,error:'forbidden'},403);const body=await readJson(request);const result=await upsertEvidenceSource(env.DB,body);if(result.ok)await auditDecision(env.DB,{decision:'source_upserted',actor,detail:{sourceId:result.id}});return respond(result,result.status||200)}
  if(method==='POST'&&path==='/v1/hq/evidence-desk/sources/seed'){if(!WRITE_ROLES.has(clean(actor.role,50)))return respond({ok:false,error:'forbidden'},403);const result=await seedEvidenceDeskSources(env.DB);await auditDecision(env.DB,{decision:'source_registry_seeded',actor,detail:result});return respond(result,201)}
  if(method==='POST'&&path==='/v1/hq/evidence-desk/claims'){if(!WRITE_ROLES.has(clean(actor.role,50)))return respond({ok:false,error:'forbidden'},403);const body=await readJson(request);const result=await upsertEvidenceClaim(env.DB,body);if(result.ok)await auditDecision(env.DB,{decision:'claim_mapped',actor,detail:result});return respond(result,result.status||200)}
  if(method==='POST'&&path==='/v1/hq/evidence-desk/commission/mhra-glp1-r11'){
    if(!CONTROL_ROLES.has(clean(actor.role,50)))return respond({ok:false,error:'forbidden'},403);
    if(clean(env.EVIDENCE_DESK_ENV,50)!=='non-production')return respond({ok:false,error:'non_production_commissioning_only'},409);
    const result=await commissionMhraGlp1R11(env.DB,actor);return respond(result,result.status||200);
  }
  const observation=path.match(/^\/v1\/hq\/evidence-desk\/sources\/([a-z0-9-]+)\/observations$/);if(method==='POST'&&observation){if(!WRITE_ROLES.has(clean(actor.role,50)))return respond({ok:false,error:'forbidden'},403);const control=await env.DB.prepare(`SELECT enabled,ingestion_enabled FROM evidence_desk_control WHERE id=1`).first();if(!Number(control?.enabled)||!Number(control?.ingestion_enabled))return respond({ok:false,error:'evidence_ingestion_locked'},409);const body=await readJson(request);const result=await recordEvidenceObservation(env.DB,observation[1],body);if(result.ok)await auditDecision(env.DB,{eventId:result.event?.id||null,decision:'structured_observation_recorded',actor,detail:{sourceId:observation[1],materialState:result.materialState,snapshotId:result.snapshotId}});return respond(result,result.status||200)}
  const packageCreate=path.match(/^\/v1\/hq\/evidence-desk\/events\/(\d+)\/package$/);if(method==='POST'&&packageCreate){if(!WRITE_ROLES.has(clean(actor.role,50)))return respond({ok:false,error:'forbidden'},403);const control=await env.DB.prepare(`SELECT enabled FROM evidence_desk_control WHERE id=1`).first();if(!Number(control?.enabled))return respond({ok:false,error:'evidence_desk_sealed'},409);const result=await createEvidencePackage(env.DB,Number(packageCreate[1]),await readJson(request),actor);return respond(result,result.status||200)}
  const packageDecision=path.match(/^\/v1\/hq\/evidence-desk\/packages\/(\d+)\/decision$/);if(method==='POST'&&packageDecision){const control=await env.DB.prepare(`SELECT enabled FROM evidence_desk_control WHERE id=1`).first();if(!Number(control?.enabled))return respond({ok:false,error:'evidence_desk_sealed'},409);const result=await decideEvidencePackage(env.DB,Number(packageDecision[1]),await readJson(request),actor);return respond(result,result.status||200)}
  if(method==='POST'&&path==='/v1/hq/evidence-desk/control/kill'){
    if(!CONTROL_ROLES.has(clean(actor.role,50)))return respond({ok:false,error:'forbidden'},403);const body=await readJson(request),reason=clean(body.reason,1000);if(!reason)return respond({ok:false,error:'stop_reason_required'},400);
    return respond(await stopEvidenceDesk(env.DB,reason,actor));
  }
  return respond({ok:false,error:'not_found'},404);
}
