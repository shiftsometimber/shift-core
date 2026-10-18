// Authoring-side gate. This module is never imported into the member Worker.
import {createHash} from 'node:crypto';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const ukReviewScopes=['title','ingredients','method','equipment','allergens','nutrition','storage','food_safety','serving_metadata','member_humanness'];
const need=(v,m)=>{if(!v)throw Error(m)};
export function buildUKCorePublication(pack,review){
 need(pack?.proof==='GRUB_UK_CORE_AUTHORING_DRAFT_20261017'&&pack.publication_ready===false,'Exact UK authoring pack required');
 need(review?.proof==='GRUB_UK_HUMAN_SECOND_PERSON_REVIEW_20261017'&&review.status==='approved','Real independent human second-person review is required; AI self-review and deployment authority do not substitute');
 need(review.pack_sha256===hash(pack)&&review.reviewer?.kind==='human'&&review.reviewer.id?.trim()&&Number.isFinite(Date.parse(review.reviewed_at))&&review.source_receipt?.trim(),'Exact pack, actual reviewer, date and review receipt required');
 need(review.physical_cooking_trial_claimed===false,'No physical cooking trial has been supplied for this pack');
 const decisions=new Map((review.recipes||[]).map(r=>[r.id,r]));
 need(decisions.size===pack.candidates.length,'Every exact new recipe needs a decision');
 const items=pack.candidates.map(candidate=>{
  const d=decisions.get(candidate.id);
  const {content_hash,...body}=candidate;need(hash(body)===content_hash,'Draft content hash changed: '+candidate.id);
  need(candidate.status==='draft'&&candidate.publication_ready===false&&!candidate.review.author_ids.includes(review.reviewer.id),'Independent reviewer required');
  need(d?.decision==='PASS'&&d.content_hash===candidate.content_hash&&ukReviewScopes.every(s=>d.scopes?.includes(s))&&Array.isArray(d.findings)&&d.findings.length===0,'Missing or unresolved exact recipe review: '+candidate.id);
  need(['kcal','protein_g','carbohydrate_g','fat_g','fibre_g'].every(k=>Number.isFinite(candidate.data.nutrition[k])&&candidate.data.nutrition[k]>=0),'Complete ingredient nutrition required: '+candidate.id);
  need(candidate.data.ingredients.length===candidate.data.ingredient_evidence.length,'Every ingredient needs evidence: '+candidate.id);
  const data=structuredClone(candidate.data);
  data.provenance={uk_core_publication:{accepted:true,proof:'GRUB_UK_CORE_SOURCE_PUBLICATION_20261017',pack_digest:hash(pack)}};
  data.tags=['uk-core','familiar'];data.taxonomy={family_size:'scalable'};
  data.nutrition.status='validated';data.nutrition.methodology+=' Exact content accepted by an independent human editorial reviewer; estimated nutrition, not physical cooking or clinical validation.';
  const row={id:candidate.id,title:candidate.title,version:1,status:'published',data,review:{status:'approved',proof:review.proof,reviewer:review.reviewer,reviewed_at:review.reviewed_at,source_receipt:review.source_receipt,author_ids:candidate.review.author_ids,scopes:ukReviewScopes,content_hash:candidate.content_hash,human_review_claimed:true,clinical_review_claimed:false,physical_kitchen_trial_claimed:false}};
  return {...row,data_sha256:hash(data),review_sha256:hash(row.review)};
 });
 const publication={proof:'GRUB_UK_CORE_SOURCE_PUBLICATION_20261017',status:'approved',review_digest:hash(review),pack_digest:hash(pack),reviewer:review.reviewer,items};
 return {...publication,release_id:hash(publication)};
}
