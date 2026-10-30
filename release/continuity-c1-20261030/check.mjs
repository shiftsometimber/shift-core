import assert from 'node:assert/strict';
import {invariantHTML,transformHTML,mainHTML,release} from './layout.mjs';
import css from './styles.mjs';
export function check(before,after){
 assert(mainHTML(before));
 assert.equal(invariantHTML(after),invariantHTML(before),'Retain every original document byte apart from the scoped C1 style and marker');
 assert(after.includes('data-continuity-c1="'+release+'"'));
 assert.equal(transformHTML(after,css),after,'C1 must be idempotent');
 assert(after.includes('src="/shift-health/hero-set-20261030/continuity.webp"'),'Keep the existing new photograph');
 for(const text of ['First decide what you need help with','Your prescription does not have to move.','What stays with you','Make the next contact easier to answer'])assert(after.includes(text));
 const links=html=>[...mainHTML(html).matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(links(after),links(before));
 return{allCopyAndLinksPreserved:true,allScriptsAndStructuredDataPreserved:true,allOriginalDocumentBytesPreserved:true,existingHeroPhotographRetained:true,importantHelpOrderPreserved:true,bodyLinks:links(after).length,idempotent:true};
}
