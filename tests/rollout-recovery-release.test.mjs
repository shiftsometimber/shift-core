import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateRolloutRecoveryComposition} from '../release/seo-follow-through-scope.mjs';
test('exact rollout recovery composition rejects scope and every current payload drift',()=>{
 const c=JSON.parse(readFileSync('shift-coach/release-manifest.json')).seoFollowThroughComposition.integrationComposition.rolloutRecoveryComposition;
 assert(c);validateRolloutRecoveryComposition(c);
 for(const patch of [{proof:'unknown'},{base:'f'.repeat(40)},{paths:[...c.paths,'wrangler.jsonc']}])assert.throws(()=>validateRolloutRecoveryComposition({...c,...patch}));
 for(const changed of c.paths)assert.throws(()=>validateRolloutRecoveryComposition(c,(ref,p)=>ref==='HEAD'&&p===changed?'drift':p),/Coaching release source drift/);
});
