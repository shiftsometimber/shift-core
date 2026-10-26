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
