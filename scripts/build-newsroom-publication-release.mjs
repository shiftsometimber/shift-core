import fs from 'node:fs';
import path from 'node:path';
import {NEWSROOM_EVENT_IDS,newsroomSha256,newsroomReleaseDigest,newsroomRowSnapshot,validateNewsroomRelease} from '../newsroom-publication-core.mjs';
const directory='evidence/newsroom-backlog-closeout-2026-09-16';
const snapshotDirectory=path.join(directory,'production-snapshot');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const proof=read(path.join(snapshotDirectory,'snapshot-proof.json')),snapshot=read(path.join(snapshotDirectory,'radar-snapshot.json')),raw=fs.readFileSync(path.join(snapshotDirectory,'radar-raw.json'),'utf8');
if(proof.status!=='pass'||proof.database_writes!==false||await newsroomSha256(raw)!==proof.radar.raw_sha256)throw Error('newsroom_retained_snapshot_invalid');
const rawRows=JSON.parse(raw);if(rawRows.length!==1||rawRows[0].success!==true)throw Error('newsroom_raw_query_invalid');
const decoded=Object.fromEntries(rawRows[0].results.map(x=>[x.section,JSON.parse(x.payload)]));
if(await newsroomSha256(decoded)!==await newsroomSha256(snapshot))throw Error('newsroom_normalized_snapshot_changed');
const candidates=read(path.join(directory,'owner-publication-candidate.json')),review=read(path.join(directory,'owner-publication-source-observation-review.json')),owner=read('evidence/owner-publication-instruction-2026-09-16.json');
if(review.raw_snapshot_sha256!==proof.radar.raw_sha256||review.snapshot_run_id!==proof.workflow_run_id)throw Error('newsroom_observation_review_binding_invalid');
for(const input of candidates.input_files)if(await newsroomSha256(fs.readFileSync(input.path,'utf8'))!==input.sha256)throw Error('newsroom_review_input_changed');
const articles=[];
for(const id of NEWSROOM_EVENT_IDS){
 const candidate=candidates.candidates.find(x=>x.event_id===id),row=snapshot.events.find(x=>x.id===id);if(!candidate||!row)throw Error('newsroom_event_missing');
 const audits=snapshot.source_audit.filter(x=>x.event_id===id),started=audits.filter(x=>x.action==='source_change_review_started');
 const source_review_generation=Math.max(0,...started.map(x=>x.id)),acknowledged=Math.max(0,...started.map(x=>Number(JSON.parse(x.detail_json).observation_id)));
 const pending=audits.filter(x=>x.action==='source_changed_review_required'&&x.id>acknowledged).sort((a,b)=>b.id-a.id)[0];
 const pending_source_change=pending?{id:pending.id,observed_at:pending.created_at,...JSON.parse(pending.detail_json)}:null;
 const history=snapshot.publication_history.filter(x=>x.event_id===id&&x.action==='published').sort((a,b)=>a.version-b.version);
 const source_observation_review=review.decisions.find(x=>x.event_id===id);
 articles.push({event_id:id,contentPackage:candidate.draft_request.contentPackage,review:candidate.review_decision,reviewed_primary_urls:candidate.review_decision.primary_sources_checked,snapshot:newsroomRowSnapshot({...row,source_review_generation}),pending_source_change,source_observation_review,first_publication_at:history[0]?.created_at||null});
}
const release={proof:'NEWSROOM_OWNER_PUBLICATION_RELEASE_V1',status:'ready',release_id:'newsroom-nine-20260916',owner_instruction:owner,owner_instruction_sha256:await newsroomSha256(owner),source_snapshot:{workflow_run_id:proof.workflow_run_id,source_sha:proof.source_sha,captured_at:proof.captured_at,raw_sha256:proof.radar.raw_sha256,observation_review_sha256:await newsroomSha256(fs.readFileSync(path.join(directory,'owner-publication-source-observation-review.json'),'utf8'))},articles};
release.release_sha256=await newsroomReleaseDigest(release);await validateNewsroomRelease(release);
fs.writeFileSync('newsroom-publication-release-v1.mjs','// Fixed owner-authorised nine-article release, bound to reviewed production observations.\nexport const NEWSROOM_PUBLICATION_RELEASE = '+JSON.stringify(release,null,2)+';\n');
console.log(JSON.stringify({ok:true,release_id:release.release_id,release_sha256:release.release_sha256,articles:articles.length,clinical_review:false,source_snapshot_run:proof.workflow_run_id}));
