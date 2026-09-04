import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const harnesses=[
  'g2-011-progress-story-production.mjs',
  'g2-013-progress-picture-rendered-production.mjs',
  'g2-014-progress-picture-premium-production.mjs',
  'g2-015-plan-manager-production.mjs'
];

test('rendered production harnesses let Playwright retain the login response cookie',()=>{
  for(const file of harnesses){
    const source=fs.readFileSync(file,'utf8');
    assert.match(source,/p\.context\(\)\.request\.post/,`${file} must log in through the browser context cookie jar`);
    assert.match(source,/p\.context\(\)\.cookies\(\[SITE,API\]\)/,`${file} must verify the retained live-host cookie`);
    assert.doesNotMatch(source,/addCookies\(/,`${file} must not reconstruct a server cookie`);
    assert.doesNotMatch(source,/domain:'\.shiftsometimber\.co\.uk'/,`${file} must not depend on parent-domain interpretation`);
  }
});
