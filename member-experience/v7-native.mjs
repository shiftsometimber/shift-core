import {mealPeriod,makeMealView} from './v7-meal-windows.mjs';
import {shellUpdates} from './v7-shell-update.mjs';
import {journeyGuideStyles} from './journey-guide-style.mjs';
import {assessmentStyles} from './assessment-browser.mjs';
import {welcomePages,welcomeStyles} from './welcome-pages.mjs';
import {welcomeArtwork} from './welcome-artwork.mjs';
import {weightSafeView} from './v7-visibility.mjs';
import {retainedContent} from './v7-retained-content.mjs';
import {authenticateMember} from '../member-state-fast-v1.js';
import {v7Context} from './v7-context.mjs';
import {shopChrome,shopStyles} from './shop-navigation.mjs';
import {v7Browser,v7Styles} from './v7-browser.mjs';
import {v7GrubBrowser,v7GrubStyles} from './v7-grub-browser.mjs';
import {v7FitBrowser,v7FitStyles} from './v7-fit-browser.mjs';
import {nativeBrowser} from './v7-shell-browser.mjs';
import {privateScreenCache} from './v7-private-cache.mjs';
import {shellRouter} from './v7-shell-router.mjs';
import {journeyPageClient} from './journey-page-client.mjs';
import {journeyPresentation} from './journey-presentation.mjs';
import {journeyPageStyles} from './journey-page.mjs';
import {supportPlanClient,supportPlanStyles} from './support-plan-client.mjs';
import {supportServiceClient} from './support-service-client.mjs';
import {prescriberNoteDraft} from './prescriber-note.mjs';
import {supportChoices} from './support-plan.mjs';
import {shopHome} from './shop-routes.mjs';
import {shellBrandSVG,shellFontBase64} from './v7-shell-assets.mjs';
import {shellServiceWorker,shellManifest} from './v7-shell-worker.mjs';
import {retainedUtilitySource,retainedUtilityStyles,supportMoreRestyle} from './v7-retained-utility.mjs';
import {v7CrewSnapshot} from './v7-crew.mjs';
import {crewBrowser,crewStyles} from './v7-crew-browser.mjs';
import {arcadeSnapshot,arcadeGames,arcadeBestLabel} from './shed-arcade-model.mjs';
import {arcadeSession} from './shed-arcade-session.mjs';
export const earlyNavScript="(()=>{document.addEventListener('click',e=>{if(window.__MT_NAV_READY||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const a=e.target.closest?.('#mtShopChrome a[data-mt-shop-tab]');if(!a||a.target==='_blank')return;e.preventDefault();window.__MT_PENDING_ROUTE=a.href;document.querySelectorAll('#mtShopChrome [aria-current]').forEach(n=>n.removeAttribute('aria-current'));a.setAttribute('aria-current','page');},true)})();";
const parse=s=>{try{return JSON.parse(s||'{}')}catch{return {}}};
const serialise=x=>JSON.stringify(x).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export const nativeCSS=shopStyles+v7Styles+v7GrubStyles+v7FitStyles+crewStyles+retainedUtilityStyles+supportMoreRestyle+journeyPageStyles+supportPlanStyles.slice(v7Styles.length)+String.raw`
#mtNativeMain[data-mt-content=shop]{max-width:none;padding:0}#mtShopChrome .mt-shop-top,#mtShopChrome .mt-shop-bottom{backface-visibility:visible}
@font-face{font-family:MyTimberHeading;src:url(/assets/member-experience/v7-heading-font.woff2?v=__V7_NATIVE_ASSET_TAG__) format("woff2");font-weight:700;font-display:swap}html{color-scheme:dark}body{margin:0;background:#050505;color:#E7E3DA;font:16px/1.45 Arial,Helvetica,sans-serif;padding-top:calc(108px + env(safe-area-inset-top));padding-bottom:calc(78px + env(safe-area-inset-bottom))}#mtNativeMain{max-width:600px;margin:auto;padding:12px 18px 30px}#mtNativeMain:not([data-mt-content=shop]) :is(button,input,select,textarea){box-sizing:border-box;max-width:100%;font:inherit;min-height:44px}#mtNativeMain:not([data-mt-content=shop]) button{border:1px solid #707762;border-radius:12px;background:#151713;color:#E7E3DA;padding:10px 12px;cursor:pointer}#mtNativeMain:not([data-mt-content=shop]) a{color:inherit;text-underline-offset:4px}#mtNativeMain .mt-v7-cream .mt-v7-actions button{background:#050505;color:#E7E3DA}#mtNativeMain .mt-v7-cream .mt-v7-actions button+button{background:transparent;color:#050505}.mt-v7-actions>a{display:block;text-align:center;border:1px solid #707762;padding:12px;border-radius:12px}.mt-native-feeling{display:flex;align-items:center;gap:6px;border:1px solid #707762;border-radius:14px;padding:8px 12px}.mt-native-feeling button{flex:1;padding:8px 4px!important;font-size:13px!important}.mt-native-history{display:block;text-align:right;font-size:13px;margin:4px 0 12px}.mt-native-setup{background:#E7E3DA;color:#050505;padding:12px;border-radius:14px;margin-bottom:10px;font-size:14px;display:flex;justify-content:space-between;gap:12px}.mt-native-icon{display:inline-block;width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;vertical-align:middle;margin-right:6px}.mt-v7-sheet input[type=checkbox]{display:inline;width:20px;min-height:20px;accent-color:#879174}.mt-v7-sheet label{display:block}.mt-v7-sheet textarea{width:100%;min-height:80px;background:#050505;color:#E7E3DA;border:1px solid #707762;font:inherit}.mt-native-status{font-size:13px}.mt-v7-card h2,.mt-v7-sheet h2,.mt-fit h1{font-family:MyTimberHeading,"Arial Narrow",Arial,sans-serif;font-weight:700}.mt-v7-actions button{font-family:MyTimberHeading,"Arial Narrow",Arial,sans-serif!important;font-weight:700!important;font-size:20px!important}.mt-shell-menu{display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid #414733;text-decoration:none}#mtNativeMain>.tj-main,#mtNativeMain>.mt-support-page{padding:0;max-width:none}body[data-mt-native-shell][data-mt-shop-navigation] #mtShopChrome{display:block!important}#mtShellOffline{max-width:600px;margin:0 auto;padding:6px 18px;color:#AEBF92;font-size:12px}#mtShopChrome nav a:not([aria-current=page]),#mtShopChrome nav a:not([aria-current=page]) :is(svg,span){color:#8d8d85;-webkit-text-fill-color:#8d8d85}#mtNativeMain .mt-grub-links button{background:transparent;color:inherit;border:0;border-radius:0;padding:0;min-height:44px;text-align:left}#mtNativeMain .mt-grub-meal button{background:transparent;border:0;border-radius:0;padding:0;min-height:28px;text-align:left}#mtNativeMain .tj-tabs [aria-pressed=true]{background:#E7E3DA;color:#050505}#mtNativeMain .mt-fit-setting button{background:transparent;color:#050505}#mtNativeMain .mt-fit-setting [aria-pressed=true]{background:#050505;color:#E7E3DA}#mtNativeMain .mt-native-feeling button{background:#050505}#mtNativeMain .mt-v7-eyebrow{color:#879174}#mtNativeMain .mt-v7-cream .mt-v7-eyebrow{color:#414733}[hidden]{display:none!important}button:disabled{opacity:.55;cursor:default!important}:focus-visible{outline:2px solid #AEBF92;outline-offset:3px}
`+welcomeStyles+assessmentStyles+journeyGuideStyles.replaceAll('#timberJourney','#mtNativeMain #timberJourney');
export const nativeJS='const mealPeriod='+mealPeriod.toString()+';const mealView=('+makeMealView.toString()+')(mealPeriod);const makeShellUpdates='+shellUpdates.toString()+';const makeWelcome='+welcomePages.toString()+';const SHED_GAMES='+JSON.stringify(arcadeGames)+';const arcadeBestLabel='+arcadeBestLabel.toString()+';const makeArcadeSession='+arcadeSession.toString()+';const makeWeightView='+weightSafeView.toString()+';const makeRetained='+retainedContent.toString()+';const makeDaily='+v7Browser.toString()+';const makeGrub='+v7GrubBrowser.toString()+';const makeFit='+v7FitBrowser.toString()+';const makeCrew='+crewBrowser.toString()+';const makeUtility='+retainedUtilitySource+';const makePrivateCache='+privateScreenCache.toString()+';const makeShellRouter='+shellRouter.toString()+';const SHOP_MARKUP='+JSON.stringify(shopHome)+';const loadDetails=()=>import("/assets/member-experience/v7-journey-support.mjs?v=__V7_NATIVE_ASSET_TAG__");const startJourney=async()=>(await loadDetails()).startJourney;const startSupport=async()=>(await loadDetails()).startSupport;const mtStart=()=>('+nativeBrowser.toString()+')();if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mtStart,{once:true});else mtStart();';
// Existing controllers load only when their own screen is first visited.
export const nativeSecondaryJS='export const startJourney=()=>('+journeyPageClient.toString()+')('+journeyPresentation.toString()+');export const startSupport=()=>('+supportPlanClient.toString()+')('+JSON.stringify(supportChoices)+','+supportServiceClient.toString()+','+prescriberNoteDraft.toString()+','+v7Browser.toString()+');';
const shellPaths=new Map([['/member/dashboard/welcome','welcome'],['/member/dashboard/personalise','personalise'],['/member/dashboard/explore-weight-loss','explore'],['/member/dashboard/explore-weight-loss/status','treatment-status'],['/member/dashboard/explore-weight-loss/questions','clinical-questions'],['/member/shed-arcade','arcade'],['/member/dashboard','today'],['/member/grub','grub'],['/member/fit','fit'],['/member/life-back/journey','journey'],['/member/life-back/shop','shop'],['/member/life-back/support','private-support'],['/member/life-back/support/league','league'],['/member/life-back','life-back'],['/member/more','more'],['/member/life-back/preferences','preferences']]);
export function shellHTML(initial=null,preloadFont=false){
 const chrome=shopChrome.replace(/<img\b[^>]*class="mt-shop-mark"[^>]*>/,shellBrandSVG.replace('<svg','<svg class="mt-shop-mark" aria-hidden="true"'));
 return '<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#050505"><meta name="robots" content="noindex,nofollow"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black"><title>My Timber</title><link rel="manifest" href="/member/manifest.webmanifest">'+(preloadFont?'<link rel="preload" href="/assets/member-experience/v7-heading-font.woff2?v=__V7_NATIVE_ASSET_TAG__" as="font" type="font/woff2" crossorigin>':'')+'<script>'+earlyNavScript+'</script><link rel="stylesheet" href="/assets/member-experience/v7-native.css?v=__V7_NATIVE_ASSET_TAG__"><script id="mtNativeInitial" type="application/json">'+serialise(initial)+'</script><script async fetchpriority="high" src="/assets/member-experience/v7-native.mjs?v=__V7_NATIVE_ASSET_TAG__"></script></head><body data-mt-native-shell data-member-session="'+(initial?'ready':'pending')+'" data-mt-shop-navigation="20261029">'+chrome+'<p id="mtShellOffline" hidden>You’re offline · showing your last saved content.</p><main id="mtNativeMain"><p role="status">Opening your saved My Timber…</p></main><noscript><p>Enable JavaScript to use My Timber, or open your <a href="/member/settings">account settings</a>.</p></noscript></body></html>';
}
async function snapshot(request,env,page){
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 const at=new Date().toISOString();
 // Account-scoped, consent-filtered reads share one D1 round trip. The public
 // frame still streams first; no private bytes precede verified identity.
 const [storedRows,consentRows,treatmentRows,foodRows,crewRows]=await env.DB.batch([
  env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId),
  env.DB.prepare("SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(auth.userId),
  env.DB.prepare("SELECT order_number,clinical_status,status FROM medicine_orders WHERE user_id=? AND status IN ('paid','refunded') ORDER BY created_at DESC,id DESC LIMIT 1").bind(auth.userId),
  env.DB.prepare("SELECT id,body_json FROM member_food_entries WHERE user_id=? AND (SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=1 AND COALESCE((SELECT json_extract(preferences,'$.myJourney.setup.paused') FROM member_state WHERE user_id=?),0)<>1 ORDER BY recorded_on DESC,created_at DESC LIMIT 60").bind(auth.userId,auth.userId,auth.userId),
  env.DB.prepare('SELECT crew_id FROM mt_v7_crew_members WHERE user_id=?').bind(auth.userId)
 ]);
 const prefs=parse(storedRows.results?.[0]?.preferences),consent=consentRows.results?.[0],treatment=treatmentRows.results?.[0];
 const tracking=Number(consent?.granted)===1&&prefs.myJourney?.setup?.paused!==true;
 const progress=tracking?prefs.lifeBack?.progress||{revision:0}: {revision:prefs.lifeBack?.progress?.revision||0,v7:{preferences:prefs.lifeBack?.progress?.v7?.preferences}};
 const [v7,league]=await Promise.all([
  v7Context(env.DB,auth.userId,{...prefs,lifeBack:{...prefs.lifeBack,progress}},at,{preparedOnly:true}),
  v7CrewSnapshot(env.DB,auth.userId,at,{membership:crewRows.results?.[0]||null})
 ]);
 const foodEntries=tracking?(foodRows.results||[]).map(r=>({id:r.id,...parse(r.body_json)})):[];
 return {release:'__V7_NATIVE_ASSET_TAG__',treatment:treatment?{orderNumber:treatment.order_number,clinicalStatus:treatment.clinical_status||'not_started',paymentStatus:treatment.status}:null,arcade:arcadeSnapshot(prefs),league,accountId:auth.userId,expiresAt:auth.user.expires_at,page,tracking,progress:{revision:progress.revision||0},v7,foodEntries,nutritionDay:tracking&&prefs.v7NutritionDay?.on===v7.today?prefs.v7NutritionDay:null,setupComplete:!!(prefs.myTimberOnboarding?.completedAt||prefs.myJourney?.setup?.completedAt)};
}
export async function nativeDocument(request,env){
 const url=new URL(request.url),path=url.pathname;if(!['GET','HEAD'].includes(request.method))return null;
 const art=path.match(/^\/assets\/member-experience\/v7-welcome-(headline|note|note-nobutton)\.webp$/)?.[1];
 if(art){const file=welcomeArtwork['welcome-v2-'+art+'.webp'];return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/webp','Content-Length':String(file.bytes),'Cache-Control':'public, max-age=31536000, immutable','ETag':'"'+file.sha256+'"','X-Content-Type-Options':'nosniff'}});}
 if(path==='/member/app-shell.html')return new Response(request.method==='HEAD'?null:shellHTML(),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':url.searchParams.get('v')==='__V7_NATIVE_ASSET_TAG__'?'public, max-age=31536000, immutable':'public, max-age=0, must-revalidate','X-My-Timber-Shell':'__V7_NATIVE_ASSET_TAG__'}});
 if(path==='/member/manifest.webmanifest')return Response.json(shellManifest,{headers:{'Content-Type':'application/manifest+json','Cache-Control':'public, max-age=3600'}});
 if(path==='/treatment-sw.js')return new Response(request.method==='HEAD'?null:shellServiceWorker,{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-cache','Service-Worker-Allowed':'/member/'}});
 if(path==='/assets/member-experience/v7-brand.svg')return new Response(request.method==='HEAD'?null:shellBrandSVG,{headers:{'Content-Type':'image/svg+xml','Cache-Control':'public, max-age=31536000, immutable'}});
 if(path==='/assets/member-experience/v7-heading-font.woff2')return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(shellFontBase64),c=>c.charCodeAt(0)),{headers:{'Content-Type':'font/woff2','Cache-Control':'public, max-age=31536000, immutable'}});
 const isBoot=path==='/v1/my-timber/boot',page=shellPaths.get(path)||(path.startsWith('/member/shed-arcade/')?'arcade':null)||(/^\/member\/(?:settings|orders|saved|plans|check-in|treatment|ask-timber|support)(?:\/|$)/.test(path)||path.startsWith('/member/life-back/shop/')?'legacy':null);
 if(!isBoot&&(!page||request.headers.get('X-My-Timber-Content')==='1'||url.searchParams.has('tools')||url.searchParams.has('view-data')))return null;
 const privateHeaders={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-My-Timber-Native':'v7','Content-Security-Policy':"default-src 'self'; script-src 'self' 'sha256-Flb52+XRtZGX8JT010sSiLoISKWNm7fFLTm07a6Ouuw=' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' https://shiftsometimber.co.uk https://www.shiftsometimber.co.uk https://api.shiftsometimber.co.uk blob: data:; font-src 'self'; connect-src 'self' https://api.shiftsometimber.co.uk https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"};
 if(isBoot){const value=await snapshot(request,env,'today');if(value instanceof Response)return value;return Response.json(value,{headers:{'Cache-Control':'no-store, private','Vary':'Cookie','X-My-Timber-Account':String(value.accountId)}});}
 if(request.method==='HEAD')return new Response(null,{headers:privateHeaders});
 // Send the public frame/resources immediately. Private JSON is appended only
 // after the one server identity check and account-scoped reads have succeeded.
 const arcadeSlug=path.split('/')[3],arcadeFiles=page==='arcade'?['v7-arcade.mjs',...(arcadeGames.some(g=>g.id===arcadeSlug)?['v7-arcade-'+arcadeSlug+'.mjs']:[])]:[];
 const arcadePreloads=arcadeFiles.map(file=>'<link rel="modulepreload" href="/assets/member-experience/'+file+'?v=__V7_NATIVE_ASSET_TAG__" crossorigin>').join('');
 const opening=shellHTML(null,true).replace('</head>',arcadePreloads+'</head>').replace(/<script id="mtNativeInitial"[^>]*>[\s\S]*?<\/script>/,'').replace('</body></html>','');
 const encoder=new TextEncoder(),stream=new ReadableStream({async start(controller){
  controller.enqueue(encoder.encode(opening));
  try{const value=await snapshot(request,env,page),payload=value instanceof Response?(value.status===401?{signedOut:true}:{unavailable:true}):value;
   const notePreload=page==='welcome'&&!(value instanceof Response)?'<link rel="preload" as="image" type="image/webp" href="/assets/member-experience/v7-welcome-'+(value.setupComplete?'note-nobutton':'note')+'.webp" fetchpriority="high">':'';
   controller.enqueue(encoder.encode(notePreload+'<script id="mtNativeInitial" type="application/json">'+serialise(payload)+'</script></body></html>'));
  }catch{controller.enqueue(encoder.encode('<script id="mtNativeInitial" type="application/json">{"unavailable":true}</script></body></html>'));}
  finally{controller.close();}
 }});
 return new Response(stream,{headers:privateHeaders});
}