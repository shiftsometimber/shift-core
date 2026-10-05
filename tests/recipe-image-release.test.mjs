import test from 'node:test';
import assert from 'node:assert/strict';
import {RECIPE_IMAGE_PATHS,validateRecipeImages} from '../release/recipe-image-scope.mjs';

test('composed recipe image releases keep unrelated current-main features protected',()=>{
 for(const path of ['medicines-watch/industry.mjs','medicines-watch/README.md','transactional-email-v1.js','auth-delivery-v1.js','home-route-banner.mjs','wrangler.jsonc'])assert.equal(RECIPE_IMAGE_PATHS.has(path),false,path);
 for(const path of RECIPE_IMAGE_PATHS){
  assert(/^(?:frontend\/member\/assets\/member-experience\/food(?:\/|$)|evidence\/(?:recipe-image-worker|recipe-image-recovery-20261005|grub-image-coverage-2026-10-04)(?:\/|$))/.test(path)||new Set(['evidence/prepared-recipe-images-2026-10-04.json','member-experience/grub-image-map.mjs','member-experience/grub-client.mjs','member-experience/grub-intelligence-client.mjs','member-experience/tests/grub-intelligence.test.mjs','member-experience/tests/recipe-image-production.test.mjs','scripts/build-grub-image-coverage.mjs','.github/workflows/readiness-preservation.yml','release/recipe-image-manifest.json','release/recipe-image-scope.mjs','tests/recipe-image-release.test.mjs']).has(path),'Unrelated recipe release exception: '+path);
 }
 assert.equal(validateRecipeImages().complete,false,'Partial recovery must remain explicitly incomplete');
});
