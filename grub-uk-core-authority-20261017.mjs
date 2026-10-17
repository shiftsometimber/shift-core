// Exact source publication: independent human review or the separately recorded explicit owner waiver.
// Pending authoring files are never loaded here.
import {UK_CORE_PUBLICATION} from './grub-uk-core-publication-20261017.mjs';
const sha=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(b=>b.toString(16).padStart(2,'0')).join('');
export async function appendUKCorePublication(authority,publication=UK_CORE_PUBLICATION){
 if(authority.incomplete||publication.status==='pending')return authority;
 if(publication.proof!=='GRUB_UK_CORE_SOURCE_PUBLICATION_20261017'||publication.status!=='approved'||publication.reviewer?.kind!=='human'||!publication.items?.length)throw Error('Missing UK recipe publication authority');
 if(publication.acceptance_kind==='owner_review_waiver'&&(publication.human_review_claimed!==false||publication.physical_kitchen_trial_claimed!==false||publication.reviewer.id!=='Matt O’Brien'||publication.reviewer.role!=='owner'||!publication.waiver_digest))throw Error('Invalid owner waiver authority');
 const {release_id,...body}=publication;if(await sha(body)!==release_id)throw Error('UK publication changed');
 const ids=new Set(authority.rows.map(r=>r.id)),rows=[];
 for(const item of publication.items){
  if(ids.has(item.id)||item.review?.status!=='approved'||item.review?.reviewer?.kind!=='human'||item.review.author_ids?.includes(item.review.reviewer.id)||item.review?.physical_kitchen_trial_claimed!==false||item.data.nutrition?.status!=='validated'||await sha(item.data)!==item.data_sha256||await sha(item.review)!==item.review_sha256)throw Error('UK exact recipe publication changed');
  if(publication.acceptance_kind==='owner_review_waiver'&&(item.review.acceptance_kind!=='owner_review_waiver'||item.review.human_review_claimed!==false||item.review.owner_waiver_digest!==publication.waiver_digest||item.data.provenance?.uk_core_publication?.waiver_digest!==publication.waiver_digest))throw Error('Owner waiver binding changed');
  ids.add(item.id);const {data_sha256,review_sha256,...row}=item;rows.push(row);
 }
 return {...authority,ukCoreAccepted:rows.length,publishedTotal:Number(authority.publishedTotal||authority.rows.length)+rows.length,rows:[...authority.rows,...rows]};
}
