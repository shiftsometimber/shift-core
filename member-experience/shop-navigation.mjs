// Shared My Timber chrome. Products, stock, account and payments stay with their
// existing owners; this module adds no clinical or commercial entitlement.
import {shopNavigationRuntime} from './shop-navigation-client.mjs';

export const shopBase='/member/life-back/shop';
export const shopNavAsset='/assets/member-experience/programme-shop-navigation.mjs';
export const shopStyleAsset='/assets/member-experience/programme-shop.css';
export const memberBasketAsset='/assets/member-experience/programme-shop-basket.js';

export function shopMemberPath(input,origin='https://shiftsometimber.co.uk'){
  let u;try{u=new URL(input,origin);}catch{return null;}
  if(u.origin!==new URL(origin).origin)return null;
  let suffix;
  if(u.pathname==='/shift-health/testing')suffix='/testing';
  else if(/^\/shift-health\/testing\/[a-z0-9-]{1,70}$/.test(u.pathname))suffix='/testing/'+u.pathname.split('/').pop();
  else if(u.pathname==='/shift-health/supplements-nutrition')suffix='/nutrition';
  else if(u.pathname==='/shop'||u.pathname==='/shop.html')suffix='/kit';
  else return null;
  return '/member/life-back/shop'+suffix+u.search+u.hash;
}

const glyphs={today:'M3 10 12 3l9 7v11h-6v-7H9v7H3Z',journey:'M5 20v-5m7 5V9m7 11V4',shop:'M5 7h14l2 14H3L5 7Zm3 0V5a4 4 0 0 1 8 0v2',grub:'M5 3v7M2 3v5a3 3 0 0 0 6 0V3M5 11v10M19 3c-4 4-4 10 0 10V3Zm0 10v8',fit:'M3 8v8m4-11v14m10-14v14m4-11v8M7 12h10',support:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',more:'M4 12h.01M12 12h.01M20 12h.01'};
export const shopIcon=key=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="'+glyphs[key]+'"/></svg>';
const links=[['today','Today','/member/dashboard#today'],['journey','Journey','/member/life-back/journey'],['shop','Shop',shopBase],['grub','Grub','/member/grub'],['fit','Fit','/member/fit'],['support','Support','/member/dashboard?timber=support#today'],['more','More','/member/dashboard?timber=stuff#today']];
const navigation=(items,cls,label)=>'<nav class="'+cls+'" aria-label="'+label+'">'+items.map(([key,title,url])=>'<a href="'+url+'" data-mt-shop-tab="'+key+'">'+shopIcon(key)+'<span>'+title+'</span></a>').join('')+'</nav>';
export const shopChrome='<div id="mtShopChrome"><header class="mt-shop-top"><div class="mt-shop-brand"><a href="/member/dashboard#today"><img class="mt-shop-mark" src="/assets/favicon-shift-s-20261020.png" width="30" height="30" alt=""><span>MY TIMBER</span></a><button type="button" id="mtShopBasket" aria-label="Open your basket" hidden>'+shopIcon('shop')+'<span id="mtShopBasketCount"></span></button></div>'+navigation(links.slice(0,3),'mt-shop-primary','Main navigation')+'</header>'+navigation(links.slice(3),'mt-shop-bottom','Everyday tools and account')+'</div>';

export const shopStyles=String.raw`
#mtShopChrome{--ms-black:#050505;--ms-cream:#E7E3DA;--ms-green:#707762;font-family:Arial,Helvetica,sans-serif;color:var(--ms-cream);color-scheme:dark}
#mtShopChrome *{box-sizing:border-box;color:var(--ms-cream);-webkit-text-fill-color:var(--ms-cream)}
#mtShopChrome .mt-shop-top{position:fixed;inset:0 0 auto;z-index:1100;background:var(--ms-black);padding-top:env(safe-area-inset-top);border-bottom:1px solid var(--ms-green)}
#mtShopChrome .mt-shop-brand{display:flex;align-items:center;justify-content:space-between;max-width:636px;height:58px;margin:auto;padding:0 16px}
#mtShopChrome .mt-shop-brand>a{font:800 16px/1 Arial,Helvetica,sans-serif;letter-spacing:.12em;text-decoration:none;display:flex;align-items:center;gap:10px;min-height:44px}
#mtShopChrome .mt-shop-mark{display:block!important;visibility:visible!important;opacity:1!important;width:30px!important;height:30px!important;object-fit:contain;flex:none}
#mtShopChrome .mt-shop-brand>button{display:flex;align-items:center;gap:6px;justify-content:center;min-width:44px;min-height:44px;padding:6px;background:var(--ms-black);color:var(--ms-cream);border:1px solid var(--ms-green);border-radius:8px;font:700 12px/1.3 Arial,sans-serif}
#mtShopChrome .mt-shop-primary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:0 12px;max-width:636px;margin:auto;border-top:1px solid var(--ms-green);background:var(--ms-black)}
#mtShopChrome .mt-shop-primary a{min-height:48px;display:flex;align-items:center;justify-content:center;gap:7px;padding:10px 4px;font:700 14px/1.3 Arial,sans-serif;text-decoration:none;border-radius:0}
#mtShopChrome .mt-shop-bottom{position:fixed;inset:auto 0 0;z-index:1100;background:var(--ms-black);border-top:1px solid var(--ms-green);display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;padding:6px max(8px,calc((100vw - 636px)/2)) max(8px,env(safe-area-inset-bottom))}
#mtShopChrome .mt-shop-bottom a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:54px;min-width:0;padding:5px 2px;font:700 11px/1.3 Arial,sans-serif;text-decoration:none;border-radius:0}
#mtShopChrome a[aria-current=page]{box-shadow:inset 0 -3px var(--ms-green)}
#mtShopChrome svg{display:block!important;visibility:visible!important;width:23px!important;height:23px!important;fill:none!important;stroke:currentColor!important;flex:none}
#mtShopChrome .mt-shop-primary svg{width:17px!important;height:17px!important}
#mtShopChrome [hidden]{display:none!important}
#mtShopChrome :is(a,button):focus-visible{outline:2px solid var(--ms-cream);outline-offset:2px}
body[data-mt-shop-navigation] :is(#appBottomNav,#mtSixNav,.tj-bottom,.mt-support-nav,#todayBrand,.tj-brand,.mt-support-brand){display:none!important}
body[data-mt-shop-navigation] #sstBasketFab{display:none!important}
body[data-member-session]:not([data-member-session=ready]) :is(#mtShopChrome,#sstBasketFab,#sstBasketPanel,#sstExtrasReview){display:none!important}
body[data-mt-shop-navigation] #sstBasketCount{background:#707762!important;color:#050505!important;-webkit-text-fill-color:#050505!important}
body[data-mt-shop-navigation] #sstBasketInner .sst-note{color:#050505!important;-webkit-text-fill-color:#050505!important}
#mtShopMain{box-sizing:border-box;max-width:636px;margin:0 auto;padding:16px 14px 24px;background:#050505;color:#E7E3DA;font:14px/1.5 Arial,Helvetica,sans-serif}
#mtShopMain *{box-sizing:border-box}
#mtShopMain .mt-shop-hero{background:#707762;color:#E7E3DA;padding:16px 18px;margin:0 0 18px}
#mtShopMain h1{font:800 28px/1.08 Arial,Helvetica,sans-serif;letter-spacing:-.045em;color:#E7E3DA;-webkit-text-fill-color:#E7E3DA;margin:0}
#mtShopMain .mt-shop-hero p{font:700 19px/1.3 Arial,sans-serif;color:#050505;-webkit-text-fill-color:#050505;margin:8px 0 0}
#mtShopMain .mt-shop-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 13px}
#mtShopMain .mt-shop-heading p{font:800 11px/1.4 Arial,sans-serif;letter-spacing:.13em;color:#E7E3DA;-webkit-text-fill-color:#E7E3DA;margin:0}
#mtShopMain a{color:#E7E3DA;-webkit-text-fill-color:#E7E3DA;text-underline-offset:4px}
#mtShopMain .mt-shop-heading>a{font-size:12px;min-height:44px;display:flex;align-items:center}
#mtShopMain .mt-shop-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}
#mtShopMain .mt-shop-category{display:block;width:100%;height:auto;min-height:0;padding:0;margin:0;text-align:left;line-height:0;background:#050505;color:#E7E3DA;border:1px solid #707762;border-radius:12px;overflow:hidden;min-width:0;text-decoration:none}
#mtShopMain .mt-shop-visual{display:block;width:100%;height:112px;margin:0;padding:0;background:#E7E3DA;overflow:hidden}
#mtShopMain .mt-shop-visual img{display:block;width:100%;height:100%;object-fit:cover}
#mtShopMain .mt-shop-visual.contain img{object-fit:contain;padding:9px}
#mtShopMain .mt-shop-copy{display:block;padding:8px 10px 10px;margin:0;width:100%}
#mtShopMain .mt-shop-copy,#mtShopMain .mt-shop-copy *{color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important;opacity:1!important}
#mtShopMain .mt-shop-copy strong{display:block;margin:0;padding:0;font:800 17px/1.1 Arial,sans-serif;letter-spacing:-.035em}
#mtShopMain .mt-shop-copy small{display:block;margin:5px 0 0;font:400 12px/1.4 Arial,sans-serif}
#mtShopMain .mt-shop-cta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:7px 0 0;font:700 12px/1.3 Arial,sans-serif}
#mtShopMain .mt-shop-free{margin:18px 0 0;border-top:1px solid #707762;padding-top:16px;font:400 12px/1.4 Arial,sans-serif;color:#E7E3DA;-webkit-text-fill-color:#E7E3DA}
body[data-mt-shop-document]{margin:0;background:#050505;color:#E7E3DA}
body[data-mt-shop-document] main{scroll-margin-top:120px}
body[data-mt-shop-document] #main-content{max-width:1100px;margin:0 auto}
body[data-mt-shop-document] #main-content [id]{scroll-margin-top:calc(120px + env(safe-area-inset-top))}
body[data-mt-shop-document] #memberSessionStatus{position:relative;z-index:1}
body[data-mt-shop-document]>.mt-shop-return{display:block;max-width:1072px;margin:0 auto;padding:12px 14px;color:#E7E3DA;-webkit-text-fill-color:#E7E3DA;font:700 13px/1.4 Arial,sans-serif;min-height:44px}
body[data-mt-shop-document]:has(#mtShopMain)>.mt-shop-return{display:none}
body[data-mt-shop-document][data-member-session]:not([data-member-session=ready])>.mt-shop-return{display:none}
@media(max-width:350px){#mtShopMain .mt-shop-grid{gap:9px}#mtShopMain .mt-shop-visual{height:102px}#mtShopMain .mt-shop-copy{padding:8px 9px 10px}#mtShopMain .mt-shop-copy strong{font-size:16px}}
@media print{#mtShopChrome{display:none!important}body[data-mt-shop-navigation]{padding-top:0!important;padding-bottom:0!important}}
`;

export function shopNavigationAsset(request){
  const path=new URL(request.url).pathname;
  const asset=path===shopNavAsset?['text/javascript','const shopMemberPath='+shopMemberPath.toString()+';const shopChrome='+JSON.stringify(shopChrome)+';'+shopNavigationRuntime]:path===shopStyleAsset?['text/css',shopStyles]:null;
  if(!asset||!['GET','HEAD'].includes(request.method))return null;
  return new Response(request.method==='HEAD'?null:asset[1],{headers:{'Content-Type':asset[0]+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

export async function withShopNavigation(request,response,env){
  const path=new URL(request.url).pathname;
  if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||request.method!=='GET'||!/^\/member\/(?:dashboard|grub|fit|orders|saved|plans|settings|check-in|my-shift|my-target|my-why|achievements|timber-circle|ask-timber|treatment|life-back(?:\/.*)?)$/.test(path)||!response?.ok||!response.headers.get('Content-Type')?.includes('text/html'))return response;
  let html=await response.text();
  if(!html.includes('data-mt-shop-assets'))html=html.replace(/<\/body>/i,'<link data-mt-shop-assets rel="stylesheet" href="'+shopStyleAsset+'"><script defer src="'+shopNavAsset+'"></script></body>');
  const headers=new Headers(response.headers);
  for(const name of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(name);
  headers.set('Cache-Control','no-store, private');headers.set('X-My-Timber-Shop','connected-source-v1');
  return new Response(html,{status:response.status,headers});
}
