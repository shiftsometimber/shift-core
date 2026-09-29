import {consentClient} from '../../acquisition-activation/consent.mjs';
import preview from '../growth-member/worker.mjs';
import {withAppLayout} from '../../app-layout-live.mjs';
export default {async fetch(request,env,ctx){const u=new URL(request.url);if(env.SHIFT_ENVIRONMENT!=='stabilisation-preview-20260917'||!/^shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(u.hostname)||!env.STAGING_EXPIRES_AT||Date.now()>=Date.parse(env.STAGING_EXPIRES_AT))return new Response('Preview unavailable',{status:404});if(u.pathname==='/consent-v4a.js')return new Response(consentClient,{headers:{'Content-Type':'text/javascript','Cache-Control':'no-store'}});
let response=await withAppLayout(request,await preview.fetch(request,env,ctx));
if(u.pathname.startsWith('/member/')&&response.headers.get('Content-Type')?.includes('text/html')){let body=await response.text();if(!body.includes('src="/consent-v4a.js"'))body=body.replace('</body>','<script defer src="/consent-v4a.js"></script></body>');const headers=new Headers(response.headers);headers.delete('Content-Length');response=new Response(body,{status:response.status,headers});}
return response;}};
