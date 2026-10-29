export const shopNavigationRuntime=String.raw`(()=>{
 'use strict';
 if(window.__mtShopNavigation)return;window.__mtShopNavigation=true;
 const body=document.body,$=s=>document.querySelector(s);
 let owner=null,epoch=0,verifying=false,queued=false,basketLoaded=false,blocked=false;
 const savedPadding=new Map(),hiddenChrome=new Map();
 const ready=()=>body.dataset.memberSession==='ready'&&body.dataset.accountDeleted!=='1'&&body.dataset.appPanel!=='1'&&(body.dataset.memberPage!=='dashboard'||!!$('#previewMember.is-ready:not([hidden])'));
 function padding(on){for(const [name,value]of [['padding-top','calc(108px + env(safe-area-inset-top))'],['padding-bottom','calc(78px + env(safe-area-inset-bottom))']]){
  if(on){if(!savedPadding.has(name))savedPadding.set(name,[body.style.getPropertyValue(name),body.style.getPropertyPriority(name)]);if(body.style.getPropertyValue(name)!==value)body.style.setProperty(name,value,'important');}
  else if(savedPadding.has(name)){const [v,p]=savedPadding.get(name);if(v)body.style.setProperty(name,v,p);else body.style.removeProperty(name);savedPadding.delete(name);}
 }}
 function legacy(on){if(on)document.querySelectorAll('#appBottomNav,#mtSixNav,.tj-bottom,.mt-support-nav,#todayBrand,.tj-brand,.mt-support-brand,.orders-header,nav.sst-member-tabs').forEach(el=>{if(!hiddenChrome.has(el))hiddenChrome.set(el,[el.style.getPropertyValue('display'),el.style.getPropertyPriority('display')]);if(el.style.getPropertyValue('display')!=='none')el.style.setProperty('display','none','important');});else{for(const [el,[value,priority]]of hiddenChrome){if(value)el.style.setProperty('display',value,priority);else el.style.removeProperty('display');}hiddenChrome.clear();}}
 function clear(){++epoch;owner=null;verifying=false;document.dispatchEvent(new CustomEvent('sst:member-basket-clear'));$('#mtShopChrome')?.remove();body.removeAttribute('data-mt-shop-navigation');padding(false);legacy(false);const panel=$('#sstBasketPanel');if(panel?.open)panel.close();$('#sstBasketInner')?.replaceChildren();const fab=$('#sstBasketFab');if(fab)fab.hidden=true;}
 function selected(){const p=location.pathname,q=new URLSearchParams(location.search);if(p.startsWith('/member/life-back/shop'))return 'shop';if(p==='/member/life-back/journey'||p==='/member/life-back'||['#journey','#visualise'].includes(location.hash))return 'journey';if(p==='/member/grub'||body.dataset.appTool==='grub')return 'grub';if(p==='/member/fit'||body.dataset.appTool==='fit')return 'fit';if(q.get('timber')==='stuff'||['/member/settings','/member/orders','/member/saved','/member/plans'].includes(p))return 'more';if(q.get('timber')==='support'||p.startsWith('/member/life-back/support')||p==='/member/ask-timber'||p==='/member/treatment')return 'support';return 'today';}
 function count(){const fab=$('#sstBasketFab'),value=Number($('#sstBasketCount')?.textContent||0),button=$('#mtShopBasket'),label=$('#mtShopBasketCount');if(!button||!label)return;const n=fab&&!fab.hidden&&Number.isSafeInteger(value)&&value>0?value:0;if(button.hidden===(n>0))button.hidden=!n;const text=n?String(n):'';if(label.textContent!==text)label.textContent=text;button.setAttribute('aria-label',n?'Open your basket, '+n+' '+(n===1?'item':'items'):'Open your basket');}
 function chrome(){
  if(!owner||!ready()||document.hidden)return;
  if(!$('#mtShopChrome')){const template=document.createElement('template');template.innerHTML=shopChrome;body.append(template.content.cloneNode(true));$('#mtShopBasket').addEventListener('click',async()=>{if(await verify(true))document.dispatchEvent(new CustomEvent('sst:member-basket-open'));});}
  if(!body.hasAttribute('data-mt-shop-navigation'))body.dataset.mtShopNavigation='20261029';padding(true);legacy(true);
  const key=selected();document.querySelectorAll('[data-mt-shop-tab]').forEach(a=>{const active=a.dataset.mtShopTab===key;if(active&&a.getAttribute('aria-current')!=='page')a.setAttribute('aria-current','page');if(!active&&a.hasAttribute('aria-current'))a.removeAttribute('aria-current');});count();
 }
 function basket(){if(!basketLoaded){basketLoaded=true;const script=document.createElement('script');script.src='/assets/member-experience/programme-shop-basket.js';script.id='mtShopBasketAsset';script.onerror=()=>{basketLoaded=false;script.remove();};document.body.append(script);}else document.dispatchEvent(new CustomEvent('sst:member-basket-refresh'));}
 async function verify(refresh=false){
  if(!ready()||document.hidden)return false;if(verifying)return false;if(owner&&!refresh){chrome();return true;}
  verifying=true;const version=epoch;
  try{const response=await fetch('/v1/me',{credentials:'include',cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Sign-in unavailable');const data=await response.json(),id=data?.user?.id;if(id===undefined||id===null)throw Error('Account missing');if(version!==epoch||!ready()||document.hidden)return false;
   const changed=owner!==String(id);if(owner!==null&&changed){document.dispatchEvent(new CustomEvent('sst:member-basket-clear'));++epoch;}
   owner=String(id);blocked=false;chrome();if(changed||!basketLoaded)basket();return true;
  }catch{if(version===epoch){blocked=true;clear();}return false;}finally{verifying=false;}
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;if(!ready()||document.hidden){if(owner||$('#mtShopChrome'))clear();return;}if(blocked)return;if(owner)chrome();else verify();});}
 // Catalogue routes stay inside the app; checkout, Stripe and clinical assessment
 // keep their existing top-level handlers. Only the finite catalogue set maps.
 document.addEventListener('click',event=>{if(!body.hasAttribute('data-mt-shop-navigation')||event.defaultPrevented||event.button>0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const link=event.target.closest('a[href]');if(!link||link.target==='_blank'||link.hasAttribute('download'))return;const raw=link.getAttribute('href');if(!raw||raw.startsWith('#'))return;const mapped=shopMemberPath(link.href,location.origin);if(mapped){event.preventDefault();location.assign(mapped);}},true);
 document.addEventListener('submit',event=>{if(!body.hasAttribute('data-mt-shop-document'))return;const form=event.target;if(!(form instanceof HTMLFormElement)||(form.method||'get').toLowerCase()!=='get')return;const mapped=shopMemberPath(form.action,location.origin);if(mapped)form.action=mapped;},true);
 addEventListener('hashchange',schedule);addEventListener('popstate',schedule);addEventListener('pagehide',clear);addEventListener('pageshow',()=>{blocked=false;if(ready())verify(true);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else{blocked=false;schedule();}});
 document.addEventListener('sst:account-changed',()=>{blocked=false;clear();schedule();});
 function boot(){new MutationObserver(records=>{if(records.some(r=>r.target===body&&r.attributeName==='data-member-session'))blocked=false;if(records.every(r=>r.target.nodeType===1&&r.target.closest?.('#mtShopChrome')))return;schedule();}).observe(body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-member-session','data-account-deleted','data-app-tool','hidden','class']});schedule();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();`;
