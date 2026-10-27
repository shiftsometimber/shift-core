import {extrasClient} from './checkout-extras/client.mjs';
// Optional Core site basket: intentionally not injected into My Timber or home.
// Public site pages share the basket. Private My Timber/member/HQ surfaces do not.
export function isPurchaseBasketPage(path){
 const value=(String(path||"").replace(/\.html$/,"").replace(/\/+$/,"")||"/");
 return !/^\/(?:v1|api|assets|member|my-timber|hq|admin|app|shift-me|health-passport)(?:\/|$)/i.test(value);
}
const SCRIPT=String.raw`(()=>{'use strict';
 if(window.__shiftPurchaseBasketInitialised)return;
 window.__shiftPurchaseBasketInitialised=true;
 const KEY='sst-purchase-basket-v1', API='https://api.shiftsometimber.co.uk';
 const EXPIRY=30*86400000, knownRoutes=new Set(['mounjaro','wegovy','wegovy-injection','wegovy-tablet','orlistat','foundayo']);
 let account='',attempts=[],saved=null,notice='';
 const now=()=>Date.now();
 function draft(value){
   if(!value||value.version!==1||value.kind!=='medicine'||!knownRoutes.has(value.slug))return null;
   if(!Number.isSafeInteger(value.variantId)||value.variantId<1)return null;
   if(typeof value.owner!=='string'||!/^[0-9a-f]{64}$/.test(value.owner))return null;
   if(!Number.isFinite(value.savedAt)||value.savedAt>now()+60000||now()-value.savedAt>EXPIRY)return null;
   return {version:1,kind:'medicine',slug:value.slug,variantId:value.variantId,owner:value.owner,savedAt:value.savedAt};
 }
 function read(){
   try{return draft(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{return null}
 }
 function persist(item){
   try{if(item)localStorage.setItem(KEY,JSON.stringify(item));else localStorage.removeItem(KEY)}catch{}
 }
 saved=read();
 const style=document.createElement('style');
 style.textContent='#sstBasketFab{position:fixed;right:18px;top:88px;z-index:980;border:2px solid #E7E3DA;border-radius:50%;width:52px;height:52px;background:#050505;color:#E7E3DA;box-shadow:0 4px 18px #0004;display:flex;align-items:center;justify-content:center;cursor:pointer}#sstBasketFab svg{width:25px;height:25px}#sstBasketFab[hidden]{display:none}#sstBasketCount{position:absolute;right:-5px;top:-7px;min-width:22px;height:22px;padding:0 5px;border-radius:12px;background:#707762;color:#050505;font:700 13px/22px system-ui;text-align:center}#sstBasketPanel{border:1px solid #707762;border-radius:18px;padding:0;width:min(440px,calc(100vw - 28px));max-height:calc(100dvh - 40px);overflow:auto;background:#E7E3DA;color:#050505;box-shadow:0 12px 40px #0006}#sstBasketPanel::backdrop{background:#0009}#sstBasketInner{padding:24px;font:16px/1.5 system-ui,-apple-system,sans-serif}#sstBasketInner h2{font:800 27px/1.1 system-ui;margin:4px 0 18px}#sstBasketInner p{margin:12px 0}#sstBasketInner button,#sstBasketInner a.sst-action{display:block;box-sizing:border-box;width:100%;padding:12px;margin:10px 0;border:0;border-radius:10px;text-align:center;text-decoration:none;background:#050505;color:#E7E3DA;font:700 15px/1.3 system-ui;cursor:pointer}#sstBasketInner button.secondary{background:transparent;color:#050505;border:1px solid #707762}#sstBasketInner .sst-note{font-size:14px;color:#353a32}#sstBasketStatus{min-height:20px}#sstBasketFab:focus-visible,#sstBasketInner button:focus-visible,#sstBasketInner a:focus-visible{outline:3px solid #707762;outline-offset:3px}@media(max-width:620px){#sstBasketFab{top:auto;bottom:18px;right:15px}}';
 document.head.appendChild(style);
 const fab=document.createElement('button');fab.id='sstBasketFab';fab.type='button';fab.hidden=true;
 fab.setAttribute('aria-label','Open saved basket');
 fab.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 3 11h12l3-11H3Z"/><path d="M9 9 12 3l3 6"/><path d="M3 9h18"/></svg><span id="sstBasketCount">1</span>';
 const panel=document.createElement('dialog');panel.id='sstBasketPanel';panel.setAttribute('aria-label','Your saved basket');
 const inner=document.createElement('div');inner.id='sstBasketInner';panel.appendChild(inner);
 document.body.append(fab,panel);
 function addButton(title,callback,secondary=false){
   const button=document.createElement('button');button.type='button';button.textContent=title;
   if(secondary)button.className='secondary';
   button.addEventListener('click',callback);inner.appendChild(button);
   return button;
 }
 function paragraph(value,klass){
   const p=document.createElement('p');p.textContent=value;if(klass)p.className=klass;inner.appendChild(p);return p;
 }
 function shown(){
   const remote=attempts.filter(a=>a&&['medicine','apparel','supplements'].includes(a.channel));
   const local=!!(account&&saved&&saved.owner===account);
   return {remote,local,count:Math.max(local?1:0,remote.length)};
 }
 function render(){
   const state=shown();fab.hidden=!state.count;
   document.getElementById('sstBasketCount').textContent=String(state.count);fab.dataset.baseCount=String(state.count);
   inner.replaceChildren();
   const title=document.createElement('h2');title.textContent='Your saved basket';inner.appendChild(title);
   if(state.remote.length){
     for(const item of state.remote){
       paragraph(item.label|| (item.channel==='medicine'?'Treatment checkout':'Timber Mill checkout'));
       paragraph('An existing payment attempt is saved. We will check it before reopening Stripe.','sst-note');
       if(item.state==='open'){
         addButton('Resume secure payment',()=>resume(item.channel));
       }else{
         paragraph('This payment attempt needs checking. Please contact SHIFT support before retrying.','sst-note');
       }
     }
   }else if(state.local){
     paragraph(saved.slug.replace(/-/g,' ').replace(/\b\w/g,function(x){return x.toUpperCase()})+' — selection saved on this device.');
     addButton('Review selection',()=>{
       const url='/'+saved.slug+'?variant='+encodeURIComponent(String(saved.variantId));
       location.assign(url);
     });
     addButton('Remove selection',()=>{saved=null;persist(null);render()},true);
   }else{
     paragraph('Your basket is empty.');
   }
   if(notice)paragraph(notice,'sst-note');
   addButton('Close',()=>panel.close(),true);
   document.dispatchEvent(new CustomEvent('sst:basket-rendered',{detail:{account,locked:state.remote.length>0}}));
 }
 async function load(){
   try{
     const session=new URLSearchParams(location.search).get('session_id');
     if((location.pathname==='/order-success'||location.pathname==='/order-success.html')&&/^cs_(test|live)_[A-Za-z0-9_]+$/.test(session||'')){
       for(const path of ['/v1/commerce/medicine-order-status','/v1/commerce/order-status']){
         const paidResponse=await fetch(API+path+'?session_id='+encodeURIComponent(session),{credentials:'include',cache:'no-store'}).catch(()=>null);
         if(!paidResponse?.ok)continue;
         const proof=await paidResponse.json().catch(()=>null);
         if(proof?.ok&&(proof.paymentStatus==='paid'||proof.status==='paid')){saved=null;persist(null);if(path.includes('medicine'))document.dispatchEvent(new CustomEvent('sst:basket-paid'));break;}
       }
     }
     const response=await fetch(API+'/v1/commerce/active-checkout',{credentials:'include',cache:'no-store'});
     if(!response.ok){account='';attempts=[];render();return}
     const body=await response.json();
     if(body.ok&&/^[a-f0-9]{64}$/.test(body.accountReference)){
       account=body.accountReference;
       attempts=Array.isArray(body.attempts)?body.attempts:[];
       if(saved&&saved.owner!==account){saved=null;persist(null)}
     }else{account='';attempts=[]}
   }catch{account='';attempts=[];notice='Could not check your basket just now.'}
   render();
 }
 async function resume(channel){
   notice='Checking your saved payment session…';render();
   try{
     const response=await fetch(API+'/v1/commerce/active-checkout?resume=1',{credentials:'include',cache:'no-store'});
     if(!response.ok)throw Error('Please sign in again before returning to checkout.');
     const body=await response.json();
     if(body.accountReference!==account)throw Error('Your account changed. Please sign in again.');
     const match=(body.attempts||[]).find(x=>x.channel===channel);
     if(match&&match.canResume&&typeof match.checkoutUrl==='string'){
       const url=new URL(match.checkoutUrl);
       if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw Error('Checkout link could not be verified.');
       location.assign(url.href);return;
     }
     notice=match?.reason==='checkout_expired'
       ?'This payment link has expired. Your selection has not been charged by this action. Return to treatment options or contact support before retrying.'
       :'We cannot safely reopen this payment yet. Please contact SHIFT support before creating another order.';
   }catch(error){notice=error.message||'Checkout is temporarily unavailable.'}
   render();
 }
 function capture(event){
   const button=event.target.closest?.('button');
   if(!button||button.disabled||button.id!=='continue'||!account)return;
   const slug=(location.pathname.split('/').filter(Boolean).pop()||'').replace(/\.html$/,'');
   if(!knownRoutes.has(slug))return;
   const select=document.getElementById('variant');
   const variantId=Number(select?.value);
   if(!Number.isSafeInteger(variantId)||variantId<1)return;
   saved={version:1,kind:'medicine',slug,variantId,owner:account,savedAt:now()};
   persist(saved);render();
 }
 document.addEventListener('click',capture,true);
 window.addEventListener('storage',(event)=>{if(event.key===KEY){saved=read();render()}});
 fab.addEventListener('click',()=>{render();panel.showModal()});
 panel.addEventListener('click',(event)=>{if(event.target===panel)panel.close()});
 load();
})();`;
export function purchaseBasketAsset(request){
 const path=new URL(request.url).pathname;
 if(request.method!=="GET"||path!=="/assets/shift-purchase-basket-v1.js")return null;
 return new Response(extrasClient+'\n'+SCRIPT,{headers:{"Content-Type":"application/javascript; charset=utf-8","Cache-Control":"public, max-age=300","X-Content-Type-Options":"nosniff"}});
}
export async function withPurchaseBasket(request,response){
 if(request.method!=="GET"||!isPurchaseBasketPage(new URL(request.url).pathname)||
    !response||response.status!==200||!String(response.headers.get("Content-Type")||"").includes("text/html"))return response;
 const original=await response.text();
 if(!/<\/body>/i.test(original)||original.includes("shift-purchase-basket-v1.js"))return new Response(original,{status:response.status,statusText:response.statusText,headers:response.headers});
 const html=original.replace(/<\/body>/i,'<script defer src="/assets/shift-purchase-basket-v1.js"></script></body>');
 const headers=new Headers(response.headers);headers.delete("Content-Length");headers.delete("ETag");
 headers.set("Cache-Control","private, no-cache, must-revalidate");
 return new Response(html,{status:response.status,statusText:response.statusText,headers});
}
