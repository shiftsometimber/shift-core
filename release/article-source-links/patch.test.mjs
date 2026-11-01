import assert from 'node:assert/strict';
import test from 'node:test';
import {deriveArticlePatch,applyArticlePatch} from './patch.mjs';
const old='// before.mjs\nconst before=1;\n// babylove/dynamic-public.mjs\nfunction inline(){return 1}\n// after.mjs\nconst after=2;\n';
const candidate=old.replace('function inline(){return 1}','function articleSource(){return "shift-contributor"}\nfunction inline(){return 2}');
test('compiled correction preserves every byte outside the article module and the serving inverse',()=>{
 const patch=deriveArticlePatch(old,candidate);
 const serving='independent serving wrapper\n'+old+'\nlatest unrelated login repair';
 const result=applyArticlePatch(Buffer.from(serving),patch);
 assert.equal(result.code,'independent serving wrapper\n'+candidate+'\nlatest unrelated login repair');
 assert.equal(result.proof.exactInverse,true);
});
test('reject any extra compiled change outside the approved article',()=>{
 assert.throws(()=>deriveArticlePatch(old,candidate.replace('before=1','before=3')),/outside/);
});
test('reject absent or ambiguous serving preimages',()=>{
 const patch=deriveArticlePatch(old,candidate);
 assert.throws(()=>applyArticlePatch(Buffer.from(candidate),patch),/absent or ambiguous/);
 assert.throws(()=>applyArticlePatch(Buffer.from(old+old),patch),/absent or ambiguous/);
});
