import assert from 'node:assert/strict';
import {invariantHTML,transformHTML,mainHTML,release} from './layout.mjs';
import css from './styles.mjs';
export function check(before,after){
 assert(mainHTML(before));
 assert.equal(invariantHTML(after),invariantHTML(before),'Retain every original document byte apart from the scoped HP1 style and marker');
 assert(after.includes('data-partner-hp1="'+release+'"'));
 assert.equal(transformHTML(after,css),after,'HP1 must be idempotent');
 assert(after.includes('src="/shift-health/hero-set-20261030/partner-support.webp"'),'Keep the existing photograph');
 for(const text of ['Ask before you fix','Practical help beats surveillance','When support needs to become healthcare','Do not advise him to change, stop or restart prescription treatment yourself.','data-share-my-timber','data-share-status'])assert(after.includes(text));
 const links=html=>[...mainHTML(html).matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(links(after),links(before));
 return{allCopyAndLinksPreserved:true,allScriptsAndStructuredDataPreserved:true,allOriginalDocumentBytesPreserved:true,existingHeroPhotographRetained:true,guidanceOrderPreserved:true,existingShareControlPreserved:true,bodyLinks:links(after).length,idempotent:true};
}
