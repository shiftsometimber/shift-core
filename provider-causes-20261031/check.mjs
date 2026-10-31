import assert from 'node:assert/strict';
import {transform,normalise,mainHTML,byClass,version} from './runtime.mjs';
import {withoutTicker} from './html.mjs';
export const scripts=s=>[...s.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(x=>x[0]);
const strip=s=>s.replace(/<style data-approved-page-style="[^"]+">[\s\S]*?<\/style>/g,'');
const inner=s=>s.slice(s.indexOf('>')+1,s.lastIndexOf('</main>'));
export function check(before,after,key){
 const old=mainHTML(before),now=mainHTML(after);assert(old&&now);assert(now.includes('data-approved-release="'+version+'"'));assert.equal((now.match(/<h1\b/g)||[]).length,1);
 assert.deepEqual(scripts(before),scripts(after),'Scripts unchanged');assert.equal(strip(after.replace(now,'')),strip(withoutTicker(before.replace(old,''))),'Shared shell unchanged');
 if(key==='causes')assert.equal(inner(now),inner(old),'All causes content and interaction markup unchanged');
 else{const base=mainHTML(normalise(before,key)),needs=byClass(base,'psp-needs').html;assert.equal(byClass(now,'psp-needs').html,needs);const a=inner(base).replace(byClass(base,'nhh-hero').html,'').replace(needs,''),b=inner(now).replace(byClass(now,'sp-hero').html,'').replace(byClass(now,'sp-prescription-note').html,'').replace(needs,'');assert.equal(a,b,'All provider guide content preserved');}
 const targets=new Set([...now.matchAll(/href="([^"]+)"/g)].map(x=>x[1]));for(const x of old.matchAll(/href="([^"]+)"/g))assert(targets.has(x[1]),'Destination retained '+x[1]);
 assert.equal(after,transform(before,key));assert.equal(transform(after,key),after);return {contentPreserved:true,scriptsPreserved:true,shellPreserved:true,linksPreserved:true};
}
