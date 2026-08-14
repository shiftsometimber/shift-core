const PATCH=`
/* G3-008 bounded production contrast remediation.
   One Shift V3.4 still carries high-specificity !important legacy ash/button and form-boundary rules.
   These selectors deliberately outrank those existing rules without changing the commissioned forest/cream system. */
.member-product .mp-btn:not(.ghost):not(.secondary),.btn.btn-primary,button.btn-primary,.member-form button[type="submit"]{background:#53624d!important;border-color:#53624d!important;color:#fff!important}
.eyebrow,.mp-eyebrow{color:#53624d!important}
.member-form input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),.mp-form input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),input.mp-input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),.member-form select,.member-form textarea,.mp-form select,.mp-form textarea,select.mp-select,textarea.mp-input,.ask-input textarea{border-color:#6f7869!important}
[role="switch"],.accessibility-toggle,.access-toggle,.mp-toggle{border-color:#6f7869!important}
`;
export async function memberContrastStatic(request,env){
 const path=new URL(request.url).pathname;if(request.method!=='GET'||path!=='/member-p0-v1.css'||!env.MEMBER_ASSETS)return null;
 const asset=await env.MEMBER_ASSETS.fetch(new Request('https://member-assets.local/member-p0-v1.css',{method:'GET'}));
 if(!asset.ok)return new Response('member stylesheet unavailable',{status:502,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
 const source=await asset.text();
 const headers=new Headers(asset.headers);headers.set('Content-Type','text/css; charset=utf-8');headers.set('Cache-Control','public, max-age=300, must-revalidate');headers.set('X-Content-Type-Options','nosniff');headers.set('X-Shift-Frontend-Authority','git:member-p0-v1.css+g3-008-contrast');
 return new Response(source+'\n'+PATCH,{status:200,headers});
}
