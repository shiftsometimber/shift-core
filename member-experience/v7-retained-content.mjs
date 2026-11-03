import {retainedLifeBack} from './v7-retained-life-back.mjs';
// Retained tools run their original controllers against a content-only document.
// No controller gets a reference to the persistent header or navigation bars.
export function retainedContent(s){
 const views=new Map();let sequence=0;
 const skip=/\b(?:analytics|public-feedback|performance-|member-shell|session\.mjs|my-timber-layout|programme-shop-navigation|chrome\.mjs|register-sw|site-config|app\.js|header|footer|v1\.mjs|programme-client|programme-support-plan|programme-shed|programme-first-six-weeks)\b/;
 function css(source,scope,base=location.href){
  source=source.replace(/url\(\s*(["']?)([^)"']+)\1\s*\)/g,(all,q,path)=>{try{return 'url("'+new URL(path,base).href+'")'}catch{return all}});
  const sheet=new CSSStyleSheet();sheet.replaceSync(source);
  const selectors=text=>text.split(/,(?![^()]*\))/).map(part=>{
   part=part.trim();if(!part)return '';
   if(/^(?:html|:root|body)(?=[\s.#[:>+~]|$)/.test(part))return part.replace(/^(?:html\s+)?body|^html|^:root/,scope);
   return scope+' '+part;
  }).join(',');
  function rules(list){return [...list].map(rule=>{
   if(rule.type===CSSRule.STYLE_RULE)return selectors(rule.selectorText)+'{'+rule.style.cssText+'}';
   if(rule.cssRules&&rule.type!==CSSRule.KEYFRAMES_RULE){const head=rule.cssText.slice(0,rule.cssText.indexOf('{'));return head+'{'+rules(rule.cssRules)+'}';}
   if(rule.type===CSSRule.IMPORT_RULE)return '';
   return rule.cssText;
  }).join('\n');}
  return rules(sheet.cssRules);
 }
 async function load(view,node){
  node.dataset.retainedState='loading';
  const key='retained-'+(++sequence),scope='[data-mt-legacy="'+key+'"]',generation=s.generation(),owner=s.owner();
  node.dataset.mtLegacy=key;for(const [name,value]of Object.entries(view.dataset||{}))if(!['memberSession','mtNativeShell','mtShopNavigation'].includes(name))node.dataset[name]=value;
  node.dataset.memberSession='ready';node.className=view.classes||'';
  const active=()=>s.ready()&&generation===s.generation()&&owner===s.owner();
  const byId=id=>node.id===id?node:node.querySelector('#'+CSS.escape(id));
  const style=(source,base)=>{const n=document.createElement('style');n.textContent=css(source,scope,base);node.append(n);return n;};
  const localURL=value=>{const u=new URL(value,location.href);if(u.hostname==='api.shiftsometimber.co.uk'&&u.pathname.startsWith('/v1/'))return location.hostname==='shift-programme-my-timber-v7-test.matobrien.workers.dev'?new URL(u.pathname+u.search,location.origin):u;if(u.origin!==location.origin)throw Error('This retained tool requested an unrecognised service.');return u;};
  async function ownedFetch(input,options={}){
   if(!active())throw Error('Your account changed. Reopen My Timber.');
   const original=input instanceof Request?input:null,u=localURL(original?.url||input),headers=new Headers(options.headers||original?.headers);
   if(u.origin===location.origin&&u.pathname.startsWith('/v1/'))headers.set('X-My-Timber-Expected-Account',owner);
   if(u.pathname==='/v1/me'&&(!options.method||options.method==='GET'))return new Response(JSON.stringify(await window.MT_MEMBER_IDENTITY()),{headers:{'Content-Type':'application/json'}});
   const r=await fetch(original?new Request(u,original):u,{...options,headers,credentials:u.origin===location.origin?'same-origin':'include',cache:'no-store'});
   if(!active())throw Error('Your account changed. Reopen My Timber.');if(r.status===401){s.clear();throw Error('Sign in again.');}const method=String(options.method||original?.method||'GET').toUpperCase();if(r.ok&&method!=='GET'&&method!=='HEAD'){let body={};try{body=JSON.parse(options.body||'{}')}catch{}if(/\/v1\/(?:auth\/)?logout$|\/v1\/privacy\/(?:account|health-tracking)$/.test(u.pathname)||/\/v1\/consents$/.test(u.pathname)&&(body.granted===false||body.granted===0)){s.clear();return r;}}if(!s.weightVisible()&&r.ok&&/application\/json/.test(r.headers.get('Content-Type')||'')&&/^\/v1\/(?:life-back|progress|shift\/progress|member-state|device-health|my-journey)/.test(u.pathname)){return new Response(JSON.stringify(s.weightData(await r.json())),{status:r.status,headers:r.headers});}return r;
  }
  const append=element=>{
   if(element.tagName==='SCRIPT'){
    if(element.src){const promise=script({src:element.src,type:element.type});promise.then(()=>element.dispatchEvent(new Event('load')),()=>element.dispatchEvent(new Event('error')));}return element;
   }
   if(element.tagName==='STYLE')return style(element.textContent);
   if(element.tagName==='LINK'&&element.rel==='stylesheet'){ownedFetch(element.href).then(r=>r.ok?r.text():Promise.reject(Error('Style unavailable'))).then(style).catch(()=>{});return element;}
   node.append(element);return element;
  };
  const head=new Proxy(node,{get(target,name){if(name==='appendChild')return append;if(name==='append')return (...elements)=>elements.forEach(append);const v=Reflect.get(target,name,target);return typeof v==='function'?v.bind(target):v;}});
  const doc=new Proxy(document,{get(target,name){
   if(name==='body'||name==='documentElement')return node;if(name==='head')return head;
   if(name==='getElementById')return byId;if(name==='querySelector')return q=>node.matches(q)?node:node.querySelector(q);
   if(name==='querySelectorAll')return q=>node.querySelectorAll(q);if(name==='hidden')return document.hidden||!node.isConnected;if(name==='visibilityState')return document.hidden||!node.isConnected?'hidden':'visible';
   if(name==='addEventListener')return (type,listener,options)=>(/^(?:sst:|shift:|mt:|visibilitychange)/.test(type)?document:node).addEventListener(type,listener,options);
   if(name==='removeEventListener')return (type,listener,options)=>(/^(?:sst:|shift:|mt:|visibilitychange)/.test(type)?document:node).removeEventListener(type,listener,options);
   const value=Reflect.get(target,name,target);return typeof value==='function'?value.bind(target):value;
  }});
  const win=new Proxy(window,{get(target,name){if(name==='document')return doc;if(name==='fetch')return ownedFetch;const value=Reflect.get(target,name,target);return typeof value==='function'&&!/^[A-Z]/.test(String(name))?value.bind(target):value;},set(target,name,value){return Reflect.set(target,name,value,target);}});
  const context={document:doc,window:win,fetch:ownedFetch,location};views.set(key,context);
  window.MT_RETAINED_CONTEXT=id=>views.get(id);
  async function script(item){
   const url=localURL(item.src),path=url.pathname;if(skip.test(path)||path.includes('my-timber-onboarding-')||path.includes('member-login-security')||path==='/turnstile-auth-v1.js'&&location.hostname==='shift-programme-my-timber-v7-test.matobrien.workers.dev'||path==='/assets/v42.js'&&!location.pathname.includes('/shop/'))return;
   if(path==='/api-adapter-v33d.js'&&window.SST_API)return;
   await new Promise((resolve,reject)=>{const n=document.createElement('script');n.src='/assets/member-experience/v7-retained-script.mjs?source='+encodeURIComponent(url.pathname+url.search)+'&context='+key;n.onload=resolve;n.onerror=()=>reject(Error('This retained control could not load.'));document.head.append(n);});
  }
  window.SST_API_BASE=location.hostname==='shift-programme-my-timber-v7-test.matobrien.workers.dev'?location.origin:'https://api.shiftsometimber.co.uk';
  // Same source API adapter; its identity read reuses the verified shell result.
  await script({src:'/api-adapter-v33d.js'});
  if(window.SST_API)window.SST_API.getMe=()=>window.MT_MEMBER_IDENTITY();
  for(const source of view.styles||[]){try{const r=await ownedFetch(source);if(r.ok)style(await r.text(),source);}catch{}}
  for(const text of view.inlineStyles||[])style(text);
  for(const config of view.configs||[]){const script=document.createElement('script');for(const [name,value]of Object.entries(config.attributes))script.setAttribute(name,value);script.type='application/json';script.textContent=config.text;node.append(script);}
  for(const element of node.querySelectorAll('#previewMember')){element.hidden=false;element.classList.add('is-ready');}
  for(const element of node.querySelectorAll('#previewAuth,#memberSessionStatus,#todayBrand,.sst-member-tabs,#appBottomNav,#appMore,.mt-shop-top,.mt-shop-bottom,.tj-brand,.mt-support-brand'))element.remove();
  for(const item of view.scripts||[])await script(typeof item==='string'?{src:item}:item);
  if(view.tools){
   node.dataset.memberTools='v1';
   const name=location.hash.slice(1)||'journey';node.querySelectorAll('.mp-panel').forEach(p=>{p.classList.toggle('active',p.id==='panel-'+name);p.hidden=p.id!=='panel-'+name;});
   for(const src of ['/member-product-v33d.js','/member-progress-picture-premium-v1.js','/member-progress-v1.js','/member-plans-premium-v1.js','/whole-man-intent-os-v1.js'])await script({src});
  }
  if(view.inlineController)await script({src:'/assets/member-experience/v7-retained-inline.mjs?document='+encodeURIComponent(view.document)});
  if(!s.weightVisible()){const hideWeights=()=>{for(const id of ['photoWeightUnit','photoWeightStoneWrap','photoWeightKgWrap','photoWeightLbWrap']){const field=byId(id);if(field)field.closest('label')?.setAttribute('hidden','');}for(const selector of ['[data-weight-export]','[data-import-status]','#weightValue']){for(const field of node.querySelectorAll(selector)){const block=field.closest('details')||field.closest('article')||field.parentElement;if(block)block.hidden=true;}}};hideWeights();new MutationObserver(hideWeights).observe(node,{childList:true,subtree:true});}
  node.dataset.retainedState='ready';node.dispatchEvent(new CustomEvent('mt:retained-ready',{bubbles:true}));
 }
 function clear(){views.clear();delete window.SST_API;}
 return {load,clear};
}

const allowed=/^\/(?:[a-z0-9-]+\.js|shop\/client\.js|assets\/[a-z0-9_/-]+\.(?:mjs|js))(?:\?[^\r\n<>]*)?$/;
export async function retainedScript(request,env,original,ctx){
 const u=new URL(request.url);if(!['/assets/member-experience/v7-retained-script.mjs','/assets/member-experience/v7-retained-inline.mjs'].includes(u.pathname)||request.method!=='GET')return null;
 const context=u.searchParams.get('context');if(!/^retained-\d+$/.test(context||''))return new Response('Unavailable',{status:404});
 let source;
 if(u.pathname.endsWith('/v7-retained-inline.mjs')){
  const document=u.searchParams.get('document');if(!['/member/dashboard?tools=journey&view-data=1','/member/fit?tools=all&view-data=1'].includes(document))return new Response('Unavailable',{status:404});
  const r=await original.fetch(new Request(new URL(document,u),{headers:request.headers}),env,ctx);if(!r.ok)return r;
  const html=await r.text(),scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  source=scripts.filter(m=>! /\bsrc\s*=/.test(m[1])&&(m[2].startsWith('// Shift Some Timber — G2-011')||m[2].startsWith('(function () {\n  "use strict";\n  const $ = (selector)'))).map(m=>m[2]).join('\n');
 }else{
  const path=u.searchParams.get('source');if(!allowed.test(path||''))return new Response('Unavailable',{status:404});
  if(path.startsWith('/assets/member-experience/v7-retained-inline.mjs?')){
   const inline=new URL(path,u);inline.searchParams.set('context',context);return retainedScript(new Request(inline,{headers:request.headers}),env,original,ctx);
  }
  let r=await original.fetch(new Request(new URL(path,u),{headers:request.headers}),env,ctx);if(!r.ok&&!path.startsWith('/assets/member-experience/v7-'))r=await fetch('https://shiftsometimber.co.uk'+path,{headers:{Accept:'text/javascript'},redirect:'manual',signal:AbortSignal.timeout(12000)});if(!r.ok&&path.split('?')[0]!=='/assets/member-experience/life-back/client.mjs')return r;
  if(path.split('?')[0]!=='/assets/member-experience/life-back/client.mjs'&&!/javascript|ecmascript/.test(r.headers.get('Content-Type')||''))return new Response('Control unavailable',{status:502});source=path.split('?')[0]==='/assets/member-experience/life-back/client.mjs'?retainedLifeBack:await r.text();
 }
 if(source.length>1500000||/^\s*(?:import\s|export\s)/m.test(source))return new Response('Unsupported retained control',{status:502});
 return new Response('(()=>{const c=window.MT_RETAINED_CONTEXT('+JSON.stringify(context)+');if(!c)return;(function(document,window,fetch,location){\n'+source+'\n}).call(c.window,c.document,c.window,c.fetch,c.location);})();',{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
}
