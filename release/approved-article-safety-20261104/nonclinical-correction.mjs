import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import specs from './specs.json' with {type:'json'};
export const slug='glp-1-nhs-eligibility';
export const published='2026-11-03T04:00:15.349Z';
export const sha256=v=>createHash('sha256').update(String(v)).digest('hex');
const approvedIds=['unverified-experience','service-boundary','programme-owner'];
export const changes=approvedIds.map(id=>{const s=specs.find(x=>x.id===id);assert(s);return s;});
export function correctBody(input){
 let body=String(input);
 const resolved=[];
 for(const {id,from,to} of changes){
  let actual=from;
  if(id==='programme-owner'){
   const matches=body.match(/\[SHIFT programme and how it works\]\(https:\/\/shiftsometimber\.co\.uk\/?\)/g)||[];
   assert.equal(matches.length,1,'Missing/duplicate approved Programme owner');actual=matches[0];
  }
  assert.equal(body.split(actual).length-1,1,'Missing/duplicate approved target: '+id);body=body.replace(actual,to);resolved.push({from:actual,to});
 }
 const signature=/^>\s*(?:[\*_])?(?:[—–-]\s*)?Matt O[’']Brien(?:[\*_])?\s*$/gm;
 assert.equal([...body.matchAll(signature)].length,1,'Unexpected/missing standalone signature');
 body=body.replace(signature,'>');
 let restored=body;
 // Preserve every unrelated byte, including the still-held medical wording.
 for(const {from,to} of [...resolved].reverse()){assert.equal(restored.split(to).length-1,1);restored=restored.replace(to,from);}
 const beforeWithoutSignature=String(input).replace(signature,'>');
 assert.equal(restored,beforeWithoutSignature);
 return body;
}
export function prepareCorrection(row,expectedHash,modifiedAt){
 assert(Number.isSafeInteger(row.id)&&row.id>0);assert.equal(row.slug,slug);
 assert.equal(row.title,'GLP-1 NHS Eligibility: Who Qualifies for Weight Loss Injections');
 assert.equal(row.author,'SHIFT Team');assert.equal(row.status,'published');assert.equal(row.publish_at,published);
 assert.equal(row.route,'babylovegrowth');assert.match(expectedHash,/^[a-f0-9]{64}$/);assert.equal(sha256(row.body),expectedHash,'Source changed');
 assert(Number.isFinite(Date.parse(modifiedAt))&&Date.parse(modifiedAt)>=Date.parse(row.updated_at||row.publish_at));
 const after={...row,body:correctBody(row.body),updated_at:modifiedAt};
 return {scope:'Only three unchanged owner-approved non-clinical replacements and signature removal',clinicalChanges:false,before:{...row},after,beforeBodySha256:expectedHash,afterBodySha256:sha256(after.body),
 update:{sql:"UPDATE knowledge_articles SET body=?,updated_at=? WHERE id=? AND slug=? AND status='published' AND body=? AND author=? AND publish_at=? AND updated_at IS ?",values:[after.body,modifiedAt,row.id,row.slug,row.body,row.author,row.publish_at,row.updated_at??null]},
 rollback:{sql:"UPDATE knowledge_articles SET body=?,updated_at=? WHERE id=? AND slug=? AND status='published' AND body=? AND author=? AND publish_at=? AND updated_at=?",values:[row.body,row.updated_at??null,row.id,row.slug,after.body,row.author,row.publish_at,modifiedAt]}};
}
