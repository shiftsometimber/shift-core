// Retain established screen runtimes without storing private data on disk.
export function memberPerformanceClient(){
'use strict';
if(window.__mtPerformance)return;window.__mtPerformance=true;
const originalFetch=window.fetch.bind(window),reads=new Map(),pendingReads=new Set();
let version=0,identity=null,lastOwner=null,identityAt=0,inflight=null,controller=null;
const authorisedOrigin=u=>u.origin===location.origin;
function endpoint(input){try{return new URL(input instanceof Request?input.url:input,location.href)}catch{return null}}
let parentApp;try{if(parent!==window&&parent.location.origin===location.origin)parentApp=parent.MT_PERFORMANCE;}catch{}
if(window.SST_API_BASE==='null')window.SST_API_BASE=location.origin;
const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('my-timber-session-invalidated'):null;
function wipe(reason,broadcast=false){
 ++version;identity=null;identityAt=0;controller?.abort();inflight=null;if(reason!=='background'){reads.clear();lastOwner=null;}
 document.dispatchEvent(new CustomEvent('mt:identity-invalidated',{detail:{reason}}));
 if(broadcast)channel?.postMessage({invalidate:true});
}
async function verified(force=false){
 if(parentApp)return parentApp.identity(force);
 if(!force&&identity&&Date.now()-identityAt<15000)return identity;
 if(inflight)return inflight;
 const epoch=version;controller=new AbortController();
 const job=(async()=>{
 const timer=setTimeout(()=>controller?.abort(),12000);
 try{
 const r=await originalFetch('/v1/me',{credentials:'include',cache:'no-store',signal:controller.signal});
 if(!r.ok)throw Error('Sign-in unavailable');
 const data=await r.json();if(data?.user?.id===undefined||data.user.id===null)throw Error('Account missing');
 if(epoch!==version)throw Error('Account changed');
 if(lastOwner!==null&&lastOwner!==String(data.user.id)){wipe('account-switch');throw Error('Account changed');}
 identity=data;lastOwner=String(data.user.id);identityAt=Date.now();return data;
 }catch(e){if(epoch===version)wipe('identity-failed');throw e;}finally{clearTimeout(timer);if(epoch===version)inflight=null;}
 })();inflight=job;return job;
}
if(!parentApp)channel?.addEventListener('message',()=>wipe('another-window'));
const identityPath=u=>authorisedOrigin(u)&&u.pathname==='/v1/me';
window.MT_MEMBER_IDENTITY=verified;
window.fetch=async function(input,init){
 const u=endpoint(input),method=(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
 if(u&&identityPath(u)&&method==='GET'){
  try{return new Response(JSON.stringify(await verified()),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}
  catch{return new Response('{"error":"sign_in_required"}',{status:401,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}
 }
 const tracked=u&&authorisedOrigin(u)&&u.pathname.startsWith('/v1/')&&method==='GET';
 let release;if(tracked){const job=new Promise(r=>release=r);pendingReads.add(job);job.finally(()=>pendingReads.delete(job));}
 try{
 const r=await originalFetch(input,init);
 if(u&&authorisedOrigin(u)&&u.pathname.startsWith('/v1/')){
  if(r.status===401){(parentApp?.invalidate||wipe)('api-session-expired',true);}
  if(tracked&&r.ok){const body=await r.clone().text();reads.set(u.pathname+u.search,body);}
  if(method!=='GET'&&method!=='HEAD'&&r.ok&&/logout|sign.?out|auth\/login|auth\/switch|privacy\/account/.test(u.pathname)) (parentApp?.invalidate||wipe)('account-operation',true);
 }return r;
 }finally{release?.();}
};
async function revalidate(){
 await Promise.allSettled([...pendingReads]);
 const before=version;let changed=false;
 await Promise.all([...reads].map(async([path,body])=>{
  const r=await originalFetch(path,{credentials:'include',cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw Error('Current information unavailable');
  if(await r.text()!==body)changed=true;
 }));
 if(before!==version)throw Error('Account changed');return !changed;
}
const screenPath=u=>authorisedOrigin(u)&&(
 /^\/member\/(?:dashboard|grub|fit|settings|orders|saved|plans|my-shift|my-target|my-why|achievements|check-in)\/?$/.test(u.pathname)||
 /^\/member\/life-back\/(?:journey|shop(?:\/(?:testing(?:\/[a-z0-9-]{1,70})?|nutrition|kit|care))?)\/?$/.test(u.pathname));
const ready=w=>{
 const d=w.document,b=d.body;if(!b||b.dataset.memberSession!=='ready'||b.dataset.accountDeleted==='1')return false;
 if(b.dataset.memberPage==='dashboard'&&!d.querySelector('#previewMember.is-ready:not([hidden])'))return false;
 if(!b.hasAttribute('data-mt-shop-navigation'))return false;
 const main=d.querySelector('main');if(!main||w.getComputedStyle(main).display==='none')return false;
 const journey=d.querySelector('#timberJourney');if(journey&&!journey.querySelector('[data-tj-add],[data-tj-snapshot-text],[data-tj-record-form],[data-tj-edit],[data-mt-six-weeks]'))return false;
 return ![...d.querySelectorAll('main [aria-busy="true"]')].some(e=>{const s=w.getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;});
};
const touched=new WeakSet();document.addEventListener('input',e=>touched.add(e.target),true);document.addEventListener('change',e=>touched.add(e.target),true);
const dirty=()=>[...document.querySelectorAll('input,textarea,select')].some(e=>touched.has(e)&&e.isConnected&&(e.type==='checkbox'||e.type==='radio'?e.checked!==e.defaultChecked:e.value!==e.defaultValue));
window.MT_SCREEN={ready:()=>ready(window),validate:revalidate,pending:()=>pendingReads.size,dirty,hide:()=>{document.documentElement.dataset.mtScreenLocked='1';},show:()=>{delete document.documentElement.dataset.mtScreenLocked;}};
if(parentApp){
 document.addEventListener('visibilitychange',e=>{e.stopImmediatePropagation();if(document.hidden)window.MT_SCREEN.hide();},true);
 document.documentElement.dataset.mtContainedScreen='1';
 document.addEventListener('click',event=>{
  const a=event.target.closest?.('a[href]');if(!a||event.defaultPrevented||event.button>0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||a.target==='_blank'||a.hasAttribute('download'))return;
  const u=endpoint(a.href);if(u&&screenPath(u)){event.preventDefault();event.stopImmediatePropagation();parentApp.navigate(u.href);}
 },true);
 document.addEventListener('sst:account-changed',()=>parentApp.invalidate('account-event',true));
 document.addEventListener('mt:identity-invalidated',()=>{document.documentElement.dataset.mtScreenLocked='1';});
 return;
}
const initial=new URL(location.href),frames=new Map(),samples=[];
let active=null,navigation=0,internalRoute=false;
const key=u=>{const v=new URL(u);if(v.searchParams.get('view')==='app')v.searchParams.delete('view');if(v.pathname==='/member/dashboard'&&['support','stuff'].includes(v.searchParams.get('timber')))v.searchParams.delete('timber');return v.pathname+v.search;},rootKey=key(initial);
function tab(u){if(u.pathname.startsWith('/member/life-back/shop'))return 'shop';if(u.pathname.startsWith('/member/life-back/journey'))return 'journey';if(u.pathname==='/member/grub')return 'grub';if(u.pathname==='/member/fit')return 'fit';return u.searchParams.get('timber')==='support'?'support':u.searchParams.get('timber')==='stuff'||/settings|orders|plans|saved|my-shift/.test(u.pathname)?'more':'today';}
function select(u){document.querySelectorAll('#mtShopChrome [data-mt-shop-tab]').forEach(a=>{if(a.dataset.mtShopTab===tab(u))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});}
function status(text){let n=document.getElementById('mtNavigationStatus');if(!n){n=document.createElement('p');n.id='mtNavigationStatus';n.setAttribute('role','status');document.body.append(n);}n.textContent=text;n.hidden=!text;}
function lock(){document.documentElement.dataset.mtScreenLocked='1';for(const {frame}of frames.values()){frame.style.visibility='hidden';try{frame.contentWindow.MT_SCREEN?.hide();}catch{}}}
function discard(){++navigation;for(const {frame}of frames.values())frame.remove();frames.clear();active=null;lock();document.dispatchEvent(new Event('sst:member-basket-clear'));}
function invalidate(reason,broadcast=false){wipe(reason,broadcast);}
function fail(){discard();document.body.dataset.memberSession='pending';document.getElementById('previewMember')?.classList.remove('is-ready');window.SST_MEMBER_SESSION?.check();status('Please check your sign-in to continue.');}
function windowOf(entry){return entry?entry.frame.contentWindow:window;}
async function waitUsable(entry,ticket){
 const w=windowOf(entry),deadline=performance.now()+20000;
 while(performance.now()<deadline){if(ticket!==navigation)throw Error('Navigation superseded');if(w.document?.body?.dataset.memberSession==='signed-out')throw Error('Sign-in required');if(ready(w)&&w.MT_SCREEN?.pending()===0){await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));if(ready(w)&&w.MT_SCREEN?.pending()===0)return;}await new Promise(r=>setTimeout(r,20));}
 throw Error('This screen has not finished loading');
}
function finish(entry,u){
 for(const e of frames.values())e.frame.style.visibility=e===entry?'visible':'hidden';
 if(entry){entry.frame.hidden=false;entry.frame.inert=false;entry.frame.contentWindow.MT_SCREEN?.show();}
 active=entry;delete document.documentElement.dataset.mtScreenLocked;
 document.documentElement.toggleAttribute('data-mt-overlay-screen',!!entry);select(u);status('');document.title=entry?.frame.contentDocument?.title||document.title;
}
async function navigate(href,options={}){
 const u=endpoint(href);if(!u||!screenPath(u))return false;
 const ticket=++navigation,t=performance.now(),row={path:u.pathname+u.search,ackMs:0,warm:false};
 status('Opening '+({today:'Today',journey:'Journey',shop:'Shop',grub:'Grub',fit:'Fit',support:'Support',more:'More'}[tab(u)]||'My Timber')+'…');
 document.querySelector('#mtShopChrome')?.setAttribute('aria-busy','true');row.ackMs=Math.round(performance.now()-t);
 try{
 const identityStart=performance.now();await verified(true);row.identityMs=Math.round(performance.now()-identityStart);if(ticket!==navigation)return;
 let entry=frames.get(key(u));
 if(key(u)===rootKey&&!document.documentElement.hasAttribute('data-mt-root-stale'))entry=null;
 else if(!entry){
  const frame=document.createElement('iframe');frame.className='mt-retained-screen';frame.title=({journey:'Journey',shop:'Shop',grub:'Grub',fit:'Fit'}[tab(u)]||'My Timber')+' screen';frame.setAttribute('aria-label',frame.title);
  frame.style.visibility='hidden';frame.src=u.href;document.body.append(frame);entry={frame,url:u.href,loaded:false};frames.set(key(u),entry);
 }
 row.warm=entry?entry.loaded:true;
 const w=windowOf(entry),dataStart=performance.now();
 if(row.warm){
  const unchanged=await w.MT_SCREEN.validate();
  if(!unchanged){
   if(w.MT_SCREEN.dirty())throw Error('Your draft is still here. Saved information has changed; finish or cancel the draft before reloading');
   if(entry){entry.loaded=false;entry.frame.src=u.href;await new Promise(r=>setTimeout(r,0));}
   else{document.documentElement.dataset.mtRootStale='1';return navigate(href,options);}
  }
 }
 await waitUsable(entry,ticket);if(ticket!==navigation)return;row.dataAndScreenMs=Math.round(performance.now()-dataStart);
 if(!options.history)history.pushState({mtRetained:true},'',u.pathname+u.search+u.hash);
 if(!entry&&u.hash!==initial.hash){history.replaceState(history.state,'',u.pathname+u.search+u.hash);dispatchEvent(new Event('hashchange'));}
 if(entry&&u.hash&&entry.frame.contentWindow.location.hash!==u.hash)entry.frame.contentWindow.location.hash=u.hash;
 finish(entry,u);if(!entry){internalRoute=true;dispatchEvent(new PopStateEvent('popstate'));internalRoute=false;}if(entry)entry.loaded=true;row.usableMs=Math.round(performance.now()-t);row.pass=true;samples.push(row);document.dispatchEvent(new CustomEvent('mt:screen-usable',{detail:row}));
 }catch(e){if(ticket!==navigation)return;row.error=e.message;samples.push(row);if(!identity)fail();else status(e.message+'. Your saved information has not changed.');}
 finally{if(ticket===navigation)document.querySelector('#mtShopChrome')?.removeAttribute('aria-busy');}
 return true;
}
window.MT_PERFORMANCE={identity:verified,invalidate,navigate,samples,current:()=>active?.frame.contentWindow||window};
let recoveringSession=false;
document.addEventListener('mt:identity-invalidated',e=>{if(e.detail?.reason==='background'){++navigation;lock();return;}const wasReady=document.body?.dataset.memberSession==='ready';discard();if(wasReady)document.documentElement.dataset.mtRootStale='1';document.body&&(document.body.dataset.memberSession='pending');if(wasReady&&!recoveringSession){recoveringSession=true;queueMicrotask(async()=>{try{await window.SST_MEMBER_SESSION?.check();if(document.body.dataset.memberSession==='ready')await navigate(location.href,{history:true});}finally{recoveringSession=false;}});}});
document.addEventListener('sst:account-changed',()=>{invalidate('account-event',true);window.SST_MEMBER_SESSION?.check();});
document.addEventListener('click',event=>{
 const a=event.target.closest?.('a[href]');if(!a||event.defaultPrevented||event.button>0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||a.target==='_blank'||a.hasAttribute('download'))return;
 const u=endpoint(a.href);if(!u||!screenPath(u)||!document.body?.hasAttribute('data-mt-shop-navigation'))return;
 event.preventDefault();event.stopImmediatePropagation();navigate(u.href);
},true);
addEventListener('popstate',()=>{if(internalRoute)return;const u=new URL(location.href);if(u.pathname===initial.pathname&&!active){select(u);return;}navigate(u.href,{history:true});});
document.addEventListener('visibilitychange',event=>{
 event.stopImmediatePropagation();
 if(document.hidden){lock();wipe('background');}
 else{(async()=>{try{await verified(true);if(active){const same=await active.frame.contentWindow.MT_SCREEN.validate();if(!same){await navigate(location.href,{history:true});return;}}else if(!await window.MT_SCREEN.validate()){document.documentElement.dataset.mtRootStale='1';await navigate(location.href,{history:true});return;}window.SST_MEMBER_SESSION?.check();finish(active,new URL(location.href));}catch{fail();}})();}
},true);
addEventListener('pagehide',()=>{discard();wipe('pagehide');});addEventListener('pageshow',event=>{if(event.persisted)fail();});
const observe=()=>{if(!document.body)return;new MutationObserver(()=>{if(document.body.dataset.accountDeleted==='1')invalidate('deleted',true);if(['signed-out','error'].includes(document.body.dataset.memberSession))delete document.documentElement.dataset.mtScreenLocked;const c=document.getElementById('mtShopChrome');if(c){c.style.zIndex='2200';select(new URL(location.href));}}).observe(document.body,{childList:true,attributes:true,attributeFilter:['data-account-deleted','data-member-session']});};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
}
export const performanceRuntime='('+memberPerformanceClient.toString()+')();';
export const performanceStyles="\nhtml[data-mt-contained-screen] :is(#mtShopChrome,#mtShopPending,#mtShopLoading){visibility:hidden!important;pointer-events:none!important}\nhtml[data-mt-contained-screen] :is(header.site-header,#sst-header-c,#sst-footer-c,.site-footer,#todayBrand,.tj-brand,.mt-support-brand,#mtSixNav,#appBottomNav,nav.sst-member-tabs){display:none!important}\nhtml[data-mt-screen-locked] main,html[data-mt-screen-locked] .mt-retained-screen{visibility:hidden!important;pointer-events:none!important}\nhtml[data-mt-overlay-screen] body>main{visibility:hidden!important;pointer-events:none!important}\n.mt-retained-screen{position:fixed!important;inset:0!important;width:100%!important;height:100dvh!important;border:0!important;margin:0!important;background:#050505!important;z-index:2000!important}\n#mtShopChrome{position:relative;z-index:2200!important}\n#mtNavigationStatus{position:fixed;top:calc(108px + env(safe-area-inset-top));left:0;right:0;margin:0;padding:10px 16px;z-index:2150;background:#050505;color:#E7E3DA;font:14px/1.4 Arial,sans-serif}\n#mtNavigationStatus[hidden]{display:none!important}\n#mtShopChrome[aria-busy=true] a:active{background:#707762}\n";
