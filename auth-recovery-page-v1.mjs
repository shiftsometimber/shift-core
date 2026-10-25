import {passwordMeetsPolicy,PASSWORD_POLICY_MESSAGE} from './password-policy-v1.js';
// Narrow repair of the current authoritative Pages reset document. Keep its
// markup, copy, styles and confirmation journey; restore five logical fallbacks.
export function repairPasswordResetDocument(html){
 const reset=html.includes('id="resetForm"');
 html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,script=>{
  if(!script.includes("getElementById('resetForm')")||!script.includes("API+'/auth/reset-password'"))return script;
  for(const value of ["new URLSearchParams(location.search).get('token')","f.get('password')","f.get('confirm')",'body.message','err.message']){
   script=script.replace(value+" |'",value+" ||'");
  }
  script=script.replace("if(p.length<12){msg('Please use at least 12 characters.');return}","if(!("+passwordMeetsPolicy.toString()+")(p)){msg("+JSON.stringify(PASSWORD_POLICY_MESSAGE)+");return}");
  return script;
 });
 if(reset)html=html.replace(/minlength=([\"'])12\1/g,'minlength="10"').replace(/at least 12 characters/g,'at least 10 characters, including one capital letter and one special character');
 if(reset&&!html.includes('data-reset-recovery="v1"')&&html.includes('</head>')){
  html=html.replace(/<body\b/,'<body data-reset-recovery="v1"').replace('</head>',`<style data-reset-recovery="v1">
body[data-reset-recovery] .auth-shell :is(h2,label,small,p,a){color:#e7e3da!important;-webkit-text-fill-color:#e7e3da!important}
body[data-reset-recovery] #resetForm input{color:#050505!important;-webkit-text-fill-color:#050505!important;background:#e7e3da!important}
body[data-reset-recovery] .footer-grid>*{min-width:0;overflow-wrap:anywhere}
</style></head>`);
 }
 return html;
}
export async function repairPasswordResetResponse(response,request){
 if(!['/reset-password','/reset-password.html'].includes(new URL(request.url).pathname)||request.method!=='GET'||!response.ok||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const body=repairPasswordResetDocument(await response.text()),headers=new Headers(response.headers);
 for(const key of ['Content-Length','ETag','Last-Modified'])headers.delete(key);
 headers.set('Cache-Control','no-store');headers.set('Referrer-Policy','no-referrer');
 return new Response(body,{status:response.status,headers});
}
