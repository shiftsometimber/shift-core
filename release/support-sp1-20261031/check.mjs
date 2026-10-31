import assert from 'node:assert/strict';
import {invariantHTML,transformHTML,mainHTML,release} from './layout.mjs';
import css from './styles.mjs';
export function check(before,after){
 assert(mainHTML(before));
 assert.equal(invariantHTML(after),invariantHTML(before),'All original document bytes must remain after removing only SP1 presentation additions');
 assert(after.includes('data-support-sp1="'+release+'"'));
 assert.equal(transformHTML(after,css),after,'SP1 must be idempotent');
 assert(after.includes('src="/shift-health/hero-set-20261030/free-support.webp"'),'Keep the existing photograph');
 assert.equal([...after.matchAll(/<div data-support-sp1-topic="\d+">/g)].length,6);
 assert.equal([...mainHTML(after).matchAll(/<details\b/g)].length,6);
 for(const text of ['What you actually get','Your first useful step','You decide what to track','Questions men ask about My Timber','Start with one useful thing','My Timber does not tell you to stop, restart, taper or change a prescription.'])assert(after.includes(text));
 const links=html=>[...mainHTML(html).matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(links(after),links(before));
 return{allCopyAndLinksPreserved:true,allScriptsAndStructuredDataPreserved:true,allOriginalDocumentBytesPreserved:true,existingHeroPhotographRetained:true,guidanceOrderPreserved:true,bodyLinks:links(after).length,practicalTopics:6,faqs:6,idempotent:true};
}
