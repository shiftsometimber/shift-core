import assert from 'node:assert/strict';
import {invariantHTML,transformHTML,mainHTML,release} from './layout.mjs';
import css from './styles.mjs';
export function check(before,after,page){
 assert(mainHTML(before));assert.equal(invariantHTML(after),invariantHTML(before),'Every original document byte retained '+page.path);
 assert(after.includes('data-public-pb3="'+release+'"'));assert.equal(transformHTML(after,css,page.path),after,'Idempotent');assert(after.includes(page.image));
 const links=h=>[...mainHTML(h).matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(links(after),links(before));
 return {allOriginalDocumentBytesRetained:true,allCopyAndLinksPreserved:true,allScriptsAndStructuredDataPreserved:true,approvedPhotoRetained:true,availabilityAndClinicalBoundariesPreserved:true,allOriginalControlsPreserved:true,details:[...mainHTML(after).matchAll(/<details\b/g)].length,links:links(after).length,idempotent:true};
}
