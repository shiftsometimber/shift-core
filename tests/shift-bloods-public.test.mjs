import test from 'node:test';
import assert from 'node:assert/strict';
import {PUBLIC_BLOODS_PATHS,INDEXABLE_BLOODS_PATHS,isPublicBloodsRequest,addBloodsEntry,BLOODS_ENTRY_STYLE} from '../shift-bloods-public.mjs';
test('All nine approved information routes support GET and HEAD, including query strings and trailing slash',()=>{
 assert.equal(PUBLIC_BLOODS_PATHS.length,9);assert.equal(INDEXABLE_BLOODS_PATHS.length,4);
 for(const path of PUBLIC_BLOODS_PATHS)for(const method of ['GET','HEAD'])for(const suffix of ['','/','?source=health'])assert.equal(isPublicBloodsRequest(new Request('https://shiftsometimber.co.uk'+path+suffix,{method})),true);
});
test('The public content route does not accept ordering methods or invented clinical/member routes',()=>{
 for(const method of ['POST','PUT','DELETE'])assert.equal(isPublicBloodsRequest(new Request('https://shiftsometimber.co.uk/shift-health/blood-tests',{method})),false);
 for(const path of ['/','/shift-health','/shift-health/blood-tests/order','/shift-health/blood-tests/results','/member/blood-tests','/v1/blood-tests'])assert.equal(isPublicBloodsRequest(new Request('https://shiftsometimber.co.uk'+path)),false);
});
test('The approved entry is inserted once at the Health catalogue anchor with the requested green CTA',()=>{
 const before='<main><h1>SHIFT Health</h1><section class="wrap intro">Existing catalogue</section></main>';
 const after=addBloodsEntry(before);
 assert.equal((after.match(/id="health-bloods-heading"/g)||[]).length,1);
 assert.match(after,/href="\/shift-health\/blood-tests"/);assert.match(after,/Ordering is not open yet/);
 assert.match(BLOODS_ENTRY_STYLE,/color:#707762/);
 assert.throws(()=>addBloodsEntry('<section>No expected insertion anchor</section>'),/anchor missing/);
});
