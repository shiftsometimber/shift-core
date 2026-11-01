import assert from 'node:assert/strict';
import {transform,mainHTML,version} from './runtime.mjs';
import {bounds,withoutTicker} from './html.mjs';
export const scripts=s=>[...s.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(x=>x[0]);
const strip=s=>s.replace(/<style data-approved-page-style="[^"]+">[\s\S]*?<\/style>/g,'');
export function originalText(source){let s=source,b;while(b=bounds(s,t=>t.includes('data-dp-art')||t.includes('data-dp-label')))s=s.slice(0,b.start)+s.slice(b.end);return s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
export function check(before,after,key){
 const old=mainHTML(before),now=mainHTML(after);assert(old&&now);assert(now.includes('data-approved-release="'+version+'"'));assert.equal((now.match(/<h1\b/g)||[]).length,1);
 assert.deepEqual(scripts(before),scripts(after),'Every original script unchanged');assert.equal(strip(after.replace(now,'')),strip(withoutTicker(before.replace(old,''))),'Shared shell and metadata unchanged');assert.equal(originalText(now),originalText(old),'All original text in original order');
 for(const tag of ['a','button','select','form','code'])for(const m of old.matchAll(new RegExp('<'+tag+'\\b[\\s\\S]*?</'+tag+'>','g')))assert(now.includes(m[0]),'Original '+tag+' and attributes retained');for(const m of old.matchAll(/<input\b[^>]*>/g))assert(now.includes(m[0]),'Every original input retained');
 const ids=[...now.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);for(const m of old.matchAll(/\bid="([^"]+)"/g))assert(ids.includes(m[1]));assert.equal(transform(after,key),after);
 return {contentPreserved:true,scriptsPreserved:true,shellPreserved:true,linksPreserved:true,controlsPreserved:true};
}
