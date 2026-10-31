import assert from 'node:assert/strict';
import {transform,mainHTML,byClass,version} from './runtime.mjs';
import {withoutTicker} from './html.mjs';
export const scripts=s=>[...s.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(x=>x[0]);
const strip=s=>s.replace(/<style data-approved-page-style="[^"]+">[\s\S]*?<\/style>/g,'');
const cards=s=>[...s.matchAll(/<div class="social-community-card-v2223(?: cm-channel)?">[\s\S]*?<\/div>/g)].map(x=>x[0].replace(/<svg\b[\s\S]*?<\/svg>/g,'').replace('social-community-card-v2223 cm-channel','social-community-card-v2223')).sort();
export function check(before,after,key){
 const old=mainHTML(before),now=mainHTML(after);assert(old&&now);assert(now.includes('data-approved-release="'+version+'"'));assert.equal((now.match(/<h1\b/g)||[]).length,1);
 assert.deepEqual(scripts(before),scripts(after),'Scripts unchanged');assert.equal(strip(after.replace(now,'')),strip(withoutTicker(before.replace(old,''))),'Shared shell unchanged');
 assert.deepEqual(cards(now),cards(old),'All three full social cards retained');assert.equal(cards(now).length,3);
 for(const cl of ['newsletter-v2223','join-conversation-v2223'])assert.equal(byClass(now,cl).html,byClass(old,cl).html,'Retain '+cl);
 const principles=old.match(/<h2\b[^>]*data-section="01"[^>]*>[\s\S]*?<\/h2>\s*<ul\b[^>]*>[\s\S]*?<\/ul>/)?.[0];assert(principles&&now.includes(principles),'All community principles retained');
 const heading=byClass(old,'article-brand-hero-v5');const intro=old.slice(heading.end).match(/<p\b[^>]*>[\s\S]*?<\/p>/)?.[0];assert(intro&&now.includes(intro),'Full original introduction retained');
 const targets=new Set([...now.matchAll(/href="([^"]+)"/g)].map(x=>x[1]));for(const x of old.matchAll(/href="([^"]+)"/g))assert(targets.has(x[1]),'Destination retained '+x[1]);
 assert.equal(after,transform(before,key));assert.equal(transform(after,key),after);return {contentPreserved:true,scriptsPreserved:true,shellPreserved:true,linksPreserved:true};
}
