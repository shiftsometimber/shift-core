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
});
