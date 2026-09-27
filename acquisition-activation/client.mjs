import {PAIRS,VERSION,BROWSER_TTL} from './model.mjs';
// The existing bootstrap loads this first-party helper, including on account
// pages, without loading GTM there. It never intercepts generic fetch or forms.
export const acquisitionClient=String.raw`(function(w,d){
'use strict'; if(w.SSTAcquisition)return;
var KEY='sstAcquisitionV1',CONSENT='sstConsentV3',VERSION=${JSON.stringify(VERSION)},TTL=${BROWSER_TTL},PAIRS=${JSON.stringify(PAIRS)};
function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
function clear(){try{localStorage.removeItem(KEY)}catch(e){}}
function consumed(){clear();if(choice())try{sessionStorage.setItem('sstAcquisitionConsumed','1')}catch(e){}}
function hasConsumed(){try{return sessionStorage.getItem('sstAcquisitionConsumed')==='1'}catch(e){return false}}
function choice(){var c=read(CONSENT);return c&&c.acquisition===true&&c.acquisitionVersion===VERSION?c:null}
function fresh(v,now){return v&&v.version===VERSION&&v.consent===true&&Object.prototype.hasOwnProperty.call(PAIRS,v.source)&&PAIRS[v.source].indexOf(v.medium)>=0&&Number.isFinite(Date.parse(v.capturedAt))&&Date.parse(v.capturedAt)<=now&&now-Date.parse(v.capturedAt)<=TTL&&Date.parse(v.consentAt)<=Date.parse(v.capturedAt)&&now-Date.parse(v.consentAt)<=TTL}
function originSource(){
 var url;try{url=new URL(location.href)}catch(e){return null}
 if(url.hostname!=='shiftsometimber.co.uk'&&url.hostname!=='www.shiftsometimber.co.uk')return null;
 var path=url.pathname.replace(/\.html$/,'').replace(/\/+$/,'');
 if(!/^\/[a-z0-9/_-]*$/i.test(path||'/'))return null;
 if(/^\/(?:member(?:[/-]|$)|my-timber(?:\/|$)|my-shift(?:\/|$)|hq(?:[/-]|$)|account(?:[/-]|$)|v1(?:\/|$)|reset-password(?:[/.]|$)|verify-email(?:[/.]|$)|treatment-order(?:[/.]|$)|checkout(?:[/.]|$)|payment(?:[/.]|$)|confirmation(?:[/.]|$))/.test(path))return null;
 var q=url.searchParams;
 if(q.has('utm_source')||q.has('utm_medium')){
  if(q.getAll('utm_source').length!==1||q.getAll('utm_medium').length!==1)return null;
  var source=q.get('utm_source').toLowerCase(),medium=q.get('utm_medium').toLowerCase();
  return Object.prototype.hasOwnProperty.call(PAIRS,source)&&PAIRS[source].indexOf(medium)>=0?{source:source,medium:medium}:null;
 }
 if(!d.referrer)return{source:'direct_or_unknown',medium:'none'};
 try{var ref=new URL(d.referrer),h=ref.hostname.toLowerCase();if(h==='shiftsometimber.co.uk'||h.endsWith('.shiftsometimber.co.uk'))return null;
  if(['www.google.com','www.google.co.uk','google.com','google.co.uk'].indexOf(h)>=0)return{source:'google',medium:'organic'};
  if(['www.bing.com','bing.com'].indexOf(h)>=0)return{source:'bing',medium:'organic'};
  var social={'facebook.com':'facebook','instagram.com':'instagram','t.co':'x','x.com':'x','linkedin.com':'linkedin','tiktok.com':'tiktok'};
  for(var domain in social)if(h===domain||h.endsWith('.'+domain))return{source:social[domain],medium:'social'};
  if(ref.protocol==='https:'||ref.protocol==='http:')return{source:'referral',medium:'referral'};
 }catch(e){} return null;
}
function capture(){
 var c=choice(),now=Date.now();if(!c||hasConsumed()){clear();return}
 var prior=read(KEY);if(fresh(prior,now))return;
 clear();var v=originSource();if(!v)return;
 var at=Date.parse(c.updatedAt);if(!Number.isFinite(at)||at>now||now-at>TTL)return;
 var value={version:VERSION,source:v.source,medium:v.medium,consent:true,consentAt:new Date(at).toISOString(),capturedAt:new Date(now).toISOString()};
 try{localStorage.setItem(KEY,JSON.stringify(value))}catch(e){}
}
function registration(){var v=read(KEY);if(!choice()||hasConsumed()||!fresh(v,Date.now())){clear();return null}return{version:VERSION,source:v.source,medium:v.medium,consent:true,consentAt:v.consentAt,capturedAt:v.capturedAt}}
async function forget(){clear();try{sessionStorage.removeItem('sstAcquisitionConsumed')}catch(e){}try{var r=await fetch('/v1/acquisition-attribution',{method:'DELETE',credentials:'include',headers:{'Content-Type':'application/json'},body:'{}',cache:'no-store'});return r.ok||r.status===401}catch(e){return false}}
w.SSTAcquisition={registration:registration,consumed:consumed,forget:forget};
w.addEventListener('sst:analytics-consent',function(e){var c=e.detail||{};if(c.acquisition===true&&c.acquisitionVersion===VERSION)capture();else clear()});
w.addEventListener('storage',function(e){if(e.key===CONSENT&&!choice())clear()});
capture();
})(window,document);`;
