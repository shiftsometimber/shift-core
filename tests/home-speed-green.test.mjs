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

import {HOME_BASE_MAIN} from '../home-critical-styles.mjs';
import {HOME_V42_CSS} from '../home-v42-critical.mjs';
test('final known homepage receives the tested subset even after earlier full CSS inlining',()=>{
 const unknown='<html><head><link rel="stylesheet" href="/assets/v42h.css?v=42p6"></head><body><main class="home-hero">Before final content</main></body></html>';
 const early=repairHomeSpeed(unknown,'/');assert(!early.includes(HOME_V42_CSS));
 const ready=early.replace('<main class="home-hero">Before final content</main>',HOME_BASE_MAIN);
 const final=repairHomeSpeed(ready,'/',{final:true});assert(final.includes(HOME_V42_CSS));assert.equal(repairHomeSpeed(final,'/',{final:true}),final);
 assert.equal(final.match(/<main[\s\S]*?<\/main>/)[0],HOME_BASE_MAIN);
 const changed=ready.replace('data-home-inline-css="/assets/v42h.css?v=42p6">','data-home-inline-css="/assets/v42h.css?v=42p6">.unknown{}');
 assert(!repairHomeSpeed(changed,'/',{final:true}).includes(HOME_V42_CSS));
});
