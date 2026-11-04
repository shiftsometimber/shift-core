export function nativeBrowser(){
 'use strict';
 const main=document.getElementById('mtNativeMain'),initial=document.getElementById('mtNativeInitial'),cache=makePrivateCache();
 let data=JSON.parse(initial.textContent),owner=data?String(data.accountId):null,generation=0,blocked=false,offline=!navigator.onLine,router=null,daily=null,grub=null,fit=null,crew=null,identityPromise=null,arcade=null,arcadeStop=null;
 const responses=new Map();let welcome=null;initial.remove();
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icons={tick:'m4 12 5 5L20 6',swap:'M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4',star:'m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6-4.4-4.3 6.1-.9Z',play:'m9 5 7 7-7 7',close:'m5 5 14 14M19 5 5 19',lock:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5Z'};
 const icon=name=>'<svg class="mt-native-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="'+(icons[name]||icons.play)+'"/></svg>';
 const ready=()=>!!data&&!blocked&&document.body.dataset.memberSession==='ready'&&!document.hidden&&Date.parse(data.expiresAt)>Date.now();
 const retained=makeRetained({ready,weightVisible:()=>data?.v7.preferences.showWeight!==false,weightData:makeWeightView,owner:()=>owner,generation:()=>generation,clear});
 const status=text=>{let n=document.querySelector('dialog[open] [data-v7-status]')||main.querySelector('[data-native-status]');if(!n){n=document.createElement('p');n.dataset.nativeStatus='';n.setAttribute('role','status');main.append(n);}n.textContent=text;};
 const offlineNote=()=>{document.getElementById('mtShellOffline').hidden=!offline;};
 let persistence=null;
 function persist(){clearTimeout(persistence);persistence=setTimeout(()=>{if(data&&!blocked)cache.save(owner,data.expiresAt,{data,responses:[...responses]}).catch(()=>{});},80);}
 async function purge(broadcast=true){responses.clear();await cache.purge();if(broadcast)channel?.postMessage({type:'purge'});}
 function clear(){arcadeStop?.();arcade?.close();arcade=null;document.dispatchEvent(new CustomEvent('sst:member-basket-clear'));retained.clear();generation++;blocked=true;data=null;owner=null;identityPromise=null;daily?.clear();grub?.clear();router?.clear();document.body.dataset.memberSession='signed-out';main.innerHTML='<p>Sign in to open your private My Timber account.</p><a href="/member-login?returnTo=%2Fmember%2Fdashboard">Sign in</a>';purge();}
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('my-timber-shell-privacy'):null;
 channel?.addEventListener('message',()=>{if(data){generation++;blocked=true;data=null;daily?.clear();router?.clear();main.innerHTML='<p>Your account or privacy settings changed. <a href="/member/dashboard">Reopen My Timber</a>.</p>';}purge(false);});
 async function request(path,body,method='POST'){
  if(!ready())throw Error('Sign in again before saving.');if(offline)throw Error('You’re offline. Your saved pile is safe. Reconnect to save.');const g=generation;
  const r=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,expectedAccount:owner}),signal:AbortSignal.timeout(15000)});
  if(g!==generation||!ready())throw Error('Your account changed. Reopen My Timber.');if(r.status===401){clear();throw Error('Sign in again before saving.');}
  const result=await r.json();if(!r.ok)throw Error(result.error||result.message||'This save could not be confirmed.');
  if(result.accountId!==undefined&&String(result.accountId)!==owner){clear();throw Error('Your account changed.');}
  for(const key of responses.keys())if(key.startsWith('/v1/'))responses.delete(key);persist();return result;
 }
 async function refresh(path,options={}){
  if(offline||!ready())throw Error('You’re offline. Showing your last saved content.');const g=generation;
  const r=await fetch(path,{credentials:'same-origin',cache:'no-store',signal:options.signal||AbortSignal.timeout(15000)});
  if(g!==generation||!ready())throw Error('Your account changed.');if(r.status===401){clear();throw Error('Sign in again.');}
  if(!r.ok)return r;const value=await r.json(),account=r.headers.get('X-My-Timber-Account')||value.accountId;
  if(account!==undefined&&account!==null&&String(account)!==owner){clear();throw Error('Your account changed.');}
  if(!path.startsWith('/v1/my-timber/assessment-draft'))responses.set(path,{value,at:Date.now()});persist();return new Response(JSON.stringify(value),{status:r.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 }
 window.MT_SCREEN_DATA=async(path,options={})=>{if(options.fresh)return refresh(path,options);const saved=responses.get(path);if(saved){if(!offline&&Date.now()-saved.at>30000)refresh(path,options).then(()=>document.dispatchEvent(new CustomEvent('mt:data-updated',{detail:{path}}))).catch(()=>{});return new Response(JSON.stringify(saved.value),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}return refresh(path,options);};
 window.MT_MEMBER_IDENTITY=()=>identityPromise||Promise.reject(Error('Account unavailable'));
 window.SST_MEMBER_SESSION={check:async callback=>{if(ready()){if(callback)await callback();}else clear();},ready:()=>{}};
 window.SST_HEALTH_CONSENT={ensure:async()=>{if(!data?.tracking)status('Open Account & settings to review optional health tracking.');return ready()&&data.tracking;}};
 let basketLoading=null;
 async function startBasket(){
  if(!basketLoading)basketLoading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/assets/member-experience/v7-basket.mjs';script.onload=resolve;script.onerror=()=>{basketLoading=null;reject(Error('Your saved basket could not be checked.'));};document.head.append(script);});
  try{await basketLoading;basketCount();}catch(e){status(e.message);}
 }
 function basketCount(){const fab=document.getElementById('sstBasketFab'),count=Number(document.getElementById('sstBasketCount')?.textContent||0),button=document.getElementById('mtShopBasket'),label=document.getElementById('mtShopBasketCount');const n=ready()&&fab&&!fab.hidden&&Number.isSafeInteger(count)?count:0;button.hidden=!n;label.textContent=n?String(n):'';button.setAttribute('aria-label',n?'Open your basket, '+n+' items':'Open your basket');}
 document.getElementById('mtShopBasket').onclick=()=>{if(ready())document.dispatchEvent(new CustomEvent('sst:member-basket-open'));};
 new MutationObserver(records=>{if(records.some(r=>r.target.id?.startsWith('sstBasket')||r.target.parentElement?.closest('#sstBasketFab,#sstBasketPanel')))basketCount();}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
 function arcadeCard(){const a=data.arcade,g=SHED_GAMES.find(g=>g.id===a?.gameOfDay)||SHED_GAMES[0];return '<section class="mt-v7-card" data-arcade-today><p class="mt-v7-eyebrow">SHIFT ARCADE</p><h2>BORED?! Want 2 mins escapism?</h2><p>'+esc(g.name)+' · '+esc(g.hook)+'</p><p data-arcade-today-best>'+esc(arcadeBestLabel(g,a?.bests?.[g.key],a?.bests))+'</p><a href="/member/shed-arcade/'+g.id+'">PLAY '+icon('play')+'</a> <a href="/member/shed-arcade">All '+SHED_GAMES.length+' games</a></section>';}
 async function startArcade(root,url){if(!arcade)return;const source='/assets/member-experience/v7-arcade.mjs?v=__V7_NATIVE_ASSET_TAG__',module=await import(source);if(root.isConnected)arcadeStop=await module.mountArcade(root,{url,esc,games:SHED_GAMES,bestLabel:arcadeBestLabel,session:arcade,status});}
 async function startPersonalisation(root){
  try{const module=await import('/assets/member-experience/v7-personalisation.mjs?v=__V7_NATIVE_ASSET_TAG__');if(!root.isConnected||!ready())return;module.mountPersonalisation(root,{ready,account:()=>owner,clear,completed:async()=>{try{const r=await refresh('/v1/my-timber/boot');if(!r.ok)throw Error('Your saved setup could not be confirmed.');data=await r.json();daily.accept(data.v7);root.replaceChildren();router.invalidate('personalise');router.invalidate('welcome');router.refresh();await router.navigate('/member/dashboard#today');persist();}catch(e){status(e.message);}}});}catch(e){if(root.isConnected)root.textContent='Your setup could not be opened. Please try again.';}
 }
 document.addEventListener('mt:screen-leaving',()=>{arcadeStop?.();arcadeStop=null;});
 function nativeMarkup(page){
  if(page==='grub')return grub.markup();if(page==='fit')return fit.markup();
  return welcome.status()+(!data.setupComplete?'<div class="mt-native-setup"><strong>Let’s make My Timber yours.</strong><a href="/member/dashboard?tools=setup#journey">Personalise '+icon('play')+'</a></div>':'')+
   '<section class="mt-native-feeling"><span>Feeling?</span>'+[['Good','Good'],['OK','So-so'],['Struggling','A bit flat']].map(([value,label])=>'<button type="button" data-native-mood="'+value+'">'+label+'</button>').join('')+'</section><a class="mt-native-history" href="/member/check-in#history">History ›</a>'+daily.todayMarkup()+daily.stackMarkup()+arcadeCard()+'<details class="mt-v7-card"><summary>In your corner: tell Timber what is difficult</summary><a href="/member/life-back/support">Tell Timber what’s difficult</a><p><a href="/member/life-back/support#rough-day">Rough day? One thing to ease the load</a></p><p><a href="/member/life-back/support">What you’ve told us · My support · Finishing this stage</a></p></details><p><a href="/member/settings#notifications">My updates and device notifications</a></p><p data-native-status role="status"></p>';
 }
 async function legacy(url){
  const requested=new URL(url);if(!requested.pathname.startsWith('/member/life-back/shop/'))requested.searchParams.set('view-data','1');const key='html:'+url.pathname+url.search;
  if(responses.has(key))return responses.get(key).value;if(offline)throw Error('This screen has not been saved on this phone yet. Reconnect to open it.');
  const r=await fetch(requested,{credentials:'same-origin',cache:'no-store',headers:{'X-My-Timber-Content':'1'}});if(r.status===401){clear();throw Error('Sign in again.');}if(!r.ok)throw Error('This saved tool could not be opened.');
  const account=r.headers.get('X-My-Timber-Account');if(account&&account!==owner){clear();throw Error('Your account changed.');}
  const doc=new DOMParser().parseFromString(await r.text(),'text/html'),content=doc.querySelector('#mtShopMain,#main-content,#previewMember,main');if(!content)throw Error('This tool’s content could not be confirmed.');
  const tool=requested.pathname==='/member/dashboard',panel=tool?doc.querySelector('#previewMember'):requested.pathname==='/member/life-back'?doc.body:content;
  const view={html:panel===doc.body?doc.body.innerHTML:(panel||content).outerHTML,classes:doc.body.className,dataset:{...doc.body.dataset},tools:tool,document:tool?'/member/dashboard?tools=journey&view-data=1':requested.pathname==='/member/fit'?'/member/fit?tools=all&view-data=1':requested.pathname+'?view-data=1',inlineController:tool||requested.pathname==='/member/fit',styles:[...doc.querySelectorAll('link[rel=stylesheet]')].map(n=>new URL(n.getAttribute('href'),url).href).filter(src=>!/header|footer|public-feedback|chrome\.css|member-shell/.test(src)),inlineStyles:[...doc.querySelectorAll('style')].map(n=>n.textContent),configs:[...doc.querySelectorAll('script[type="application/json"],script[data-testing-storefront]')].filter(n=>{try{JSON.parse(n.textContent);return true}catch{return false}}).map(n=>({attributes:Object.fromEntries([...n.attributes].map(a=>[a.name,a.value])),text:n.textContent})),scripts:[...doc.querySelectorAll('script[src]')].filter(n=>requested.pathname!=='/member/dashboard/explore-weight-loss/questions'||n.getAttribute('src')?.includes('/clinical-journey-v1/')).map(n=>({src:new URL(n.getAttribute('src'),url).href,type:n.type}))};
  responses.set(key,{value:view,at:Date.now()});persist();return view;
 }
 async function startLegacy(view,node){await retained.load(view,node);if(location.pathname==='/member/settings'&&!node.querySelector('#health-tags')){const section=document.createElement('section');section.id='health-tags';section.className='mt-v7-card';section.innerHTML='<h2>Health tags</h2><p>Saved with your consent. Never shared. You can delete these at any time.</p><button type="button" data-fit="health">Manage private movement details</button>';node.querySelector('main')?.append(section);if(location.hash==='#health-tags')section.scrollIntoView({block:'start'});}}

 async function privacyChanged(){generation++;retained.clear();await purge();responses.clear();router.privacyReset();document.dispatchEvent(new CustomEvent('mt:privacy-changed'));router.refresh();persist();}
 function initialise(){
  blocked=false;document.body.dataset.memberSession='ready';if(!arcade)arcade=makeArcadeSession({games:SHED_GAMES,state:()=>data,ready,request,update:value=>{if(data){data.arcade=value;const g=SHED_GAMES.find(g=>g.id===value.gameOfDay),n=main.querySelector('[data-arcade-today-best]');if(g&&n)n.textContent=arcadeBestLabel(g,value.bests?.[g.key],value.bests);router?.invalidate('today');persist();}}});identityPromise=Promise.resolve({user:{id:data.accountId},expiresAt:data.expiresAt});
  if(!daily){daily=makeDaily({esc,icon,ready,account:()=>owner,generation:()=>generation,progress:()=>data.progress,goalVisible:()=>{try{return localStorage.getItem('mt:headline:'+owner)!=='off'}catch{return true}},request:body=>request('/v1/life-back',body),saved:result=>{if(!data)return;data.progress={revision:result.progress.revision};data.v7=result.v7;if(result.league)data.league=result.league;document.dispatchEvent(new CustomEvent('mt:v7-updated',{detail:{v7:result.v7}}));router?.refresh();persist();},quickLog:quickRecord,quickRecord});
   const services={esc,icon,state:()=>data,request,status,sheet:(...args)=>daily.sheet(...args),sheetRoot:()=>daily.sheetRoot(),close:()=>daily.close(),save:(...args)=>daily.save(...args),update:patch=>{if(!data)return;Object.assign(data,patch);if(patch.nutritionDay)data.v7.proteinG=patch.nutritionDay.proteinG;daily.accept(data.v7);router.refresh();persist();}};
   welcome=makeWelcome({state:()=>data,icon,esc,ready,request,readAssessment:async options=>{const r=await refresh('/v1/my-timber/assessment-draft'+(options==='history'?'/history-options':options?'/options':''));const value=await r.json();if(!r.ok)throw Error(value.message||'Your saved health questions could not load.');return value;},lookupGp:async query=>{const r=await refresh('/v1/member/details/gp-search?q='+encodeURIComponent(query));const value=await r.json();if(!r.ok)throw Error(value.message||'GP search could not load.');return value;},clinicalContext:async()=>{const r=await refresh('/v1/commerce/medicine-clinical-context');if(!r.ok)throw Error('Clinical service unavailable');return r.json();}});grub=makeGrub(services);fit=makeFit(services);crew=makeCrew(services);router=makeShellRouter({welcome,startPersonalisation,root:main,esc,icon,crew,startArcade,startUtility:(page,node)=>makeUtility({root:node,page,ready,account:()=>owner,clearAuth:clear,weightVisible:()=>data.v7.preferences.showWeight,logout:()=>request('/v1/auth/logout',{})}),state:()=>data,ready,nativeMarkup,bindDaily:n=>daily.bind(n),save:(...args)=>daily.save(...args),privacyChanged,persist,legacy,startLegacy,shopMarkup:SHOP_MARKUP,startBasket,startJourney:()=>startJourney(),startSupport:()=>startSupport()});
  }
  daily.accept(data.v7);
  const pendingDestination=window.__MT_PENDING_ROUTE;delete window.__MT_PENDING_ROUTE;window.__MT_NAV_READY=true;let destination=pendingDestination||location.href;try{const key='mt:welcome-seen:'+owner,seen=localStorage.getItem(key);if(!pendingDestination&&!seen&&!data.setupComplete&&data.v7.count===0&&router.pageFor(location.href)==='today'&&!new URL(location.href).search){destination='/member/dashboard/welcome';history.replaceState({},'',destination);}localStorage.setItem(key,'1');}catch{}
  router.navigate(destination,!!pendingDestination);offlineNote();persist();
 }
 async function boot(){
  if(data?.signedOut){clear();return;}if(data?.unavailable){data=null;main.innerHTML='<p>Your account could not be checked. <a href="/member/dashboard">Try again</a>.</p>';return;}
  if(data){owner=String(data.accountId);initialise();return;}
  const stored=await cache.restore();if(stored&&!navigator.onLine){data=stored.payload.data;owner=stored.owner;for(const entry of stored.payload.responses||[])responses.set(...entry);offline=true;initialise();return;}
  main.innerHTML='<p role="status">Opening your private My Timber…</p>';
  try{const response=await fetch('/v1/my-timber/boot',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});if(response.status===404){await purge();location.replace('/member/dashboard?mt-rollback=1');return;}if(response.status===401){clear();return;}if(!response.ok)throw Error('My Timber could not check your account.');const fresh=await response.json();if(!fresh.arcade){await purge();location.replace('/member/dashboard?mt-rollback=1');return;}
   if(stored&&stored.owner===String(fresh.accountId))for(const entry of stored.payload.responses||[])responses.set(...entry);else await purge(false);
   data=fresh;owner=String(data.accountId);initialise();
  }catch(error){if(stored){data=stored.payload.data;owner=stored.owner;offline=true;initialise();}else main.innerHTML='<p>'+esc(error.message)+'</p><a href="/member/dashboard">Try again</a>';}
 }
 async function quickRecord(key){if(key==='Pint'||key==='Takeaway'){if(await daily.save('v7-quick',{kind:key==='Pint'?'pint':'takeaway'}))daily.sheet('Quick log saved','<h2>'+key.toUpperCase()+' RECORDED</h2><p>Helps Timber learn. Doesn’t add a pile log.</p><p>Your food totals are unchanged. Record the food or drink and portion you had to update them.</p><a href="/member/grub#record-eaten">Record what you ate</a>');return;}if(key==='Weigh in'){daily.sheet('Record your weight','<h2>WEIGH IN</h2><form data-native-weight><label>Weight (kg)<input type="number" name="weight" step="0.1" min="20" max="400" required></label><button>Save reading</button></form><p>This saves your reading. It doesn’t add a pile log.</p>');daily.sheetRoot().querySelector('form').onsubmit=async e=>{e.preventDefault();try{await request('/v1/progress',{weightKg:Number(new FormData(e.target).get('weight')),recordedOn:data.v7.today,source:'my_timber_quick_log'});daily.close();status('Reading saved. Your pile is unchanged.');}catch(error){status(error.message);}};return;}
  const gym=key==='Gym done';daily.sheet(gym?'Record activity':'Record a rough night','<h2>'+(gym?'GYM DONE':'ROUGH NIGHT')+'</h2><p>This records a private '+(gym?'activity':'sleep note')+'. It doesn’t add a pile log.</p><button type="button" data-native-quick>Record '+(gym?'gym activity':'rough night')+'</button>');daily.sheetRoot().querySelector('[data-native-quick]').onclick=async()=>{if(await daily.save('v7-quick',{kind:gym?'gym':'sleep'}))daily.close();};
 }
 document.addEventListener('mt:headline-privacy',()=>router.refresh());
 document.addEventListener('mt:screen-activated',e=>{if(e.detail?.page==='grub'&&location.hash==='#record-eaten')grub.quick('dinner');});
 document.addEventListener('click',async e=>{
  const link=e.target.closest('a[href]');if(link&&router&&ready()&&!e.defaultPrevented&&e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&!link.download&&link.target!=='_blank'){
   const url=new URL(link.href,location.origin);if(url.origin===location.origin&&router.pageFor(url)){e.preventDefault();daily.close();await router.navigate(url.href);return;}}
  const b=e.target.closest('[data-grub],[data-fit],[data-crew],[data-native-mood]');if(!b||b.disabled||!ready())return;e.preventDefault();b.disabled=true;try{if(b.dataset.crew)await crew.handle(b);else if(b.dataset.grub)await grub.handle(b);else if(b.dataset.fit)await fit.handle(b);else {if(!data.tracking)throw Error('Review optional tracking in Account & settings first.');await request('/v1/life-back/check-in',{mood:b.dataset.nativeMood});status('Check-in saved.');if(await arcade.nudge()){const g=SHED_GAMES.find(g=>g.id===data.arcade.gameOfDay);const n=document.createElement('aside');n.className='mt-v7-card';n.dataset.arcadeNudge='';n.innerHTML='<p>Checked in today? Have a go at '+esc(g.name)+'.</p><a href="/member/shed-arcade/'+g.id+'">Play</a> <button type="button" data-arcade-dismiss>Not today</button>';main.append(n);n.querySelector('button').onclick=()=>{arcade.dismiss();n.remove();};}}}catch(error){status(error.message);}finally{if(b.isConnected)b.disabled=false;}
 });
 addEventListener('popstate',()=>{if(ready())router.navigate(location.href,false);});
 addEventListener('offline',()=>{offline=true;offlineNote();});addEventListener('online',async()=>{offline=false;offlineNote();if(!data)return;try{const r=await refresh('/v1/my-timber/boot');if(r.ok){const fresh=await r.json();data=fresh;arcade?.accept(fresh.arcade);daily.accept(data.v7);router.refresh();document.dispatchEvent(new CustomEvent('mt:privacy-changed'));persist();}}catch(e){status(e.message);}});
 addEventListener('pagehide',()=>{if(data)cache.save(owner,data.expiresAt,{data,responses:[...responses]}).catch(()=>{});});
 let visitCheck=null;
 async function verifyVisit(){
  if(!data||document.hidden)return;if(Date.parse(data.expiresAt)<=Date.now()){clear();return;}if(offline){main.hidden=false;return;}if(visitCheck)return visitCheck;
  main.hidden=true;const g=generation,was=owner;
  visitCheck=(async()=>{try{
   const r=await fetch('/v1/my-timber/boot',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});
   if(g!==generation||!data)return;if(r.status===401){clear();return;}if(!r.ok)throw Error('Your account could not be checked. Reopen My Timber.');const fresh=await r.json();
   if(String(fresh.accountId)!==was){clear();return;}
   if(JSON.stringify(data.treatment)!==JSON.stringify(fresh.treatment)){data.treatment=fresh.treatment;router.invalidate('treatment-status');router.refresh();}data.setupComplete=fresh.setupComplete;router.invalidate('welcome');data.expiresAt=fresh.expiresAt;arcade?.accept(fresh.arcade);identityPromise=Promise.resolve({user:{id:data.accountId},expiresAt:data.expiresAt});
   if(fresh.v7.preferences.showWeight!==data.v7.preferences.showWeight){data=fresh;daily.accept(data.v7);await privacyChanged();router.refresh();}
   main.hidden=false;persist();
  }catch{if(g===generation&&data){main.replaceChildren();const p=document.createElement('p');p.textContent='Your account could not be checked. Reopen My Timber to continue.';const a=document.createElement('a');a.href='/member/dashboard';a.textContent='Reopen My Timber';main.append(p,a);main.hidden=false;}}finally{visitCheck=null;}})();return visitCheck;
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden){daily?.close();main.hidden=true;}else verifyVisit();});
 addEventListener('pageshow',event=>{if(event.persisted)verifyVisit();});
 document.addEventListener('sst:account-changed',clear);document.addEventListener('sst:private-record-deleted',()=>purge());
 navigator.serviceWorker?.addEventListener('message',e=>{if(e.data?.type==='MT_PURGE_PRIVATE'&&data)clear();});
 if('serviceWorker' in navigator)navigator.serviceWorker.register('/treatment-sw.js',{scope:'/member/'}).catch(()=>{});
 boot().finally(()=>{window.__MT_NAV_READY=true;});
}