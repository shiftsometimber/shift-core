// Offline owner-directed publication preparation. No trainer attestation is inferred.
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyFitCanonicalGuidance} from './fit-canonical-guidance-v1.mjs';
import {fitOriginalContent} from './fit-publication-contract-v1.mjs';
import {inspectDose,loadFitV3Inputs} from './scripts/fit-v3-closeout.mjs';
import {createFitPreview} from './preview/fit-grub/session-builder.js';
import {assertPublishableStructuredContent} from './structured-content-v1.js';

export const fitDigest = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export const FIT_OWNER_PUBLICATION_PROOF = 'FIT_OWNER_PUBLICATION_V1';
const requirementFor = createFitPreview([]).requirements;
const uniqueMap = (rows,key,label) => { const map = new Map(); for (const row of rows) { assert.ok(row[key] && !map.has(row[key]),`${label}: duplicate or missing ${key}`); map.set(row[key],row); } return map; };
const stripPending = value => String(value || '').replace(/^Suitability review pending\.\s*/,'');

export function prepareFitOwnerCandidate(source) {
  assert.equal(source.guides.length,300); assert.equal(source.rows.length,1542);
  const candidate = structuredClone(source);
  candidate.publicationPreparation = {sourceCandidateHash:fitDigest(source),authorityKind:'owner_publication_instruction',instruction:'Publish them all !!!!!!',trainerApprovalClaimed:false,clinicalApprovalClaimed:false,professionalReviewStatus:'pending',changes:[]};
  const guide = candidate.guides.find(row => row.id === '45-degree-sled-leg-press');
  const before = guide.modifications;
  guide.modifications = 'Make it easier: Choose the separate Armrest-assisted sit-to-stand exercise using its own setup and dose. The higher stable seat or fixed-support option belongs to that alternative, not to the leg-press machine. Do not improvise extra supports or alter the machine beyond its manufacturer-approved settings.\nAlternative in this library: Armrest-assisted sit-to-stand. Choose that exercise’s own dose; do not transfer this dose automatically.';
  candidate.publicationPreparation.changes.push({movementId:guide.id,field:'modifications',before,after:guide.modifications,reason:'Identify the existing sit-to-stand regression as a separate exercise, not an instruction to improvise the leg-press setup.'});
  for (const row of candidate.rows) {
    const guidance = candidate.guides.find(item => item.id === row.movementId);
    if (row.movementId === 'dumbbell-triceps-kickback') {
      const beforeInstructions = row.proposedProtocol.instructions;
      row.proposedProtocol.instructions += ' The listed repetitions are the total across both arms in each set, not an additional prescription for each arm. Divide them as evenly as possible between arms; for an odd total, alternate which arm gets the extra repetition on the next set or session. Set up securely for each arm. Take the stated between-set rest after completing both arms.';
      row.proposedProtocol.repetitionScope = 'total-across-both-arms';
      candidate.publicationPreparation.changes.push({id:row.id,movementId:row.movementId,field:'instructions',before:beforeInstructions,after:row.proposedProtocol.instructions,reason:'Preserve every original repetition, set and rest number; clarify the original each-limb-action count without doubling the total volume.'});
    }
    if (['dumbbell-triceps-kickback','45-degree-sled-leg-press'].includes(row.movementId)) {
      row.ownerResolution = {sourceCandidateSnapshotSha256:row.candidateSnapshotSha256,decision:row.movementId === 'dumbbell-triceps-kickback' ? 'retain_original_total_volume_with_explicit_two_arm_distribution' : 'retain_original_intermediate_timed_dynamic_repetitions',independentReview:'pending',trainerReview:'pending'};
    }
    const {guideHash:previousGuideHash,image,...writtenGuide} = guidance;
    guidance.guideHash = fitDigest(writtenGuide);
    row.guideHash = guidance.guideHash;
    row.candidateSnapshotSha256 = fitDigest({guide:writtenGuide,variant:row.proposedProtocol,imageSha256:row.imageSha256});
  }
  candidate.publicationPreparation.numericDosesChanged = 0;
  candidate.publicationPreparation.protocolsClarified = 9;
  candidate.publicationPreparation.publicationReady = false;
  return candidate;
}

export function fitServingGroup(guide) {
  const id = guide.id, type = guide.movementType;
  if (/high-to-low-chop|low-to-high-lift/.test(id)) return 'core';
  if (/clamshell/.test(id)) return 'legs';
  if (/reverse-snow-angel|external-rotation-at-side/.test(id)) return 'pull';
  if (/internal-rotation-at-side/.test(id)) return 'push';
  if (/Core|Loaded carry/.test(type)) return 'core';
  if (/cardio|Conditioning|Ballistic/.test(type)) return 'cardio';
  if (/Balance/.test(type)) return 'balance';
  if (/Stretch|Gentle|Controlled travel/.test(type)) return 'mobility';
  if (/Bodyweight lower body/.test(guide.category) || /leg|squat|lunge|deadlift|hip-|calf|heel|hamstring|step-|good-morning|glute|sit-to-stand|sit-to-wall|wall-sit/.test(id)) return 'legs';
  if (/row|pull|curl|reverse-fly|rear-delt|face-pull|shrug/.test(id)) return 'pull';
  if (/chest|push|press|triceps|dip|fly|raise|shoulder/.test(id)) return 'push';
  if (/seated-knee|knee-extension|knee-flexion|ankle|toe|bridge|swing/.test(id)) return 'legs';
  throw new Error(`Movement needs explicit serving group: ${id}`);
}

export function fitDosage(protocol) {
  const parsed = inspectDose(protocol.dose);
  assert.ok(parsed,`Unparsed prescription: ${protocol.id}`);
  const sideScope = protocol.repetitionScope || parsed.sideScope || 'total';
  const multiplier = /per side|each direction|per lead foot/.test(sideScope) ? 2 : 1;
  let dosage, workSeconds, restSeconds;
  if (parsed.unit === 'legacy_structured') {
    const values = parsed.values;
    dosage = {sets:values.sets,rest_seconds:values['rest seconds'],...(values.reps ? {reps:values.reps,unit:'repetitions'} : {time_seconds:values['time seconds'],unit:'seconds'})};
    workSeconds = values.sets * (values.reps ? values.reps * 4 : values['time seconds']);
    restSeconds = Math.max(0,values.sets-1)*values['rest seconds'];
  } else if (parsed.unit === 'repetitions') {
    dosage = {sets:parsed.sets,reps:parsed.repetitions,rest_seconds:parsed.restSeconds,unit:'repetitions'};
    workSeconds = parsed.sets*parsed.repetitions*4*multiplier; restSeconds = Math.max(0,parsed.sets*multiplier-1)*parsed.restSeconds;
  } else if (parsed.unit === 'seconds') {
    dosage = {sets:parsed.bouts,time_seconds:parsed.seconds,rest_seconds:parsed.restSeconds,unit:'seconds'};
    workSeconds = parsed.bouts*parsed.seconds*multiplier; restSeconds = Math.max(0,parsed.bouts*multiplier-1)*parsed.restSeconds;
  } else {
    dosage = {duration_minutes:parsed.minutes,unit:parsed.unit,rest_seconds:0};
    workSeconds = parsed.minutes*60; restSeconds = 0;
  }
  dosage.side_scope = sideScope;
  dosage.prescription_text = protocol.dose + (protocol.repetitionScope ? ' Total repetitions across both arms in each set.' : '');
  return {dosage,minutes:Math.max(1,Math.ceil((workSeconds+restSeconds)/60)),timing_kind:dosage.unit==='repetitions'?'estimate_at_four_seconds_per_repetition':'prescribed_work_and_rest'};
}

export function buildFitOwnerRelease({candidate,ownerInstruction,nineReview,preparedAt='2026-09-16T18:50:04Z'}) {
  assert.equal(candidate.guides.length,300); assert.equal(candidate.rows.length,1542);
  const candidateHash = fitDigest(candidate);
  assert.equal(ownerInstruction?.kind,'owner_publication_instruction');
  assert.equal(ownerInstruction?.quote,'Publish them all !!!!!!');
  assert.equal(ownerInstruction?.candidate_hash,candidateHash,'Owner instruction must bind the exact prepared candidate');
  assert.equal(ownerInstruction?.trainer_attestation,false,'Do not infer a trainer attestation');
  assert.equal(nineReview?.proof,'FIT_NINE_DOSE_CLARIFICATIONS_INDEPENDENT_AI_REVIEW_V1');
  assert.equal(nineReview.source_candidate_json_stringify_sha256,candidateHash);
  const specific = uniqueMap(nineReview.decisions,'id','Specific dose review'); assert.equal(specific.size,9);
  const guides = uniqueMap(candidate.guides,'id','Movement');
  const protocols = uniqueMap(candidate.rows,'id','Protocol');
  assert.equal(protocols.size,1542);
  const inputs = loadFitV3Inputs(), accepted = new Set(inputs.accepted.decisions.map(row => row.movement_id));
  const originals = inputs.source.filter(row => accepted.has(row.canonical_movement) && row.id.startsWith('industrial-v3-fit-'));
  assert.equal(originals.length,1326);
  const originalsById = uniqueMap(originals,'id','Original protocol'), images = uniqueMap(inputs.assets.records,'id','Approved image');
  const items = [], supersedes = [];
  for (const row of candidate.rows) {
    const guide = guides.get(row.movementId), image = images.get(row.movementId), protocol = row.proposedProtocol;
    const {guideHash,image:ignored,...writtenGuide} = guide;
    assert.equal(guideHash,fitDigest(writtenGuide),`Guide hash mismatch: ${guide.id}`);
    assert.equal(row.guideHash,guideHash);
    assert.equal(row.candidateSnapshotSha256,fitDigest({guide:writtenGuide,variant:protocol,imageSha256:row.imageSha256}),`Protocol hash mismatch: ${row.id}`);
    assert.equal(image.status,'approved'); assert.equal(image.sha256,row.imageSha256); assert.equal(image.image,guide.image.path);
    if (row.ownerResolution) {
      const decision = specific.get(row.id);
      assert.equal(decision?.decision,'PASS'); assert.equal(decision.candidateSnapshotSha256,row.candidateSnapshotSha256); assert.equal(decision.guideHash,row.guideHash);
      assert.equal(decision.reviewer.kind,'ai'); assert.ok(!decision.author_ids.includes(decision.reviewer.id)); assert.equal(decision.findings.length,0);
      assert.equal(decision.trainer_attestation,false); assert.equal(decision.clinical_attestation,false);
    } else assert.equal(row.objectiveReview.issues.length,0,`Unresolved objective issue: ${row.id}`);
    const replacement = row.disposition === 'existing-id-changed-draft';
    assert.ok(replacement || row.disposition === 'new-draft');
    const original = originalsById.get(row.id);
    if (replacement) { assert.ok(original); assert.equal(fitDigest(original),row.currentSourceSha256); }
    else assert.ok(!originalsById.has(row.id));
    const id = replacement ? `${row.id}--owner-v2-20260916` : row.id;
    if (replacement) supersedes.push({original_id:row.id,replacement_id:id});
    const requiredEquipment = requirementFor(guide).map(value => value.toLowerCase());
    const locations = /equipped home gym/.test(guide.location) ? ['gym','home'] : guide.location.split(/\s+/).filter(value => ['home','gym','outside','hotel','work'].includes(value));
    const group = fitServingGroup(guide), dosing = fitDosage(protocol);
    const data = {
      schema_version:1,canonical_movement:guide.id,variation_identity:protocol.label,movement_group:group,serving_groups:[group],
      instructions:[guide.setup,guide.cues,protocol.instructions],form_cues:[guide.equipmentSetup,guide.space],safety_cues:[stripPending(guide.safety),guide.mistakes],
      regressions:[guide.modifications],progressions:[],substitutions:guide.easier?[guide.easier]:[],equipment:requiredEquipment.length?requiredEquipment:['none'],equipment_description:guide.equipment,
      equipment_setup:guide.equipmentSetup,locations:[...new Set(locations)],floor_access:guide.floorAccess,movement_type:guide.movementType,
      limitations:structuredClone(original?.limitations || {avoid:[],caution:[]}),intensity:{level:protocol.difficulty},...dosing,
      selection_constraints:{requires_all_equipment:true,required_equipment:requiredEquipment,floor_transfer:guide.floorAccess!=='No floor transfer',ballistic_skill:guide.movementType==='Ballistic skill',minimum_level:protocol.difficulty,unreviewed_individual_restrictions:true},
      dose_text:dosing.dosage.prescription_text,visual:{status:'approved',asset_ref:guide.image.path,alt_text:`${guide.title}: approved canonical movement visual`,sha256:guide.image.sha256,canonical_movement:guide.id},
      provenance:{fit_owner_publication:{proof:FIT_OWNER_PUBLICATION_PROOF,authority_kind:'owner_publication_instruction',candidate_hash:candidateHash,source_id:row.id,source_protocol_hash:row.candidateSnapshotSha256,revision_of:replacement?row.id:null,guide_hash:row.guideHash,trainer_review:'pending',clinical_attestation:false}},
      canonical_review:{scope:'owner_published_exact_candidate',candidate_hash:candidateHash,source_protocol_hash:row.candidateSnapshotSha256,trainer_review:'pending'},
    };
    const review = {status:'approved',authority_kind:'owner_publication_instruction',instruction:structuredClone(ownerInstruction),source_protocol_hash:row.candidateSnapshotSha256,objective_review:structuredClone(row.objectiveReview),specific_dose_review:row.ownerResolution?structuredClone(specific.get(row.id)):null,trainer_review:'pending',clinical_attestation:false,retained_source_review:{programming:protocol.programmingReview,technique:protocol.techniqueReview,content:protocol.contentReview}};
    const title=protocol.name.replace(/\s*\(corrected draft\)\s*$/,'').trim();
    assert.ok(!/\b(?:draft|pending review)\b/i.test(title),'Editorial working labels cannot become product titles');
    const item = {id,contentType:'exercise',title,version:replacement?2:1,status:'published',data,review};
    assertPublishableStructuredContent(item); items.push(item);
  }
  assert.equal(supersedes.length,180); assert.equal(items.filter(item => !item.data.provenance.fit_owner_publication.revision_of).length,1362);
  assert.equal(new Set(items.map(item => item.id)).size,1542);
  const rows = items.map(item => ({id:item.id,content_type:item.contentType,title:item.title,version:item.version,status:'published',data_json:JSON.stringify(item.data),review_json:JSON.stringify(item.review),created_at:preparedAt,updated_at:preparedAt})).sort((a,b)=>a.id.localeCompare(b.id));
  const protectedOriginals = buildFitOriginalBindings(originals);
  const manifest = {proof:'FIT_OWNER_SERVING_AUTHORITY_V1',status:'approved',candidate_hash:candidateHash,owner_instruction:structuredClone(ownerInstruction),protected_v1:protectedOriginals,supersedes,additions:rows.map(row => ({id:row.id,title:row.title,version:row.version,source_id:JSON.parse(row.data_json).provenance.fit_owner_publication.source_id,canonical_movement:JSON.parse(row.data_json).canonical_movement,data_sha256:fitDigest(row.data_json),review_sha256:fitDigest(row.review_json)})),published_count:2868,served_count:2688,canonical_movements:300};
  return {proof:FIT_OWNER_PUBLICATION_PROOF,candidate_hash:candidateHash,items,rows,additions:rows,manifest,protected_originals:protectedOriginals,professional_review_status:'pending',production_mutated:false};
}

export function buildFitOriginalBindings(originals) {
  const visuals = new Map(JSON.parse(fs.readFileSync(new URL('./content/fit/premium-visual-production-v1.json',import.meta.url))).produced_candidates.map(row=>[row.canonical_movement,row]));
  return originals.map(source=>{
    const guided=applyFitCanonicalGuidance({...source,name:source.title}),visual=visuals.get(source.canonical_movement);
    assert.ok(visual);
    const equipment=[...new Set((source.equipment||[]).flatMap(value=>{const x=String(value).toLowerCase();return {bodyweight:['none'],none:['none'],dumbbell:['dumbbell','dumbbells'],band:['band','resistance band'],cable:['cable','full gym'],bike:['stationary bike','full gym'],'rowing-erg':['rowing erg','full gym']}[x]||[x]}))];
    const data={...source,equipment:equipment.length?equipment:['none'],instructions:guided.instructions||source.instructions||[],form_cues:[...(guided.form_cues||[]),...(guided.safety_cues||[])],safety_cues:guided.safety_cues||source.safety_cues||[],regressions:guided.regression?.instruction?[guided.regression.instruction]:source.regressions||[],progressions:guided.progression?.instruction?[guided.progression.instruction]:source.progressions||[],visual:{status:'approved',asset_ref:visual.asset,alt_text:guided.visual?.alt_text||`${visual.display_name}: START, MOVE and FINISH coaching sequence.`,geometry:'v3',canonical_movement:source.canonical_movement}};
    return {id:source.id,content_type:'exercise',content_hash:fitDigest(fitOriginalContent(data,source.title)),content_hash_algorithm:'fit_v1_content_v1'};
  }).sort((a,b)=>a.id.localeCompare(b.id));
}

export function bindFitOriginalSnapshot(release,existingRows) {
  assert.equal(release.proof,FIT_OWNER_PUBLICATION_PROOF);
  const existing = uniqueMap(existingRows,'id','Database snapshot'), snapshot = [];
  const fields = ['id','content_type','title','version','status','data_json','review_json','created_at','updated_at'];
  for (const expected of release.protected_originals) {
    const row = existing.get(expected.id); assert.ok(row,`Original Fit row missing: ${expected.id}`);
    assert.ok(fields.every(key => row[key] !== undefined),'Complete original row bytes required');
    assert.equal(row.content_type,'exercise'); assert.equal(row.status,'published');
    const data = JSON.parse(row.data_json), review = JSON.parse(row.review_json);
    assert.equal(fitDigest(fitOriginalContent(data,row.title)),expected.content_hash);
    assert.equal(data.provenance?.final_v1_acceptance?.accepted,true); assert.equal(review.status,'approved');
    snapshot.push(Object.fromEntries(fields.map(key => [key,row[key]])));
  }
  assert.equal(snapshot.length,1326);
  for (const row of release.rows) assert.ok(!existing.has(row.id),`Refusing existing Fit ID overwrite: ${row.id}`);
  const markerRows = existingRows.filter(row => row.content_type === 'exercise' && row.status === 'published' && JSON.parse(row.data_json).provenance?.final_v1_acceptance?.accepted === true);
  assert.equal(markerRows.length,1326);
  const manifest = {...structuredClone(release.manifest),protected_v1:snapshot.map(row => ({...release.protected_originals.find(x=>x.id===row.id),title:row.title,data_sha256:fitDigest(row.data_json),review_sha256:fitDigest(row.review_json)}))};
  return {...release,manifest,protected_snapshot:snapshot};
}
