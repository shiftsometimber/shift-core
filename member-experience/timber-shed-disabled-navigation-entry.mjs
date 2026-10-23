// Bounded restoration of the approved visible, non-interactive Shed labels.
// Only the already loaded public footer asset is served; no page/API routes.
import originalFooterScript from './timber-shed-original-footer-social.mjs';
import {addTimberShedTeaser} from '../timber-shed-public-teaser.mjs';
import {publicHeader,publicDrawer} from '../public-shell-contract.mjs';
import {approvedFooter} from '../shared-footer.mjs';
const sample=addTimberShedTeaser('<html><head></head><body>'+publicHeader+publicDrawer+approvedFooter+'</body></html>');
const css=sample.match(/<style id="sst-timber-shed-teaser-css">([\s\S]*?)<\/style>/)?.[1];
if(!css)throw Error('Approved Shed styling is unavailable');
export const disabledNavigationClient=';\n('+function(style){
 'use strict';
 if(/^\/(?:member(?:\/|$)|v1(?:\/|$)|hq(?:\/|$)|api(?:\/|$)|staging(?:\/|$))/.test(location.pathname))return;
 function install(){
  const targets=[['.desktop-nav','sst-shed-teaser'],['#site-drawer nav','sst-shed-teaser sst-shed-drawer'],['footer.site-footer section','sst-shed-teaser sst-shed-footer']];
  for(const[selector,className]of targets){
   const containers=[...document.querySelectorAll(selector)];
   const host=containers.find(el=>el.querySelector('a[href="/member/dashboard"]'));
   if(!host||host.querySelector('.sst-shed-teaser'))continue;
   if(!document.getElementById('sst-timber-shed-teaser-css')){
    const sheet=document.createElement('style');sheet.id='sst-timber-shed-teaser-css';sheet.textContent=style;document.head.append(sheet);
   }
   const label=document.createElement('span');label.className=className;label.setAttribute('aria-label','The Timber Shed — coming soon');label.setAttribute('aria-disabled','true');label.append(document.createTextNode('The Timber Shed '));
   const badge=document.createElement('small');badge.textContent='SOON';label.append(badge);
   for(const el of[label,badge]){el.style.setProperty('color','#707762','important');el.style.setProperty('-webkit-text-fill-color','#707762','important');}
   host.querySelector('a[href="/member/dashboard"]').after(label);
  }
 }
 const start=()=>{install();new MutationObserver(install).observe(document.body,{childList:true,subtree:true})};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}.toString()+')('+JSON.stringify(css)+');\n';
export const publicNavigationAsset=originalFooterScript+disabledNavigationClient;
const hosts=new Set(['shiftsometimber.co.uk','www.shiftsometimber.co.uk']);
export default {
 async fetch(request){
  const url=new URL(request.url);
  if(url.protocol!=='https:'||!hosts.has(url.hostname)||url.pathname!=='/assets/footer-social-links-v1.js')return new Response('Not found',{status:404});
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  return new Response(request.method==='HEAD'?null:publicNavigationAsset,{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Shift-Navigation':'shed-disabled-20261023'}});
 }
};
