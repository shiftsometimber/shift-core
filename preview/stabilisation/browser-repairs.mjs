import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
assert(process.env.GITHUB_REF==='refs/heads/preview/stabilisation-life-back-20260917');
const worker=readFileSync('preview/stabilisation/worker.mjs','utf8');
for(const marker of ["'Referrer-Policy':'same-origin'",'const tickerAsset=publicTickerAsset(request)',"if(path==='/member-login')body=body.replace"])assert(worker.includes(marker),'Preview entry repair missing: '+marker);
const path='public-shell-contract.mjs';let shell=readFileSync(path,'utf8');
for(const marker of ['data-shared-footer-dependency','data-related-guide-dependency'])assert(shell.includes(marker),'Scoped component dependency missing: '+marker);
const before="if(groups&&!html.includes('data-shift-link-repair')){",after="if(groups&&!/<section\\b[^>]*\\bdata-shift-link-repair(?:\\s|>|=)/i.test(html)){";
if(!shell.includes(after)){assert(shell.includes(before));shell=shell.replace(before,after);writeFileSync(path,shell);}
const proof=readFileSync('preview/stabilisation/browser-proof.mjs','utf8');
assert(proof.includes('previewPreservationFixture'),'Non-empty preservation fixture missing');assert(proof.includes('footer heading consistency'),'Visual consistency assertion missing');
console.log('Preview component dependencies verified; related-guide idempotence uses actual section markup, never CSS text.');
