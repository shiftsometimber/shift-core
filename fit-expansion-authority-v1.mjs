import {FIT_EXPANSION_SERVING_AUTHORITY} from './fit-expansion-serving-manifest-v1.mjs';
import {fitOriginalContent} from './fit-publication-contract-v1.mjs';
const sha=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const map=rows=>new Map(rows.map(row=>[row.id,row]));
const hashPattern=/^[a-f0-9]{64}$/;

export async function selectGovernedFitRows(rows,manifest=FIT_EXPANSION_SERVING_AUTHORITY) {
  const accepted=rows.filter(row=>row.data?.provenance?.final_v1_acceptance?.accepted===true);
  const base={active:true,expected:1326,accepted:accepted.length,expansionAccepted:0,publishedTotal:rows.length};
  const fail=reason=>({...base,incomplete:true,reason,rows:[]});
  if(manifest?.proof!=='FIT_OWNER_SERVING_AUTHORITY_V1'||!['pending','approved'].includes(manifest.status)||manifest.protected_v1?.length!==1326||!Array.isArray(manifest.additions)||!Array.isArray(manifest.supersedes))return fail('invalid_fit_manifest');
  const protectedIds=map(manifest.protected_v1),byId=map(rows);
  if(protectedIds.size!==1326||byId.size!==rows.length||accepted.length!==1326)return fail('original_fit_cohort_incomplete');
  if(accepted.some(row=>!protectedIds.has(row.id)||row.review?.status!=='approved'))return fail('original_fit_authority_mismatch');
  const hashes=await Promise.all(accepted.map(async row=>({id:row.id,content:await sha(JSON.stringify(fitOriginalContent(row.data,row.title))),data:await sha(row.data_json||JSON.stringify(row.data)),review:await sha(row.review_json||JSON.stringify(row.review))})));
  if(hashes.some(row=>{const binding=protectedIds.get(row.id);return binding.content_hash_algorithm!=='fit_v1_content_v1'||binding.content_hash!==row.content||(binding.data_sha256&&binding.data_sha256!==row.data)||(binding.review_sha256&&binding.review_sha256!==row.review)}))return fail('original_fit_content_changed');
  if(manifest.status==='pending') {
    if(manifest.additions.length||manifest.supersedes.length)return fail('pending_fit_manifest_has_additions');
    return {...base,incomplete:false,rows:accepted};
  }
  const instruction=manifest.owner_instruction;
  if(!hashPattern.test(manifest.candidate_hash||'')||!hashPattern.test(manifest.rows_sha256||'')||instruction?.kind!=='owner_publication_instruction'||instruction.quote!=='Publish them all !!!!!!'||instruction.candidate_hash!==manifest.candidate_hash||instruction.trainer_attestation!==false||instruction.clinical_attestation!==false||instruction.actor?.kind!=='human'||instruction.actor?.role!=='owner'||manifest.additions.length!==1542||manifest.supersedes.length!==180||manifest.published_count!==2868||manifest.served_count!==2688||manifest.canonical_movements!==300)return fail('invalid_fit_owner_authority');
  const bindings=map(manifest.additions);
  if(bindings.size!==1542)return fail('duplicate_fit_addition');
  const additions=[];
  for(const binding of manifest.additions){
    const row=byId.get(binding.id),p=row?.data?.provenance?.fit_owner_publication;
    if(!row||protectedIds.has(binding.id)||row.title!==binding.title||row.version!==binding.version||row.data.provenance.final_v1_acceptance||p?.proof!=='FIT_OWNER_PUBLICATION_V1'||p.candidate_hash!==manifest.candidate_hash||p.source_id!==binding.source_id||row.data.canonical_movement!==binding.canonical_movement||p.trainer_review!=='pending'||p.clinical_attestation!==false||row.review?.status!=='approved'||row.review.authority_kind!=='owner_publication_instruction'||JSON.stringify(row.review.instruction)!==JSON.stringify(instruction))return fail('fit_addition_missing_or_unapproved');
    additions.push(row);
  }
  const additionHashes=await Promise.all(additions.map(async row=>({id:row.id,data:await sha(row.data_json||JSON.stringify(row.data)),review:await sha(row.review_json||JSON.stringify(row.review))})));
  if(additionHashes.some(row=>row.data!==bindings.get(row.id).data_sha256||row.review!==bindings.get(row.id).review_sha256))return fail('fit_addition_content_changed');
  const superseded=new Set(),replacements=new Map();
  for(const revision of manifest.supersedes){
    const row=byId.get(revision.replacement_id);
    if(!protectedIds.has(revision.original_id)||!bindings.has(revision.replacement_id)||superseded.has(revision.original_id)||replacements.has(revision.replacement_id)||row.version!==2||row.data.provenance.fit_owner_publication.revision_of!==revision.original_id||row.data.provenance.fit_owner_publication.source_id!==revision.original_id)return fail('invalid_fit_supersession');
    superseded.add(revision.original_id);replacements.set(revision.replacement_id,revision.original_id);
  }
  if(additions.some(row=>Boolean(row.data.provenance.fit_owner_publication.revision_of)!==replacements.has(row.id)))return fail('unbound_fit_revision');
  const served=[...accepted.filter(row=>!superseded.has(row.id)),...additions.map(row=>replacements.has(row.id)?{...row,id:replacements.get(row.id),publication_id:row.id}:row)];
  if(served.length!==2688||map(served).size!==2688||new Set(served.map(row=>row.data.canonical_movement)).size!==300)return fail('fit_serving_partition_mismatch');
  return {...base,incomplete:false,expansionAccepted:additions.length,revisionAccepted:180,authorityKind:'owner_publication_instruction',rows:served};
}

export async function loadGovernedFitCatalogue(DB,manifest=FIT_EXPANSION_SERVING_AUTHORITY){
  const allPublished=[];let after='';
  for(;;){
    const {results=[]}=await DB.prepare("SELECT id,title,version,data_json,review_json,updated_at FROM structured_content WHERE content_type='exercise' AND status='published' AND id > ? ORDER BY id LIMIT ?").bind(after,500).all();
    if(!results.length)break;
    if(results.some((row,index)=>!row.id||row.id<=(index?results[index-1].id:after)))throw Error('fit_catalogue_pagination_invalid');
    allPublished.push(...results.map(row=>({...row,data:JSON.parse(row.data_json),review:JSON.parse(row.review_json)})));
    if(allPublished.length>10000)throw Error('fit_catalogue_partition_unexpected');
    if(results.length<500)break;after=results.at(-1).id;
  }
  return {allPublished,authority:await selectGovernedFitRows(allPublished,manifest)};
}

// New rows never infer individual clearance from the owner publication instruction.
export function ownerFitExerciseAllowed(data,context){
  if(!data?.provenance?.fit_owner_publication)return true;
  const c=data.selection_constraints;if(!c?.requires_all_equipment)return false;
  if(!c.required_equipment.every(kit=>kit==='none'||context.equipment.includes(kit)))return false;
  const levels={beginner:0,standard:1,intermediate:1,advanced:2};
  if((levels[String(c.minimum_level).toLowerCase()]??3)>(levels[String(context.level||'beginner').toLowerCase()]??0))return false;
  if(c.ballistic_skill)return false;
  if(context.restrictions?.some(value=>value!=='limited_floor_access')||context.notes?.trim())return false;
  if(c.floor_transfer&&context.restrictions?.includes('limited_floor_access'))return false;
  if(c.floor_transfer&&/limited.floor|no.floor|floor.access/.test(context.text))return false;
  return true;
}

export function ownerFitRestrictionContext(body){
  const restrictions=Array.isArray(body.limitations?.selected)?body.limitations.selected:[];
  const declared=String(body.limitations?.notes||(typeof body.limitations==='string'?body.limitations:'')).trim();
  // The current form duplicates its optional notes into preferences. Ordinary
  // goal words convey no individual restriction; unknown limitation notes still
  // retain the accepted catalogue rather than imply new clinical clearance.
  const goalOnly=/^(?:(?:i|we|want|would|like|to|my|our|goal|is|improve|build|more|less|better|general|fitness|strength|stamina|mobility|balance|weight|loss|lose|fat|muscle|tone|toning|energy|exercise|movement|training|cardio|cardiovascular|endurance|and|or|for|a|some|the)\b[\s,.;!-]*)+$/i;
  const preference=String(body.preferences||'');
  const restrictionInPreference=/\b(?:pain|injur\w*|surg\w*|pregnan\w*|arthritis|osteopor\w*|dizz\w*|medical|condition|restriction|limited|cannot|can't|avoid|no floor|bad knee|bad back)\b/i.test(preference);
  return {restrictions,notes:declared&&!goalOnly.test(declared)?declared:restrictionInPreference?preference:''};
}

export function ownerFitDoseFields(row){
  const data=row.data;
  if(!data?.provenance?.fit_owner_publication)return {};
  return {publication_id:row.publication_id||row.id,dose_locked:true,dose_text:data.dose_text,time_seconds:data.dosage?.time_seconds??null,reps:data.dosage?.reps??null};
}

export function fitRemainingMinutes(exercises,index,requestedMinutes){
  const budget=Math.max(0,Number(requestedMinutes)||30);
  return Math.max(0,budget-exercises.reduce((total,item,i)=>total+(i===index?0:Math.max(0,Number(item.minutes)||0)),0));
}
export function ownerFitWithinTime(data,availableMinutes){
  if(!data?.provenance?.fit_owner_publication)return true;
  return Number.isFinite(data.minutes)&&data.minutes>0&&data.minutes<=availableMinutes;
}
