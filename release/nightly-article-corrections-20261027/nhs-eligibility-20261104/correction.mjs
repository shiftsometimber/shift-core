import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import specs from './specs.json' with {type:'json'};
export {specs};
export const sha256=v=>createHash('sha256').update(String(v)).digest('hex');
export const scope={slug:'glp-1-nhs-eligibility',title:'GLP-1 NHS Eligibility: Who Qualifies for Weight Loss Injections',author:'SHIFT Team',published:'2026-11-03T04:00:15.349Z'};
export function correctBody(input){
 let body=String(input);
 for(const {id,from,to} of specs){assert.equal(body.split(from).length-1,1,'Missing or duplicate correction target: '+id);body=body.replace(from,to);}
 const signature=/^>\s*(?:[\*_])?(?:[—–-]\s*)?Matt O[’']Brien(?:[\*_])?\s*$/gm;
 assert.equal([...body.matchAll(signature)].length,1,'Unexpected or missing standalone signature');
 body=body.replace(signature,'>');
 assert(!/Matt O[’']Brien/.test(body),'Unreviewed personal attribution remains');
 assert(!/NICE authorises|NICE guidance says to stop tirzepatide|handled by appropriately regulated partners|Plenty of men tell us/.test(body));
 return body;
}
export function prepareCorrection(row,expectedBodySha256,modifiedAt){
 assert(Number.isSafeInteger(row.id)&&row.id>0,'Capture the real article id');
 assert.equal(row.slug,scope.slug);assert.equal(row.title,scope.title);assert.equal(row.author,scope.author);
 assert.equal(row.publish_at,scope.published);assert.equal(row.status,'published');
 assert.equal(row.route,'babylovegrowth','Require authenticated provenance, not media inference');
 assert.match(expectedBodySha256,/^[a-f0-9]{64}$/);assert.equal(sha256(row.body),expectedBodySha256,'Source changed');
 assert(Number.isFinite(Date.parse(modifiedAt))&&Date.parse(modifiedAt)>=Date.parse(row.updated_at||row.publish_at),'Invalid modification time');
 const after={...row,body:correctBody(row.body),updated_at:modifiedAt};
 return {status:'prepared; clinical and exact-copy release gates retained',deployed:false,before:{...row},after,beforeBodySha256:expectedBodySha256,afterBodySha256:sha256(after.body),
  update:{sql:"UPDATE knowledge_articles SET body=?,updated_at=? WHERE id=? AND slug=? AND status='published' AND body=? AND author=? AND publish_at=? AND updated_at IS ?",params:[after.body,modifiedAt,row.id,row.slug,row.body,row.author,row.publish_at,row.updated_at??null],requiredChanges:1},
  rollback:{sql:"UPDATE knowledge_articles SET body=?,updated_at=? WHERE id=? AND slug=? AND status='published' AND body=? AND author=? AND publish_at=? AND updated_at=?",params:[row.body,row.updated_at??null,row.id,row.slug,after.body,row.author,row.publish_at,modifiedAt],requiredChanges:1}};
}
