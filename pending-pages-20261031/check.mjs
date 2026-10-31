import assert from 'node:assert/strict';
import {transform,normalise,mainHTML,byClass,version} from './runtime.mjs';
import {withoutTicker} from './html.mjs';
export const scripts=html=>[...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(x=>x[0]);
const hrefs=s=>new Set([...s.matchAll(/\bhref="([^"]+)"/g)].map(m=>m[1]));
const strip=s=>s.replace(/<style data-approved-page-style="[^"]+">[\s\S]*?<\/style>/g,'');
const inner=s=>s.slice(s.indexOf('>')+1,s.lastIndexOf('</main>'));
function canonicalContent(s,key){
 if(key==='partner'){
  const grid=byClass(s,'partner-grid-v3b2');assert(grid);const cards=[...grid.html.matchAll(/<div(?: id="sp-partner-\d+")? class="partner-card-v3b2">([\s\S]*?)<\/div>/g)].map(x=>x[1]).sort();assert.equal(cards.length,8);s=s.replace(grid.html,'CATEGORY_CONTENT:'+cards.join('\n'));
 }
 return s;
}
export function check(before,after,key){
 const old=mainHTML(before),updated=mainHTML(after);assert(old&&updated);
 assert(updated.includes('data-approved-release="'+version+'"'));assert.equal((updated.match(/<h1\b/gi)||[]).length,1);
 assert.deepEqual(scripts(after),scripts(before),'All existing scripts unchanged');
 assert.equal(strip(after.replace(updated,'')),strip(withoutTicker(before.replace(old,''))),'Shared header/footer/metadata preserved');
 if(before.includes('data-approved-release="'+version+'"')){assert.equal(updated,old,'Stylesheet refresh retains exact main');assert.equal(after,transform(before,key),'Exact approved stylesheet refresh');assert.equal(transform(after,key),after);return {acceptedContentPreserved:true,stylesheetRefreshed:true};}
 const targets=hrefs(updated);for(const href of hrefs(old))assert(targets.has(href),'Existing destination lost '+href);
 const normal=mainHTML(normalise(before,key));
 const base=inner(normal).replace(byClass(normal,'nhh-hero').html,'');
 const output=inner(updated).replace(transformHero(updated,key),'');
 assert.equal(canonicalContent(output,key),canonicalContent(base,key),'All existing guide content preserved');
 assert.equal(after,transform(before,key),'Exact selected candidate');assert.equal(transform(after,key),after,'Idempotent');
 return {oneHeading:true,shellPreserved:true,scriptsPreserved:true,contentPreserved:true,linksPreserved:true,idempotent:true};
}
function transformHero(main,key){
 const h=byClass(main,'sp-hero');assert(h);
 if(key!=='partner')return h.html;
 const benefits=byClass(main,'sp-benefits'),nav=byClass(main,'sp-category-links');assert(benefits&&nav);return h.html+benefits.html+nav.html;
}
