import assert from 'node:assert/strict';
import {mainHTML,byClass,byId,withoutTicker,calculatorSection,transform,version} from './runtime.mjs';
import {tools} from './presentation.mjs';
export const scripts=html=>[...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(x=>x[0]);
const stripStyle=s=>s.replace(/<style data-tools-ct3-style="[^"]+">[\s\S]*?<\/style>/g,'');
const hrefs=s=>new Set([...s.matchAll(/\bhref="([^"]+)"/g)].map(m=>m[1]));
export function check(before,after){
 const old=mainHTML(before),updated=mainHTML(after);assert(old&&updated);
 assert.equal((updated.match(/<h1\b/gi)||[]).length,1);
 assert(updated.includes('data-tools-ct3="'+version+'"'));assert(!byId(after,'shift-public-news'),'Tools has no ticker');
 assert.deepEqual(scripts(after),scripts(before),'Scripts must remain byte-for-byte unchanged');
 assert.equal(stripStyle(after.replace(updated,'')),withoutTicker(before.replace(old,'')),'Page head, shared header/navigation and footer preserved');
 let oldRest=old.replace(byClass(old,'pagehero').html,'').replace(byId(old,'feel-featured-tool').html,'').replace(calculatorSection(old).html,'');
 let newRest=updated.replace(byClass(updated,'ct3-hero').html,'').replace(byClass(updated,'ct3-checkin').html,'').replace(byClass(updated,'ct3-tools').html,'');
 newRest=newRest.replace(byClass(newRest,'ct3-anchor').html,'').replace(byClass(newRest,'ct3-more-links').html,'');
 newRest=newRest.replace(newRest.slice(0,newRest.indexOf('>')+1),old.slice(0,old.indexOf('>')+1));
 assert.equal(newRest,oldRest,'All remaining content and links preserved');
 const targets=hrefs(updated);for(const h of hrefs(old))assert(targets.has(h),'Existing destination lost '+h);
 for(const t of tools)assert(targets.has(t.href),'Selected tool destination missing '+t.href);
 assert(byId(updated,'calculators')&&byId(updated,'ct3-more-guides'),'In-page targets exist');
 assert.equal(after,transform(before),'Exact selected candidate delivered');assert.equal(transform(after),after,'Idempotent through nested serving layers');
 return {oneHeading:true,sharedShellPreserved:true,scriptsPreserved:true,remainingContentPreserved:true,existingDestinationsPreserved:true,selectedTools:tools.length,noTicker:true,idempotent:true};
}
