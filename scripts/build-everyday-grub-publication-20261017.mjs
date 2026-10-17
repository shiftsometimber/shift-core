// Offline, exact seven-row source publication. No credentials or DB writes.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {assertPublishableStructuredContent} from '../structured-content-v1.js';
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const raw=readFileSync('content/grub/everyday-meals-draft-20261017.json','utf8'),pack=JSON.parse(raw);
const reviewRaw=readFileSync(process.env.EVERYDAY_REVIEW_FILE||'../independent-everyday-review/review-final.json','utf8'),review=JSON.parse(reviewRaw);
const need=(ok,m)=>{if(!ok)throw Error(m)};
need(createHash('sha256').update(raw).digest('hex')===review.input_file_sha256,'Exact reviewed draft file required');
need(review.proof==='EVERYDAY_GRUB_INDEPENDENT_AI_REVIEW_V1'&&review.outcome==='PASS'&&review.reviewer?.kind==='ai'&&review.reviewer.id==='/root/recipe_review'&&review.human_review_claimed===false&&review.publication_authority===false,'Honest independent AI review required');
const rows=pack.candidates;
need(rows.length===7&&review.decisions.length===7&&new Set(rows.map(r=>r.id)).size===7,'Exactly seven drafts and decisions required');
for(const r of rows){const {content_hash,...candidate}=r,d=review.decisions.find(x=>x.id===r.id);need(content_hash===digest(candidate)&&d?.content_hash===content_hash&&d.decision==='PASS'&&d.findings.length===0&&!d.author_ids.includes(d.reviewer.id),'Exact independent PASS required: '+r.id)}
const authority={proof:'GRUB_EVERYDAY_OWNER_PUBLICATION_V1',instruction:'Deploy all',actor:{id:'Matt O’Brien',kind:'human',role:'owner'},recorded_at:'2026-10-17T20:15:01Z',source:'Explicit instruction in this Grub competitor/ease conversation, following the seven-draft and implemented-feature preview',recipe_ids:rows.map(r=>r.id),candidate_hashes:rows.map(r=>({id:r.id,content_hash:r.content_hash})),review_document_sha256:digest(review),human_editorial_review_claimed:false,clinical_review_claimed:false,physical_kitchen_trial_claimed:false};
const release_id=digest({proof:'GRUB_EVERYDAY_SOURCE_PUBLICATION_V1',authority,candidates:rows.map(r=>({id:r.id,hash:r.content_hash}))});
const published=rows.map(r=>{
 const d=review.decisions.find(x=>x.id===r.id);
 const data={...r.data,nutrition:{...r.data.nutrition,status:'validated',methodology:'CoFID 2021 ingredient-level estimate; exact recipe and evidence independently AI reviewed. Household portions, brands and measurements vary.'},provenance:{grub_everyday_publication:{proof:'GRUB_EVERYDAY_SOURCE_PUBLICATION_V1',accepted:true,release_id,candidate_hash:r.content_hash,independent_review_sha256:digest(review),owner_authority_sha256:digest(authority)}}};
 const decision={status:'approved',decision_source:review.proof,content_hash:r.content_hash,reviewer:d.reviewer,author_ids:d.author_ids,reviewed_at:d.reviewed_at,scopes:d.scopes,findings:[],human_review_claimed:false,clinical_review_claimed:false,owner_publication:authority};
 assertPublishableStructuredContent({id:r.id,contentType:'recipe',status:'published',data,review:decision});
 return {id:r.id,content_type:'recipe',title:r.title,version:1,status:'published',data_json:JSON.stringify(data),review_json:JSON.stringify(decision),created_at:review.reviewed_at,updated_at:review.reviewed_at};
});
const publication={proof:'GRUB_EVERYDAY_SOURCE_PUBLICATION_V1',status:'approved',release_id,owner_authority:authority,independent_review:review,candidates:rows,rows:published,rows_sha256:digest(published),database_writes:0,legacy_authority_changed:false};
const output='// Immutable seven-row source publication. No recipe generation at runtime.\nexport const EVERYDAY_PUBLICATION='+JSON.stringify(publication)+';\nexport const EVERYDAY_PUBLICATION_SHA256='+JSON.stringify(digest(publication))+';\n';
writeFileSync('grub-everyday-publication-v1.mjs',output);
mkdirSync('evidence/grub-everyday-20261017',{recursive:true});writeFileSync('evidence/grub-everyday-20261017/independent-review.json',reviewRaw);
console.log(JSON.stringify({release_id,publication_sha256:digest(publication),rows:published.length,reviewer:review.reviewer.id,database_writes:0}));
