import assert from 'node:assert/strict';
import {invariantHTML,transformHTML,mainHTML,ownAssets,assetBase,release} from './layout.mjs';
import css from './styles.mjs';
export function check(before,after){
 assert(mainHTML(before));assert(mainHTML(after));assert.equal(invariantHTML(after),invariantHTML(before),'Preserve all original document bytes except the four approved photo sources/alts and owned presentation');assert(after.includes('data-treatments-tr3="'+release+'"'));assert.equal(transformHTML(after,css),after,'TR3 must be idempotent');
 for(const name of ownAssets)assert.equal(after.split('src="'+assetBase+name+'"').length,2,'Each approved photograph must appear once: '+name);
 const links=html=>[...mainHTML(html).matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(links(after),links(before));
 assert(before.includes('Medicines &amp; Research Watch')&&after.includes('Medicines &amp; Research Watch'));
 return{allCopyAndLinksPreserved:true,allScriptsPreserved:true,allOtherDocumentBytesPreserved:true,approvedPhotographs:4,bodyLinks:links(after).length,researchWatchRetained:true,idempotent:true};
}
