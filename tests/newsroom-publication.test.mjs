import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import hq from '../hq-ai.js';
import {memoryDB} from '../preview/newsroom-discovery/memory-db.mjs';
import {ensureRadarSchema,radarRoutes,verifyEvidence} from '../radar-integration-v1.js';
import {recordSourceChange,pendingSourceChange,sourceReviewEvent,sourceFingerprint} from '../radar-source-review-v1.js';
import {NEWSROOM_EVENT_IDS,publishFixedNewsroom,validateNewsroomRelease,newsroomSha256,newsroomReleaseDigest,newsroomRowSnapshot} from '../newsroom-publication-core.mjs';
import {newsroomPublicationRoute} from '../newsroom-publication-v1.js';
const candidates=JSON.parse(fs.readFileSync(new URL('../evidence/newsroom-backlog-closeout-2026-09-16/owner-publication-candidate.json',import.meta.url),'utf8')).candidates;
const owner=JSON.parse(fs.readFileSync(new URL('../evidence/owner-publication-instruction-2026-09-16.json',import.meta.url),'utf8'));
const identity={kind:'github_oidc',repository:'shiftsometimber/shift-core',sha:'a'.repeat(40),workflow_ref:'shiftsometimber/shift-core/.github/workflows/cloudflare-production-promote.yml@refs/heads/main',run_id:'12345',actor_id:'315011648'};
async function fixture(){
 const DB=memoryDB();await ensureRadarSchema(DB);
 const articles=[];
 for(const c of candidates){
  const pkg=c.draft_request.contentPackage;
  const evidence=[{source_tier:1,authority:'MHRA',title:pkg.headline,url:pkg.seo.source_url,source_date:'2026-07-21',summary:'TEST FIXTURE: reviewed source observation'}];
  await DB.prepare("INSERT INTO radar_events(id,event_key,status,headline,region,regulator,clinical,requires_review,source_evidence_json,verification_json,medicine_patch_json,content_package_json) VALUES(?,?,'hold',?,'UK','MHRA',1,1,?,?,'{}','{}')").bind(c.event_id,'fixture-'+c.event_id,pkg.headline,JSON.stringify([{...evidence[0],summary:'Earlier source'}]),JSON.stringify(verifyEvidence(evidence))).run();
  const old=await sourceReviewEvent(DB,c.event_id),observation={headline:pkg.headline,evidence,verification:verifyEvidence(evidence),scores:{relevance:75,urgency:92},confidence:97,region:'UK'};
  await recordSourceChange(DB,old,{fingerprint:sourceFingerprint(observation.headline,evidence),observation});
  const pending=await pendingSourceChange(DB,c.event_id);
  articles.push({event_id:c.event_id,contentPackage:pkg,review:c.review_decision,reviewed_primary_urls:c.review_decision.primary_sources_checked,snapshot:newsroomRowSnapshot(await sourceReviewEvent(DB,c.event_id)),pending_source_change:pending,source_observation_review:{kind:'ai',decision:'PASS',reviewer:'TEST_FIXTURE_ONLY',sha256:await newsroomSha256(pending)},first_publication_at:null});
 }
 const release={proof:'NEWSROOM_OWNER_PUBLICATION_RELEASE_V1',status:'ready',release_id:'newsroom-nine-20260916',owner_instruction:owner,owner_instruction_sha256:await newsroomSha256(owner),articles};
 release.release_sha256=await newsroomReleaseDigest(release);
 return{DB,release};
}
const count=async(DB,action)=>(await DB.prepare('SELECT COUNT(*) n FROM radar_audit WHERE action=?').bind(action).first()).n;
async function reseal(release){release.release_sha256=await newsroomReleaseDigest(release);return release}

test('fixed nine publication uses truthful automation actor and normal guarded Radar actions, then retries without republishing',async()=>{
 const {DB,release}=await fixture();
 const priorHq=hq.fetch;hq.fetch=async()=>{throw Error('Automation must not create/use an HQ session')};
 try{
  const report=await publishFixedNewsroom({DB},release,identity);
  assert.equal(report.published,9);assert.equal(report.already_published,0);assert.equal(report.clinical_review,false);
  for(const a of release.articles){
   const row=await sourceReviewEvent(DB,a.event_id),pkg=JSON.parse(row.content_package_json);
   assert.equal(row.status,'published');assert.equal(row.reviewed_by,'github-actions:shiftsometimber/shift-core@'+'a'.repeat(40));
   assert.equal(pkg.article_markdown,a.contentPackage.article_markdown);assert.equal(pkg.release_provenance.clinical_review,false);
   assert.deepEqual(pkg.destinations,['medicine_news','knowledge_links','search','sitemap']);assert.equal(row.medicine_patch_json,'{}');
   assert.equal(row.source_evidence_json,JSON.stringify(a.pending_source_change.observation.evidence));
   assert.equal(await pendingSourceChange(DB,a.event_id),null);
  }
  assert.equal(await count(DB,'source_change_review_started'),9);assert.equal(await count(DB,'approved'),9);assert.equal(await count(DB,'published'),9);
  const again=await publishFixedNewsroom({DB},release,identity);assert.equal(again.published,0);assert.equal(again.already_published,9);assert.equal(await count(DB,'published'),9);
 }finally{hq.fetch=priorHq}
});
test('changed last observation rejects entire preflight before any release write',async()=>{
 const {DB,release}=await fixture(),a=release.articles.at(-1),row=await sourceReviewEvent(DB,a.event_id),observation=structuredClone(a.pending_source_change.observation);
 observation.evidence[0].summary='New source finding after retained review';
 await recordSourceChange(DB,row,{fingerprint:sourceFingerprint(observation.headline,observation.evidence),observation});
 await assert.rejects(publishFixedNewsroom({DB},release,identity),/snapshot_changed_294/);
 assert.equal(await count(DB,'owner_instruction_release_started'),0);assert.equal(await count(DB,'published'),0);
});
test('same primary source under a different headline blocks duplicate publication',async()=>{
 const {DB,release}=await fixture(),a=release.articles.find(x=>x.event_id===292);
 await DB.prepare("INSERT INTO radar_events(id,event_key,status,headline,source_evidence_json,content_package_json) VALUES(23,'older-asthma','published','Different historical title',?,'{}')").bind(JSON.stringify([{url:a.contentPackage.seo.source_url}])).run();
 await assert.rejects(publishFixedNewsroom({DB},release,identity),/duplicate_publication_292_23/);
 assert.equal(await count(DB,'owner_instruction_release_started'),0);
});
test('new source observation after a release-start audit still blocks correction and publication',async()=>{
 const {DB,release}=await fixture(),prepare=DB.prepare.bind(DB);let injected=false;
 DB.prepare=sql=>{const statement=prepare(sql),run=statement.run.bind(statement);statement.run=async()=>{const result=await run();if(!injected&&sql.includes("'owner_instruction_release_started'")){injected=true;const a=release.articles[0],observation=structuredClone(a.pending_source_change.observation);observation.evidence[0].summary='Source changed during release';await recordSourceChange(DB,await sourceReviewEvent(DB,a.event_id),{fingerprint:sourceFingerprint(observation.headline,observation.evidence),observation})}return result};return statement};
 await assert.rejects(publishFixedNewsroom({DB},release,identity),/new_source_observation_276/);assert.equal(await count(DB,'published'),0);assert.equal(await count(DB,'source_change_review_started'),0);
});
test('scope, reviewed-body hash, owner attestation and destinations cannot be widened',async()=>{
 const {release}=await fixture();
 for(const edit of [r=>r.articles.pop(),r=>r.articles[0].contentPackage.article_markdown+=' changed',r=>r.articles[0].contentPackage.destinations.push('member_email'),r=>r.owner_instruction.clinical_review_claimed=true,r=>r.articles[0].source_observation_review.sha256='0'.repeat(64)]){
  const bad=structuredClone(release);edit(bad);await reseal(bad);await assert.rejects(validateNewsroomRelease(bad),/newsroom_/);
 }
});
test('unauthenticated release and ordinary non-owner HQ approval both remain forbidden',async()=>{
 const response=await newsroomPublicationRoute(new Request('https://api.shiftsometimber.co.uk/v1/commissioning/newsroom-publication',{method:'POST',body:'{}'}),{DB:{prepare(){throw Error('Must reject before database')}}});assert.equal(response.status,403);
 const {DB}=await fixture(),prior=hq.fetch;hq.fetch=async()=>new Response(JSON.stringify({user:{role:'editor',email:'editor@example.test'}}),{headers:{'content-type':'application/json'}});
 try{const r=await radarRoutes(new Request('https://example.test/v1/hq/radar/events/276/approve',{method:'POST',body:'{}'}),{DB},{});assert.equal(r.status,403);assert.equal((await r.json()).error,'owner_approval_required')}finally{hq.fetch=prior}
});
