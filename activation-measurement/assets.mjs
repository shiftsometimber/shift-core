// Authoritative privacy boundary for the existing Google Tag Manager only.
// No second tracker and no changes to public or member HTML.
export const bootstrap=String.raw`(function(window,document){
 'use strict';
 if(window.__sstAnalyticsBootstrapV2)return;
 window.__sstAnalyticsBootstrapV2=true;
 var KEY='sstConsentV3',GTM='GTM-PSJVW9XR',GA='G-Y7BV5KY6RR',loaded=false;
 var path=location.pathname.replace(/\.html$/,'').replace(/\/+$/,'')||'/';
 // Never initialise third-party analytics on account, health-record or payment
 // surfaces. Auth tokens and return destinations must not reach tag managers.
 var privatePage=/^\/(?:start-here(?:[/.]|$)|treatment-finder(?:[/.]|$)|how-are-you-feeling(?:[/.]|$)|member(?:[/-]|$)|my-timber(?:\/|$)|my-shift(?:\/|$)|hq(?:[/-]|$)|v1(?:\/|$)|account(?:[/-]|$)|reset-password(?:[/.]|$)|verify-email(?:[/.]|$)|treatment-order(?:[/.]|$)|checkout(?:[/.]|$)|payment(?:[/.]|$)|confirmation(?:[/.]|$)|health-mot(?:[/.]|$)|shift-health(?:\/|$))/.test(path);
 var querySafe=true;
 var sources=['google','bing','facebook','instagram','x','email','newsletter','partner','referral'];
 var media=['organic','cpc','paid_social','social','email','newsletter','partner','referral'];
 try{new URLSearchParams(location.search).forEach(function(value,key){
  if(key==='utm_source'&&sources.indexOf(value.toLowerCase())>=0)return;
  if(key==='utm_medium'&&media.indexOf(value.toLowerCase())>=0)return;
  querySafe=false;
 });}catch(e){querySafe=false;}
 // Unknown query/hash values are excluded, not merely renamed after collection.
 var hashSafe=!location.hash||['#top','#main','#cookie-choices'].indexOf(location.hash)>=0;
 var permitted=!privatePage&&/^\/[a-z0-9/_-]*$/i.test(path)&&querySafe&&hashSafe&&location.hostname==='shiftsometimber.co.uk';
 window.SST_ANALYTICS_SUPPRESSED=!permitted;
 window['ga-disable-'+GA]=true;
 window.dataLayer=window.dataLayer||[];
 window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
 var denied={analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',functionality_storage:'granted',security_storage:'granted'};
 window.gtag('consent','default',denied);
 window.shiftUpdateGoogleConsent=function(granted){
  var allowed=permitted&&granted===true;
  window['ga-disable-'+GA]=!allowed;
  window.gtag('consent','update',{analytics_storage:allowed?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  if(!allowed||loaded)return;
  loaded=true;
  // Sanitised global defaults precede GTM; no free-form referrer or query.
  window.gtag('set',{page_location:location.origin+path,page_referrer:'',page_title:path==='/'?'Shift Some Timber':path,allow_google_signals:false,allow_ad_personalization_signals:false});
  window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
  var script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtm.js?id='+GTM;script.id='sst-consented-gtm';document.head.appendChild(script);
 };
 var stored=null;try{stored=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){}
 window.shiftUpdateGoogleConsent(!!(stored&&stored.analytics===true));
 window.addEventListener('sst:analytics-consent',function(event){window.shiftUpdateGoogleConsent(!!(event.detail&&event.detail.analytics===true));});
 window.addEventListener('storage',function(event){if(event.key===KEY){var v=null;try{v=JSON.parse(event.newValue||'null');}catch(e){}window.shiftUpdateGoogleConsent(!!(v&&v.analytics===true));}});
})(window,document);
`;
export function measurementAsset(request){
 if(new URL(request.url).pathname!=='/analytics-bootstrap-v1.js')return null;
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
 return new Response(request.method==='HEAD'?null:bootstrap,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Shift-Analytics-Authority':'consented-public-v2'}});
}
