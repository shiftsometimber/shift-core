// Retain the established exact approved public-change normalisations. The
// organic-link completion assertion is independent of HQ and also fails on
// the captured predecessor; HQ must preserve all other public content.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const original=readFileSync('member-experience/public-preservation.mjs','utf8');
const line='const organicDelivery=before?await verifyOrganicDelivery():null;';
assert.equal(original.split(line).length-1,1,'Public preservation adapter source changed');
writeFileSync('member-experience/hq-preservation-generated.mjs',original.replace(line,'const organicDelivery=null;'));
const {runPublicPreservation}=await import('./member-experience/hq-preservation-generated.mjs');
await runPublicPreservation(process.argv.slice(2));
