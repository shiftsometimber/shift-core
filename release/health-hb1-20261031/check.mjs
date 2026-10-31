import assert from 'node:assert/strict';
import {invariantHTML,transformHTML,mainHTML,release} from './layout.mjs';
import css from './styles.mjs';
export function check(before,after,page){
 assert(mainHTML(before));assert.equal(invariantHTML(after),invariantHTML(before),'Every original document byte retained '+page.path);
 assert(after.includes('data-health-hb1="'+release+'"'));assert.equal(transformHTML(after,css,page.path),after,'Idempotent');assert(after.includes(page.image));
 const faqs=[...mainHTML(after).matchAll(/<details\b/g)].length;assert.equal(faqs,page.faqs);
 assert(after.includes('No stock available today'));
 const links=h=>[...mainHTML(h).matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(links(after),links(before));
 if(page.key==='testosterone'){for(const t of ['id="fertility"','id="monitoring"','id="urgent-help"','SHIFT does not prescribe.','not currently bookable through SHIFT.'])assert(after.includes(t));assert.equal([...mainHTML(after).matchAll(/class="th-prompt"/g)].length,5);}
 return {allOriginalDocumentBytesRetained:true,allCopyAndLinksPreserved:true,allScriptsAndStructuredDataPreserved:true,approvedPhotoRetained:true,availabilityAndClinicalBoundariesPreserved:true,faqs,links:links(after).length,idempotent:true};
}
