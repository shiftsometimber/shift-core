import {memberNavigation,addMemberChrome} from './chrome.mjs';
import {withSessionState} from './session-state.mjs';

export const ordersHTML=(work=false)=>withSessionState(addMemberChrome(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>My Orders · My Timber</title><link rel="stylesheet" href="/assets/member-experience/chrome.css"><link rel="stylesheet" href="/assets/member-experience/orders.css"></head><body data-member-page="orders" class="sst-member-experience"><a class="orders-skip" href="#main-content">Skip to orders</a><header class="orders-header"><a href="/member/dashboard#today" aria-label="Shift Some Timber · My Timber">SHIFT SOME TIMBER</a></header><nav class="sst-member-tabs" aria-label="My Timber">${memberNavigation(work)}</nav><main id="main-content"><header class="member-tool-hero" data-member-hero="v1"><p class="eyebrow">MY TIMBER · ORDERS</p><h1>My Orders</h1><p>Your SHIFT shop orders, all in one place.</p></header><section aria-label="Order history"><p id="orders-status" role="status" aria-live="polite">Loading your orders…</p><div id="orders-list"></div><button id="orders-retry" type="button" hidden>Retry loading orders</button></section><p class="orders-help">Need help with an order? <a href="mailto:orders@shiftsometimber.co.uk">Contact the orders team</a>.</p></main><script defer src="/assets/member-experience/orders.mjs"></script></body></html>`,'orders'));

export const ordersStyles=String.raw`
html body[data-member-page="orders"]{margin:0;background:#e7e3da;color:#11140f;font:16px/1.5 Arial,sans-serif}
html body[data-member-page="orders"] .orders-header{background:#050505;padding:20px max(24px,calc((100vw - 1132px)/2))}
html body[data-member-page="orders"] .orders-header a{color:#e7e3da;font-size:20px;font-weight:900;text-decoration:none;letter-spacing:.06em}
html body[data-member-page="orders"] .orders-skip{position:absolute;left:-10000px}
html body[data-member-page="orders"] .orders-skip:focus{left:16px;top:8px;z-index:50;background:white;padding:8px}
html body[data-member-page="orders"] .member-tool-hero{background:#11140f;color:#e7e3da;border-radius:16px;padding:30px;margin-bottom:28px}
html body[data-member-page="orders"] .member-tool-hero h1{font-size:clamp(32px,5vw,48px);margin:.25em 0}
html body[data-member-page="orders"] .member-tool-hero p{margin:0}
html body[data-member-page="orders"] .eyebrow{font-size:12px;font-weight:800;letter-spacing:.14em}
html body[data-member-page="orders"] .orders-card{background:#fff;border:1px solid #a5aa98;border-radius:12px;padding:22px;margin:16px 0}
html body[data-member-page="orders"] .orders-card h2{font-size:22px;margin:0 0 8px}
html body[data-member-page="orders"] .orders-card p{margin:6px 0}
html body[data-member-page="orders"] .orders-card ul{padding-left:22px}
html body[data-member-page="orders"] .orders-help{margin-top:28px}
html body[data-member-page="orders"] a{color:#173b2c}
html body[data-member-page="orders"] #orders-retry{padding:12px 18px;border:0;border-radius:8px;background:#17261d;color:#fff;cursor:pointer}
`;

export const ordersRuntime=String.raw`(()=>{
 'use strict';const list=document.getElementById('orders-list'),status=document.getElementById('orders-status'),retry=document.getElementById('orders-retry');if(!list||!status||!retry)return;
 const node=(tag,value)=>{const el=document.createElement(tag);el.textContent=String(value??'');return el};
 const money=(pence,currency)=>{try{return new Intl.NumberFormat('en-GB',{style:'currency',currency:currency||'GBP'}).format(Number(pence)/100)}catch{return 'Amount unavailable'}};
 function render(orders){list.replaceChildren();if(!orders.length){status.textContent='You have no SHIFT shop orders yet.';return}status.textContent=orders.length===1?'1 order found.':orders.length+' orders found.';
  for(const order of orders){const card=document.createElement('article');card.className='orders-card';card.append(node('h2','Order '+(order.order_number||'—')));
   const date=order.created_at?new Date(order.created_at):null;if(date&&!Number.isNaN(date.getTime()))card.append(node('p','Placed '+new Intl.DateTimeFormat('en-GB',{dateStyle:'medium'}).format(date)));
   card.append(node('p','Status: '+String(order.status||'Pending').replaceAll('_',' ')));
   if(Array.isArray(order.items)&&order.items.length){const ul=document.createElement('ul');for(const item of order.items){const description=[item.product_name||order.product_name,item.colour,item.size&&'Size '+item.size,'Qty '+(item.quantity||1)].filter(Boolean).join(' · ');ul.append(node('li',description))}card.append(ul)}else card.append(node('p',[order.product_name,order.size&&'Size '+order.size,'Qty '+(order.quantity||1)].filter(Boolean).join(' · ')));
   if(Number.isFinite(Number(order.total_pence)))card.append(node('p','Total: '+money(order.total_pence,order.currency)));
   if(order.tracking_reference)card.append(node('p','Tracking reference: '+order.tracking_reference));
   if(order.tracking_url){try{const url=new URL(order.tracking_url);if(url.protocol==='https:'){const a=node('a','Track delivery');a.href=url.href;a.rel='noopener noreferrer';a.target='_blank';card.append(a)}}catch{}}
   list.append(card)}
 }
 let busy=false;async function load(){if(busy)return;busy=true;retry.hidden=true;status.textContent='Loading your orders…';list.replaceChildren();const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{const response=await fetch('/v1/commerce/orders',{credentials:'include',cache:'no-store',signal:controller.signal});if(response.status===401){status.textContent='Sign in to see your orders.';const a=node('a','Sign in');a.href='/member-login?returnTo=%2Fmember%2Forders';list.append(a);return}if(!response.ok)throw Error('unavailable');const data=await response.json();if(data?.ok!==true||!Array.isArray(data.orders))throw Error('invalid');render(data.orders)}catch{status.textContent='We could not load your orders. Please try again.';retry.hidden=false}finally{clearTimeout(timer);busy=false}}
 retry.addEventListener('click',load);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();`;
