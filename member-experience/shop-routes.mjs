import {withSessionState} from './session-state.mjs';
import {shopBase,shopStyleAsset,shopNavAsset,shopMemberPath} from './shop-navigation.mjs';

const publicOrigin='https://shiftsometimber.co.uk';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const free='<p class="mt-shop-free">Your food, movement and support stay free.<br>Everything here is optional.</p>';
const hero=(title,subtitle)=>'<div class="mt-shop-hero"><h1>'+title+'</h1><p>'+subtitle+'</p></div>';
const category=(route,title,description,cta,image,contain=false)=>'<a class="mt-shop-category" href="'+shopBase+'/'+route+'"><span class="mt-shop-visual'+(contain?' contain':'')+'"><img src="'+image+'" alt="" width="300" height="180"></span><span class="mt-shop-copy"><strong>'+title+'</strong><small>'+description+'</small><span class="mt-shop-cta">'+cta+'</span></span></a>';
export const shopHome='<main id="mtShopMain">'+hero('Useful things.<br>Properly explained.','A bit more help, on your terms.')+'<div class="mt-shop-heading"><p>SHOP &amp; SERVICES</p><a href="/member/orders">Your orders</a></div><div class="mt-shop-grid">'+
 category('testing','Testing &amp; wellbeing','Home tests, lab tests and what each can tell you.','Explore tests','/shift-health/assets/testing-brandless-cutout-vitamin-d.webp',true)+
 category('nutrition','Supplements &amp; nutrition','Understand the optional extras before choosing.','Explore the range','/shift-health/assets/nutrition-kitchen.webp')+
 category('care','Weight-management care','Understand your options and the assessment.','Explore care','/shift-health/assets/weight-management-plan.webp')+
 category('kit','Everyday kit','Clothing and useful accessories from the Timber Mill.','Explore the Mill','/assets/products/heavyweight-tee/ash-green.webp?v=timber4',true)+
 '</div>'+free+'</main>';
const care='<main id="mtShopMain"><a href="'+shopBase+'">← Back to Shop</a>'+hero('Understand your options.','Weight-management care.')+'<img src="/shift-health/assets/weight-management-plan.webp" alt="A man planning his day at home" style="display:block;width:100%;border-radius:12px"><h2>A clear starting point.</h2><p>Explore the service and assessment process before deciding your next step.</p><p><a href="/start-here">Check eligibility and explore your options →</a></p><p>Treatment questions and prescribing decisions belong with the prescriber. Browsing does not arrange treatment.</p>'+free+'</main>';

function shell(title,main,head='',scripts='',bodyAttributes=''){
 return withSessionState('<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#050505"><meta name="robots" content="noindex,nofollow"><title>'+escape(title)+' · My Timber</title>'+head+'<link data-mt-shop-assets rel="stylesheet" href="'+shopStyleAsset+'"></head><body '+bodyAttributes+' data-mt-shop-document><a class="mt-shop-return" href="'+shopBase+'">← Back to Shop</a>'+main+scripts+'<script defer src="'+shopNavAsset+'"></script></body></html>');
}
function htmlResponse(html,status=200,head=false){return new Response(head?null:html,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, private','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-My-Timber-Shop':'connected-source-v1'}});}

// The public catalogue remains the single source for approved descriptions,
// product identities, stock, prices and purchase controls. No member credentials
// or arbitrary target/return URL is sent to that public read.
export function publicShopURL(input){
 const url=new URL(input),suffix=url.pathname.slice(shopBase.length);
 let path;if(suffix==='/testing'||/^\/testing\/[a-z0-9-]{1,70}$/.test(suffix))path='/shift-health'+suffix;
 else if(suffix==='/nutrition')path='/shift-health/supplements-nutrition';
 else if(suffix==='/kit')path='/shop';else return null;
 const allowed=suffix.startsWith('/testing')?new Set(['q','category']):suffix==='/kit'?new Set(['item','colour','category','range']):new Set(['product','q','category','brand','format','sort','supplements_session']);
 const target=new URL(path,publicOrigin),seen=new Set();
 for(const [key,value]of url.searchParams){if(!allowed.has(key)||seen.has(key)||value.length>180||/[\u0000-\u001f\u007f]/.test(value))return null;seen.add(key);target.searchParams.set(key,value);}
 return target;
}

export function projectShopDocument(source,target){
 const main=source.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0];
 if(!main||!/^<main\b[^>]*\bid=["']main-content["']/i.test(main))throw Error('Public catalogue main contract changed');
 const scripts=[];
 for(const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  const src=match[1].match(/\bsrc=["']([^"']+)["']/i)?.[1];
  if(src&&/^\/(?:site-config-v3a\.js|app\.js|assets\/v42\.js|consent-v4a\.js|shop\/client\.js)(?:\?|$)/.test(src))scripts.push(match[0]);
  else if(!src&&/\bdata-testing-storefront\b/.test(match[1]))scripts.push(match[0]);
 }
 const styles=[...source.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].map(m=>m[0]).join('');
 const css=[...source.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]).filter(tag=>/\brel=["']stylesheet["']/i.test(tag)&&!/(?:public-feedback|header-navigation)/.test(tag)).join('');
 const body=source.match(/<body\b([^>]*)>/i)?.[1]||'';
 // Preserve only classes/templates used by the serving product stylesheet.
 const attrs=[...body.matchAll(/\b(class|data-template)=["']([^"']*)["']/gi)].map(m=>m[1]+'="'+escape(m[2])+'"').join(' ');
 let content=main.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
 content=content.replace(/\b(href|action)=(["'])([^"']*)\2/gi,(whole,attr,quote,value)=>{
  if(value.startsWith('#'))return whole;
  const decoded=value.replace(/&amp;/g,'&');let absolute;try{absolute=new URL(decoded,target);}catch{return whole;}
  const mapped=shopMemberPath(absolute.href,publicOrigin);return mapped?attr+'='+quote+escape(mapped)+quote:whole;
 });
 return shell(target.pathname==='/shop'?'Everyday kit':target.pathname.includes('supplements')?'Supplements & nutrition':'Testing & wellbeing',content,css+styles,scripts.join(''),attrs);
}

export async function shopPageRoutes(request,env,fetchPublic=globalThis.fetch){
 const url=new URL(request.url);
 if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||!(url.pathname===shopBase||url.pathname.startsWith(shopBase+'/')))return null;
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD','Cache-Control':'no-store'}});
 const head=request.method==='HEAD';
 if(url.pathname===shopBase)return htmlResponse(shell('Shop',shopHome),200,head);
 if(url.pathname===shopBase+'/care')return htmlResponse(shell('Weight-management care',care),200,head);
 const target=publicShopURL(url);
 if(!target)return htmlResponse(shell('Shop','<main id="mtShopMain"><h1>That page is unavailable.</h1><p><a href="'+shopBase+'">Back to Shop</a></p></main>'),404,head);
 try{
  const response=await fetchPublic(new Request(target,{headers:{Accept:'text/html'},redirect:'manual',signal:AbortSignal.timeout(12000)}));
  if(!response.ok||!response.headers.get('Content-Type')?.includes('text/html'))throw Error('Catalogue response '+response.status+' '+(response.headers.get('Content-Type')||'missing type'));
  const source=await response.text();if(source.length>2000000)throw Error('Catalogue too large');
  return htmlResponse(projectShopDocument(source,target),200,head);
 }catch(error){const response=htmlResponse(shell('Shop','<main id="mtShopMain"><h1>The range could not load.</h1><p>Your basket has not changed.</p><p><a href="'+escape(url.pathname+url.search)+'">Try again</a> · <a href="'+shopBase+'">Back to Shop</a></p></main>'),503,head);response.headers.set('X-My-Timber-Catalogue-Read',encodeURIComponent(String(error?.message||error?.name||'unavailable').slice(0,160)));return response;}
}
