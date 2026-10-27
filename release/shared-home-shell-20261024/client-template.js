/* Shared homepage shell. No API, account or communications operations. */
;(()=>{'use strict';
if(/^\/(?:hq|admin|v1|api)(?:\/|$)/.test(location.pathname)||window.__shiftHomeShell)return;
window.__shiftHomeShell=true;
 for(const [key,cls]of [['sst_large_text','large-text'],['sst_reduce_motion','reduce-motion']])try{if(localStorage.getItem(key)==='1')document.documentElement.classList.add(cls)}catch{}
const master=__MASTER__,css=__CSS__;
// The homepage is frozen: apply the approved heading colour only elsewhere.
const footerHeadingColour=/^\/(?:index(?:\.html?)?)?$/.test(location.pathname)?'':'\nhtml body footer#sst-footer-c#sst-footer-c#sst-footer-c#sst-footer-c#sst-footer-c .fc-main h2{color:#707762!important;-webkit-text-fill-color:#707762!important}';
const style=document.createElement('style');style.id='shift-home-shell-20261024';style.textContent=css+footerHeadingColour;document.head.append(style);
function node(html){const t=document.createElement('template');t.innerHTML=html;return t.content.firstElementChild}
function fit(footer){const nav=footer.querySelector('[data-shift-footer-social]'),row=footer.querySelector('[data-whatsapp-contact]');if(!nav||!row)return;const size=()=>{const a=[...nav.querySelectorAll('a')].map(a=>a.getBoundingClientRect());if(a.length)row.style.setProperty('--shift-chat-width',Math.ceil(Math.max(...a.map(a=>a.right))-Math.min(...a.map(a=>a.left)))+'px')};size();new ResizeObserver(size).observe(nav)}
function bindNewHeader(h,d,back){const trigger=h.querySelector('.menu-trigger'),close=d.querySelector('.drawer-close');let prior;
 const shut=()=>{d.hidden=true;back.hidden=true;document.body.classList.remove('drawer-open');trigger.setAttribute('aria-expanded','false');(prior||trigger).focus()};
 trigger.addEventListener('click',()=>{prior=document.activeElement;d.hidden=false;back.hidden=false;document.body.classList.add('drawer-open');trigger.setAttribute('aria-expanded','true');close.focus()});
 close.addEventListener('click',shut);back.addEventListener('click',shut);d.addEventListener('click',e=>{if(e.target.closest('a'))shut()});
 document.addEventListener('keydown',e=>{if(d.hidden)return;if(e.key==='Escape')shut();if(e.key==='Tab'){const a=[...d.querySelectorAll('a,button,[tabindex]')].filter(e=>!e.disabled&&e.tabIndex!==-1),first=a[0],last=a.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
}
function frameBody(){
 const body=document.body;if(body.dataset.homeFrame)return;
 const cs=getComputedStyle(body),margin=parseFloat(cs.marginLeft)+parseFloat(cs.marginRight),pad=parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom);
 if(body.getBoundingClientRect().width>=document.documentElement.clientWidth-0.5&&!margin&&!pad)return;
 const frame=document.createElement('div');frame.dataset.shiftPageContent='preserved';
 frame.style.cssText='box-sizing:border-box;width:'+(cs.maxWidth==='none'?'calc(100% - '+margin+'px)':'100%')+';max-width:'+cs.maxWidth+';margin:'+cs.marginTop+' auto '+cs.marginBottom+';padding:'+cs.padding+';';
 for(const child of [...body.childNodes])if(child.nodeType!==1||!child.matches('header.site-header,footer.site-footer,aside.site-drawer,.drawer-backdrop,script,style,link'))frame.append(child);
 body.prepend(frame);body.dataset.homeFrame='1';
 for(const [key,value]of Object.entries({width:'100%','max-width':'none',margin:'0',padding:'0','box-sizing':'border-box'}))body.style.setProperty(key,value,'important');
}
function install(){if(!document.body)return;frameBody();
 let h=document.querySelector('header.site-header[data-header-v2]');
 if(!h){h=node(master.header);const d=node(master.drawer),back=node(master.backdrop);document.body.prepend(h,d,back);bindNewHeader(h,d,back);h.dataset.homeBound='1'}
 if(!h.dataset.homeBound&&!document.querySelector('script[src*="/assets/v42.js"]')){
  let drawer=document.querySelector('#site-drawer'),back=document.querySelector('.drawer-backdrop');
  if(!drawer){drawer=node(master.drawer);document.body.append(drawer)}if(!back){back=node(master.backdrop);document.body.append(back)}
  bindNewHeader(h,drawer,back);h.dataset.homeBound='1';
 }
 const skip=document.body.querySelector(':scope > a.skip-link,:scope > a[href="#main-content"]');if(skip){if(document.body.firstElementChild!==skip)document.body.prepend(skip);if(skip.nextElementSibling!==h)skip.after(h)}else if(h.parentElement!==document.body||document.body.firstElementChild!==h)document.body.prepend(h);
 h.id='shift-site-header';h.dataset.shiftHomeShell='20261024';
 if(!h.dataset.homeFocusBound){h.querySelector('.menu-trigger')?.addEventListener('click',event=>event.currentTarget.focus(),{capture:true});h.dataset.homeFocusBound='1'}
 const img=h.querySelector('.site-logo img');
 if(img&&!img.dataset.homeLogo){
  img.dataset.homeLogo='1';
  const normalize=()=>{const src='/assets/header-logo-20261020-v2.svg';if(img.getAttribute('src')!==src)img.setAttribute('src',src);
   for(const [name,value]of Object.entries({content:'url("'+src+'")',height:'var(--shift-logo-height)',width:'var(--shift-logo-width)','max-height':'var(--shift-logo-height)',filter:'none',display:'block'}))if(img.style.getPropertyValue(name)!==value||img.style.getPropertyPriority(name)!=='important')img.style.setProperty(name,value,'important')};
  normalize();new MutationObserver(normalize).observe(img,{attributes:true,attributeFilter:['src','style']});
 }
 if(!h.dataset.homeNav){const nav=h.querySelector('.desktop-nav'),canonical=node(master.header);if(nav)nav.replaceChildren(...canonical.querySelector('.desktop-nav').childNodes);h.dataset.homeNav='1'}
 let f=document.querySelector('footer.site-footer');
 if(!f?.dataset.shiftHomeShell){
  const next=node(master.footer);next.dataset.shiftHomeShell='20261024';
  for(const id of ['toggleLargeText','toggleMotion'])next.querySelector('#'+id)?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();const enabled=document.documentElement.classList.toggle(id==='toggleLargeText'?'large-text':'reduce-motion');try{localStorage.setItem(id==='toggleLargeText'?'sst_large_text':'sst_reduce_motion',enabled?'1':'0')}catch{}},{capture:true});
  if(f)f.replaceWith(next);else document.body.append(next);f=next;fit(f);
 }
 if(f.parentElement!==document.body)document.body.append(f);
 for(const extra of document.querySelectorAll('footer'))if(extra!==f){if(extra.querySelector('.footer-brand,.fc-main,.footer-grid'))extra.remove();else for(const duplicate of extra.querySelectorAll('.shift-whatsapp-row,[data-shift-footer-social]'))duplicate.remove()}
 document.documentElement.dataset.shiftHomeShell='20261024';
}
const start=()=>{install();let queued=false;new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;install()})}}).observe(document.body,{childList:true,subtree:true})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
