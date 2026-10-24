// My Shift composition: retain both exact approved merge parents; see my-shift-release-scope-20261024.mjs.
import {verifyMyShiftRelease,myShiftSafetyComparison,MY_SHIFT_PATHS} from './my-shift-release-scope-20261024.mjs';
import {compactLiteralExcludes} from './combined-finite-scope-20261014.mjs';
import {reconciliationGitArgs,reconciliationHistoricalRead,reconciliationPath,RECONCILIATION_PATHS,verifyReconciledRelease,LATER_UNATTRIBUTED_WATCH_RECOVERY_PRESERVED} from './approved-runtime-composition.mjs';
import {METRICS_PATHS,verifyMetricsConnection} from './metrics-connection-scope.mjs';
import {rankingGrowthHistoricalRef} from './seo-growth-scope.mjs';
import {originalPwaLiveReadVerifier} from './seo-follow-through-preservation.mjs';
import {WATCH_RECONCILIATION_BASE,ZENAGAMTIDE_BASE,ZENAGAMTIDE_PATHS,FIT300_PATHS,READONLY_ORGANIC_PATHS,validateFit300} from './fit-300-scope.mjs';
import {RECIPE_IMAGE_PATHS,validateRecipeImages} from './recipe-image-scope.mjs';
import {DEVICE_HEALTH_PATHS,historicalDeviceHealthRef,validateDeviceHealthSource,verifyDeviceHealthProof} from './device-health-scope.mjs';
import {COACH_BASE,COACH_PATHS,WATCH_CURRENT_PATHS,coachingHistoricalRef,withoutCoachEntrypoint,verifyCoachingRelease} from '../shift-coach/release-contract.mjs';
import {MEMBER_DESIGN_PATHS,MEMBER_LAYOUT_PATHS,validateMemberDesignSource} from './member-design-scope.mjs';
import {FOOTER_CANDIDATE,FOOTER_PATHS,FOOTER_RUNTIME_PATHS,historicalFooterRef,validateFooterSource} from './footer-scope.mjs';
import {validateHomeBanner} from './home-banner-scope.mjs';
import {MEMBER_FOCUS_APPROVED,MEMBER_FOCUS_PATHS,validateMemberFocus} from './member-focus-scope.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {withImmutableHistoryVerification,immutableHistorySourceHead,immutableHistoryExecFileSync} from './immutable-git-facts.mjs';
// Only these native source readers freeze HEAD inside the checked synchronous scope.
const execFileSync=(bin,args,options)=>{const head=immutableHistorySourceHead();return immutableHistoryExecFileSync(bin,head&&bin==='git'?args.map(value=>value==='HEAD'?head:value.startsWith('HEAD:')?head+value.slice(4):value):args,options);};
import {createHash} from 'node:crypto';
export const PWA_DISMISS_APPROVED='fbbc8e592549f48280e32009edcbb73d1dd42669';
export const PWA_DISMISS_PATHS=['my-timber-pwa/ui.mjs','my-timber-pwa/presentation.mjs','my-timber-pwa/pwa.test.mjs','my-timber-pwa/preservation.mjs','my-timber-pwa/preservation.test.mjs','preview/pwa-dismiss/verify.cjs','.github/workflows/pwa-dismiss-preview.yml'];
export const APP_BASE='8c6902c8e0c6a53863282c6c4378f82ec1a70f6f';
export const APP_APPROVED=MEMBER_FOCUS_APPROVED;
export const APP_HASHES=JSON.parse(readFileSync(new URL('./app-manifest.json',import.meta.url))).sha256;
// Exact full-history checkout for the separately pinned recipe imagery release.
APP_HASHES['.github/workflows/readiness-preservation.yml']='ecd1538ae921da46a9e6afc8c6b08dd2df8db6b64e59f71f47def3708c6d145c';
export const ARTICLE_REPAIR_SOURCE='f5184e4ffefd6bc2eb105e86e7107e5c61f00327';
export const ARTICLE_REPAIR_PATHS=new Set(['.github/workflows/evidence-article-repair-snapshot.yml','.github/workflows/evidence-based-article-live-release.yml','babylove/dynamic-public.mjs','babylove/dynamic-public.test.mjs','babylove/repair-evidence-based-article.mjs','public-continuity.mjs']);
export const APP_PATHS=new Set([...FIT300_PATHS,...READONLY_ORGANIC_PATHS,...RECIPE_IMAGE_PATHS,...DEVICE_HEALTH_PATHS,...ARTICLE_REPAIR_PATHS,...Object.keys(APP_HASHES),'release/app-manifest.json','release/app-scope.mjs','release/growth-scope.mjs','docs/content-review/2026-10-03-public-copy-preview.json','docs/content-review/2026-10-03-public-copy-residual.json','medicines-watch/reviews/2026-10-01-authorised-broader-discovery.json','medicines-watch/reviews/2026-10-01-synt101-mad-correction.json','medicines-watch/reviews/2026-10-02-authorised-international-omissions.json','medicines-watch/reviews/2026-10-02-authorised-expanded-discovery.json','medicines-watch/reviews/2026-10-02-authorised-ubt251.json','medicines-watch/reviews/2026-10-02-authorised-sgb7342.json','medicines-watch/reviews/2026-10-02-authorised-abbv-asc30-tern-bimagrumab.json','medicines-watch/reviews/2026-10-02-source-monitor-repairs.json','medicines-watch/reviews/2026-10-02-authorised-registry-omissions.json','medicines-watch/reviews/2026-10-02-pfizer-pdf-monitor-repair.json','medicines-watch/reviews/2026-10-02-authorised-enobosarm-semaglutide.json','medicines-watch/reviews/2026-10-02-authorised-semaglutide-specialist-trials.json','medicines-watch/reviews/2026-10-02-authorised-glimr-copd.json','medicines-watch/reviews/2026-10-02-authorised-specialist-registry-followup.json','medicines-watch/reviews/2026-10-02-authorised-switching-studies.json','medicines-watch/reviews/2026-10-02-authorised-na931.json','medicines-watch/reviews/2026-10-03-authorised-amylin-metabolic-followup.json','medicines-watch/reviews/2026-10-03-authorised-azd1043.json','medicines-watch/reviews/2026-10-03-authorised-azd6234-selene.json','medicines-watch/reviews/2026-10-03-authorised-wve007.json','medicines-watch/reviews/2026-10-03-authorised-specialist-registry-wave.json','medicines-watch/reviews/2026-10-03-authorised-lean-mass-energy-followup.json','medicines-watch/reviews/2026-10-03-authorised-foundayo-predicted-risk.json','medicines-watch/reviews/2026-10-03-authorised-wegovy-mash-correction.json','medicines-watch/reviews/2026-10-03-authorised-vk3019-at673.json','medicines-watch/reviews/2026-10-04-authorised-srsd384.json','medicines-watch/reviews/2026-10-04-authorised-fractyl-modality-gap.json','medicines-watch/reviews/2026-10-04-authorised-art2713-muscle-gap.json',...FOOTER_PATHS,...MEMBER_DESIGN_PATHS,...MEMBER_LAYOUT_PATHS,'release/member-design-scope.mjs','tests/member-design-release.test.mjs','.github/workflows/member-design-release-proof.yml',...COACH_PATHS]);
APP_PATHS.add('medicines-watch/reviews/2026-10-06-authorised-zenagamtide-ambience.json');
APP_PATHS.add('medicines-watch/reviews/2026-10-05-authorised-710go.json');
APP_PATHS.add('medicines-watch/reviews/2026-10-06-authorised-survodutide-synchronize-jp.json');
APP_PATHS.add('medicines-watch/reviews/2026-10-06-authorised-core-trial-lifecycle.json');
APP_PATHS.add('medicines-watch/reviews/2026-10-06-authorised-gub-ucn2-mbl949.json');
APP_PATHS.add('medicines-watch/reviews/2026-10-06-authorised-at7687-at673-alias.json');
APP_PATHS.add('medicines-watch/reviews/2026-10-06-authorised-viking-rhythm-registry-review.json');
APP_PATHS.add('medicines-watch/reviews/2026-10-06-overdue-source-renewal.json');
APP_PATHS.add('medicines-watch/reviews/2026-10-06-authorised-gs4571-tirzepatide-menopause.json');
APP_PATHS.add('medicines-watch/reviews/2026-10-07-authorised-registry-lifecycle-followup.json');
APP_PATHS.add('medicines-watch/reviews/2026-10-07-authorised-enicepatide-emugrobart-registry.json');
// Reconcile separately reviewed current-main public additions with this legacy
// aggregate app boundary. Each path remains covered by its own release tests;
// this list does not relax protected runtime, member-data or configuration checks.
const CURRENT_MAIN_PUBLIC_MAINTENANCE=[
 '.github/workflows/whole-estate-route-sweep.yml',
 'causes-partners-teaser.mjs',
 'causes-partners/README.md',
 'causes-partners/index.html',
 'causes-partners/production.mjs',
 'causes-partners/public-content.mjs',
 'frontend/member/assets/causes/hopeful-outlook-hero.webp',
 'release/health-vision-scope-20261021.json',
 'release/health-vision-scope-20261021.mjs',
 'release/shift-health-vision-20261021/STATUS.json',
 'release/shift-health-vision-20261021/checks.json',
 'release/shift-health-vision-20261021/health-vision-preservation.json',
 'release/shift-health-vision-20261021/live-status-latest.json',
 'release/shift-health-vision-20261021/production-bundle-final.log',
 'release/shift-health-vision-20261021/source-tests-final.log',
 'shift-health-vision-content.mjs',
 'tests/causes-partners-teaser.test.mjs',
 'tests/causes-public.test.mjs',
 'tests/health-vision-scope-20261021.test.mjs',
 'tests/timber-shed-public-teaser.test.mjs',
 'timber-shed-public-teaser.mjs',
 'release/current-runtime-preservation-20261016.mjs',
 'release/recorded-week-navigation-outer-frame-20261018.mjs',
 'reta-styles-data.mjs',
 'gate1-whole-estate-production-sweep.mjs',
 'public-response-policy.test.mjs',
 'release/root-share-preview-scope.mjs',
 'tests/root-share-preview.test.mjs'
];
for(const p of CURRENT_MAIN_PUBLIC_MAINTENANCE)APP_PATHS.add(p);
export const originalAppHashRef=p=>rankingGrowthHistoricalRef('HEAD',p,undefined,false)!=='HEAD'?rankingGrowthHistoricalRef('HEAD',p,undefined,false):['release/app-scope.mjs','release/watch-registry-wave-scope.mjs','shift-coach/release-contract.mjs','tests/b1-release-scope.test.mjs','tests/watch-ownership-release.test.mjs'].includes(p)?'HEAD':p==='my-timber-pwa/presentation.mjs'?PWA_DISMISS_APPROVED:historicalDeviceHealthRef(coachingHistoricalRef(historicalFooterRef(ZENAGAMTIDE_PATHS.includes(p)?ZENAGAMTIDE_BASE:'HEAD',p),p),p);
export function originalMemberWorkerPresentation(source){
 return source.replace("\nexport function memberWorkerHtml(html){\n return html.replace(/(<script\\b[^>]*\\bsrc=[\"'])(\\/(?:app\\.js|register-sw-v3a\\.js)(?:\\?[^\"']*)?)([\"'][^>]*>)/gi,(_,before,src,after)=>before+src+(/[?&](?:amp;)?member_worker=1(?:&|$)/.test(src)?'':(src.includes('?')?'&amp;':'?')+'member_worker=1')+after);\n}\nexport async function memberWorkerAsset(request,response){\n const u=new URL(request.url);\n if(request.method!=='GET'||u.searchParams.get('member_worker')!=='1'||!['/app.js','/register-sw-v3a.js'].includes(u.pathname))return null;\n if(!response.ok||!/(?:javascript|ecmascript)/i.test(response.headers.get('Content-Type')||''))return response;\n const before=await response.text(),legacy=u.pathname==='/app.js'?\"navigator.serviceWorker.register('/service-worker.js')\":\"navigator.serviceWorker.register('/service-worker-v3a.js?v=cos-live-recovery-20260909-r2',{updateViaCache:'none'})\",shared=\"navigator.serviceWorker.register('/shift-push-sw-v1.js',{scope:'/',updateViaCache:'none'})\";\n const h=new Headers(response.headers);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])h.delete(k);h.set('Cache-Control','no-store');\n if(before.split(legacy).length!==2)return new Response('Member worker registration source changed; please retry later.',{status:503,headers:h});\n return new Response(before.replace(legacy,shared),{status:response.status,statusText:response.statusText,headers:h});\n}\n",'').replace("\n const memberAsset=await memberWorkerAsset(request,response);if(memberAsset)return memberAsset;",'').replace("\n if(/^\\/member\\//.test(path))html=memberWorkerHtml(html);",'');
}
for(const p of [...METRICS_PATHS,...RECONCILIATION_PATHS,...LATER_UNATTRIBUTED_WATCH_RECOVERY_PRESERVED])APP_PATHS.add(p);
// Pin the finite owner-approved release and merged safety sources exactly.
// A path cannot admit later edits; every existing app assertion runs below.
const CURRENT_MAIN_SAFETY_CHECK_BLOBS=Object.freeze({
 '.github/workflows/whole-estate-route-sweep.yml':'7252162d1ac21edafd8e71ae504f7c7ad6023ac3',
 'gate1-whole-estate-production-sweep.mjs':'5a9a737b89267158c63ca7634b0b22a62ec1fa88',
 'public-response-policy.test.mjs':'d2c8c91a42e994c56b3454918bb657e5a348d8f3',
 'tests/release-recovery-safety-20261024.test.mjs':'8e364b0358faf18ab78053859db2756e635e754e',
 'continuity-interest-v1.js':'9c82570da17bfbc5e45b0b5d343f8ce56503f405',
 'transactional-email-v1.js':'4713c190b1d502bac7f22d8c6a4d476c0cf5857b',
 'worker-entry-v6.js':'02f14a8badfacae1fd829b1148ba3169fb2e5459',
 'babylove/dynamic-public.mjs':'30accc79e573188eebe2dd3432a1ab3a4287fc0d',
 'approved-public-corrections-20261024.mjs':'79ef8d2d5c07b228523ee2c85551ff7363b93df0',
 'approved-public-corrections-data-20261024.mjs':'03d46a1e31d6247a7fdaff6af3397238125a0812',
 'review/nhs-vs-private-eligibility-exact-body-20261023.md':'aa70e4acabd1aedba74f04d543ca84f518075fed',
 'review/saxenda-orlistat-exact-addendum-20261023.md':'5cda45dd5ac0648a0559438da27cf82399d59be3',
 'review/shift-product-events-v42m-generic-form-removal.diff':'007fdd8957545cf670c9ce5225ce750171135bc5',
 'review/shift-product-events-v42m-generic-form-removal.proposed.js':'c04b5e2eb1b08e15dcf7f1fa38f007166371cd11',
 'tests/contact-delivery-contract.test.mjs':'2195328a74ec0c86a49a6fcc6b61aebcc418e1fd',
 'tests/contact-success-analytics.test.mjs':'ec8387b925cd7d97420a585d30c8c81d31ef76fe',
 'tests/generic-form-telemetry-removal.test.mjs':'bd1c15590b3d6a1580978c825ff8bee7c3b86625',
 'tests/approved-public-corrections-20261024.test.mjs':'f87dc2a7dc796b50691553f3851b4be0288dc175',
 'tests/fixtures/approved-corrections-20261024/nhs-before.json':'297367c88854c575b79dea953df729fe5d726c22',
 'release/approved-source-comparison-20261024.mjs':'6af31f06d5667c037f65cae202af1b478813dbaa',
 'release/approved-source-comparison-data-20261024.mjs':'b212df000aee8b17cc3055df232f60f2794df016',
 'tests/approved-source-comparison-20261024.test.mjs':'9c9e3af228b7dde074621698ebe8f49c85323f45',
 'release/recorded-week-navigation-outer-frame-20261018.mjs':'dd48e3d21472804243a7e9c141b0ff8a7ee89a77',
 'shift-coach/release-contract.mjs':'9b86959aa0b88793d8b3df38f397880e971119f3',
 'release/root-share-preview-scope.mjs':'aff239d1880a84481dd62ff1d71b3eef17216811',
 'tests/root-share-preview-composition.test.mjs':'cb410665b8b0294a102d9a04d4f84ffe44e2387f',
 'tests/root-share-preview.test.mjs':'d69bcf08a28cb1008b38693968377352fb976044',
 'release/combined-finite-scope-20261014.mjs':'b5c1ffe7141f223803088a84058d9ad4e163833c',
 'home-speed-repair.mjs':'f0d2db246ea89b2cce17a2a05c9d8d77fe6f008f',
 'timber-shed-public-teaser.mjs':'3d8d11d641a1409aab7b8013bb7cb4d941d98506',
 'home-header-baseline-20261024.mjs':'8dcab2585a0a07844a73c9670f609055ac909410',
 '.github/workflows/online-privacy-recovery-proof.yml':'52341409f18e452c6fe4c83fb1730427e0b1e544'
});
export function verifyCurrentMainSafetyChecks(read=(path)=>execFileSync('git',['rev-parse','HEAD:'+path],{encoding:'utf8'}).trim()){
 verifyMyShiftRelease();
 for(const path of MY_SHIFT_PATHS)APP_PATHS.add(path);
 for(const [path,expected] of Object.entries(CURRENT_MAIN_SAFETY_CHECK_BLOBS))assert.equal(myShiftSafetyComparison(path,read(path)),expected,'Merged safety-check source drift: '+path);
 return Object.keys(CURRENT_MAIN_SAFETY_CHECK_BLOBS);
}
export function validateAppSource(){
 return withImmutableHistoryVerification(()=>{
 verifyReconciledRelease();
 verifyMetricsConnection();
 validateFit300();
 validateRecipeImages();
 verifyCoachingRelease();
 validateDeviceHealthSource();
 const git=(...args)=>execFileSync('git',compactLiteralExcludes(reconciliationGitArgs(args)),{encoding:'utf8'}).trim();
 git('merge-base','--is-ancestor',APP_BASE,'HEAD');
 validateFooterSource();
 validateMemberDesignSource();
 validateHomeBanner();
 for(const p of PWA_DISMISS_PATHS)if(p==='my-timber-pwa/presentation.mjs')assert.equal(originalMemberWorkerPresentation(execFileSync('git',['show','HEAD:'+p],{encoding:'utf8'})),execFileSync('git',['show',PWA_DISMISS_APPROVED+':'+p],{encoding:'utf8'}),'Complete PWA presentation differs beyond exact shared member worker registration');else assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',PWA_DISMISS_APPROVED+':'+p),'Reviewed PWA install dismissal drift: '+p);
 validateMemberFocus((ref,path)=>git('rev-parse',(ref==='HEAD'&&path==='preview/app-layout/tabs.mjs'?FOOTER_CANDIDATE:ref)+':'+path));
 const changed=git('diff','--name-only',APP_BASE,'HEAD').split('\n').filter(Boolean);
 const exactSafetyPaths=new Set(verifyCurrentMainSafetyChecks());
 assert(changed.every(p=>APP_PATHS.has(p)||exactSafetyPaths.has(p)),'Unapproved files in app release: '+changed.filter(p=>!APP_PATHS.has(p)&&!exactSafetyPaths.has(p)).join(','));
 for(const [p,sha]of Object.entries(APP_HASHES))assert.equal(createHash('sha256').update(execFileSync('git',reconciliationGitArgs(['show',originalAppHashRef(p)+':'+p]))).digest('hex'),sha,'App release drift: '+p);
 for(const p of ['presentation.mjs','screens.mjs','tabs.mjs','refinement.mjs','verify.cjs'])assert.equal(git('rev-parse',historicalFooterRef('HEAD','preview/app-layout/'+p)+':preview/app-layout/'+p),git('rev-parse',APP_APPROVED+':preview/app-layout/'+p),'Approved app design changed: '+p);
 assert.equal(originalPwaLiveReadVerifier(execFileSync('git',['show','HEAD:my-timber-pwa/verify-live.mjs'],{encoding:'utf8'})),execFileSync('git',['show',APP_BASE+':my-timber-pwa/verify-live.mjs'],{encoding:'utf8'}),'PWA verifier differs beyond the exact bounded GET retry repair');
 assert.equal(execFileSync('git',['show','HEAD:my-timber-pwa/service-worker.mjs'],{encoding:'utf8'}).replace(" const panel=['/member/fit','/member/grub','/member/life-back'].includes(u.pathname)&&u.searchParams.get('app_panel')==='1'&&['app','web'].includes(u.searchParams.get('view'))&&u.searchParams.size===2;\n if(event.request.method!=='GET'||event.request.mode!=='navigate'||u.origin!==self.location.origin||!/^\\/member\\//.test(u.pathname)||(u.search&&!panel))return;"," if(event.request.method!=='GET'||event.request.mode!=='navigate'||u.origin!==self.location.origin||!/^\\/member\\//.test(u.pathname)||u.search)return;"),execFileSync('git',['show',FOOTER_CANDIDATE+':my-timber-pwa/service-worker.mjs'],{encoding:'utf8'}),'Service worker differs beyond exact authenticated inline panel fetch');
 assert.equal(git('diff',APP_BASE,'HEAD','--','member-experience','my-timber-pwa','migrations',':(exclude)my-timber-pwa/verify-live.mjs',':(exclude)member-experience/orders.mjs',':(exclude)member-experience/tablet-routine.mjs',':(exclude)member-experience/tablet-routine-client.mjs',':(exclude)member-experience/ai-site-knowledge.mjs',':(exclude)member-experience/ai-stream.mjs',':(exclude)member-experience/tests/lookup-continuation.test.mjs',':(exclude)member-experience/tests/continuity-measurement.test.mjs',':(exclude)member-experience/public-preservation.mjs',':(exclude)member-experience/verify-production-member.mjs',':(exclude)member-experience/dashboard-tools.mjs',':(exclude)member-experience/tests/dashboard-tools.test.mjs',...[...RECONCILIATION_PATHS].filter(reconciliationPath).map(p=>':(exclude)'+p),...[...DEVICE_HEALTH_PATHS].map(p=>':(exclude)'+p),...[...FOOTER_RUNTIME_PATHS].map(p=>':(exclude)'+p),...PWA_DISMISS_PATHS.map(p=>':(exclude)'+p),...MEMBER_FOCUS_PATHS.map(p=>':(exclude)'+p),...[...RECIPE_IMAGE_PATHS].map(p=>':(exclude)'+p)),'','Protected runtime, data and PWA source changed');
 assert.equal(withoutCoachEntrypoint(readFileSync('wrangler.jsonc','utf8')),execFileSync('git',['show',APP_BASE+':wrangler.jsonc'],{encoding:'utf8'}),'Protected configuration changed outside the separately pinned coaching entrypoint');
 });
}