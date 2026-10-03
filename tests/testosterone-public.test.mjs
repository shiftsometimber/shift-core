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
const reviewedAuditCopy=[["This information does not mean a test, device or treatment is available to order.","No order or booking can be made on this page. The guide below explains the intended route. Provider, product, price and follow-up arrangements must be confirmed before ordering opens."],["<a href=\"#included\">What you get</a>","<a href=\"#included\">Proposed scope</a>"],["<small>02 · WHAT YOU GET</small><h2>More than an item in a box.</h2>","<small>02 · PROPOSED SCOPE</small><h2>What the route would need to include.</h2>"],["<b>Included in the route</b>","<b>Proposed scope — subject to confirmation</b>"],["<b>What My Timber keeps</b>","<b>How this could fit My Timber</b>"],["<h2>One clear route. No mystery hand-offs.</h2>","<h2>The proposed steps, once available.</h2><p class=\"sectionCopy\">These steps describe the intended service, not a booking or a promise of clinical follow-up. Ask about availability before making plans around it.</p>"],["My Timber keeps the result, your priorities and one useful next step together. It becomes part of your Journey—not another purchase you forget about in a drawer.","You can use My Timber today for your own goals, check-ins and progress. Reading this guide or saving an interest does not book a test, arrange treatment or create clinical follow-up."]];
test('nine Health pages preserve baseline outside reviewed availability and NHS safety corrections',()=>{
 for(const [slug,hash] of Object.entries(baselineHashes)){
  const html=renderShiftHealthDocument(shell,slug);
  let preserved=html;
  for(const [before,after] of reviewedAuditCopy){assert.equal(preserved.split(after).length-1,1,slug+': exact reviewed copy');preserved=preserved.replace(after,before);}
  for(const [before,after] of [["Record three morning readings", "Follow the agreed repeat-reading schedule"], ["Log three properly taken morning readings, then use the appropriate health door if the pattern is high.", "If your doctor or nurse asks you to monitor at home, take two readings a minute apart, usually morning and evening. Follow their advice on how many days to record and arrange for the complete record to be reviewed."], ["Chest pain during sex, an erection lasting four hours, penile injury, severe pain or sudden neurological symptoms need urgent medical help.", "Call 999 or go to A&amp;E for an erection lasting more than 3 to 4 hours. With sickle cell disease, a painful erection lasting more than one hour needs emergency help. Chest pain or sudden stroke-like symptoms also need emergency help; penile injury or severe pain needs urgent assessment."]]){if(preserved.includes(after)){assert.equal(preserved.split(after).length-1,1);preserved=preserved.replace(after,before);}}
  assert.equal(createHash('sha256').update(preserved).digest('hex'),hash,slug);
  assert.equal((html.match(/name="twitter:image"/g)||[]).length,1,slug);
 }
});
