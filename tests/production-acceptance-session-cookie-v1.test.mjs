import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const harnesses=[
  'g2-011-progress-story-production.mjs',
  'g2-013-progress-picture-rendered-production.mjs',
  'g2-014-progress-picture-premium-production.mjs',
  'g2-015-plan-manager-production.mjs'
];

test('rendered production harnesses bind the disposable session to both live hosts',()=>{
  for(const file of harnesses){
    const source=fs.readFileSync(file,'utf8');
    assert.match(source,/url:SITE/,`${file} must seed the public-site cookie`);
    assert.match(source,/url:API/,`${file} must seed the API-host cookie`);
    assert.doesNotMatch(source,/domain:'\.shiftsometimber\.co\.uk'/,`${file} must not depend on parent-domain interpretation`);
    assert.match(source,/\(\?:\^\|,\\s\*\)sst_session/,`${file} must parse combined Set-Cookie headers`);
  }
});
