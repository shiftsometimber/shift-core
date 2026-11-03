// Owns content only. Header, tabs and bottom bar are never replaced here.
export function shellRouter(s){
 const root=s.root,nodes=new Map(),started=new Set();let current=null,serial=0;
 const paths={today:'/member/dashboard#today',journey:'/member/life-back/journey',shop:'/member/life-back/shop',grub:'/member/grub',fit:'/member/fit',support:'/member/dashboard?timber=support#today','private-support':'/member/life-back/support','life-back':'/member/life-back',more:'/member/more',league:'/member/life-back/support/league',preferences:'/member/life-back/preferences'};
 const pageFor=url=>{
  const u=new URL(url,location.origin);if(u.origin!==location.origin)return null;if(u.searchParams.has('tools'))return 'legacy';
  if(u.pathname==='/member/dashboard'){const t=u.searchParams.get('timber');return t==='support'?'support':t==='stuff'?'more':['#journey','#visualise'].includes(u.hash)?'legacy':'today';}
  for(const [page,path]of Object.entries(paths))if(new URL(path,location.origin).pathname===u.pathname)return page;
  return u.pathname.startsWith('/member/')?'legacy':null;
 };
 function select(page){const active=page==='preferences'?'more':['league','private-support'].includes(page)?'support':page==='life-back'?'journey':page;document.querySelectorAll('[data-mt-shop-tab]').forEach(n=>{if(n.dataset.mtShopTab===active)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');});}
 function native(page){const node=document.createElement('section');node.dataset.mtScreen=page;node.innerHTML=s.nativeMarkup(page);s.bindDaily(node);return node;}
 function preferences(){const node=document.createElement('section');node.dataset.mtScreen='preferences';const weight=s.state().v7.preferences.showWeight;node.innerHTML='<p><a href="/member/more">More</a></p><h1>PREFERENCES</h1><section class="mt-v7-card"><label class="tj-switch"><strong>Show weight: '+(weight?'On':'Off')+'</strong><input data-shell-weight type="checkbox" '+(weight?'checked':'')+'></label><p>Turn off if you’d rather focus on strength, energy or measurements.</p></section><p role="status"></p>';node.querySelector('input').onchange=async e=>{e.target.disabled=true;const result=await s.save('v7-preferences',{showWeight:e.target.checked});if(result){await s.privacyChanged();nodes.delete('preferences');show('preferences',false);}else e.target.disabled=false;};return node;}
 function more(){const node=document.createElement('section');node.dataset.mtScreen='more';node.innerHTML='<h1>MORE</h1>'+[['Preferences',paths.preferences],['Account & settings','/member/settings'],['Your orders','/member/orders'],['Saved plans','/member/plans'],['Saved items','/member/saved'],['Journey setup and weekly check-in','/member/dashboard?tools=journey#journey'],['Private progress photos, weight history and comparisons','/member/dashboard?tools=journey#visualise'],['Your support and saved step',paths.support]].map(([label,href])=>'<a class="mt-shell-menu" href="'+href+'">'+label+s.icon('play')+'</a>').join('')+'<p><a href="/member/settings#privacy">Consent, export and deletion</a></p>';return node;}
 function create(page){
  if(page==='league'){const node=document.createElement('section');node.dataset.mtScreen='league';node.innerHTML=s.crew.markup();s.crew.bind(node);return node;}
  if(['today','grub','fit'].includes(page))return native(page);
  if(page==='preferences')return preferences();if(['support','more'].includes(page)){const node=document.createElement('section');node.dataset.mtScreen=page;node.id='mtUtility';s.startUtility(page,node);return node;}
  const node=document.createElement('section');node.dataset.mtScreen=page;
  if(page==='journey'){node.id='timberJourney';node.className='tj-main';}
  else if(page==='private-support'){node.id='supportPlanMain';node.className='mt-support-page';}
  else if(page==='shop'){node.innerHTML=s.shopMarkup;node.querySelectorAll('img').forEach(i=>{i.loading='lazy';i.decoding='async';});}
  return node;
 }
 function start(page,node){if(started.has(page))return;started.add(page);if(page==='journey')s.startJourney();else if(page==='private-support')s.startSupport();else if(page==='shop')s.startBasket();}
 async function show(page,push=true,url=null){
  if(!s.ready())return;const version=++serial;current=page;root.dataset.mtContent=new URL(url||location.href,location.origin).pathname.startsWith('/member/life-back/shop')?'shop':page;s.state().page=page;select(page==='legacy'?(new URL(url||location.href,location.origin).pathname.includes('shop')?'shop':/^\/member\/(?:ask-timber|treatment|support)(?:\/|$)/.test(new URL(url||location.href,location.origin).pathname)?'support':new URL(url||location.href,location.origin).pathname==='/member/check-in'?'today':new URL(url||location.href,location.origin).pathname==='/member/dashboard'?'journey':new URL(url||location.href,location.origin).pathname.includes('grub')?'grub':new URL(url||location.href,location.origin).pathname.includes('fit')?'fit':'more'):page);
  if(page==='legacy'||page==='life-back')return legacy(url||location.href,version,push);
  if(!nodes.has(page))nodes.set(page,create(page));const node=nodes.get(page);root.replaceChildren(node);start(page,node);
  if(push){const old=location.href;history.pushState({page},'',url||paths[page]||paths.today);if(new URL(old).hash!==location.hash)dispatchEvent(new HashChangeEvent('hashchange',{oldURL:old,newURL:location.href}));}
  document.dispatchEvent(new CustomEvent('mt:screen-activated',{detail:{page}}));scrollTo(0,0);s.persist();
 }
 async function legacy(url,version,push){
  const requested=new URL(url,location.origin),key='legacy:'+requested.pathname+requested.search+requested.hash;
  if(nodes.has(key)){root.replaceChildren(nodes.get(key));if(push)history.pushState({page:'legacy'},'',requested);dispatchEvent(new HashChangeEvent('hashchange'));return;}
  root.innerHTML='<p role="status">Opening your saved tools…</p>';
  try{const view=await s.legacy(requested);if(version!==serial||!s.ready())return;const node=document.createElement('section');node.dataset.mtScreen='legacy';node.innerHTML=view.html;
   // A fetched document contributes only its content; no second frame or iframe.
   node.querySelectorAll('#mtShopChrome,#mtShopPending,#mtShopLoading,.mt-shop-top,.mt-shop-bottom,.tj-brand,.mt-support-brand,#appBottomNav,#appMore,.site-header,.member-nav,.preview-strip,iframe,script').forEach(n=>n.remove());
   nodes.set(key,node);root.replaceChildren(node);if(push)history.pushState({page:'legacy'},'',requested);await s.startLegacy(view,node);s.persist();
  }catch(e){if(version===serial){root.innerHTML='<p role="status">'+s.esc(e.message)+'</p>';}}
 }
 function privacyReset(){for(const [key,node]of nodes){if(key.startsWith('legacy:')||['life-back','journey'].includes(key)){node.replaceChildren();nodes.delete(key);started.delete(key);}}}
 function refresh(){for(const page of ['today','grub','fit','preferences','league'])nodes.delete(page);if(current&&['today','grub','fit','league'].includes(current))show(current,false);}
 function clear(){++serial;for(const n of nodes.values())n.replaceChildren();nodes.clear();started.clear();root.replaceChildren();current=null;}
 async function navigate(url,push=true){const page=pageFor(url);if(!page)return false;await show(page,push,url);return true;}
 return {show,navigate,pageFor,refresh,privacyReset,clear,current:()=>current};
}
