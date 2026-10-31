import assert from 'node:assert/strict';
import {invariantHTML,transformHTML,mainHTML,release} from './layout.mjs';
import css from './styles.mjs';
export function check(before,after){
 assert(mainHTML(before));
 assert.equal(invariantHTML(after),invariantHTML(before),'Retain every original document byte apart from the scoped WW1 style and marker');
 assert(after.includes('data-work-ww1="'+release+'"'));
 assert.equal(transformHTML(after,css),after,'WW1 must be idempotent');
 assert(after.includes('src="/shift-health/hero-set-20261030/partnerships.webp"'),'Keep the existing photograph');
 assert.equal([...mainHTML(after).matchAll(/class="ww-stat"/g)].length,4);
 assert.equal([...mainHTML(after).matchAll(/class="ww-route"/g)].length,6);
 for(const text of ['69.7%','1.6m','3.3m','1 in 10','Where could you move the needle?','Clear clinical and commercial boundaries.'])assert(after.includes(text));
 const links=html=>[...mainHTML(html).matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(links(after),links(before));
 return{allCopyAndLinksPreserved:true,allScriptsAndStructuredDataPreserved:true,allOriginalDocumentBytesPreserved:true,existingHeroPhotographRetained:true,guidanceOrderPreserved:true,existingMarketStatisticsAndSourcesPreserved:true,statistics:4,partnershipRoutes:6,bodyLinks:links(after).length,idempotent:true};
}
