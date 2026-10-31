import assert from 'node:assert/strict';
import {invariantHTML,transformHTML,mainHTML,release} from './layout.mjs';
import css from './styles.mjs';
export function check(before,after){
 assert(mainHTML(before));
 assert.equal(invariantHTML(after),invariantHTML(before),'Retain every original document byte apart from the scoped MW1 style and marker');
 assert(after.includes('data-weight-mw1="'+release+'"'));
 assert.equal(transformHTML(after,css),after,'MW1 must be idempotent');
 assert(after.includes('src="/shift-health/hero-set-20261030/weight-management.webp"'),'Keep the existing photograph');
 assert.equal([...mainHTML(after).matchAll(/class="authority-section(?: authority-faq)?"/g)].length,7);
 assert.equal([...mainHTML(after).matchAll(/<details\b/g)].length,3);
 for(const text of ['Your first-week plan','How do I choose weight-loss support that fits my life?','Do I have to count calories or start with medicine?','Independent clinical review is not claimed.','A qualified clinician remains responsible for individual medical decisions.'])assert(after.includes(text));
 const links=html=>[...mainHTML(html).matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(links(after),links(before));
 return{allCopyAndLinksPreserved:true,allScriptsAndStructuredDataPreserved:true,allOriginalDocumentBytesPreserved:true,existingHeroPhotographRetained:true,guidanceOrderPreserved:true,existingFirstWeekAndSupportGuidancePreserved:true,faqs:3,topicSections:6,bodyLinks:links(after).length,idempotent:true};
}
