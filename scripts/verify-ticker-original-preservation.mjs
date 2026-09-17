import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {preserveContinuityContent} from '../public-continuity-preservation.mjs';
import {publicPageEvidence} from '../medicines-watch/preservation.mjs';
// Original archived pre/post hashes from production run 35197863290.
// Its pre-release checker normalized two tokens and retained the third at r2.
// Reconstruct that exact representation from current bytes to prove preservation
// against the original evidence, without substituting a fresh baseline.
const before=JSON.parse(readFileSync('original-release/public-before.json'));
const after=JSON.parse(readFileSync('original-release/public-after.json'));
const hash=value=>createHash('sha256').update(value).digest('hex'),results=[];
assert.equal(before.pages.length,12);assert.equal(after.pages.length,12);
for(const old of before.pages){
 const response=await fetch('https://shiftsometimber.co.uk'+old.path,{signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,old.path);
 const raw=Buffer.from(await response.arrayBuffer()),current=preserveContinuityContent(old.path,raw,{required:true});
 const recordedAfter=after.pages.find(p=>p.path===old.path);
 const now=publicPageEvidence(old.path,response.status,current,{requireTreatmentsEntry:true,hash});
 assert.equal(now.sha256,recordedAfter.sha256,old.path+' differs from the original post-deployment evidence');
 const text=current.toString('utf8'),marker='data-shift-ai-full-wire="public-news-20260917-r3"';
 const count=text.split(marker).length-1;assert.ok(count===0||count===1);
 const originalRepresentation=Buffer.from(text.replace(marker,'data-shift-ai-full-wire="public-news-20260917-r2"'));
 const equivalent=publicPageEvidence(old.path,response.status,originalRepresentation,{requireTreatmentsEntry:true,hash});
 assert.equal(equivalent.sha256,old.sha256,old.path+' differs from original pre-deployment content');
 assert.equal(equivalent.bytes,old.bytes,old.path+' pre-deployment size differs');
 results.push({path:old.path,original_before_sha256:old.sha256,current_sha256:now.sha256,exact_marker_difference:count,unchanged_content:true});
}
writeFileSync('ticker-original-preservation.json',JSON.stringify({ok:true,original_run:35197863290,results},null,2));
console.log('ORIGINAL_TICKER_PRESERVATION '+JSON.stringify({ok:true,original_run:35197863290,results}));
