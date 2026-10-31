import assert from 'node:assert/strict';
import {transform,mainHTML,byClass,version} from './runtime.mjs';
import {withoutTicker} from './html.mjs';
export const scripts=html=>[...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(x=>x[0]);
const hrefs=s=>new Set([...s.matchAll(/\bhref="([^"]+)"/g)].map(m=>m[1]));
const strip=s=>s.replace(/<style data-approved-page-style="[^"]+">[\s\S]*?<\/style>/g,'');
const inner=s=>s.slice(s.indexOf('>')+1,s.lastIndexOf('</main>'));
export function check(before,after,key){
 const old=mainHTML(before),updated=mainHTML(after);assert(old&&updated);
 assert(updated.includes('data-approved-release="'+version+'"'));assert.equal((updated.match(/<h1\b/gi)||[]).length,1);
 assert.deepEqual(scripts(after),scripts(before),'All existing scripts remain byte-for-byte unchanged');
 const shell=before.replace(old,'');assert.equal(strip(after.replace(updated,'')),['newsroom','continuity'].includes(key)?shell:withoutTicker(shell),'Shared header, footer, metadata and shell preserved');
 if(before.includes('data-approved-release="'+version+'"')){assert.equal(after,before);return {alreadyAccepted:true};}
 const targets=hrefs(updated);for(const href of hrefs(old))assert(targets.has(href),'Existing destination lost '+href);
 if(key==='contact'){
  for(const c of ['ct-hero','ct-form-card','ct-details','ct-safety'])assert.equal(byClass(updated,c).html,byClass(old,c).html,c+' content preserved exactly');
 }else{
  let a=inner(old).replace(byClass(old,'nhh-hero').html,''),b=inner(updated).replace(byClass(updated,'sp-hero').html,'');
  if(key==='about')b=b.replace(byClass(b,'sp-principles').html,'');
  if(key==='life-back'){const needs=byClass(old,'lbp-needs').html;assert.equal(byClass(updated,'lbp-needs').html,needs);a=a.replace(needs,'');b=b.replace(needs,'');}
  if(key==='continuity'){b=b.replace(byClass(b,'sp-continuity-strip').html,'').replace(' id="sp-help-routes"','').replace(/<span class="sp-route-detail">([\s\S]*?)<\/span>/g,'$1');}
  assert.equal(b,a,'All content outside selected presentation preserved exactly');
 }
 assert.equal(after,transform(before,key),'Exact approved candidate');assert.equal(transform(after,key),after,'Nested layers are idempotent');
 return {oneHeading:true,shellPreserved:true,scriptsPreserved:true,contentPreserved:true,linksPreserved:true,idempotent:true};
}
