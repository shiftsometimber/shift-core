import assert from 'node:assert/strict';
import {transform,mainHTML,byClass,version} from './runtime.mjs';
import {withoutTicker} from './html.mjs';
export const scripts=s=>[...s.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(x=>x[0]);
const strip=s=>s.replace(/<style data-approved-page-style="[^"]+">[\s\S]*?<\/style>/g,'');
const cards=s=>[...s.matchAll(/<div class="resource-card-v3b2">[\s\S]*?<\/div>/g)].map(x=>x[0].replace(/<svg\b[\s\S]*?<\/svg>/g,'')).sort();
export function check(before,after,key){
 const old=mainHTML(before),now=mainHTML(after);assert(old&&now);assert(now.includes('data-approved-release="'+version+'"'));assert.equal((now.match(/<h1\b/g)||[]).length,1);
 assert.deepEqual(scripts(before),scripts(after),'Scripts unchanged');assert.equal(strip(after.replace(now,'')),strip(withoutTicker(before.replace(old,''))),'Shared shell unchanged');
 assert.deepEqual(cards(now),cards(old),'All six complete resource cards preserved');assert.equal(cards(now).length,6);
 assert.equal(byClass(now,'download-note-v3b2').html,byClass(old,'download-note-v3b2').html,'Preparation boundary retained');
 const targets=new Set([...now.matchAll(/href="([^"]+)"/g)].map(x=>x[1]));for(const x of old.matchAll(/href="([^"]+)"/g))assert(targets.has(x[1]),'Destination retained '+x[1]);
 assert.equal(after,transform(before,key));assert.equal(transform(after,key),after);return {contentPreserved:true,scriptsPreserved:true,shellPreserved:true,linksPreserved:true};
}
