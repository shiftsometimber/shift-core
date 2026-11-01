import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const sha=value=>createHash('sha256').update(value).digest('hex');
export function deriveLoginPatch(before,after){
 let start=0;while(start<before.length&&start<after.length&&before[start]===after[start])start++;
 assert(start<before.length,'No compiled login repair');
 let end=0;while(end<before.length-start&&end<after.length-start&&before.at(-1-end)===after.at(-1-end))end++;
 const left=Math.max(0,start-512),rightBefore=Math.min(before.length,before.length-end+512),rightAfter=Math.min(after.length,after.length-end+512);
 const oldText=before.slice(left,rightBefore),newText=after.slice(left,rightAfter);
 assert(oldText.length<6500&&newText.length<9000,'Compiled repair exceeds login-only envelope');
 assert.match(oldText,/function withSessionState\(html\)/);
 assert.match(newText,/removeAttribute\('pattern'\)/);
 assert.equal(before.split(oldText).length,2);assert.equal(after.split(newText).length,2);
 assert.equal(after.replace(newText,oldText),before,'Every unrelated compiled byte must remain');
 return {oldText,newText,beforeSHA256:sha(before),afterSHA256:sha(after)};
}
export function applyLoginPatch(bytes,patch){
 const original=Buffer.from(bytes).toString('utf8');assert(Buffer.from(original).equals(Buffer.from(bytes)));
 assert.equal(original.split(patch.oldText).length,2,'Serving login preimage is absent or ambiguous');
 const code=original.replace(patch.oldText,patch.newText);
 assert.equal(code.split(patch.newText).length,2);assert.equal(code.replace(patch.newText,patch.oldText),original);
 return {code,proof:{beforeSHA256:sha(bytes),afterSHA256:sha(code),exactInverse:true}};
}
export function assertOwned(current,id){assert.equal(current.versions?.length,1);assert.equal(current.versions[0].percentage,100);assert.equal(current.versions[0].version_id,id,'Serving deployment moved');}
export function assertSettings(after,before,annotations){assert.deepEqual(after,{...before,annotations:{...before.annotations,...annotations}},'Only release annotations may change');}
