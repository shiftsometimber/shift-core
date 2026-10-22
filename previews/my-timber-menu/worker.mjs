import menu from '../about-presentation/menu-client.mjs';
export const version='20261022-mytimber-menu-live-v1';
export const assetPath='/assets/my-timber-welcome-20261021.js';
export const suffix='\n;/* '+version+' */\n'+menu+'\n';
export default{async fetch(request,env){
 const url=new URL(request.url),preview=url.hostname.endsWith('.workers.dev');
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only asset',{status:405});
 if(url.pathname===assetPath){
  const upstream=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+assetPath+url.search));
  if(!upstream.ok)return upstream;
  const source=await upstream.text();if(source.includes(version))return new Response('Duplicate menu source',{status:502});
  const headers=new Headers(upstream.headers);for(const name of['Set-Cookie','Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(name);
  headers.set('Content-Type','application/javascript; charset=utf-8');headers.set('Cache-Control','no-store');headers.set('X-Shift-MyTimber-Menu',version);
  if(preview)headers.set('X-Robots-Tag','noindex, nofollow');
  return new Response(request.method==='HEAD'?null:source+suffix,{status:200,headers});
 }
 if(!preview)return new Response('Outside the public asset boundary',{status:404});
 if(url.pathname.startsWith('/v1/'))return new Response('{"ok":false,"error":"preview_signed_out"}',{status:401,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(/sw\.js$|register-sw/.test(url.pathname))return new Response('No preview service worker',{status:403});
 if(url.pathname==='/member/dashboard'){
  // No request cookies, credentials or member data are forwarded in preview.
  const upstream=await env.CORE.fetch(new Request('https://shiftsometimber.co.uk/member/dashboard'));
  const html=await upstream.text(),headers=new Headers(upstream.headers);for(const name of['Set-Cookie','Content-Length','Content-Encoding','ETag'])headers.delete(name);
  headers.set('Cache-Control','private,no-store');headers.set('X-Robots-Tag','noindex, nofollow');
  return new Response(request.method==='HEAD'?null:html,{status:upstream.status,headers});
 }
 if(/\.(?:css|js|mjs|woff2?|webp|png|jpe?g|svg|ico)$/.test(url.pathname)&&!url.pathname.includes('..'))return env.CORE.fetch(new Request('https://shiftsometimber.co.uk'+url.pathname+url.search));
 return Response.redirect('https://shiftsometimber.co.uk'+url.pathname+url.search,302);
}};
