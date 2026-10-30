import assert from 'node:assert/strict';
import {byTag,byClass,classes,transform} from './runtime.mjs';
export const mainHTML=html=>byTag(html,'main')?.html;
const scripts=html=>[...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(m=>m[0]);
export function check(before,after,page){
 const original=mainHTML(before),updated=mainHTML(after);assert(original&&updated);
 assert.equal((updated.match(/<h1\b/gi)||[]).length,1,page.path+' must have one heading');
 assert(updated.includes('data-next-hero="'+page.id+'"'),'Approved hero missing '+page.path);
 assert.deepEqual(scripts(after),scripts(before),'Scripts changed '+page.path);
 const stripStyle=s=>s.replace(/<style data-hero-set-style="[^"]+">[\s\S]*?<\/style>/,'');
 assert.equal(stripStyle(after.replace(updated,'')),before.replace(original,''),'Head, navigation or footer changed '+page.path);
 const oldHero=byClass(original,classes[page.id]);assert(oldHero);
 let expected=original.replace(oldHero.html,'');
 if(page.removePhotoClass){const photo=byClass(expected,page.removePhotoClass);if(photo)expected=expected.replace(photo.html,'');}
 let retained=updated.replace(byClass(updated,'nhh-hero').html,'');
 const context=byClass(retained,'nhh-context');if(context)retained=retained.replace(context.html,'');
 retained=retained.replace(/<span id="(?:fertility-guides|nhh-content-start)" class="nhh-anchor" aria-hidden="true"><\/span>/g,'');
 if(page.id==='research'&&!original.includes('id="research-directory"'))retained=retained.replace(' id="research-directory"','');
 if(!/\bid=["']main-content["']/.test(original.slice(0,original.indexOf('>')+1)))retained=retained.replace(' id="main-content"','');
 assert.equal(retained,expected,'Content outside the replaced hero changed '+page.path);
 const proposed=transform(before,page);assert.equal(after,proposed.html,'Delivered bytes differ '+page.path);
 if(proposed.retainedContext)assert(after.includes(proposed.retainedContext),'Existing opening context lost '+page.path);
 assert.equal(transform(after,page).html,after,'Repeated transform must be idempotent');
 if(page.target.startsWith('#'))assert(after.includes('id="'+page.target.slice(1)+'"')||after.includes("id='"+page.target.slice(1)+"'"),'CTA target missing');
 return {path:page.path,oneHeading:true,outsideHeroPreserved:true,scriptsPreserved:true,shellPreserved:true,existingContextPreserved:true,ctaValid:true,idempotent:true};
}
