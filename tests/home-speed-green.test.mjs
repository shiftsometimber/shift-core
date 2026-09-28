import test from 'node:test';
import assert from 'node:assert/strict';
import {repairHomeSpeed} from '../home-speed-repair.mjs';
import {HOME_BLOCKING_STYLES} from '../home-blocking-styles.mjs';
import {preserveApprovedStartup} from '../release/member-details-preservation.mjs';
const raw='<html><head><link rel="stylesheet" href="/assets/v42h.css?v=42p6"><link rel="stylesheet" href="/assets/my-timber-pwa.css"></head><body><main class="home-hero"><h1>Keep this</h1></main></body></html>';
test('homepage styles retain source order, all rules and body; private routes untouched',()=>{
 const early=repairHomeSpeed(raw,'/');assert(early.includes('<link rel="stylesheet" href="/assets/my-timber-pwa.css">'));
 const final=repairHomeSpeed(early,'/',{final:true});
 assert.equal(final.match(/data-home-inline-css=/g).length,2);
 for(const css of Object.values(HOME_BLOCKING_STYLES))assert(final.includes(css.replace(/\/\*[\s\S]*?\*\//g,c=>c.replaceAll('<','&lt;'))));
 assert.equal(final.split('<body>')[1],raw.split('<body>')[1]);
 assert.equal(repairHomeSpeed(final,'/',{final:true}),final);
 assert.equal(repairHomeSpeed(raw,'/member/dashboard',{final:true}),raw);
 assert.equal(preserveApprovedStartup('/',Buffer.from(final)).toString(),early);
 const altered=final.replace('Keep this','Changed');assert.notEqual(preserveApprovedStartup('/',Buffer.from(altered)).toString(),early);
 assert.throws(()=>preserveApprovedStartup('/',Buffer.from(final.replace('data-home-inline-css="/assets/my-timber-pwa.css">','data-home-inline-css="/assets/my-timber-pwa.css">.bad{}'))));
});
