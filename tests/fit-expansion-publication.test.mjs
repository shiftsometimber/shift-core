import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {gunzipSync} from 'node:zlib';
import {buildFitOwnerRelease,fitDigest,fitDosage,bindFitOriginalSnapshot} from '../fit-expansion-publication-v1.mjs';
import {selectGovernedFitRows,loadGovernedFitCatalogue,ownerFitExerciseAllowed,ownerFitDoseFields,ownerFitRestrictionContext,fitRemainingMinutes,ownerFitWithinTime} from '../fit-expansion-authority-v1.mjs';
import {FIT_EXPANSION_SERVING_AUTHORITY} from '../fit-expansion-serving-manifest-v1.mjs';
import {catalogueRowsSha256} from '../catalogue-publication-shared.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const candidate=read('evidence/fit-publication-2026-09-16/resolved-candidate.json'),nineReview=read('evidence/fit-publication-2026-09-16/independent-nine-dose-review.json');
const wire=JSON.parse(gunzipSync(fs.readFileSync('evidence/fit-publication-2026-09-16/owner-release.json.gz')));
const input={candidate,ownerInstruction:wire.manifest.owner_instruction,nineReview};
const release=buildFitOwnerRelease(input);
const decoded=row=>({...row,data:JSON.parse(row.data_json),review:JSON.parse(row.review_json)});
// Use the actual original publication script, not the new hash projector, as the fixture source.
function publishedOriginals(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fit-v1-original-'));
  try{
    execFileSync(process.execPath,['grub-v1-publication-pack.mjs'],{stdio:'pipe',env:{...process.env,COFID_INDEX:path.resolve('tests/fixtures/grub-cofid-2021-governed-subset.json'),GRUB_PUBLICATION_DIR:dir,GRUB_DECISIONS_FILE:path.resolve('evidence/grub-v1-final-decisions-2026-08-14.json')}});
    execFileSync(process.execPath,['final-v1-production-publication.mjs'],{stdio:'pipe',env:{...process.env,GRUB_PUBLISHABLE_FILE:path.join(dir,'grub-v1-publishable.json'),FINAL_V1_PUBLICATION_DIR:dir}});
    const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(dir,'final-v1-production-publication.sql'),'utf8'));
    const rows=db.prepare("SELECT * FROM structured_content WHERE content_type='exercise' ORDER BY id").all().map(row=>({...row}));db.close();return rows;
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
const originalWire=publishedOriginals(),originals=originalWire.map(decoded),all=[...originals,...wire.additions.map(decoded)];

test('real original publisher produces all 1326 exact protected hashes accepted by pending authority',async()=>{
  const result=await selectGovernedFitRows(originals);
  assert.equal(result.incomplete,false,result.reason);assert.equal(result.rows.length,1326);assert.equal(result.expansionAccepted,0);
  assert.deepEqual(FIT_EXPANSION_SERVING_AUTHORITY.protected_v1,wire.protected_originals);
});
test('wire export reproduces every exact row and shared canonical hash without claiming trainer approval',async()=>{
  assert.deepEqual(release.additions,wire.additions);assert.equal(await catalogueRowsSha256(release.additions),wire.rows_sha256);
  assert.equal(release.additions.length,1542);assert.equal(release.manifest.supersedes.length,180);
  for(const row of release.items){assert.doesNotMatch(row.title,/draft|pending review/i);assert.equal(row.data.provenance.final_v1_acceptance,undefined);assert.equal(row.review.trainer_review,'pending');assert.equal(row.review.clinical_attestation,false);assert.equal(row.data.visual.status,'approved');}
});
test('2688 served protocols cover all 300 movements while physical2868 preserve all old row bytes and saved IDs',async()=>{
  const before=JSON.stringify(originalWire),result=await selectGovernedFitRows(all,wire.manifest);
  assert.equal(result.incomplete,false,result.reason);assert.equal(result.rows.length,2688);assert.equal(new Set(result.rows.map(row=>row.data.canonical_movement)).size,300);
  assert.equal(result.revisionAccepted,180);assert.equal(all.length,2868);assert.equal(JSON.stringify(originalWire),before);
  for(const revision of wire.manifest.supersedes){const replacement=result.rows.find(row=>row.id===revision.original_id);assert.equal(replacement.publication_id,revision.replacement_id);assert.ok(originalWire.some(row=>row.id===revision.original_id));}
  const pending=await selectGovernedFitRows(all);assert.equal(pending.rows.length,1326);assert.equal(pending.expansionAccepted,0);
});
test('paged serving retrieves beyond2500 and never drops additions',async()=>{
  const rows=[...originalWire,...wire.additions].sort((a,b)=>a.id<b.id?-1:1),calls=[];
  const DB={prepare(sql){assert.match(sql,/ORDER BY id LIMIT/);return{bind(after,limit){return{async all(){calls.push(after);return{results:rows.filter(row=>row.id>after).slice(0,limit)}}}}}}};
  const result=await loadGovernedFitCatalogue(DB,wire.manifest);assert.equal(result.allPublished.length,2868);assert.equal(result.authority.rows.length,2688);assert.equal(calls.length,6);
});
test('missing, stale, tampered or forged authority fails closed without changing protected originals',async()=>{
  for(const mutate of [
    (rows,m)=>rows.pop(),
    (rows,m)=>{rows[0].data.instructions[0]+=' Changed';rows[0].data_json=JSON.stringify(rows[0].data)},
    (rows,m)=>{rows.at(-1).data.dose_text='100 reps';rows.at(-1).data_json=JSON.stringify(rows.at(-1).data)},
    (rows,m)=>m.owner_instruction.trainer_attestation=true,
    (rows,m)=>m.supersedes[0].replacement_id=m.supersedes[1].replacement_id,
    (rows,m)=>m.additions.pop(),
    (rows,m)=>{rows.at(-1).review.status='pending';rows.at(-1).review_json=JSON.stringify(rows.at(-1).review)},
  ]){const rows=structuredClone(all),manifest=structuredClone(wire.manifest);mutate(rows,manifest);const result=await selectGovernedFitRows(rows,manifest);assert.equal(result.incomplete,true);assert.equal(result.rows.length,0);}
});
test('full original snapshot binds exact data and review bytes and rejects any existing addition ID',()=>{
  const bound=bindFitOriginalSnapshot(release,originalWire);assert.equal(bound.protected_snapshot.length,1326);assert.ok(bound.manifest.protected_v1.every(row=>row.data_sha256&&row.review_sha256));
  assert.throws(()=>bindFitOriginalSnapshot(release,[...originalWire,wire.additions[0]]),/overwrite/);
  const changed=structuredClone(originalWire);changed[0].title+=' changed';assert.throws(()=>bindFitOriginalSnapshot(release,changed));
});
test('source doses retain total-side and timed units, with no numeric changes',()=>{
  const kickback=release.items.find(row=>row.id==='SST-FIT-0171-V01'),legpress=release.items.find(row=>row.id==='SST-FIT-0224-V01');
  assert.equal(kickback.data.dosage.reps,5);assert.equal(kickback.data.dosage.sets,2);assert.equal(kickback.data.dosage.rest_seconds,75);assert.equal(kickback.data.dosage.side_scope,'total-across-both-arms');
  assert.equal(legpress.data.dosage.time_seconds,10);assert.equal(legpress.data.dosage.sets,4);assert.equal(legpress.data.dosage.rest_seconds,50);assert.equal(legpress.data.dosage.reps,undefined);assert.equal(legpress.data.dosage.unit,'seconds');
  assert.equal(ownerFitDoseFields(legpress).reps,null);assert.equal(ownerFitDoseFields(legpress).time_seconds,10);assert.equal(ownerFitDoseFields(legpress).dose_locked,true);assert.equal(ownerFitDoseFields(kickback).reps,5);
  for(const row of candidate.rows)assert.equal(fitDosage(row.proposedProtocol).dosage.prescription_text.startsWith(row.proposedProtocol.dose),true);
});
test('stale or fabricated review and owner bindings are rejected before export',()=>{
  for(const mutate of [x=>x.candidate.rows[0].proposedProtocol.dose='100 reps.',x=>x.ownerInstruction.candidate_hash='0'.repeat(64),x=>x.ownerInstruction.trainer_attestation=true,x=>x.nineReview.decisions[0].decision='FIX',x=>x.nineReview.decisions[0].reviewer.id=x.nineReview.decisions[0].author_ids[0]]){const data=structuredClone(input);mutate(data);assert.throws(()=>buildFitOwnerRelease(data));}
});
test('new protocol selection requires every listed kit item and never infers medical or advanced clearance',()=>{
  const data={provenance:{fit_owner_publication:{}},selection_constraints:{requires_all_equipment:true,required_equipment:['dumbbells','mat'],minimum_level:'beginner',floor_transfer:true}};
  const context={equipment:['dumbbells','mat'],restrictions:[],notes:'',text:'',level:'beginner'};
  assert.equal(ownerFitExerciseAllowed(data,context),true);assert.equal(ownerFitExerciseAllowed(data,{...context,equipment:['dumbbells']}),false);assert.equal(ownerFitExerciseAllowed(data,{...context,restrictions:['limited_floor_access']}),false);assert.equal(ownerFitExerciseAllowed(data,{...context,notes:'recent surgery'}),false);
  assert.equal(ownerFitExerciseAllowed({...data,selection_constraints:{...data.selection_constraints,minimum_level:'advanced'}},context),false);
  for(const body of [{preferences:'strength'},{preferences:'I want to build strength',limitations:{selected:[],notes:'I want to build strength'}}])assert.equal(ownerFitExerciseAllowed(data,{...context,...ownerFitRestrictionContext(body)}),true);
  for(const body of [{preferences:'knee pain'},{limitations:{selected:[],notes:'recent surgery'}}])assert.equal(ownerFitExerciseAllowed(data,{...context,...ownerFitRestrictionContext(body)}),false);
  assert.equal(ownerFitExerciseAllowed({...data,selection_constraints:{...data.selection_constraints,floor_transfer:false}},{...context,restrictions:['limited_floor_access']}),true);
});
test('full timed work and rest must fit the remaining session; prescriptions are never shortened to fit',()=>{
  const timed=release.items.find(row=>row.id==='SST-FIT-0224-V01').data;
  const original=JSON.stringify(timed),session=[{minutes:3},{minutes:6},{minutes:2}];
  assert.equal(timed.minutes,4); // 4x10s work +3x50s rest =190s, rounded up.
  assert.equal(fitRemainingMinutes(session,0,10),2);
  assert.equal(ownerFitWithinTime(timed,fitRemainingMinutes(session,0,10)),false);
  assert.equal(ownerFitWithinTime(timed,fitRemainingMinutes(session,0,15)),true);
  const long=release.items.find(row=>row.data.intensity.level==='beginner'&&row.data.minutes===16).data;
  assert.equal(ownerFitWithinTime(long,10),false);
  assert.equal(JSON.stringify(timed),original);assert.equal(timed.dosage.time_seconds,10);assert.equal(timed.dosage.rest_seconds,50);
  assert.equal(ownerFitWithinTime({minutes:16},10),true,'Legacy selection remains unchanged');
});
