import assert from 'node:assert/strict';
import {invariantHTML,transformHTML,ownAssets,assetBase,release} from './layout.mjs';
import css from './styles.mjs';
export function check(before,after){
 assert(before.includes('id="sw-welcome"'));
 assert.equal(invariantHTML(after),invariantHTML(before),'Preserve all document bytes except four photo sources/alts and the scoped ST1 presentation');
 assert(after.includes('data-start-here-st1="'+release+'"'));
 assert.equal(transformHTML(after,css),after,'ST1 must be idempotent');
 for(const name of ownAssets)assert.equal(after.split('src="'+assetBase+name+'"').length,2,'Each new photograph appears exactly once: '+name);
 const links=html=>[...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(links(after),links(before));
 assert(before.includes('data-weight-start')&&after.includes('data-weight-start'));
 assert(after.includes('Already on treatment? Read our switching guide'));
 assert(after.includes('Any treatment decision requires an appropriate clinical assessment.'));
 assert(after.includes('src="/start-here/assets/health.webp"'));
 return{allCopyAndLinksPreserved:true,allScriptsPreserved:true,allOtherDocumentBytesPreserved:true,newPhotographs:4,existingHealthPhotographRetained:true,weightRouteAndSwitchingGuideRetained:true,clinicalBoundaryRetained:true,idempotent:true};
}
