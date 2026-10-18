import test from 'node:test';
import assert from 'node:assert/strict';
import {PUBLIC_BLOODS_PATHS,INDEXABLE_BLOODS_PATHS,isPublicBloodsRequest,addBloodsEntry,BLOODS_ENTRY_STYLE} from '../shift-bloods-public.mjs';
import {renderShiftHealthDocument} from '../shift-health-public.mjs';
test('All nine approved information routes support GET and HEAD, including query strings and trailing slash',()=>{
 assert.equal(PUBLIC_BLOODS_PATHS.length,9);assert.equal(INDEXABLE_BLOODS_PATHS.length,4);
 for(const path of PUBLIC_BLOODS_PATHS)for(const method of ['GET','HEAD'])for(const suffix of ['','/','?source=health'])assert.equal(isPublicBloodsRequest(new Request('https://shiftsometimber.co.uk'+path+suffix,{method})),true);
});
test('The public content route does not accept ordering methods or invented clinical/member routes',()=>{
 for(const method of ['POST','PUT','DELETE'])assert.equal(isPublicBloodsRequest(new Request('https://shiftsometimber.co.uk/shift-health/blood-tests',{method})),false);
 for(const path of ['/','/shift-health','/shift-health/blood-tests/order','/shift-health/blood-tests/results','/member/blood-tests','/v1/blood-tests'])assert.equal(isPublicBloodsRequest(new Request('https://shiftsometimber.co.uk'+path)),false);
});
test('The Health hub adds one coming-soon Bloods entry with green CTA while existing product pages stay separate',()=>{
 const shell='<html><head></head><body><header>Retained header</header><main></main><footer>Retained footer</footer></body></html>';
 const hub=renderShiftHealthDocument(shell),product=renderShiftHealthDocument(shell,'testosterone-energy');
 assert.equal((hub.match(/id="health-bloods-heading"/g)||[]).length,1);
 assert.match(hub,/href="\/shift-health\/blood-tests"/);assert.match(hub,/Ordering is not open yet/);
 assert.match(hub,/<header>Retained header<\/header>/);assert.match(hub,/<footer>Retained footer<\/footer>/);
 assert.doesNotMatch(product,/id="health-bloods-heading"/);assert.match(BLOODS_ENTRY_STYLE,/color:#707762/);
 assert.throws(()=>addBloodsEntry('<section>No expected insertion anchor</section>'),/anchor missing/);
});
