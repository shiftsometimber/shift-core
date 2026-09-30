import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {replaceFreeStrip,restoreFreeStrip} from './free-strip.mjs';

mkdirSync('preview/home-banner/generated',{recursive:true});
mkdirSync('home-banner-proof',{recursive:true});

const r=await fetch('https://shiftsometimber.co.uk/');
assert(r.ok);
const baseline=await r.text();
const candidate=replaceFreeStrip(baseline);
assert.equal(restoreFreeStrip(candidate),baseline,'Only the existing My Timber free strip may change');

const sha=s=>createHash('sha256').update(s).digest('hex');
writeFileSync('preview/home-banner/generated/page.mjs','export const baseline='+JSON.stringify(baseline)+';export const candidate='+JSON.stringify(candidate)+';');
writeFileSync('home-banner-proof/baseline.html',baseline);
writeFileSync('home-banner-proof/candidate.html',candidate);
writeFileSync('home-banner-proof/capture.json',JSON.stringify({
 capturedAt:new Date().toISOString(),
 source:'https://shiftsometimber.co.uk/',
 sourceCommit:process.env.GITHUB_SHA||null,
 baseline:sha(baseline),
 candidate:sha(candidate),
 exactRestorationAfterRemovingNewStrip:true
},null,2));
console.log('PASS: current live homepage preserved exactly except the approved My Timber free strip');
