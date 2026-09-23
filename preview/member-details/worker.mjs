import {previewEmailRoute} from '../../account-completion/preview-mail.mjs';
import {singleDispatchHtmlAsset} from '../../activation-measurement/single-dispatch.mjs';
import {withStartupStability} from '../../public-startup-stability.mjs';
// Private fictional preview entry only; never imported by production.
import staging from '../stabilisation/worker.mjs';
import core from '../../worker-entry-v6.js';
import {pwaAssets,withPwa} from '../../my-timber-pwa/presentation.mjs';
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'same-origin','X-Content-Type-Options':'nosniff'};
const page=(html,status=200)=>new Response(html,{status,headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; form-action 'self'; base-uri 'none'; object-src 'none'"}});
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function intro(env,problem=''){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Timber — Member details preview</title><style>body{max-width:780px;margin:48px auto;padding:0 24px;background:#050505;color:#e7e3da;font:17px/1.6 Arial}h1{font-size:40px;line-height:1.1;letter-spacing:-.03em}a{color:inherit}button{min-height:48px;background:#e7e3da;color:#050505;border:0;padding:14px 22px;border-radius:9px;font:700 17px Arial;cursor:pointer}.note{border:1px solid #707762;border-radius:12px;padding:18px;margin:24px 0}small{display:block;word-break:break-all;margin:18px 0}</style></head><body><p>SHIFT SOME TIMBER · PREVIEW ONLY</p><h1>Your details. Easy to find.<br>Easy to change.</h1><p>Try Member details inside the existing My Timber account. The live website and real member records are unchanged.</p>${problem?'<p role="alert">'+escape(problem)+'</p>':''}<form method="post" action="/__preview/start"><button type="submit">Start a fictional member preview</button></form><div class="note"><strong>Use fictional details only.</strong><p>Change the home address or phone number, save, then refresh. Your saved details should remain. Orders, meals, check-ins and privacy choices are separate.</p><p><strong>Postcode lookup is not connected:</strong> enter the full address manually. GP suggestions use the NHS directory for England and Wales, with manual fallback.</p></div><p><a href="/staging/register">Create a fictional account with a test-only password</a><br><a href="/staging/sign-in">Return to your fictional test account</a><br><a href="/member/settings#memberDetailsPanel">Open Member details</a><br><a href="/__review/email-inbox">Open your fictional confirmation inbox (no real email sent)</a><br><a href="/__review/gp-form">Try GP suggestions in the existing assessment form (submission disabled)</a></p><small>Preview source: ${escape(env.PREVIEW_SOURCE_SHA)}<br>Expires: ${escape(env.STAGING_EXPIRES_AT)}</small><p>This is not a live-account sign-in. Do not enter your real password or address.</p></body></html>`;}
export default {async fetch(request,env,ctx){
 const u=new URL(request.url),path=u.pathname;
 if(u.hostname!=='shift-stabilisation-preview.matobrien.workers.dev'||env.SHIFT_ENVIRONMENT!=='stabilisation-preview-20260917'||!env.STAGING_EXPIRES_AT||Date.now()>=Date.parse(env.STAGING_EXPIRES_AT))return new Response('Preview unavailable',{status:404,headers});
 const emailPreview=await previewEmailRoute(request,env,ctx,core);if(emailPreview)return emailPreview;
 if(path==='/__review'&&request.method==='GET')return page(intro(env));
 if(path==='/__preview/start'&&request.method==='POST'){
  if(request.headers.get('Origin')!==u.origin)return page(intro(env,'Use the preview button on this page.'),403);
  const email='review-'+crypto.randomUUID()+'@example.invalid',password=crypto.randomUUID()+'x!';
  const r=await staging.fetch(new Request(new URL('/v1/auth/register',u),{method:'POST',headers:{Origin:u.origin,'Content-Type':'application/json'},body:JSON.stringify({email,password,firstName:'Fictional reviewer'})}),env,ctx);
  if(!r.ok)return page(intro(env,'The fictional account could not be created. Use the test-account sign-in or try again.'),503);
  const h=new Headers(headers);h.set('Location','/member/settings#memberDetailsPanel');for(const cookie of r.headers.getSetCookie())h.append('Set-Cookie',cookie);return new Response(null,{status:303,headers:h});
 }
 if(path.startsWith('/v1/member/details')||path==='/assets/member-experience/gp-form.mjs')return core.fetch(request,env,ctx);
 if(path==='/__review/gp-form'&&request.method==='GET'){const r=await env.STAGING_ASSETS.fetch(new Request(new URL('/review-gp-assessment.html',u)));return page(await r.text(),r.status);}
 if(path==='/__preview/clinical-disabled')return new Response('Clinical submission is disabled in this preview.',{status:403,headers});
 const asset=pwaAssets(request);if(asset)return asset;
 return withStartupStability(request,await singleDispatchHtmlAsset(request,await withPwa(request,await staging.fetch(request,env,ctx))));
}};
