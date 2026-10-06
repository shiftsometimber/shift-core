import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateInlineToolComposition} from '../release/seo-follow-through-scope.mjs';
test('exact inline worker composition rejects scope and every current payload drift',()=>{
 const c=JSON.parse(readFileSync('shift-coach/release-manifest.json')).seoFollowThroughComposition.integrationComposition.inlineToolComposition;
 assert(c);validateInlineToolComposition(c);
 for(const patch of [{proof:'unknown'},{base:'f'.repeat(40)},{paths:[...c.paths,'wrangler.jsonc']}])assert.throws(()=>validateInlineToolComposition({...c,...patch}));
 for(const changed of c.paths)assert.throws(()=>validateInlineToolComposition(c,(ref,p)=>ref==='HEAD'&&p===changed?'drift':p),/Coaching release source drift/);
});

import {assertCoachingChangedPath} from '../shift-coach/release-contract.mjs';
test('coaching scope accepts only the exact pinned member presentation modification',()=>{assertCoachingChangedPath('M','my-timber-pwa/presentation.mjs');assert.throws(()=>assertCoachingChangedPath('A','my-timber-pwa/presentation.mjs'),/Unexpected member worker presentation status/);assert.throws(()=>assertCoachingChangedPath('M','my-timber-pwa/unreviewed.mjs'),/Unlisted coaching/);});
