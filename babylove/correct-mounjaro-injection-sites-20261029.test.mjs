import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {correctedBody,FROM_ROUTINE,FROM_AVAILABILITY,FROM_MISSED,TO_ROUTINE,TO_AVAILABILITY,TO_MISSED} from './correct-mounjaro-injection-sites-20261029.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
const fixture=['opening',FROM_MISSED,'middle',FROM_ROUTINE,'later',FROM_AVAILABILITY,'ending'].join('\n\n');

test('the reviewed correction removes attribution and availability risks and adds the supported schedule rule',()=>{
 const corrected=correctedBody(fixture,{expectedHash:hash(fixture)});
 for(const old of [FROM_ROUTINE,FROM_AVAILABILITY,FROM_MISSED])assert(!corrected.includes(old));
 for(const next of [TO_ROUTINE,TO_AVAILABILITY,TO_MISSED])assert(corrected.includes(next));
 assert(!corrected.includes('— Matt O’Brien'));
 assert.match(corrected,/does not currently provide or book prescribing, dispensing or treatment/);
 assert.match(corrected,/at least three days between two doses/);
});

test('stale, missing and duplicate public copy fail closed',()=>{
 assert.throws(()=>correctedBody(fixture+'changed',{expectedHash:hash(fixture)}),/Live article changed/);
 for(const missing of [FROM_ROUTINE,FROM_AVAILABILITY,FROM_MISSED])assert.throws(()=>correctedBody(fixture.replace(missing,''),{expectedHash:hash(fixture.replace(missing,''))}),/missing or duplicated/);
 const duplicate=fixture+'\n'+FROM_AVAILABILITY;
 assert.throws(()=>correctedBody(duplicate,{expectedHash:hash(duplicate)}),/missing or duplicated/);
});
