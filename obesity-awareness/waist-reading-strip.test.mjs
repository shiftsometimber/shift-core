import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {amendWaistAwarenessRoute,amendSupportingDocument} from './candidate.mjs';
const source=readFileSync(new URL('../release/tool-page-schema-20261008/%2Ftools%2Fwaist-height.after.html'.replaceAll('%','%25'),import.meta.url),'utf8');
const before='<a href="/guides/nhs-weight-loss-medication-pathways">NHS medication guide</a> · <a href="/mounjaro">Mounjaro for men</a>';
const after='<a href="/male-obesity">Understand obesity and choose one step</a> · <a href="/start-here">Start Here</a>';
test('archived full tool document changes only the approved pair',()=>{
 const result=amendWaistAwarenessRoute('/tools/waist-height',source);
 assert.equal(result,source.replace(before,after));
 assert.ok(result.includes('<a href="/tools/bmi">BMI calculator</a>'));
});
test('homepage, BMI, medicine and other routes remain byte-identical',()=>{
 for(const path of ['/','/index','/home','/tools/bmi','/mounjaro','/start-here','/tools/waist-height-other'])
  assert.equal(amendWaistAwarenessRoute(path,source),source);
});
test('second pass is idempotent and supporting adapter retains contextual paragraph',()=>{
 const result=amendSupportingDocument('/tools/waist-height',source);
 assert.ok(result.includes(after));
 assert.equal((result.match(/data-obesity-context-link/g)||[]).length,1);
 assert.equal(amendSupportingDocument('/tools/waist-height',result),result);
});
test('missing, duplicated or changed reading strip fails closed',()=>{
 for(const input of [source.replace('<strong>Useful next reads: </strong>',''),source+source,source.replace('NHS medication guide','Changed guide'),source.replace('BMI calculator</a>','Changed BMI</a>')])
  assert.throws(()=>amendWaistAwarenessRoute('/tools/waist-height',input),/awareness_waist_source_drift/);
});
test('same medicine links outside the reading strip remain unchanged',()=>{
 const outside='<div>'+before+'</div>';
 const result=amendWaistAwarenessRoute('/tools/waist-height',outside+source);
 assert.ok(result.startsWith(outside));
 assert.equal(result,outside+source.replace(before,after));
});
