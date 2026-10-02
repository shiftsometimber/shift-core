import {consentClient} from '../../acquisition-activation/consent.mjs';
import preview from './host.mjs';
import {memberExperienceEntry} from '../../member-experience/entry.mjs';
import {withBookVoice} from '../../book-voice.mjs';
import {withAppLayout} from '../../app-layout-live.mjs';
export default {async fetch(request,env,ctx){const u=new URL(request.url);if(env.SHIFT_ENVIRONMENT!=='stabilisation-preview-20260917'||!/^shift-book-voice-a9c990\.[a-z0-9-]+\.workers\.dev$/.test(u.hostname)||!env.STAGING_EXPIRES_AT||Date.now()>=Date.parse(env.STAGING_EXPIRES_AT))return new Response('Preview unavailable',{status:404});if(u.pathname==='/consent-v4a.js')return new Response(consentClient,{headers:{'Content-Type':'text/javascript','Cache-Control':'no-store'}});
let source;
if(u.pathname==='/member/saved'&&request.method==='GET'){
 const original=await env.STAGING_ASSETS.fetch(new Request(new URL('/staging/member-source/member/saved.html',u)));
 let body=await original.text();body=body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace('</head>','<script>window.SST_API_BASE=location.origin;</script><script defer src="/staging/member-connected/script/api-adapter-v33d.js"></script></head>');
 source=await memberExperienceEntry(request,env,new Response(body,{headers:{'Content-Type':'text/html','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}}));
}else source=await preview.fetch(request,env,ctx);
let response=await withAppLayout(request,source);
if(u.pathname.startsWith('/member/')&&response.headers.get('Content-Type')?.includes('text/html')){let body=await response.text();if(!body.includes('src="/consent-v4a.js"'))body=body.replace('</body>','<script defer src="/consent-v4a.js"></script></body>');const headers=new Headers(response.headers);headers.delete('Content-Length');response=new Response(body,{status:response.status,headers});}
const copyRequest=u.pathname==='/staging/member-connected/script/fit.js'?new Request(new URL('/assets/member-experience/fit.mjs',u)):request;return withBookVoice(copyRequest,response);}};
