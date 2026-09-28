import preview from '../growth-member/worker.mjs';
import {appPresentation} from './presentation.mjs';
import {reviewHTML} from './review.mjs';
const privateHeaders={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, private','X-Robots-Tag':'noindex, nofollow','Vary':'Cookie'};
export default {async fetch(request,env,ctx){
 const u=new URL(request.url);
 if(env.SHIFT_ENVIRONMENT!=='stabilisation-preview-20260917'||!/^shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(u.hostname)||!env.STAGING_EXPIRES_AT||Date.now()>=Date.parse(env.STAGING_EXPIRES_AT))return new Response('Preview unavailable',{status:404});
 if(u.pathname==='/__app-review'&&request.method==='GET')return new Response(reviewHTML,{headers:privateHeaders});
 const response=await preview.fetch(request,env,ctx);
 if(request.method!=='GET'||!response.ok||!(u.pathname.startsWith('/member/')||u.pathname.startsWith('/staging/member-connected/'))||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const choice=u.searchParams.get('view'),app=choice==='app'||choice!=='web'&&/(?:^|;\s*)shift_app_preview=1(?:;|$)/.test(request.headers.get('Cookie')||'');
 const before=await response.text(),after=app?appPresentation(before,u.pathname):before,headers=new Headers(response.headers);
 headers.set('Cache-Control','no-store, private');headers.set('Vary','Cookie');
 if(choice==='app'||choice==='web')headers.append('Set-Cookie','shift_app_preview='+(choice==='app'?'1':'')+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+(choice==='app'?'86400':'0'));
 if(after!==before){headers.delete('Content-Length');headers.delete('ETag');headers.delete('Last-Modified')}
 return new Response(after,{status:response.status,headers});
}};
