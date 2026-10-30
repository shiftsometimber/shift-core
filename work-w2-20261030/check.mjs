import assert from 'node:assert/strict';
import {mainHTML,byClass,byId,withoutTicker,transform,version} from './runtime.mjs';
const scripts=html=>[...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(x=>x[0]);
const stripStyle=s=>s.replace(/<style data-work-w2-style="[^"]+">[\s\S]*?<\/style>/g,'');
export function check(before,after){
 const old=mainHTML(before),updated=mainHTML(after);assert(old&&updated);
 assert.equal((updated.match(/<h1\b/gi)||[]).length,1);
 assert(updated.includes('data-work-w2="'+version+'"'));
 assert(!byId(after,'shift-public-news'),'Work has no ticker');
 assert.deepEqual(scripts(after),scripts(before),'Scripts must remain byte-for-byte unchanged');
 assert.equal(stripStyle(after.replace(updated,'')),withoutTicker(before.replace(old,'')),'Head, shared header, navigation and footer preserved');
 assert.equal(byId(updated,'work-enquiry').html,byId(old,'work-enquiry').html,'Enquiry markup and privacy wording preserved');
 const remainingOld=old.replace(byClass(old,'fw-hero').html,'').replace(byClass(old,'fw-benefits').html,'');
 const remainingNew=updated.replace(byClass(updated,'ww2-hero').html,'').replace(byClass(updated,'ww2-benefits').html,'').replace(' data-work-w2="'+version+'"','');
 assert.equal(remainingNew,remainingOld,'How it works and all remaining content preserved');
 assert.equal(after,transform(before),'Exact approved candidate delivered');
 assert.equal(transform(after),after,'Idempotent across nested page layers');
 return {oneHeading:true,sharedShellPreserved:true,enquiryPreserved:true,scriptsPreserved:true,remainingContentPreserved:true,noTicker:true,idempotent:true};
}
