import assert from 'node:assert/strict';
import {invariantHTML,transformHTML,mainHTML,release} from './layout.mjs';
import css from './styles.mjs';
export function check(before,after){
 assert(mainHTML(before));
 assert.equal(invariantHTML(after),invariantHTML(before),'Retain every original document byte apart from the scoped CP1 style and marker');
 assert(after.includes('data-comparison-cp1="'+release+'"'));
 assert.equal(transformHTML(after,css),after,'CP1 must be idempotent');
 assert(after.includes('src="/shift-health/hero-set-20261030/treatment-choices.webp"'),'Keep the existing photograph');
 for(const text of ['Mounjaro versus Wegovy','Wegovy pill versus Foundayo','Tablets versus injections','Medication versus surgery','How this comparison is governed','Frequently asked questions','Sources you can inspect','Who wrote this?'])assert(after.includes(text));
 const links=html=>[...mainHTML(html).matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(links(after),links(before));
 return{allCopyAndLinksPreserved:true,allScriptsAndStructuredDataPreserved:true,allOriginalDocumentBytesPreserved:true,existingHeroPhotographRetained:true,guidanceOrderPreserved:true,bodyLinks:links(after).length,idempotent:true};
}
