import assert from 'node:assert/strict';
import {transform,mainHTML,byClass,version} from './runtime.mjs';
import {withoutTicker} from './html.mjs';
export const scripts=s=>[...s.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(x=>x[0]);
const strip=s=>s.replace(/<style data-approved-page-style="[^"]+">[\s\S]*?<\/style>/g,'');
const text=s=>s.replace(/<svg\b[\s\S]*?<\/svg>/g,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export function check(before,after,key){
 const old=mainHTML(before),now=mainHTML(after);assert(old&&now);assert(now.includes('data-approved-release="'+version+'"'));assert.equal((now.match(/<h1\b/g)||[]).length,1);
 assert.deepEqual(scripts(before),scripts(after),'All scripts unchanged');assert.equal(strip(after.replace(now,'')),strip(withoutTicker(before.replace(old,''))),'Shared shell and metadata unchanged');
 const index=byClass(now,'ut-index-frame');assert.equal(text(index?now.replace(index.html,''):now),text(old),'All original page text retained in order');
 for(const a of old.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g))assert(now.includes(a[0]),'Every original link and its attributes retained');
 for(const c of old.matchAll(/<code\b[^>]*>[\s\S]*?<\/code>/g))assert(now.includes(c[0]),'Original data-key/code reference retained');
 const ids=[...now.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,'All IDs unique');
 for(const a of now.matchAll(/href="#(ut-[^"]+)"/g))assert(ids.includes(a[1]),'Native section link resolves '+a[1]);
 assert.equal(after,transform(before,key));assert.equal(transform(after,key),after);return {contentPreserved:true,scriptsPreserved:true,shellPreserved:true,linksPreserved:true};
}
