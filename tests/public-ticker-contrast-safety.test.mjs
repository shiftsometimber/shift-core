import test from 'node:test';
import assert from 'node:assert/strict';
import {contrastSafetyStyles,contrastSafetyVersion} from '../public-navigation-policy.mjs';

test('audited public contrast safety stays brand-only and covers the shared collision roots',()=>{
  assert.match(contrastSafetyVersion,/^public-contrast-20260917-r\d+$/);
  for(const selector of [
    '.sst-service-bridge__limit','a.sst-service-bridge__cta','.ct-form-card',
    '.faqcard','.eu-card','.dec-panel','.ready-panel','.ready-card',
    '.resource-card-v3b2','.fifa-card','.future-card','.authority-next a',
    '.shift-guided-card','.at-composer','.sh-card__alt','.tool-intro',
    '.featured-links__eyebrow'
  ]) assert.ok(contrastSafetyStyles.includes(selector),selector);
  for(const colour of contrastSafetyStyles.match(/#[0-9a-fA-F]{6}/g)||[])
    assert.ok(['#E7E3DA','#050505','#707762'].includes(colour),colour);
  assert.doesNotMatch(contrastSafetyStyles,/#fff(?:fff)?\b|#f4f1e9\b|background:\s*white\b|color:\s*white\b/i);
});
