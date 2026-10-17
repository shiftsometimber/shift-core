import {EVERYDAY_PUBLICATION,EVERYDAY_PUBLICATION_SHA256} from './grub-everyday-publication-v1.mjs';
const sha=async v=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))].map(x=>x.toString(16).padStart(2,'0')).join('');
const ids=['everyday-chicken-salad','everyday-chicken-salad-sandwich','everyday-ham-sandwich','everyday-tuna-sandwich','everyday-ham-salad','everyday-beans-on-toast','everyday-scrambled-eggs-on-toast'];
const scopes=['title','ingredients','method','equipment','allergens','nutrition','storage','food_safety','serving_metadata','member_humanness'];
export async function verifyEverydayPublication(p=EVERYDAY_PUBLICATION){
 if(await sha(p)!==EVERYDAY_PUBLICATION_SHA256||p.proof!=='GRUB_EVERYDAY_SOURCE_PUBLICATION_V1'||p.status!=='approved'||p.database_writes!==0||p.legacy_authority_changed!==false)throw Error('everyday_publication_changed');
 const a=p.owner_authority,review=p.independent_review;
 if(a?.proof!=='GRUB_EVERYDAY_OWNER_PUBLICATION_V1'||a.instruction!=='Deploy all'||a.recorded_at!=='2026-10-17T20:15:01Z'||a.actor?.id!=='Matt O’Brien'||a.actor.kind!=='human'||a.actor.role!=='owner'||a.human_editorial_review_claimed!==false||a.clinical_review_claimed!==false)throw Error('everyday_owner_authority_changed');
 if(review?.proof!=='EVERYDAY_GRUB_INDEPENDENT_AI_REVIEW_V1'||review.outcome!=='PASS'||review.reviewer?.kind!=='ai'||review.reviewer.id!=='/root/recipe_review'||review.human_review_claimed!==false||review.publication_authority!==false||await sha(review)!==a.review_document_sha256)throw Error('everyday_independent_review_changed');
 if(p.rows?.length!==7||p.candidates?.length!==7||review.decisions?.length!==7||await sha(p.rows)!==p.rows_sha256||new Set(p.rows.map(r=>r.id)).size!==7||ids.some(id=>!p.rows.some(r=>r.id===id)))throw Error('everyday_publication_partition_changed');
 const out=[];
 for(const row of p.rows){
  const candidate=p.candidates.find(r=>r.id===row.id),decision=review.decisions.find(r=>r.id===row.id);
  const {content_hash,...authored}=candidate;
  if(content_hash!==await sha(authored)||decision?.decision!=='PASS'||decision.content_hash!==content_hash||decision.findings?.length!==0||decision.author_ids?.includes(decision.reviewer?.id)||scopes.some(s=>!decision.scopes?.includes(s)))throw Error('everyday_recipe_review_changed');
  const data=JSON.parse(row.data_json),r=JSON.parse(row.review_json),accept=data.provenance?.grub_everyday_publication;
  if(row.content_type!=='recipe'||row.status!=='published'||row.title!==candidate.title||row.version!==1||r.status!=='approved'||data.nutrition?.status!=='validated'||accept?.accepted!==true||accept.release_id!==p.release_id||accept.candidate_hash!==content_hash||accept.independent_review_sha256!==await sha(review)||accept.owner_authority_sha256!==await sha(a)||data.provenance.final_v1_acceptance||data.provenance.grub_expansion_acceptance)throw Error('everyday_recipe_authority_changed');
  out.push({...row,data,review:r});
 }
 return out;
}
export async function appendEverydayPublication(authority,allDatabaseRows=[],publication=EVERYDAY_PUBLICATION){
 if(authority.incomplete)return authority;
 try{
  const additions=await verifyEverydayPublication(publication),existing=new Set([...allDatabaseRows,...authority.rows].map(r=>r.id));
  if(additions.some(r=>existing.has(r.id)))throw Error('everyday_source_id_collision');
  return {...authority,databasePublishedTotal:authority.publishedTotal,publishedTotal:authority.publishedTotal+7,everydayAccepted:7,everydayRelease:publication.release_id,rows:[...authority.rows,...additions]};
 }catch(e){return {...authority,incomplete:true,reason:e.message,rows:[]}}
}
