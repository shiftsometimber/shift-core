import assert from 'node:assert/strict';
import {invariantHTML,transformHTML,mainHTML,release} from './layout.mjs';
import css from './styles.mjs';
export function check(before,after,page){
 assert(mainHTML(before));assert.equal(invariantHTML(after),invariantHTML(before),'Every original document byte retained '+page.path);
 assert(after.includes('data-health-hb2="'+release+'"'));assert.equal(transformHTML(after,css,page.path),after,'Idempotent');assert(after.includes(page.image));
 const faqs=[...mainHTML(after).matchAll(/<details\b/g)].length;assert.equal(faqs,page.faqs);
 for(const text of ['No stock available today','No order or booking can be made on this page.','When this is not the next step.','The proposed steps, once available.'])assert(after.includes(text));
 const links=h=>[...mainHTML(h).matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(links(after),links(before));
 return {allOriginalDocumentBytesRetained:true,allCopyAndLinksPreserved:true,allScriptsAndStructuredDataPreserved:true,approvedPhotoRetained:true,availabilityAndUrgentGuidancePreserved:true,faqs,links:links(after).length,idempotent:true};
}
