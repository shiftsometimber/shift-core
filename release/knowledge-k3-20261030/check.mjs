import assert from 'node:assert/strict';
import fs from 'node:fs';
import css from './styles.mjs';
import {release,transformHTML,outsideMain,mainInvariant,articleBlocks,stripCardPresentation,element,mainHTML} from './layout.mjs';
export function check(before,after=transformHTML(before,css)){
 assert.equal(outsideMain(after),outsideMain(before),'Keep every document byte outside the owned Knowledge main and new style');
 assert.equal(mainInvariant(after),mainInvariant(before),'Keep every main byte outside the approved presentation changes');
 assert.equal(transformHTML(after,css),after,'K3 transformation must be idempotent');
 const old=mainHTML(before),now=mainHTML(after);
 const links=s=>[...s.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<\/a>/g)].map(x=>x[0]);
 assert.deepEqual(links(now),links(old),'Every existing Knowledge link, text and destination must remain in order');
 const originals=articleBlocks(before),cards=articleBlocks(after);assert(originals.length>=50);assert.equal(cards.length,originals.length);
 assert.deepEqual(cards.map(stripCardPresentation),originals.map(stripCardPresentation),'Preserve every original guide card word for word');
 assert.equal(element(now,'div','class="kh-filter"'),element(old,'div','class="kh-filter"'),'Search and filter controls unchanged');
 assert.equal(element(now,'nav','aria-label="Knowledge topics"'),element(old,'nav','aria-label="Knowledge topics"'),'Topic navigation unchanged');
 const heroOld=element(old,'header','class="kh-hero"'),heroNew=element(now,'header','class="kh-hero"');
 for(const re of [/<h1\b[^>]*>[\s\S]*?<\/h1>/,/<p class="kh-eyebrow">[\s\S]*?<\/p>/,/<p class="kh-lead">[\s\S]*?<\/p>/,/<p class="kh-note">[\s\S]*?<\/p>/])assert.equal(heroNew.match(re)?.[0],heroOld.match(re)?.[0],'Keep the approved introduction exactly');
 const scripts=s=>[...s.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(x=>x[0]);assert.deepEqual(scripts(after),scripts(before),'Keep all existing script bytes');
 assert.equal((now.match(/class="k3-guide-photo"/g)||[]).length,cards.length);
 assert.equal((now.match(/class="k3-hero-photo"/g)||[]).length,1);
 assert(now.includes('data-knowledge-k3="'+release+'"'));assert(!/Georgia|Times New Roman/.test(css));
 assert(now.indexOf('class="kh-filter"')<now.indexOf('aria-label="Knowledge topics"'));
 return {guideCards:cards.length,allCopyAndLinksPreserved:true,searchAndTopicControlsPreserved:true,allScriptsPreserved:true,outsideMainPreserved:true,idempotent:true};
}
if(process.argv[2])console.log(JSON.stringify(check(fs.readFileSync(process.argv[2],'utf8'))));
