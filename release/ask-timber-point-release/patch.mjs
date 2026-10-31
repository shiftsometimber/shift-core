import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const sha=x=>createHash('sha256').update(x).digest('hex');
export function patchServingModule(input,manifest){
 assert.equal(manifest.baseline,'589a8ce131af1b5074b62328964f344d33043faf');
 assert.equal(manifest.candidate,'4230e524c194886d0dfe9095baed29e73fe0b1bf');
 assert.equal(manifest.hunks.length,6,'Exactly six reviewed changes required');
 const original=Buffer.from(input).toString('utf8');assert(Buffer.from(original).equals(Buffer.from(input)),'UTF-8 module required');
 let code=original,last=-1;const offsets=[];
 for(const h of manifest.hunks){assert(h.before&&h.after&&h.before!==h.after);const at=original.indexOf(h.before);assert(at>last&&original.indexOf(h.before,at+1)===-1,'Missing, ambiguous or reordered preimage');last=at;offsets.push(at);assert.equal(code.split(h.before).length,2,'Each preimage must occur exactly once');code=code.replace(h.before,h.after);}
 let restored=code;for(const h of [...manifest.hunks].reverse()){assert.equal(restored.split(h.after).length,2,'Each inverse must be unique');restored=restored.replace(h.after,h.before);}
 assert.equal(restored,original,'Every unrelated serving byte must remain exact');
 return{code,proof:{beforeSHA256:sha(input),afterSHA256:sha(code),hunks:6,offsets,exactInverse:true,candidate:manifest.candidate}};
}
export function assertOwnedDeployment(current,expected){assert.equal(current.versions?.length,1);assert.equal(current.versions[0].percentage,100);assert.equal(current.versions[0].version_id,expected,'Another deployment owns current traffic');}
