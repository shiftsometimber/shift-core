import test from 'node:test';
import assert from 'node:assert/strict';
import {shareCatalogue} from '../../scripts/share-my-timber-catalogue.mjs';
test('a shared catalogue retains every existing byte and requires an exact complete value match',()=>{
 const value={proof:'APPROVED_SOURCE',recipes:[{id:'one',method:['Keep a } inside the text.','Use your own choice.']}],status:'approved'};
 const original='var X='+JSON.stringify(value).replace(/"proof":/,'proof:')+';export function wrapSupportService(){}';
 const shared=shareCatalogue(original,value);assert(shared.source.startsWith(original));assert.match(shared.source,/export \{X as UK_FULL_PUBLICATION\}/);
 assert.throws(()=>shareCatalogue(original,{...value,status:'changed'}),/differs/);
 assert.throws(()=>shareCatalogue(original+original,value),/uniquely/);
});

test('the owner catalogue is shared by native reference, with functions unchanged and complete value validation',async()=>{
 const {shareOwnerCatalogue}=await import('../../scripts/share-my-timber-catalogue.mjs'),value={proof:'EXACT',rows:[{id:1,label:'real source'}]};
 const owner='var ROOT = '+JSON.stringify(value)+';export default {};',prior='var P='+JSON.stringify(value).replace('"proof":','proof:')+';function untouched(){return P.rows;}var provenance="EXACT";';
 const shared=shareOwnerCatalogue(owner,prior,value);assert(shared.owner.startsWith(owner));assert(shared.prior.endsWith(shared.proof.importStatement));assert(shared.prior.includes('function untouched(){return P.rows;}'));assert(!shared.prior.includes('"real source"'));assert(shared.proof.duplicateLiteralBytesRemoved>0);assert.deepEqual(shareOwnerCatalogue(shared.owner,shared.prior,value).prior,shared.prior);
 assert.throws(()=>shareOwnerCatalogue(owner,prior,{...value,rows:[]}),/differs/);
 assert.throws(()=>shareOwnerCatalogue(owner,prior.replace('real source','changed'),value),/differs/);
});
