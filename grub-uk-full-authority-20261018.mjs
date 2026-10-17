// Applies exact ingredient/method corrections after the original immutable catalogue authority.
import {UK_FULL_PUBLICATION} from './grub-uk-full-publication-20261018.mjs';
const sha=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(x=>x.toString(16).padStart(2,'0')).join('');
let checked;
async function validate(pub){
 if(pub.proof!=='GRUB_UK_FULL_EXISTING_CORRECTIONS_20261018'||pub.status!=='owner_authorised'||pub.owner?.id!=='Matt O’Brien'||pub.owner?.role!=='owner'||pub.human_editorial_review_claimed!==false||pub.physical_cooking_trial_claimed!==false||pub.recipes.length!==2671||new Set(pub.recipes.map(r=>r.id)).size!==2671)throw Error('Missing exact full UK correction authority');
 const{release_id,...body}=pub;if(await sha(body)!==release_id)throw Error('Full UK correction publication changed');
 for(const row of pub.recipes)if(row.human_review_claimed!==false||row.physical_cooking_trial_claimed!==false||!row.source_sha256||await sha({id:row.id,title:row.title,data:row.data})!==row.content_sha256)throw Error('Full UK correction recipe changed');
 return new Map(pub.recipes.map(r=>[r.id,r]));
}
export async function applyFullUKCorrections(authority,pub=UK_FULL_PUBLICATION){
 if(authority.incomplete)return authority;
 const byId=await(pub===UK_FULL_PUBLICATION?(checked??=validate(pub)):validate(pub));
 const rows=await Promise.all(authority.rows.map(async row=>{
  const c=byId.get(row.id);if(!c)return row;
  if(await sha({title:row.title,data:row.data,review:row.review})!==c.source_sha256)throw Error('UK correction parent changed: '+row.id);
  const data={...c.data,provenance:{uk_full_correction:{accepted:true,proof:pub.proof,publication_digest:pub.release_id,source_sha256:c.source_sha256,source_baseline:pub.base,human_review_claimed:false}}};
  const review={status:'approved',proof:pub.proof,reviewer:{kind:'ai',id:'/root'},owner_authority:pub.owner,acceptance_kind:'owner_authorised_existing_recipe_correction',content_hash:c.content_sha256,human_review_claimed:false,physical_kitchen_trial_claimed:false,clinical_review_claimed:false};
  const{data_json,review_json,...base}=row;
  return {...base,title:c.title,data,review};
 }));
 return {...authority,rows,fullUKCorrected:true,correctionRelease:pub.release_id,humanReviewClaimed:false};
}
