import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import {contrastSafetyStyles,contrastSafetyVersion,contrastSafetyClient,withPublicTicker} from '../public-navigation-policy.mjs';

test('audited public contrast safety stays brand-only and covers the shared collision roots',()=>{
  assert.match(contrastSafetyVersion,/^public-contrast-20260917-r\d+$/);
  for(const selector of [
    '.sst-service-bridge__limit','a.sst-service-bridge__cta','.ct-form-card',
    '.faqcard','.eu-card','.dec-panel','.ready-panel','.ready-card',
    '.resource-card-v3b2','.fifa-card','.future-card','.authority-next a',
    '.shift-guided-card','.at-composer','.sh-card__alt','.tool-intro',
    '.featured-links__eyebrow','.editorial-note-v2222','.review-status-v2222',
    'table.reta-table','table.nhsm-table','.calc-explain-card','.sh-choice-grid-v72',
    '.mmh-start-grid','details.mw-evidence'
  ]) assert.ok(contrastSafetyStyles.includes(selector),selector);
  for(const colour of contrastSafetyStyles.match(/#[0-9a-fA-F]{6}/g)||[])
    assert.ok(['#E7E3DA','#050505','#707762'].includes(colour),colour);
  assert.doesNotMatch(contrastSafetyStyles,/#fff(?:fff)?\b|#f4f1e9\b|background:\s*white\b|color:\s*white\b/i);
});

test('severe contrast guard is syntactically valid and injected once into public HTML',async()=>{
  new Script(contrastSafetyClient);
  const html='<!doctype html><html><head><title>x</title></head><body><header></header><main><p>x</p></main></body></html>';
  const req=new Request('https://shiftsometimber.co.uk/knowledge');
  const once=await(await withPublicTicker(req,new Response(html,{headers:{'Content-Type':'text/html'}}))).text();
  const twice=await(await withPublicTicker(req,new Response(once,{headers:{'Content-Type':'text/html'}}))).text();
  assert.equal((once.match(/data-shift-contrast-guard/g)||[]).length,1);
  assert.equal((twice.match(/data-shift-contrast-guard/g)||[]).length,1);
  assert.equal((once.match(/data-shift-public-contrast/g)||[]).length,1);
  assert.equal((twice.match(/data-shift-public-contrast/g)||[]).length,1);
  assert.match(once,/public-contrast-20260917-r2/);
});
