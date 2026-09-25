import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('iOS release metadata stays read-only',()=>{const e=read('native/ios/HealthKit.entitlements'),p=read('prepare-integration.mjs');assert.match(e,/com\.apple\.developer\.healthkit/);assert.match(p,/CODE_SIGN_ENTITLEMENTS: HealthKit\.entitlements/);assert.match(p,/NSHealthShareUsageDescription/);assert.doesNotMatch(p,/NSHealthUpdateUsageDescription/)});
test('Android requests only selected health reads',()=>{const m=read('native/android/src/main/AndroidManifest.xml');for(const p of ['READ_WEIGHT','READ_HEIGHT','READ_STEPS','READ_SLEEP'])assert.match(m,new RegExp(p));assert.doesNotMatch(m,/WRITE_|READ_HEALTH_DATA_IN_BACKGROUND|READ_HEALTH_DATA_HISTORY/);assert.match(m,/ACTION_SHOW_PERMISSIONS_RATIONALE/);assert.match(m,/VIEW_PERMISSION_USAGE/)});
test('production flag remains absent until device acceptance',()=>{const root=readFileSync(new URL('../../wrangler.toml',import.meta.url),'utf8');assert.doesNotMatch(root,/CONNECTED_HEALTH_V1_ENABLED/);assert.match(read('compile.jsonc'),/CONNECTED_HEALTH_V1_ENABLED/)});
