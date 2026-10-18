(()=>{'use strict';
const BUILD='price-period-20261018-1314bdafe846';
const compact=matchMedia('(max-width:1100px), (pointer:coarse)');
const chat='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 9h10M7 13h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const cookie='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M20.5 12.5A8.8 8.8 0 1 1 11.5 3a4 4 0 0 0 4.5 4.5 4 4 0 0 0 4.5 5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8" cy="9" r="1" fill="currentColor"/><circle cx="8" cy="15" r="1" fill="currentColor"/><circle cx="14" cy="15" r="1" fill="currentColor"/></svg>';
try{sessionStorage.removeItem('sstMedicineMatch')}catch(_){}
let meta=document.querySelector('meta[name="public-shell-build"]');
if(!meta){meta=document.createElement('meta');meta.name='public-shell-build';document.head.append(meta)}meta.content=BUILD;
let pending=false;
function update(){
 pending=false;
 const ask=document.getElementById('askTimberLaunch'),privacy=document.getElementById('sstCookieSettings');
 const controls=[privacy,ask].filter(Boolean);
 for(const button of controls){
  const isAsk=button===ask,label=isAsk?'Ask Timber':'Cookie choices';
  if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
  if(button.title!==label)button.title=label;
  if(compact.matches){
   if(button.dataset.compactUtility!=='1'||!button.querySelector('svg')){button.dataset.compactUtility='1';button.innerHTML=isAsk?chat:cookie;}
  }else if(button.dataset.compactUtility==='1'){delete button.dataset.compactUtility;button.textContent=label;}
 }
 if(compact.matches&&controls.length&&document.body.dataset.appPanel!=='1'){
  const member=document.getElementById('memberUtilities');
  let host=member||document.getElementById('publicUtilities');
  if(!host&&!document.body.dataset.memberChrome){host=document.createElement('nav');host.id='publicUtilities';host.setAttribute('aria-label','Help and privacy');const anchor=document.querySelector('main')||document.querySelector('.site-footer');if(anchor)anchor.after(host);else document.body.append(host)}
  if(host)for(const button of controls)if(button.parentElement!==host)host.append(button);
 }else if(!compact.matches){
  const host=document.getElementById('publicUtilities');if(host){for(const button of [...host.children])document.body.append(button);host.remove()}
 }
 for(const badge of document.querySelectorAll('.sh-match-badge-v1')){
  if(badge.textContent!=='Prescription-only medicine')badge.textContent='Prescription-only medicine';
 }
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(update)}}
function start(){update();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});compact.addEventListener('change',schedule)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
