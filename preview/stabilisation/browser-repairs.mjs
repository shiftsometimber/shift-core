import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
assert(process.env.GITHUB_REF==='refs/heads/preview/stabilisation-life-back-20260917');
const worker=readFileSync('preview/stabilisation/worker.mjs','utf8');
for(const marker of ["'Referrer-Policy':'same-origin'",'const tickerAsset=publicTickerAsset(request)',"if(path==='/member-login')body=body.replace"])assert(worker.includes(marker),'Preview entry repair missing: '+marker);
const path='public-shell-contract.mjs';let shell=readFileSync(path,'utf8');
assert(shell.includes('data-shared-footer-dependency')&&shell.includes('data-related-guide-dependency'));
assert(shell.includes("if(groups&&!/<section\\b[^>]*\\bdata-shift-link-repair"));
// Read-only browser CSS inspection proved the competing rule is
// body.vr-site:not(.home-approved) h2 (two class selectors, two element selectors).
// Own only these new component headings; no more global typography patches.
shell=shell.replaceAll('footer.site-footer h2{','footer.site-footer .footer-grid section h2{');
shell=shell.replaceAll('[data-shift-link-repair]', 'section[data-shift-link-repair][aria-label]');
// Avoid duplicating the section scope on subsequent preview gate runs.
shell=shell.replaceAll('sectionsection[data-shift-link-repair][aria-label][aria-label]','section[data-shift-link-repair][aria-label]');
writeFileSync(path,shell);
const proofPath='preview/stabilisation/browser-proof.mjs';let proof=readFileSync(proofPath,'utf8');
assert(proof.includes('previewPreservationFixture')&&proof.includes('footer heading consistency'));
const before="if(path==='/shift-health'){const related=",after="if(path==='/shift-health'){assert.equal(await page.locator('[data-shift-link-repair] h2').evaluate(el=>getComputedStyle(el).fontSize),'22px','Related-guide heading owns its typography');const related=";
if(!proof.includes(after)){assert(proof.includes(before));proof=proof.replace(before,after);writeFileSync(proofPath,proof);}
console.log('Measured legacy selector collision removed from owned component headings; all functional, visual and preservation assertions remain active.');
