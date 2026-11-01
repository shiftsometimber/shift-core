import assert from 'node:assert/strict';
import test from 'node:test';
import {deriveArticlePatch,applyArticlePatch,expectedRenderedDocument} from './patch.mjs';
const literal='const literal="'+['$&','$$',"$'",'$`'].join(' ')+'";\n';
const old='// before.mjs\nconst before=1;\n// babylove/dynamic-public.mjs\n'+literal+'function inline(){return 1}\n// after.mjs\nconst after=2;\n';
const candidate=old.replace('function inline(){return 1}','function articleSource(){return "shift-contributor"}\nfunction inline(){return 2}');
test('compiled correction preserves literal replacement tokens, unrelated serving bytes and the exact inverse',()=>{
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
const source='Evidence [paper](https://example.org/paper(25)/fulltext)';
const oldAnchor='<a href="https://example.org/paper(25">paper</a>/fulltext)';
const newAnchor='<a href="https://example.org/paper(25)/fulltext">paper</a>';
const oldRender=s=>'<p>'+(s===source?'Evidence ':'')+oldAnchor+'</p>';
const newRender=s=>'<p>'+(s===source?'Evidence ':'')+newAnchor+'</p>';
test('final page proof retains existing shell transformations while admitting only the exact citation repair',()=>{
 const page='<main><p class="current">Evidence '+oldAnchor+'</p></main>';
 const expected='<main><p class="current">Evidence '+newAnchor+'</p></main>';
 assert.equal(expectedRenderedDocument(page,source,oldRender,newRender).html,expected);
});
test('final page proof rejects unrelated wording changes and missing citation preimages',()=>{
 const page='<main>Evidence '+oldAnchor+'</main>';
 assert.throws(()=>expectedRenderedDocument(page,source,oldRender,s=>newRender(s).replace('Evidence','Changed claim')),/every changed/);
 assert.throws(()=>expectedRenderedDocument('<main>Absent citation</main>',source,oldRender,newRender),/actual live document/);
});
