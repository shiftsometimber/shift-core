import assert from 'node:assert/strict';
import {invariantHTML,transformHTML,mainHTML,release} from './layout.mjs';
import css from './styles.mjs';
export function check(before,after){
 assert(mainHTML(before));
 assert.equal(invariantHTML(after),invariantHTML(before),'Every original document byte retained apart from scoped style and marker');
 assert(after.includes('data-hair-hl1="'+release+'"'));
 assert.equal(transformHTML(after,css),after,'HL1 must be idempotent');
 assert(after.includes('/shift-health/hair-loss?shift_hero=20261029-approved-v1-hair-c8efba044fa1'),'Approved photograph retained');
 const faqs=[...mainHTML(after).matchAll(/<details\b/g)].length;assert.equal(faqs,2);
 for(const text of ['No stock available today','No order or booking can be made on this page.','The proposed steps, once available.','When this is not the next step.'])assert(after.includes(text));
 const links=h=>[...mainHTML(h).matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(links(after),links(before));
 return {allCopyAndLinksPreserved:true,allScriptsAndStructuredDataPreserved:true,allOriginalDocumentBytesPreserved:true,existingApprovedHeroRetained:true,availabilityAndClinicalBoundariesPreserved:true,faqs,bodyLinks:links(after).length,idempotent:true};
}
