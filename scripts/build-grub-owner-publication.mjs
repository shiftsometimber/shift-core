import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {buildIndustrialCatalogue} from '../industrial-catalogue-v14.js';
import {buildGrubExpansionPublication,normaliseGrubEditorialEvidence,REVIEW_SCOPES} from '../grub-expansion-publication-v1.mjs';
import {protectedRevisionContentHash} from '../grub-protected-revisions-v2.mjs';
import {assertPublishableStructuredContent} from '../structured-content-v1.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const directory=path.join(root,'evidence/grub-expansion-closeout-2026-09-16');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const need=(condition,message)=>{if(!condition)throw new Error(message)};
const textHash=text=>createHash('sha256').update(text).digest('hex');

export function buildProtectedGrubPublication({pack,review,instruction,protectedOriginals}){
  need(pack.proof==='GRUB_PROTECTED_RECIPE_REVISIONS_V2'&&pack.candidates?.length===12,'exact twelve-recipe revision candidate required');
  need(review.proof==='GRUB_PROTECTED_REVISIONS_V2_INDEPENDENT_AI_REVIEW'&&review.outcome==='PASS'&&review.decisions?.length===12&&review.candidate_digest===pack.candidate_digest,'exact independent protected revision review required');
  need(instruction.status==='authorised'&&instruction.instruction==='Publish them all !!!!!!'&&instruction.scope.grub_protected_corrections===12,'protected revision owner instruction required');
  const originals=new Map(protectedOriginals.map(row=>[row.id,row]));
  const decisions=new Map(review.decisions.map(row=>[row.id,row]));
  const additions=[],revisions=[],seen=new Set();
  for(const row of pack.candidates){
    const decision=decisions.get(row.id);
    need(!seen.has(row.id)&&!originals.has(row.id)&&originals.get(row.original_id)?.content_hash===row.expected_source_content_hash,'protected revision source mismatch');seen.add(row.id);
    need(protectedRevisionContentHash(row)===row.content_hash&&decision?.content_hash===row.content_hash&&decision.original_id===row.original_id&&decision.expected_source_content_hash===row.expected_source_content_hash,'protected revision content changed');
    need(decision.decision==='PASS'&&decision.reviewer?.kind==='ai'&&!row.author_ids.includes(decision.reviewer.id)&&JSON.stringify(decision.author_ids)===JSON.stringify(row.author_ids)&&Number.isFinite(Date.parse(decision.reviewed_at))&&REVIEW_SCOPES.every(scope=>decision.scopes.includes(scope))&&decision.findings.length===0,'protected revision independent review incomplete');
    const item=structuredClone(row.structured_item_draft);
    need(item.status==='draft'&&item.version===2&&item.id===row.id,'revision must originate from the reviewed draft');
    item.status='published';
    item.data.provenance={grub_protected_revision:{proof:'GRUB_PROTECTED_RECIPE_PUBLICATION_V2',accepted:true,original_id:row.original_id,expected_source_content_hash:row.expected_source_content_hash,content_hash:row.content_hash,owner_instruction_sha256:hash(instruction),independent_review_sha256:hash(review)}};
    item.review={status:'approved',scope:'exact_protected_recipe_revision',content_hash:row.content_hash,reviewer:decision.reviewer,reviewed_at:decision.reviewed_at,scopes:decision.scopes,author_ids:decision.author_ids,findings:[],human_review_claimed:false,owner_publication:{proof:'GRUB_OWNER_PUBLICATION_INSTRUCTION_V1',instruction:instruction.instruction,actor:instruction.actor,recorded_at:instruction.recorded_at,human_editorial_review_claimed:false}};
    assertPublishableStructuredContent(item);
    const addition={id:item.id,content_type:'recipe',title:item.title,version:2,status:'published',data_json:JSON.stringify(item.data),review_json:JSON.stringify(item.review),created_at:instruction.recorded_at,updated_at:instruction.recorded_at};
    additions.push(addition);revisions.push({id:item.id,title:item.title,original_id:row.original_id,source_content_hash:row.expected_source_content_hash,content_hash:row.content_hash,data_sha256:textHash(addition.data_json),review_sha256:textHash(addition.review_json)});
  }
  need(new Set(revisions.map(row=>row.original_id)).size===12,'revision original identities must be unique');
  return {additions,revisions};
}

// These reconstructed rows are only a deterministic source input. Their invented
// metadata is explicitly marked and must never be used as a production snapshot.
export function reconstructOriginalGrubSourceRows(){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'grub-owner-source-'));
  try{
    execFileSync(process.execPath,['grub-v1-publication-pack.mjs'],{cwd:root,stdio:'pipe',env:{...process.env,COFID_INDEX:path.join(root,'tests/fixtures/grub-cofid-2021-governed-subset.json'),GRUB_PUBLICATION_DIR:temp,GRUB_DECISIONS_FILE:path.join(root,'evidence/grub-v1-final-decisions-2026-08-14.json')}});
    const payload=read(path.join(temp,'grub-v1-publishable.json'));
    const acceptance=read(path.join(root,'evidence/matt-v1-final-content-acceptance-2026-08-14.json'));
    const raw=new Map(buildIndustrialCatalogue().recipes.map(row=>[row.id,row]));
    return payload.items.map(item=>({id:item.id,content_type:'recipe',title:item.title,version:1,status:'published',data_json:JSON.stringify({...raw.get(item.id),...item.data,provenance:{final_v1_acceptance:{accepted:true,proof:acceptance.proof,reviewer:acceptance.reviewer,accepted_at:acceptance.accepted_at}}}),review_json:JSON.stringify(item.review),created_at:'OFFLINE_SOURCE_RECONSTRUCTION',updated_at:'OFFLINE_SOURCE_RECONSTRUCTION'}));
  }finally{fs.rmSync(temp,{recursive:true,force:true})}
}

export function buildGrubOwnerPublication({existingRows}={}){
  const instruction=read(path.join(root,'evidence/owner-publication-instruction-2026-09-16.json'));
  need(instruction.proof==='SHIFT_OWNER_PUBLICATION_INSTRUCTION_V1'&&instruction.status==='authorised'&&instruction.instruction==='Publish them all !!!!!!','explicit recorded owner instruction required');
  const archive=fs.readFileSync(path.join(directory,'grub-additive-candidate.json.gz'));
  need(createHash('sha256').update(archive).digest('hex')===instruction.grub_candidate_gzip_sha256,'owner-authorised recipe candidate changed');
  const result=JSON.parse(gunzipSync(archive)),decisions=read(path.join(directory,'independent-editorial-review.json')),authorship=read(path.join(directory,'authorship.json'));
  const normalized=normaliseGrubEditorialEvidence(decisions);
  const ownerAcceptance={proof:'GRUB_OWNER_PUBLICATION_INSTRUCTION_V1',status:'authorised',instruction:instruction.instruction,actor:instruction.actor,recorded_at:instruction.recorded_at,human_editorial_review_claimed:false,candidate_sha256:hash(result),independent_review_sha256:hash(normalized),authorship_sha256:hash(authorship),families:normalized.families.map(family=>({...structuredClone(family),decision:'AUTHORISE_PUBLICATION'}))};
  const sourceRows=existingRows||reconstructOriginalGrubSourceRows();
  const release=buildGrubExpansionPublication({result,decisions,authorship,ownerAcceptance,existingRows:sourceRows});
  const at=instruction.recorded_at;
  const additions=release.items.map(item=>({id:item.id,content_type:'recipe',title:item.title,version:item.version,status:'published',data_json:JSON.stringify(item.data),review_json:JSON.stringify(item.review),created_at:at,updated_at:at}));
  const revisionBytes=fs.readFileSync(path.join(directory,'protected-revisions-v2.json'));
  const revisionReview=read(path.join(directory,'protected-revisions-v2-independent-review.json'));
  need(textHash(revisionBytes)===revisionReview.input_file_sha256,'protected revision reviewed file changed');
  const corrected=buildProtectedGrubPublication({pack:JSON.parse(revisionBytes),review:revisionReview,instruction,protectedOriginals:result.protected_v1});
  return {proof:'GRUB_OWNER_PUBLICATION_BUILD_V1',owner_instruction_sha256:hash(instruction),ownerAcceptance,additions:[...additions,...corrected.additions],serving_manifest:{...release.serving_manifest,revisions:corrected.revisions},protected_originals:result.protected_v1.map(row=>({...row,content_type:'recipe',content_hash_algorithm:'grub_original_v1'})),source_reconstruction_only:!existingRows};
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  const output=process.argv[2]||path.join(root,'evidence/grub-owner-publication-2026-09-16');
  fs.mkdirSync(output,{recursive:true});
  const result=buildGrubOwnerPublication();
  fs.writeFileSync(path.join(output,'grub-owner-publication.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({proof:result.proof,additions:result.additions.length,protected:result.protected_originals.length,rows_sha256:hash(result.additions),source_reconstruction_only:result.source_reconstruction_only}));
}
