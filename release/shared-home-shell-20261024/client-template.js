/* Shared homepage shell. No API, account or communications operations. */
;(()=>{'use strict';
if(/^\/(?:hq|admin|v1|api)(?:\/|$)/.test(location.pathname)||window.__shiftHomeShell)return;
window.__shiftHomeShell=true;
const master=__MASTER__,css=__CSS__;
const style=document.createElement('style');style.id='shift-home-shell-20261024';style.textContent=css;document.head.append(style);
function node(html){const t=document.createElement('template');t.innerHTML=html;return t.content.firstElementChild}
function fit(footer){const nav=footer.querySelector('[data-shift-footer-social]'),row=footer.querySelector('[data-whatsapp-contact]');if(!nav||!row)return;const size=()=>{const a=[...nav.querySelectorAll('a')].map(a=>a.getBoundingClientRect());if(a.length)row.style.setProperty('--shift-chat-width',Math.ceil(Math.max(...a.map(a=>a.right))-Math.min(...a.map(a=>a.left)))+'px')};size();new ResizeObserver(size).observe(nav)}
function bindNewHeader(h,d,back){const trigger=h.querySelector('.menu-trigger'),close=d.querySelector('.drawer-close');let prior;
 const shut=()=>{d.hidden=true;back.hidden=true;document.body.classList.remove('drawer-open');trigger.setAttribute('aria-expanded','false');(prior||trigger).focus()};
 trigger.addEventListener('click',()=>{prior=document.activeElement;d.hidden=false;back.hidden=false;document.body.classList.add('drawer-open');trigger.setAttribute('aria-expanded','true');close.focus()});
 close.addEventListener('click',shut);back.addEventListener('click',shut);d.addEventListener('click',e=>{if(e.target.closest('a'))shut()});
 document.addEventListener('keydown',e=>{if(d.hidden)return;if(e.key==='Escape')shut();if(e.key==='Tab'){const a=[...d.querySelectorAll('a,button,[tabindex]')].filter(e=>!e.disabled&&e.tabIndex!==-1),first=a[0],last=a.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
}
function install(){if(!document.body)return;
 let h=document.querySelector('header.site-header[data-header-v2]');
 if(!h){h=node(master.header);const d=node(master.drawer),back=node(master.backdrop);document.body.prepend(h,d,back);bindNewHeader(h,d,back)}
 if(h.parentElement!==document.body)document.body.prepend(h);
 h.id='shift-site-header';h.dataset.shiftHomeShell='20261024';
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
  for(const id of ['toggleLargeText','toggleMotion']){const old=f?.querySelector('#'+id),replacement=next.querySelector('#'+id);if(old&&replacement)replacement.replaceWith(old);else replacement?.addEventListener('click',()=>document.documentElement.classList.toggle(id==='toggleLargeText'?'large-text':'reduce-motion'))}
  if(f)f.replaceWith(next);else document.body.append(next);f=next;fit(f);
 }
 if(f.parentElement!==document.body)document.body.append(f);
 document.documentElement.dataset.shiftHomeShell='20261024';
}
const start=()=>{install();let queued=false;new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;install()})}}).observe(document.body,{childList:true,subtree:true})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
