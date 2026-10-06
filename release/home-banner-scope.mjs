import {coachingHistoricalRef,verifyCoachingRelease} from '../shift-coach/release-contract.mjs';
// Extend the historical exact-source gates only for Matt's approved homepage insertion.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const HOME_BANNER_PREVIEW='a6df71e802cd6296f5f2af28fe8f347fec92ce12';
export const HOME_BANNER_RUN=36694132592;
export const CREAM_PREVIEW='4f294ec717d8ce523a2739f757716b51e5117a6c';
export const CREAM_RUN=36718120436;
export const FOOTER_PREVIEW='56504b56cf0b9d6cfd1a2ee7ca44831547b3ec69';
export const FOOTER_RUN=36723365840;
export const HOME_BANNER_PATHS=new Set(['frontend/member/fit-v3-images/sst-header-brand-mark-20261001.png','home-compact-footer.mjs','.github/workflows/home-compact-proof.yml','release/home-compact-proof.cjs','preview/home-banner/free-design.mjs','preview/home-banner/cream-footer.mjs','home-route-banner-legacy.mjs','cream-navigation.mjs','preview/home-banner/four-step.mjs','preview/home-banner/cream-header.mjs','preview/home-banner/verify-spacing.cjs','.github/workflows/cloudflare-production-promote.yml','release/home-banner-live.cjs','home-route-banner.mjs','home-route-font.mjs','public-startup-stability.mjs','release/member-details-preservation.mjs','release/home-banner-scope.mjs','tests/home-route-banner.test.mjs','.github/workflows/home-banner-preview.yml','preview/home-banner/banner.mjs','preview/home-banner/assets/barlow-condensed-700.ttf','preview/home-banner/assets/OFL.txt','preview/home-banner/build.mjs','preview/home-banner/worker.mjs','preview/home-banner/wrangler.jsonc','preview/home-banner/verify.cjs']);
const read=(ref,p)=>execFileSync('git',['show',ref+':'+p],{encoding:'utf8'});
export function originalHomeSpeedSource(path,source){
 if(path==='release/member-details-preservation.mjs')source=source.replace("import {removeCatalogueBenefits} from '../catalogue-benefits.mjs';\n",'').replace(" // Reverse the exact already-live catalogue copy before the older banner.\n // The banner's strict signatures and the full-page comparison still reject drift.\n",'').replace("removeCatalogueBenefits(body.toString('utf8'),path)","body.toString('utf8')");
 if(path==='release/member-details-preservation.mjs')source=source.replace("import {restoreHomeFont} from '../shift-coach/public-font-delivery.mjs';\n",'').replace("removeCreamNavigation(restoreHomeFont(path,body.toString('utf8')))","removeCreamNavigation(body.toString('utf8'))");
 if(path==='public-startup-stability.mjs')source=source.replace("import {withBookVoice} from './book-voice.mjs';\n",'').replace('return withBookVoice(request,response);','return response;').replace('return withBookVoice(request,new Response(after,{status:response.status,statusText:response.statusText,headers}));','return new Response(after,{status:response.status,statusText:response.statusText,headers});');
 source=source.replace("import {addCreamNavigation} from './cream-navigation.mjs';\n",'').replace('function stabiliseOriginalPublicHtml(path,html){','export function stabilisePublicHtml(path,html){').replace('export function stabilisePublicHtml(path,html){return addCreamNavigation(stabiliseOriginalPublicHtml(path,html));}\n','');
 if(path==='public-startup-stability.mjs')source=source.replace("response.status!==200||!(response.headers", "response.status!==200||!['/','/programme','/programme.html','/member-login','/member-login.html'].includes(path)||!(response.headers");
 source=source.replace("import {removeCreamNavigation} from '../cream-navigation.mjs';\n",'').replace("const original=removeCreamNavigation(body.toString('utf8'));","const original=body.toString('utf8');").replaceAll('removeCreamNavigation(stabilisePublicHtml(path,before))','stabilisePublicHtml(path,before)');
 if(path==='public-startup-stability.mjs')return source.replace("import {addHomeBanner} from './home-route-banner.mjs';\n",'').replace('return addHomeBanner(repairHomeSpeed(html,path,{final:true}));','return repairHomeSpeed(html,path,{final:true});');
 if(path==='release/member-details-preservation.mjs')return source.replace("import {removeHomeBanner} from '../home-route-banner.mjs';\n",'').replace("const original=body.toString('utf8');const text=path==='/'?removeHomeBanner(original):original;body=Buffer.from(text);let before=text;","const text=body.toString('utf8');let before=text;").replace("assert.equal(path==='/'?removeHomeBanner(stabilisePublicHtml(path,before)):stabilisePublicHtml(path,before),text,","assert.equal(stabilisePublicHtml(path,before),text,");
 return source;
}
export function validateHomeBanner(){
 verifyCoachingRelease();
 assert.equal(execFileSync('git',['hash-object','home-compact-footer.mjs'],{encoding:'utf8'}).trim(),'dcbbe3efa6c5882a3dd762da0a7f0eb67160e6fc','Approved 1 October homepage presentation changed');
 assert.equal(read('HEAD','preview/home-banner/free-design.mjs'),read('2a26480aaadcbd7177d2671d21de35b4028de2d8','preview/home-banner/free-design.mjs'),'Approved compact homepage source changed');
 assert.equal(read('HEAD','preview/home-banner/cream-footer.mjs'),read(FOOTER_PREVIEW,'preview/home-banner/cream-footer.mjs'),'Approved cream footer changed');
 assert.equal(read('HEAD','preview/home-banner/cream-header.mjs'),read(CREAM_PREVIEW,'preview/home-banner/cream-header.mjs'),'Approved cream navigation changed');
 assert.equal(read('HEAD','preview/home-banner/four-step.mjs').replace('../../home-route-banner-legacy.mjs','../../home-route-banner.mjs'),read(CREAM_PREVIEW,'preview/home-banner/four-step.mjs'),'Approved four-step banner changed');
 assert.equal(read('HEAD','home-route-banner-legacy.mjs'),read('c0d53358e5117bfa148582e42496b9dd9e456249','home-route-banner.mjs'),'Previous banner source changed');
 assert.equal(read('HEAD','.github/workflows/home-banner-preview.yml').replace('node preview/home-banner/verify-spacing.cjs','node preview/home-banner/verify.cjs'),read(HOME_BANNER_PREVIEW,'.github/workflows/home-banner-preview.yml'),'Preview gate changed beyond focused spacing verification');
 // Reconcile only the exact separately approved PWA stylesheet; all remaining workflow bytes stay pinned.
 const workflow=read(coachingHistoricalRef('HEAD','.github/workflows/cloudflare-production-promote.yml'),'.github/workflows/cloudflare-production-promote.yml').replace("          import {styles as pwaStyles} from './my-timber-pwa/presentation.mjs';\n",'').replace("...HOME_BLOCKING_STYLES,'/assets/my-timber-pwa.css':pwaStyles","...HOME_BLOCKING_STYLES").replace('      - "home-route-banner.mjs"\n','').replace('node --test tests/home-route-banner.test.mjs tests/app-layout-live.test.mjs','node --test tests/app-layout-live.test.mjs').replace('          node release/home-banner-live.cjs\n','');
 assert.equal(workflow,read('e518a5d97b9682afb07ee932057c3414251093ab','.github/workflows/cloudflare-production-promote.yml'),'Existing production gates changed');
 for(const p of ['public-startup-stability.mjs','release/member-details-preservation.mjs'])assert.equal(originalHomeSpeedSource(p,read('HEAD',p)),read('e518a5d97b9682afb07ee932057c3414251093ab',p),'Unrelated homepage/startup change: '+p);
 for(const p of HOME_BANNER_PATHS){if(p.startsWith('preview/home-banner/')&&p!=='preview/home-banner/free-design.mjs'&&p!=='preview/home-banner/build.mjs'&&p!=='preview/home-banner/verify-spacing.cjs'&&p!=='preview/home-banner/cream-header.mjs'&&p!=='preview/home-banner/cream-footer.mjs'&&p!=='preview/home-banner/four-step.mjs')assert.equal(execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}),execFileSync('git',['rev-parse',HOME_BANNER_PREVIEW+':'+p],{encoding:'utf8'}),'Signed-off preview changed: '+p);}
 const font=execFileSync('git',['show',HOME_BANNER_PREVIEW+':preview/home-banner/assets/barlow-condensed-700.ttf']).toString('base64');
 assert.equal(read('HEAD','home-route-font.mjs'),'export const fontData='+JSON.stringify('data:font/ttf;base64,'+font)+';\n','Approved font bytes changed');
}
