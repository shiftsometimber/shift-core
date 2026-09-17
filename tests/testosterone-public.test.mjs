import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {renderShiftHealthDocument,healthSlugs} from '../shift-health-public.mjs';
import {hubMain} from '../shift-health-public-content.mjs';
import {promoteTestosteroneCard,preserveHealthCardOrder} from '../testosterone-hub-order.mjs';
const shell='<html><head><title>Old</title></head><body class="one-shift programme-page"><header>locked</header><main>old</main><footer>locked</footer></body></html>';
test('approved public hub is indexable, sourced and unavailable to purchase',()=>{
 const html=renderShiftHealthDocument(shell,'testosterone-energy');
 for(const marker of ['What’s brought you here?','fertility','monitoring','No stock available today','data-stock="0"','disabled','id="evidence"'])assert.ok(html.includes(marker),marker);
 assert.doesNotMatch(html,/PREVIEW FOR MATT|This preview|noindex|testosterone-checkout\.js/);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
 for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes('id="'+id+'"'),id);
});
test('testosterone card moves to first; exact previous grid is recoverable',()=>{
 const next=promoteTestosteroneCard(hubMain);assert.equal(next.match(/<article class="card" id="([^"]+)"/)[1],'testosterone');
 assert.equal((next.match(/id="testosterone"/g)||[]).length,1);
 assert.equal(preserveHealthCardOrder('/shift-health',Buffer.from(next)).toString(),hubMain);
 assert.throws(()=>preserveHealthCardOrder('/shift-health',Buffer.from(next.replace('Energy check','Unexpected change'))));
});
// Baseline e64cbf56032efc7fe727cb52b5832530e632824d with the fixed shell above.
const baselineHashes={"health-mot":"5d36466955fc569a453e6c54e7336c4665b0b629e24997b3c1ff154d8e73063b","blood-pressure-monitor":"9a57ed86a163ab6e7a31cefc33be52c20dfbec6d44982746ded44170cfe1df9e","digital-scales":"8123a6200e41db9ac408538460d36f39ed95824f584a1b003a3cf82996811939","resistance-bands":"844d2a182c375e2c768d225e3f9e38c7077abf2e881c9e61e25f1ab3c4925d55","shift-measure":"f01731de00d197e33bab829b45e7ff0aee8a7858697e1d5554b34d17e7db5f4f","erectile-dysfunction":"10274f42ee22ede5f3a4d8a48dbc359b7cd669b1658cd5da779695c114041787","hair-loss":"09d61c8614d62045125e37d3f7d7ab7df657318fd6df3798ec856d080e91fab7","stop-smoking":"ca37ae50dce4ff29fd18a539512e11ef9c887319714693fa3671746440a717e6","sleep-apnoea":"bb3fd091aad576a097454b7ec7cfa33d187ee72e3afd83ea07d60f0100e07cb1"};
test('all nine other Health pages render byte-for-byte identically',()=>{
 for(const [slug,hash] of Object.entries(baselineHashes))assert.equal(createHash('sha256').update(renderShiftHealthDocument(shell,slug)).digest('hex'),hash,slug);
});
