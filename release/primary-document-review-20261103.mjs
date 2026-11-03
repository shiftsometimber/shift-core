// Finite, owner-authorised source appraisal for two existing CMS records.
// This does not deploy code, approve an article, publish, or send notifications.
import assert from 'node:assert/strict';
import {createHash,createPublicKey,verify} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {sourceReviewEvent,pendingSourceChange,sourceFingerprint,recordSourceChange} from '../radar-source-review-v1.js';

export const BRANCH='fix/primary-document-review-20261103';
export const OWNER_INSTRUCTION='Matt, 3 November 2026: Publish all - you are signed in to HQ on SST MAC';
export const COPY_PAGE='https://chatgpt.com/space/page_b28be854edec819195715c169873a97b';
export const PLANS=Object.freeze([
 Object.freeze({id:1700,key:'scotland',headline:'New research shows varied access to new medicines across Scotland',url:'https://www.abpi.org.uk/media/news/2026/october/new-research-shows-varied-access-to-new-medicines-across-scotland/',sourceDate:'2026-10-29',eventDate:'2026-10-29',slug:'medicine-news/scotland-glp1-prescribing-variation-october-2026',authority:'ABPI / LCP Health — original industry analysis',kind:'primary_industry_analysis',region:'Scotland',summary:'Original industry analysis of recorded NHS prescribing, September 2020–August 2025. Mixed indications, private-prescribing exclusion and small-population limitations retained; not a trial, care-quality ranking or measure of individual access.'}),
 Object.freeze({id:1701,key:'offshore',headline:'Safe weight limit policy | Offshore Energies UK (OEUK)',url:'https://oeuk.org.uk/industry-support/hse/safe-weight-limit-policy/',sourceDate:null,eventDate:'2026-11-01',slug:'medicine-news/offshore-travel-weight-limit-november-2026',authority:'Offshore Energies UK — original industry policy',kind:'primary_industry_policy',region:'UK',summary:'Original industry travel/rescue policy: 124kg clothed weight, mandatory from 1 November 2026; outbound installation travel, not marine vessels or return flights. Not a regulator decision, treatment requirement, medicine trial or individual occupational-fitness assessment.'})
]);
export const digest=s=>createHash('sha256').update(typeof s==='string'?s:JSON.stringify(s)).digest('hex');
const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const planFor=id=>{const p=PLANS.find(x=>x.id===Number(id));assert(p,'Outside the two approved source records');return p};
const text=html=>String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();

export function qualifyDocument(id,{url,status,body,fetchedAt}){
 const p=planFor(id);assert.equal(url,p.url,'Original source redirect or identity changed');assert.equal(status,200,'Original source is not readable');
 assert(Number.isFinite(Date.parse(fetchedAt)),'Missing actual retrieval time');
 const s=text(body);assert(s.length>1000,'Incomplete original document');
 const checks=p.id===1700?[/29 October 2026/i,/September 2020 to August 2025/i,/GLP.?1/i,/10 times/i,/small island populations/i,/private prescriptions/i,/individual patient access/i]:[/124\s*kg/i,/1 Nov(?:ember)? 2026/i,/including shoes/i,/marine vessels/i,/outbound/i,/return flights to shore/i];
 for(const pattern of checks)assert(pattern.test(s),'Original document claim check missing: '+pattern);
 const evidence={source_tier:2,authority:p.authority,title:p.headline,url:p.url,source_date:p.sourceDate,event_date:p.eventDate,event_date_kind:p.id===1701?'policy_implementation':'report_publication',source_document_type:p.kind,regulatory_decision:false,clinical_trial_results:false,summary:p.summary,retrieved_at:fetchedAt,primary_document_sha256:digest(body),review_method:'AI-assisted primary-document appraisal; owner approved the existing exact public copy; no clinical-review attestation',copy_approval_reference:COPY_PAGE};
 const verification={verified:true,evidence_level:2,regulator_confirmed:false,confidence:88,reason:p.id===1700?'Original industry analysis and its stated methods/limitations checked; not regulator-confirmed, a randomised trial or current individual access':'Original industry policy and implementation/scope checked; not regulator-confirmed, clinical research or individual treatment advice',conflicts:[],source_document_type:p.kind,clinical_review:false,reviewed_at:fetchedAt};
 return{evidence,verification,document_sha256:digest(body),readable_text_sha256:digest(s)};
}

export function assertOriginalRow(p,row,pending=null){
 assert(row&&row.id===p.id,'Wrong or missing CMS identity');assert.equal(row.headline,p.headline);assert.equal(row.status,'needs_more_evidence','An editorial owner changed the record');
 assert.equal(Number(row.source_review_generation||0),0,'A source correction has already started');assert(!row.reviewed_at&&!row.reviewed_by,'An editorial decision already exists');
 assert.equal(row.content_package_json,'{}','Prepared copy changed; do not overwrite');assert.equal(row.medicine_patch_json,'{}','Medicine state changed; do not overwrite');
 const e=JSON.parse(row.source_evidence_json);assert.equal(e.length,1);assert.equal(e[0].url,p.url);assert.equal(e[0].source_date,p.sourceDate);assert.equal(e[0].source_tier,4);assert.equal(JSON.parse(row.verification_json).verified,false);
 if(pending)assert(pending.observation?.review_scope==='primary-document-review-20261103'&&pending.observation?.copy_approval_reference===COPY_PAGE,'Unrelated pending observation requires its owner');
}

export function observationFor(p,qualified,row,principal){
 const evidence=[{...JSON.parse(row.source_evidence_json)[0],...qualified.evidence}];
 const observation={headline:row.headline,evidence,verification:qualified.verification,confidence:88,scores:{relevance:row.relevance_score,urgency:row.urgency_score},region:p.region,review_scope:'primary-document-review-20261103',copy_approval_reference:COPY_PAGE,owner_instruction:OWNER_INSTRUCTION,review_actor:principal,document_sha256:qualified.document_sha256};
 return{fingerprint:sourceFingerprint(row.headline,evidence),observation};
}

async function oidc(){
 assert.equal(process.env.GITHUB_REPOSITORY,'shiftsometimber/shift-core');assert.equal(process.env.GITHUB_REF,'refs/heads/'+BRANCH);assert.equal(process.env.GITHUB_ACTOR_ID,'315011648');
 const audience='shift-primary-document-review-20261103',requestUrl=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);requestUrl.searchParams.set('audience',audience);
 const response=await fetch(requestUrl,{headers:{Authorization:'Bearer '+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},signal:AbortSignal.timeout(15000)});assert(response.ok,'OIDC issue failed');
 const token=(await response.json()).value,[head,payload,sig]=token.split('.'),header=JSON.parse(Buffer.from(head,'base64url')),claims=JSON.parse(Buffer.from(payload,'base64url'));
 assert.equal(header.alg,'RS256');const jwks=await fetch('https://token.actions.githubusercontent.com/.well-known/jwks',{signal:AbortSignal.timeout(15000)});assert(jwks.ok);const key=(await jwks.json()).keys.find(k=>k.kid===header.kid);assert(key,'OIDC signing key unavailable');
 assert(verify('RSA-SHA256',Buffer.from(head+'.'+payload),createPublicKey({key,format:'jwk'}),Buffer.from(sig,'base64url')),'OIDC signature invalid');
 const now=Date.now()/1000;assert.equal(claims.iss,'https://token.actions.githubusercontent.com');assert.equal(claims.aud,audience);assert(claims.exp>now&&(!claims.nbf||claims.nbf<=now+30));assert.equal(claims.repository,process.env.GITHUB_REPOSITORY);assert.equal(claims.ref,process.env.GITHUB_REF);assert.equal(claims.sha,process.env.GITHUB_SHA);assert.equal(String(claims.actor_id),'315011648');assert.equal(claims.workflow_ref,'shiftsometimber/shift-core/.github/workflows/primary-document-review-20261103.yml@refs/heads/'+BRANCH);
 return{kind:'github_oidc',repository:claims.repository,sha:claims.sha,workflow_ref:claims.workflow_ref,run_id:String(process.env.GITHUB_RUN_ID),actor_id:String(claims.actor_id)};
}

function productionDB(){
 assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,'9e5386dcf455be34c582d93f8bfc79e6');assert.equal(process.env.PRIMARY_REVIEW_DB_ID,'88f40aed-cb23-4372-8c94-8a73f48bc847');assert(process.env.CLOUDFLARE_API_TOKEN);
 const endpoint='https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/d1/database/'+process.env.PRIMARY_REVIEW_DB_ID+'/query';
 const query=async batch=>{const r=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({batch}),signal:AbortSignal.timeout(30000)});const j=await r.json();assert(r.ok&&j.success,'Bounded CMS database operation failed');return j.result};
 return{prepare(sql){let params=[];const statement={bind(...values){params=values;return statement},_query:()=>({sql,params}),async all(){return(await query([{sql,params}]))[0]},async first(){return(await statement.all()).results?.[0]||null},async run(){return(await query([{sql,params}]))[0]}};return statement},async batch(statements){return query(statements.map(s=>s._query()))}};
}

async function assertNoPublication(DB){
 for(const p of PLANS){const other=await DB.prepare("SELECT id,status FROM radar_events WHERE id<>? AND status IN ('approved','published') AND (rtrim(COALESCE(json_extract(source_evidence_json,'$[0].url'),''),'/')=? OR json_extract(content_package_json,'$.seo.slug')=?) LIMIT 1").bind(p.id,p.url.replace(/\/$/,''),p.slug).first();assert(!other,'Duplicate governed publication exists');
  const count=await DB.prepare("SELECT COUNT(*) n FROM radar_audit WHERE event_id=? AND action='published'").bind(p.id).first();assert.equal(Number(count.n),0,'This is already a published story');}
}

async function run(mode){
 const principal=await oidc(),DB=productionDB(),dir='primary-document-review-proof';mkdirSync(dir,{recursive:true});
 if(mode==='--snapshot'){
  await assertNoPublication(DB);const items=[];
  for(const p of PLANS){const row=await sourceReviewEvent(DB,p.id),pending=await pendingSourceChange(DB,p.id);assertOriginalRow(p,row,pending);
   const response=await fetch(p.url,{redirect:'follow',headers:{Accept:'text/html','User-Agent':'Shift-Radar/1.0'},signal:AbortSignal.timeout(25000)}),body=await response.text();const qualified=qualifyDocument(p.id,{url:response.url,status:response.status,body,fetchedAt:new Date().toISOString()});
   if(pending)assert.equal(pending.observation.document_sha256,qualified.document_sha256,'Previously observed primary document changed; reconcile instead of replaying');
   writeFileSync(dir+'/'+p.key+'-original-source.txt',body);items.push({plan:p,row,pending,qualified});}
  writeFileSync(dir+'/before.json',JSON.stringify({scope:'primary-document-review-20261103',principal,owner_instruction:OWNER_INSTRUCTION,copy_approval_reference:COPY_PAGE,at:new Date().toISOString(),items},null,2));console.log('SNAPSHOT VERIFIED: existing events 1700/1701 only; originals, snapshots and rollback evidence retained; no writes');return;
 }
 assert.equal(mode,'--apply');const before=JSON.parse(readFileSync(dir+'/before.json'));assert.equal(before.principal.sha,principal.sha);assert(Date.now()-Date.parse(before.at)<15*60*1000,'Snapshot is stale');assert.deepEqual(before.items.map(x=>x.plan.id),[1700,1701]);
 await assertNoPublication(DB);for(const item of before.items){const p=planFor(item.plan.id),row=await sourceReviewEvent(DB,p.id),pending=await pendingSourceChange(DB,p.id);assertOriginalRow(p,row,pending);assert.equal(canonical(row),canonical(item.row),'CMS row changed since retained snapshot');assert.equal(canonical(pending),canonical(item.pending),'Source owner changed since snapshot');assert.equal(digest(readFileSync(dir+'/'+p.key+'-original-source.txt','utf8')),item.qualified.document_sha256);}
 const outcomes=[];
 for(const item of before.items){const p=planFor(item.plan.id),row=await sourceReviewEvent(DB,p.id);assert.equal(canonical(row),canonical(item.row),'Concurrent CMS writer');const observation=observationFor(p,item.qualified,row,principal);const changed=await recordSourceChange(DB,row,observation);const pending=await pendingSourceChange(DB,p.id);assert.equal(pending.fingerprint,observation.fingerprint);assert.equal(pending.observation.document_sha256,item.qualified.document_sha256);assert.equal(pending.reviewed_snapshot.source_evidence_json,row.source_evidence_json,'Original evidence must remain recoverable');
  const receipt={scope:'primary-document-review-20261103',principal,copy_approval_reference:COPY_PAGE,owner_instruction:OWNER_INSTRUCTION,document_sha256:item.qualified.document_sha256,prior_row_sha256:digest(canonical(row)),observation_id:pending.id,source_document_type:p.kind,regulator_confirmed:false,clinical_review:false,publication_performed:false,notification_performed:false};
  const exists=await DB.prepare("SELECT id FROM radar_audit WHERE event_id=? AND action='primary_document_review_receipt' AND json_extract(detail_json,'$.observation_id')=? LIMIT 1").bind(p.id,pending.id).first();if(!exists)await DB.prepare("INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(?,'primary_document_review_receipt',?,?)").bind(p.id,'github-actions:'+principal.repository+'@'+principal.sha,JSON.stringify(receipt)).run();
  const after=await sourceReviewEvent(DB,p.id);assert.equal(after.source_evidence_json,row.source_evidence_json,'Source retrieval must not silently replace evidence');assert.equal(after.content_package_json,row.content_package_json);assert.equal(after.reviewed_at,row.reviewed_at);outcomes.push({event_id:p.id,observation_id:pending.id,new_observation:changed,source:p.url,source_document_type:p.kind,source_date:p.sourceDate,event_date:p.eventDate,next:'Existing named-owner CMS Start source correction, then exact draft, separate approval and publication',...receipt});}
 writeFileSync(dir+'/after.json',JSON.stringify({verified:true,at:new Date().toISOString(),outcomes,codeDeployed:false,articlesPublished:0,emailsSent:0},null,2));console.log('SOURCE OBSERVATIONS VERIFIED for 1700/1701. Original rows retained; owner correction/approval/publication gates remain mandatory. No runtime deployment, publication or email.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await run(process.argv[2]);
