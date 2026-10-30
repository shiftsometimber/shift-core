import assert from 'node:assert/strict';
import {invariantHTML,transformHTML,mainHTML,release} from './layout.mjs';
import css from './styles.mjs';
export function check(before,after){
 assert(mainHTML(before));
 assert.equal(invariantHTML(after),invariantHTML(before),'Retain every original document byte apart from the scoped P1 style and marker');
 assert(after.includes('data-provider-p1="'+release+'"'));
 assert.equal(transformHTML(after,css),after,'P1 must be idempotent');
 assert(after.includes('src="/shift-health/hero-set-20261030/switching.webp"'),'Keep the existing new photograph');
 for(const text of ['Three different situations','Your prescription does not have to move.','Compare the cost you will actually pay','Check the handover before relying on it','Your five-minute handover note'])assert(after.includes(text));
 const links=html=>[...mainHTML(html).matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(links(after),links(before));
 return{allCopyAndLinksPreserved:true,allScriptsAndStructuredDataPreserved:true,allOriginalDocumentBytesPreserved:true,existingHeroPhotographRetained:true,guidanceOrderPreserved:true,bodyLinks:links(after).length,idempotent:true};
}
