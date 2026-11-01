import assert from 'node:assert/strict';
import {transform,mainHTML,byClass,version} from './runtime.mjs';
import {bounds,withoutTicker} from './html.mjs';
export const scripts=s=>[...s.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(x=>x[0]);
const strip=s=>s.replace(/<script data-quality-bridge-placement>[\s\S]*?<\/script>/g,'').replace(/<style data-approved-page-style="[^"]+">[\s\S]*?<\/style>/g,'');
const plain=s=>s.replace(/<svg\b[\s\S]*?<\/svg>/g,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export function originalText(source){
 let s=source;const oldIndex=byClass(s,'ut-index-frame');if(oldIndex)s=s.replace(oldIndex.html,'');
 let b;while(b=bounds(s,t=>t.includes('data-rp-decoration')))s=s.slice(0,b.start)+s.slice(b.end);
 return plain(s);
}
export function check(before,after,key){
 const old=mainHTML(before),now=mainHTML(after);assert(old&&now);assert(now.includes('data-approved-release="'+version+'"'));assert.equal((now.match(/<h1\b/g)||[]).length,1);
 assert.deepEqual(scripts(before),scripts(after).filter(s=>!s.startsWith('<script data-quality-bridge-placement>')),'Every original script unchanged');assert.equal((after.match(/<script data-quality-bridge-placement>/g)||[]).length,1,'One scoped bridge placement script');assert.equal(strip(after.replace(now,'')),strip(withoutTicker(before.replace(old,''))),'Shared shell and metadata unchanged');
 assert.equal(originalText(now),originalText(old),'Every original text passage retained in order');
 const oldIndex=byClass(old,'ut-index-frame'),content=oldIndex?old.replace(oldIndex.html,''):old;
 for(const a of content.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g))assert(now.includes(a[0]),'Original link and attributes retained '+a[0]);
 for(const c of content.matchAll(/<code\b[^>]*>[\s\S]*?<\/code>/g))assert(now.includes(c[0]),'Original data-key/code reference retained');
 for(const control of content.matchAll(/<(?:select|textarea)\b[\s\S]*?<\/(?:select|textarea)>/g))assert(now.includes(control[0]),'Original selector and options retained');for(const control of content.matchAll(/<input\b[^>]*>/g))assert(now.includes(control[0]),'Original input retained');
 for(const im of old.matchAll(/<img\b[^>]*>/g))assert(now.includes(im[0]),'Original image and attributes retained');
 const originalIds=[...old.matchAll(/\bid=\"([^\"]+)\"/g)].map(x=>x[1]);
 const ids=[...now.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,'All IDs unique');for(const id of originalIds)assert(ids.includes(id),'Original anchor retained '+id);
 for(const a of now.matchAll(/href="#((?:qr-|ut-|rp-)[^"]+)"/g))assert(ids.includes(a[1]),'Section link resolves '+a[1]);
 for(const b of content.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g))assert(now.includes(b[0]),'Original button, handler and attributes retained');for(const f of content.matchAll(/<form\b[\s\S]*?<\/form>/g))assert(now.includes(f[0]),'Original form retained');assert.equal(after,transform(before,key));assert.equal(transform(after,key),after);return {contentPreserved:true,scriptsPreserved:true,shellPreserved:true,linksPreserved:true};
}
