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

// Actual failure39114788801: current main settles after the early CSS stage.
import {withSharedFooter as deliverFinalHomeCss,applySharedFooter as originalFooterHtml} from '../shared-footer.mjs';
import {CURRENT_HOME_MAIN as finalApprovedMain} from '../home-current-main-private-20261018.mjs';
import {HOME_RECOVERY_CSS as finalRecoveryCss} from '../home-critical-styles.mjs';
import {RETA_STYLES as finalRetaStyles} from '../reta-styles-data.mjs';
import {verifyRootPreservation as verifyFinalRootBoundary} from '../release/root-share-preview-live.mjs';
import {APPROVED_SHARE_URL as finalApprovedShareUrl} from '../share-preview/metadata.mjs';
test('final current homepage delivers the unchanged approved CSS after late main rendering and preserves every other byte',async()=>{
 const specs=[['/assets/v42h.css?v=42p6',HOME_BLOCKING_STYLES['/assets/v42h.css?v=42p6'],HOME_V42_CSS],['/assets/shift-recovery-v6.css?v=cos-live-recovery-20260909-r2',finalRetaStyles['/assets/shift-recovery-v6.css?v=cos-live-recovery-20260909-r2'],finalRecoveryCss]];
 const full='<html><head><meta property="og:image" content="'+finalApprovedShareUrl+'"><meta name="twitter:image" content="'+finalApprovedShareUrl+'">'+specs.map(([path,css])=>'<style data-home-inline-css="'+path+'">'+css.replace(/\/\*[\s\S]*?\*\//g,c=>c.replaceAll('<','&lt;'))+'</style>').join('')+'</head><body>'+finalApprovedMain+'<script>const originalHomeHandler=true;</script></body></html>';
 const request=new Request('https://example.test/'),response=s=>new Response(s,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Unrelated':'retained'}});
 const baseline=originalFooterHtml(full);assert(!baseline.includes(finalRecoveryCss));assert(!baseline.includes(HOME_V42_CSS));
 let expected=baseline;
 for(const[path,,css]of specs){const rows=[...expected.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/g)].filter(row=>row[1].includes('data-home-inline-css="'+path+'"'));assert.equal(rows.length,1);expected=expected.replace(rows[0][0],rows[0][0].replace(rows[0][2],css));}
 const output=await deliverFinalHomeCss(request,response(full));assert.equal(output.headers.get('X-Unrelated'),'retained');const html=await output.text();assert.equal(html,expected);assert.equal(verifyFinalRootBoundary(Buffer.from(baseline),Buffer.from(html)),true);assert(html.includes(finalRecoveryCss));assert(html.includes(HOME_V42_CSS));assert.equal(html.match(/<main\b[\s\S]*?<\/main>/)[0],finalApprovedMain);assert.equal(await(await deliverFinalHomeCss(request,response(html))).text(),html);
 for(const altered of [full.replace('Helping ordinary','Unapproved change'),full.replace('data-home-inline-css="/assets/v42h.css?v=42p6">','data-home-inline-css="/assets/v42h.css?v=42p6">.unknown{}'),full.replace('</head>',specs.map(([path,css])=>'<style data-home-inline-css="'+path+'">'+css+'</style>').join('')+'</head>')]){const value=await(await deliverFinalHomeCss(request,response(altered))).text();assert(!value.includes(finalRecoveryCss));assert(!value.includes(HOME_V42_CSS));}
 for(const path of ['/about','/contact','/member/dashboard'])assert.equal(await(await deliverFinalHomeCss(new Request('https://example.test'+path),response(full))).text(),originalFooterHtml(full));
 for(const method of ['HEAD','POST']){const input=response(full);assert.equal(await deliverFinalHomeCss(new Request('https://example.test/',{method}),input),input);}
 for(const bad of [html.replace('Helping ordinary','Unapproved copy'),html.replace('</body>','<script>unapproved=true</script></body>'),html.replace('fetchpriority="high"','fetchpriority="low"'),html.replace('data-home-inline-css="/assets/v42h.css?v=42p6">','data-home-inline-css="/assets/v42h.css?v=42p6">.unapproved{}')])assert.throws(()=>verifyFinalRootBoundary(Buffer.from(baseline),Buffer.from(bad)));
 const unknownBaseline=baseline.replace('data-home-inline-css="/assets/v42h.css?v=42p6">','data-home-inline-css="/assets/v42h.css?v=42p6">.unapproved{}');assert.throws(()=>verifyFinalRootBoundary(Buffer.from(unknownBaseline),Buffer.from(html)));
 const notFound=new Response(full,{status:404,headers:{'Content-Type':'text/html'}});assert.equal(await(await deliverFinalHomeCss(request,notFound)).text(),originalFooterHtml(full));
});
