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
 assert.equal((html.match(/name="twitter:image"/g)||[]).length,1);
 for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes('id="'+id+'"'),id);
});
test('testosterone card moves to first; exact previous grid is recoverable',()=>{
 const next=promoteTestosteroneCard(hubMain);assert.equal(next.match(/<article class="card" id="([^"]+)"/)[1],'testosterone');
 assert.equal((next.match(/id="testosterone"/g)||[]).length,1);
 assert.equal(preserveHealthCardOrder('/shift-health',Buffer.from(next)).toString(),hubMain);
 assert.throws(()=>preserveHealthCardOrder('/shift-health',Buffer.from(next.replace('Energy check','Unexpected change'))));
});
// Baseline e64cbf56032efc7fe727cb52b5832530e632824d with the fixed shell above.
const baselineHashes={"health-mot":"ace2184691693814d7f4aaf9d2e2ce3ccd47df6ecaf49bd59bb436044ff4d613","blood-pressure-monitor":"ecbebe3309a1d586c33b184aff3bd70d5fce7ba779730763dc4e7a730a225c63","digital-scales":"5d77978f075b17061489e3994bd0211b42ace2e4e857d629ab265214179e83c4","resistance-bands":"03c284c28c6eabdc3dc74b875705817ee0fd78d7b83bff2cfcd2f774df8755c9","shift-measure":"13ef946d85581e2a4bd122e3593663d23342ce7fc3bba44bfa173a6a2f085b35","erectile-dysfunction":"e9ba0c92e2709d56c7db242151d5f103094938205c1dbba884212017cbc8a99d","hair-loss":"ac1725552865eca1a6a21fb52d06d65eb0fe372e3dabdd9dc40b490b01ac4ed8","stop-smoking":"420e70931b8e33c9340799abe95f7668007acbe2c59e09f31147cb365719e076","sleep-apnoea":"17674bba34753babb866b2079f3f3c350e7a5101cbe210891811efdbbad510f0"};
test('all nine other Health pages render byte-for-byte identically',()=>{
 for(const [slug,hash] of Object.entries(baselineHashes)){
  const html=renderShiftHealthDocument(shell,slug);
  assert.equal(createHash('sha256').update(html).digest('hex'),hash,slug);
  assert.equal((html.match(/name="twitter:image"/g)||[]).length,1,slug);
 }
});
