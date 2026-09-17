// Isolated preview host. Never imported by production; no production bindings or routes.
import staging from '../../work/staging/worker.mjs';
import {publicTickerAsset} from '../../public-navigation-policy.mjs';
const privateHeaders={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'same-origin','X-Content-Type-Options':'nosniff'};
const banner='<aside id="preview-only" style="padding:12px 20px;background:#e7e3da;color:#050505;font:14px/1.4 Arial"><strong>PREVIEW ONLY — live site unchanged.</strong> Public pages are read-only. Member tools use fictional accounts and separate databases. <a href="/__review" style="color:#050505">Review menu</a></aside>';
const html=(body)=>new Response(body,{headers:{...privateHeaders,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"}});
const review='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SHIFT preview review</title><style>body{max-width:900px;margin:40px auto;padding:0 20px;background:#050505;color:#e7e3da;font:18px/1.6 Arial}a,button{color:#e7e3da}a{display:inline-block;margin:8px 18px 8px 0}button{background:#707762;color:#050505;padding:14px 20px;border:0;border-radius:8px;font:700 18px Arial;cursor:pointer}section{border-top:1px solid #707762;margin-top:28px;padding-top:20px}h1{line-height:1.15}</style></head><body><p>SHIFT · PREVIEW ONLY</p><h1>Consistent navigation.<br>One useful next Shift.</h1><p>The live site and real member data are untouched. Nothing here is approved for production yet.</p><section><h2>Public website</h2><a href="/">Homepage</a><a href="/shift-health">SHIFT Health</a><a href="/mens-mental-health">Mental health</a><a href="/mental-health/getting-professional-help">Getting professional help</a><a href="/comparison-centre">Comparisons</a><a href="/member-login">Public login shell</a><a href="/life-back">Life Back worked example</a><a href="/sitemap.xml">Preview sitemap proposal</a><p>Check the drawer, footer and related-guide links. Public contact, payments and ordering are disabled here; your live contact form has not been altered.</p></section><section><h2>Try the connected Life Back loop</h2><form method="post" action="/__preview/start"><button>Start a fresh fictional review</button></form><p>This creates a separate, empty test account. Use fictional goals and ratings only. Choose a goal, save a check-in, open My Next Shift on Today, mark an action tried or done, then return to Life Back for the follow-up.</p><a href="/staging/register?next=life-back">Create a test account with your own test-only password</a><a href="/staging/sign-in?next=life-back">Return to a saved fictional account</a><a href="/member/dashboard#today">Open Today</a><a href="/member/life-back">Open Life Back</a></section><section><h2>What stayed out of scope</h2><p>No supporter accounts, no design rebuild, no medicine or dose recommendations, and no changes to live contact handling. Three legacy pages remain unpromoted rather than linking visitors into outdated workplace, pricing or browser-storage claims.</p></section></body></html>';
export default {async fetch(request,env,ctx){
 const u=new URL(request.url),path=u.pathname;
 if(env.SHIFT_ENVIRONMENT!=='stabilisation-preview-20260917'||!/^shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(u.hostname)||!env.STAGING_EXPIRES_AT||Date.now()>=Date.parse(env.STAGING_EXPIRES_AT))return new Response('Preview unavailable',{status:404,headers:privateHeaders});
 const tickerAsset=publicTickerAsset(request);if(tickerAsset)return tickerAsset;
 if(path==='/robots.txt')return new Response('User-agent: *\nDisallow: /\n',{headers:privateHeaders});
 if(path==='/__review'&&request.method==='GET')return html(review);
 if(path==='/__preview/meta'&&request.method==='GET')return Response.json({previewOnly:true,source:env.PREVIEW_SOURCE_SHA,expires:env.STAGING_EXPIRES_AT,productionBindings:false},{headers:privateHeaders});
 if(path==='/__preview/start'&&request.method==='POST'){
  if(request.headers.get('Origin')!==u.origin)return new Response('Same-origin only',{status:403});
  const id=crypto.randomUUID().replaceAll('-',''),body={email:'review-'+id+'@example.invalid',password:crypto.randomUUID()+'!',firstName:'Fictional reviewer'};
  const response=await staging.fetch(new Request(new URL('/v1/auth/register',u),{method:'POST',headers:{'Content-Type':'application/json',Origin:u.origin},body:JSON.stringify(body)}),env,ctx);
  if(!response.ok)return html(review.replace('<h1>','<p>Could not create a fresh review account. Please use the test-account sign-in below.</p><h1>'));
  const headers=new Headers(privateHeaders);headers.set('Location','/member/life-back');for(const cookie of response.headers.getSetCookie())headers.append('Set-Cookie',cookie);
  return new Response(null,{status:303,headers});
 }
 if(path==='/v1/radar/ticker'&&request.method==='GET'){const r=await env.STAGING_ASSETS.fetch(new Request(new URL('/public-ticker.json',u)));return new Response(r.body,{headers:{...privateHeaders,'Content-Type':'application/json'}});}
 if(path==='/medicine-news'&&['GET','HEAD'].includes(request.method))return new Response(null,{status:301,headers:{...privateHeaders,Location:'/shift-newsroom'+u.search}});
 if(path==='/sitemap.xml'&&['GET','HEAD'].includes(request.method)){const r=await env.STAGING_ASSETS.fetch(new Request(new URL('/public-sitemap.xml',u)));return new Response(request.method==='HEAD'?null:r.body,{headers:{...privateHeaders,'Content-Type':'application/xml'}});}
 if(['/v1/contact','/v1/continuity-interest'].includes(path)||/^\/(?:checkout|payment|treatment-order|treatment-assessment|hq|employer)/.test(path))return new Response('This action is disabled in the isolated preview. The live service is unchanged.',{status:403,headers:privateHeaders});
 if(!path.startsWith('/member/')&&!path.startsWith('/v1/')&&!path.startsWith('/staging/')&&!/\.[a-z0-9]+$/i.test(path)&&['GET','HEAD'].includes(request.method)){
  const file='/public-documents/'+(path==='/'?'index':path.slice(1))+'.html';const r=await env.STAGING_ASSETS.fetch(new Request(new URL(file,u)));
  if(r.ok){
   let body=await r.text();
   if(path==='/member-login'){
    body=body.replace(/<script\b[^>]*src=["'][^"']*(?:member-|my-timber-|turnstile-auth-|shift-me-api-)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi,'');
    if(!/<script\b[^>]*\bsrc=["']\/api-adapter-v33d\.js(?:\?[^"']*)?["'][^>]*>/i.test(body)){
     const adapter='<script src="/api-adapter-v33d.js" data-shift-auth-adapter></script>',baseScript=/<script\b[^>]*>\s*window\.SST_API_BASE\s*=\s*location\.origin\s*;?\s*<\/script>/i;
     body=baseScript.test(body)?body.replace(baseScript,match=>match+adapter):body.replace('</head>',()=>adapter+'</head>');
    }
   }
   body=body.replace(/<script\b[^>]*src=["'][^"']*(?:analytics|googletagmanager|google-analytics|cloudflareinsights)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi,'');
   body=body.replace(/(<body\b[^>]*>)/i,'$1'+banner).replace(/(<a\b[^>]*href=["'])https:\/\/shiftsometimber\.co\.uk(?=\/)/gi,'$1');
   return html(request.method==='HEAD'?'':body);
  }
 }
 const response=await staging.fetch(request,env,ctx);
 if(response.status!==404){const h=new Headers(response.headers);for(const[k,v]of Object.entries(privateHeaders))h.set(k,v);return new Response(response.body,{status:response.status,headers:h});}
 if(['GET','HEAD'].includes(request.method)&&!/^\/(?:v1|api|hq|public-documents|public-sitemap|public-ticker|staging)\//.test(path)&&/\.(?:css|js|mjs|png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(path)){
  // Public static resources only; no request cookies, auth or headers are forwarded.
  const r=await fetch('https://shiftsometimber.co.uk'+path+u.search,{method:'GET'});
  return new Response(request.method==='HEAD'?null:r.body,{status:r.status,headers:{...privateHeaders,'Content-Type':r.headers.get('Content-Type')||'application/octet-stream'}});
 }
 return new Response('This route is not part of the isolated preview.',{status:404,headers:privateHeaders});
}};
