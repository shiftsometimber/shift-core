import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Ask Timber permits credentialed requests from the public site',()=>{
  const source=fs.readFileSync(new URL('../ask-timber-v1.js',import.meta.url),'utf8');
  assert.match(source,/'Access-Control-Allow-Credentials':'true'/);
  assert.match(source,/ORIGINS\.has\(origin\)/);
  assert.match(source,/'Access-Control-Allow-Origin'/);
  assert.match(source,/REVIEWED_SITE_EVIDENCE/);
  assert.match(source,/articles\/glp1-side-effects/);
  assert.match(source,/articles\/stopping-glp1/);
  assert.match(source,/reviewedSiteEvidence\(message\)/);
  assert.match(source,/mode:'reviewed_direct'/);
  assert.match(source,/directReviewedAnswer\(message\)/);
  assert.match(source,/\(eggy\|sulphur\|sulfur\)/);
  assert.match(source,/direct extract from reviewed Shift information/);
  assert.doesNotMatch(source,/error:'answer_unavailable'/);
});

test('Shift Me respects hidden state above its overlay presentation rules',()=>{
  const source=fs.readFileSync(new URL('../frontend/member/member-shift-me-premium-v1.css',import.meta.url),'utf8');
  assert.match(source,/\.sm-empty\[hidden\],\.sm-busy\[hidden\]\{display:none!important\}/);
});
