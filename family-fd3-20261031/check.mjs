import assert from 'node:assert/strict';
import {transform,mainHTML,byClass,version} from './runtime.mjs';
import {withoutTicker} from './html.mjs';
export const scripts=s=>[...s.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(x=>x[0]);
const strip=s=>s.replace(/<style data-approved-page-style="[^"]+">[\s\S]*?<\/style>/g,'');
export function check(before,after,key){
 const old=mainHTML(before),now=mainHTML(after);assert(old&&now);assert(now.includes('data-approved-release="'+version+'"'));assert.equal((now.match(/<h1\b/g)||[]).length,1);
 assert.deepEqual(scripts(before),scripts(after),'Scripts unchanged');assert.equal(strip(after.replace(now,'')),strip(withoutTicker(before.replace(old,''))),'Shared shell unchanged');
 for(const cl of ['byline-v12','editorial-note-v2222','sourcebox'])assert.equal(byClass(now,cl).html,byClass(old,cl).html,'Retain '+cl);
 const article=byClass(old,'sst-reading-article-v31').html;for(const block of article.matchAll(/<(?:h2|p|ul)\b[^>]*>[\s\S]*?<\/(?:h2|p|ul)>/g))assert(now.includes(block[0]),'All original guide content retained: '+block[0]);
 const targets=new Set([...now.matchAll(/href="([^"]+)"/g)].map(x=>x[1]));for(const x of old.matchAll(/href="([^"]+)"/g))assert(targets.has(x[1]),'Destination retained '+x[1]);
 assert.equal(after,transform(before,key));assert.equal(transform(after,key),after);return {contentPreserved:true,scriptsPreserved:true,shellPreserved:true,linksPreserved:true};
}
