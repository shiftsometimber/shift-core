import {createHash} from 'node:crypto';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function buildUKOwnerWaivedPublication(pack,waiver){
 const need=(v,m)=>{if(!v)throw Error(m)};
 need(waiver?.proof==='GRUB_UK_OWNER_REVIEW_WAIVER_20261017'&&waiver.status==='authorised','Explicit owner review waiver required');
 need(waiver.owner?.id==='Matt O’Brien'&&waiver.owner.role==='owner'&&waiver.owner.kind==='human','Actual owner authority required');
 need(waiver.pack_sha256===hash(pack)&&waiver.pack_sha256==='f12fd840b0a5071b5988869b4c3fabdf26d9bdd4ab6c4bbc08c04a5bbebe2b38','Waiver applies only to the exact corrected pack');
 need(waiver.question==='Do you want to waive that review requirement and deploy the corrected catalogue, keeping nutrition and timings labelled as estimates and making no kitchen-tested claim?'&&waiver.answer==='Yea'&&waiver.authorised_at==='2026-10-17T23:31:23+01:00','Exact explicit owner decision required');
 need(waiver.human_editorial_review_claimed===false&&waiver.physical_cooking_trial_claimed===false,'Waiver cannot claim a review or trial');
 need(pack.publication_ready===false&&pack.candidates.length===14,'Exact fourteen drafts required');
 need(JSON.stringify(waiver.candidates)===JSON.stringify(pack.candidates.map(r=>({id:r.id,content_hash:r.content_hash}))),'Every exact candidate must be bound');
 const items=pack.candidates.map(candidate=>{
  const {content_hash,...body}=candidate;need(hash(body)===content_hash,'Draft content hash changed');
  const data=structuredClone(candidate.data);
  need(['kcal','protein_g','carbohydrate_g','fat_g','fibre_g'].every(k=>Number.isFinite(data.nutrition[k])&&data.nutrition[k]>=0)&&data.ingredients.length===data.ingredient_evidence.length,'Ingredient nutrition evidence required');
  data.provenance={uk_core_publication:{accepted:true,proof:'GRUB_UK_CORE_SOURCE_PUBLICATION_20261017',pack_digest:hash(pack),acceptance_kind:'owner_review_waiver',waiver_digest:hash(waiver)}};
  data.tags=['uk-core','familiar'];data.taxonomy={family_size:'scalable'};
  data.nutrition.status='validated';data.nutrition.validation_scope='ingredient_source_arithmetic_only';
  data.nutrition.methodology+=' Estimated nutrition: ingredient source arithmetic checked. Independent human editorial review waived by the owner; no physical cooking, timing or clinical validation.';
  const review={status:'approved',acceptance_kind:'owner_review_waiver',proof:waiver.proof,reviewer:waiver.owner,authorised_at:waiver.authorised_at,author_ids:candidate.review.author_ids,content_hash,owner_waiver_digest:hash(waiver),human_review_claimed:false,clinical_review_claimed:false,physical_kitchen_trial_claimed:false};
  const row={id:candidate.id,title:candidate.title,version:1,status:'published',data,review};
  return {...row,data_sha256:hash(data),review_sha256:hash(review)};
 });
 const publication={proof:'GRUB_UK_CORE_SOURCE_PUBLICATION_20261017',status:'approved',acceptance_kind:'owner_review_waiver',waiver_digest:hash(waiver),pack_digest:hash(pack),reviewer:waiver.owner,human_review_claimed:false,physical_kitchen_trial_claimed:false,items};
 return {...publication,release_id:hash(publication)};
}
