import {pendingSourceChange,sourceReviewEvent,sourceFingerprint} from './radar-source-review-v1.js';
import {saveRadarDraftCore,reviewRadarActionCore,ensureRadarPublicationJobCore,radarSeoPackage,verifyEvidence} from './radar-integration-v1.js';
export const NEWSROOM_EVENT_IDS=Object.freeze([276,279,281,284,286,288,290,292,294]);
export const NEWSROOM_DESTINATIONS=Object.freeze(['medicine_news','knowledge_links','search','sitemap']);
const parse=(text,fallback={})=>{try{return JSON.parse(text)}catch{return fallback}};
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export async function newsroomSha256(value){const data=typeof value==='string'?value:canonical(value);return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function newsroomReleaseDigest(release){const {release_sha256,...data}=release;return newsroomSha256(data)}
const fail=reason=>{throw new Error('newsroom_'+reason)};
const url=value=>String(value||'').replace(/\/+$/,'');
const unmodified=row=>Object.fromEntries(['id','event_key','status','headline','region','regulator','clinical','requires_review','source_evidence_json','verification_json','medicine_patch_json','content_package_json','reviewed_at','created_at','updated_at','source_review_generation'].map(k=>[k,row[k]??null]));
export const newsroomRowSnapshot=unmodified;
const stripModified=pkg=>{const copy=structuredClone(pkg);if(copy.seo)delete copy.seo.dateModified;return copy};
export async function validateNewsroomRelease(release){
 if(release?.proof!=='NEWSROOM_OWNER_PUBLICATION_RELEASE_V1'||release.status!=='ready'||release.release_id!=='newsroom-nine-20260916')fail('release_not_ready');
 if(await newsroomReleaseDigest(release)!==release.release_sha256)fail('release_digest_mismatch');
 const owner=release.owner_instruction;
 if(owner?.status!=='authorised'||owner.instruction!=='Publish them all !!!!!!'||owner.actor?.role!=='owner'||owner.clinical_review_claimed!==false||owner.human_editorial_review_claimed!==false||canonical(owner.scope?.newsroom_corrected_articles)!==canonical(NEWSROOM_EVENT_IDS)||await newsroomSha256(owner)!==release.owner_instruction_sha256)fail('owner_instruction_invalid');
 if(!Array.isArray(release.articles)||canonical(release.articles.map(a=>a.event_id).sort((a,b)=>a-b))!==canonical(NEWSROOM_EVENT_IDS))fail('event_scope_invalid');
 const slugs=new Set();
 for(const a of release.articles){
  if(a.review?.decision!=='PASS'||a.review.reviewer?.kind!=='ai'||a.review.author?.id===a.review.reviewer?.id||await newsroomSha256(a.contentPackage.article_markdown)!==a.review.article_markdown_sha256)fail('review_binding_invalid');
  if(canonical(a.contentPackage.destinations)!==canonical(NEWSROOM_DESTINATIONS)||!a.contentPackage.known_facts?.every(f=>f.claim&&/^https:\/\//.test(f.source_url)))fail('package_scope_invalid');
  const {seo,errors}=radarSeoPackage(a.contentPackage,{headline:a.contentPackage.headline,source_evidence_json:a.snapshot.source_evidence_json,content_package_json:'{}'});
  if(errors.length||slugs.has(seo.slug)||a.contentPackage.seo.author!=='SHIFT AI Newsroom')fail('package_invalid');slugs.add(seo.slug);
  const observed=a.pending_source_change?.observation,evidence=observed?.evidence||parse(a.snapshot.source_evidence_json,[]);
  if(!verifyEvidence(evidence).verified||url(evidence[0]?.url)!==url(a.contentPackage.seo.source_url)||!a.reviewed_primary_urls?.includes(evidence[0]?.url))fail('source_binding_invalid');
  if(a.pending_source_change&&a.pending_source_change.fingerprint!==sourceFingerprint(observed.headline,evidence))fail('observation_fingerprint_invalid');
  if(a.snapshot.id!==a.event_id||!['hold','verified','ready_for_review'].includes(a.snapshot.status)||a.source_observation_review?.decision!=='PASS'||a.source_observation_review?.kind!=='ai'||await newsroomSha256(a.pending_source_change||a.snapshot.source_evidence_json)!==a.source_observation_review.sha256)fail('snapshot_review_missing');
 }
 return true;
}
function packageFor(release,a,stamp){
 const contentPackage=structuredClone(a.contentPackage);
 contentPackage.seo.datePublished=a.first_publication_at||stamp;
 contentPackage.release_provenance={release_id:release.release_id,release_sha256:release.release_sha256,owner_instruction_sha256:release.owner_instruction_sha256,authorship:'AI',independent_review:'AI primary-source editorial',clinical_review:false};
 contentPackage.seo=radarSeoPackage(contentPackage,{headline:contentPackage.headline,source_evidence_json:a.snapshot.source_evidence_json,content_package_json:'{}'}).seo;
 return contentPackage;
}
async function startedRelease(DB,id,release){
 const row=await DB.prepare("SELECT * FROM radar_audit WHERE event_id=? AND action='owner_instruction_release_started' AND json_extract(detail_json,'$.release_sha256')=? ORDER BY id LIMIT 1").bind(id,release.release_sha256).first();
 return row?{...row,detail:parse(row.detail_json)}:null;
}
async function preflightArticle(DB,release,a){
 const row=await sourceReviewEvent(DB,a.event_id);if(!row)fail('event_missing');
 const pending=await pendingSourceChange(DB,a.event_id),started=await startedRelease(DB,a.event_id,release);
 if(!started){
  if(canonical(unmodified(row))!==canonical(a.snapshot)||canonical(pending)!==canonical(a.pending_source_change))fail('snapshot_changed_'+a.event_id);
  return{row,pending,started};
 }
 if(started.detail.owner_instruction_sha256!==release.owner_instruction_sha256)fail('release_actor_binding_changed');
 if(canonical(unmodified(row))===canonical(a.snapshot)&&canonical(pending)===canonical(a.pending_source_change))return{row,pending,started};
 if(pending){
  if(canonical(pending)!==canonical(a.pending_source_change)||canonical(unmodified(row))!==canonical(a.snapshot))fail('new_source_observation_'+a.event_id);
  return{row,pending,started};
 }
 const expectedEvidence=a.pending_source_change?JSON.stringify(a.pending_source_change.observation.evidence):a.snapshot.source_evidence_json;
 if(row.source_evidence_json!==expectedEvidence||!parse(row.verification_json).verified)fail('source_changed_'+a.event_id);
 if(a.pending_source_change){
  const generation=await DB.prepare("SELECT detail_json FROM radar_audit WHERE id=? AND event_id=? AND action='source_change_review_started'").bind(row.source_review_generation,a.event_id).first();
  if(Number(parse(generation?.detail_json).observation_id)!==Number(a.pending_source_change.id))fail('source_generation_changed_'+a.event_id);
 }else if(Number(row.source_review_generation)!==Number(a.snapshot.source_review_generation))fail('source_generation_changed_'+a.event_id);
 const pkg=parse(row.content_package_json),expected=packageFor(release,a,started.created_at);
 if(row.status==='verified'&&row.content_package_json==='{}'&&row.medicine_patch_json==='{}')return{row,pending,started};
 if(!['ready_for_review','approved','publish_failed','published'].includes(row.status)||canonical(stripModified(pkg))!==canonical(stripModified(expected))||canonical(parse(row.medicine_patch_json))!=='{}')fail('prepared_package_changed_'+a.event_id);
 return{row,pending,started};
}
async function assertNoDuplicates(DB,release){
 const {results=[]}=await DB.prepare("SELECT id,headline,source_evidence_json,content_package_json FROM radar_events WHERE status IN ('approved','published')").all();
 for(const a of release.articles){
  const primary=url(a.contentPackage.seo.source_url),headline=(a.pending_source_change?.observation.headline||a.snapshot.headline).trim().toLowerCase(),slug=radarSeoPackage(a.contentPackage,{source_evidence_json:a.snapshot.source_evidence_json,content_package_json:'{}'}).seo.slug;
  for(const row of results.filter(r=>r.id!==a.event_id))if(row.headline.trim().toLowerCase()===headline||url(parse(row.source_evidence_json,[])[0]?.url)===primary||parse(row.content_package_json).seo?.slug===slug)fail('duplicate_publication_'+a.event_id+'_'+row.id);
 }
}
const expectedState=state=>({row:state.row,pending_source_change_id:state.pending?.id??null});
async function responseData(response){const body=await response.json();if(!response.ok||body.ok!==true)fail(body.error||'action_failed');return body}
export async function publishFixedNewsroom(env,release,identity){
 await validateNewsroomRelease(release);
 if(identity?.kind!=='github_oidc'||identity.repository!=='shiftsometimber/shift-core'||!/^[a-f0-9]{40}$/.test(identity.sha||'')||!identity.workflow_ref)fail('automation_principal_invalid');
 const actor=`github-actions:${identity.repository}@${identity.sha}`;
 // Read every selected row and duplicate boundary before the first audit or content write.
 await assertNoDuplicates(env.DB,release);
 for(const a of release.articles)await preflightArticle(env.DB,release,a);
 const results=[];
 for(const a of release.articles){
  let state=await preflightArticle(env.DB,release,a);
  if(!state.started){
   const stamp=new Date().toISOString();
   await env.DB.prepare("INSERT INTO radar_audit(event_id,action,actor,detail_json,created_at) VALUES(?,'owner_instruction_release_started',?,?,?)").bind(a.event_id,actor,JSON.stringify({release_id:release.release_id,release_sha256:release.release_sha256,owner_instruction_sha256:release.owner_instruction_sha256,principal:identity,approval_kind:'owner_instruction_editorial',clinical_review:false}),stamp).run();
   state=await preflightArticle(env.DB,release,a);
  }
  if(state.row.status==='published'){results.push({event_id:a.event_id,status:'already_published',url:parse(state.row.content_package_json).seo.canonical});continue}
  const note=`Owner instruction ${release.owner_instruction_sha256}; release ${release.release_sha256}; executed by ${actor}. AI-authored, independently AI source-reviewed; owner editorial publication, no clinical-review attestation. Website and internal discovery only.`;
  if(state.pending){await responseData(await reviewRadarActionCore(env,a.event_id,'correct',{note},actor,expectedState(state)));state=await preflightArticle(env.DB,release,a)}
  const pkg=packageFor(release,a,state.started.created_at);
  if(['hold','verified','ready_for_review'].includes(state.row.status)){
   await responseData(await saveRadarDraftCore(env,a.event_id,{medicinePatch:{},contentPackage:pkg,destinations:NEWSROOM_DESTINATIONS,note},actor,expectedState(state)));
   state=await preflightArticle(env.DB,release,a);
   await responseData(await reviewRadarActionCore(env,a.event_id,'approve',{note,destinations:NEWSROOM_DESTINATIONS},actor,expectedState(state)));
  }
  state=await preflightArticle(env.DB,release,a);
  await responseData(await ensureRadarPublicationJobCore(env,a.event_id,actor,expectedState(state)));
  state=await preflightArticle(env.DB,release,a);
  const published=await responseData(await reviewRadarActionCore(env,a.event_id,'publish',{},actor,expectedState(state)));
  results.push({event_id:a.event_id,status:published.status,url:pkg.seo.canonical,version:published.version});
 }
 return{ok:true,release_id:release.release_id,release_sha256:release.release_sha256,actor,clinical_review:false,workflow_sha:identity.sha,published:results.filter(x=>x.status==='published').length,already_published:results.filter(x=>x.status==='already_published').length,results};
}
