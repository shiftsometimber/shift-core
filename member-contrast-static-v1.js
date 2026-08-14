const PATCH=`
/* G3-008 bounded production contrast remediation — final precedence-safe override */
html body .member-main .member-product .mp-form .mp-btn:not(.ghost),html body .member-main .mp-form .mp-btn:not(.ghost),html body .member-main .mp-btn:not(.ghost),html body .btn.btn-primary,html body button.btn-primary,html body .member-form button[type="submit"]{background:#53624d!important;border-color:#53624d!important;color:#fff!important}
html body .member-main .eyebrow,html body .member-main .mp-eyebrow{color:#53624d!important}
html body .member-main .member-form input,html body .member-main .member-form select,html body .member-main .member-form textarea,html body .member-main .member-product .mp-form input,html body .member-main .member-product .mp-form select,html body .member-main .member-product .mp-form textarea,html body .member-main .mp-form input,html body .member-main .mp-form select,html body .member-main .mp-form textarea,html body .member-main .mp-input,html body .member-main .mp-select,html body .ask-input textarea{border-color:#6f7869!important}
html body [role="switch"],html body .accessibility-toggle,html body .access-toggle,html body .mp-toggle{border-color:#6f7869!important}
`;
export async function memberContrastStatic(request,env){
 const path=new URL(request.url).pathname;if(request.method!=='GET'||path!=='/member-p0-v1.css'||!env.MEMBER_ASSETS)return null;
 const asset=await env.MEMBER_ASSETS.fetch(new Request('https://member-assets.local/member-p0-v1.css',{method:'GET'}));
 if(!asset.ok)return new Response('member stylesheet unavailable',{status:502,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
 const source=await asset.text();
 const headers=new Headers(asset.headers);headers.set('Content-Type','text/css; charset=utf-8');headers.set('Cache-Control','public, max-age=300, must-revalidate');headers.set('X-Content-Type-Options','nosniff');headers.set('X-Shift-Frontend-Authority','git:member-p0-v1.css+g3-008-contrast-final');
 return new Response(source+'\n'+PATCH,{status:200,headers});
}
