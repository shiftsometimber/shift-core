// Presentation only. The existing authenticated APIs remain the data boundary.
export const sessionStyles=String.raw`
html body[data-member-session="pending"] :is(main,.sst-member-tabs),html body[data-member-session="signed-out"] :is(main,.sst-member-tabs),html body[data-member-session="error"] :is(main,.sst-member-tabs){display:none!important}
html body[data-member-session] #memberSessionStatus{max-width:680px;margin:28px auto;padding:24px;background:#e7e3da;color:#050505;border:1px solid #707762;border-radius:14px}
html body[data-member-session] #memberSessionStatus[hidden]{display:none!important}
html body[data-member-session] #memberSessionStatus :is(a,button){display:inline-block;padding:12px 18px;margin:8px 8px 0 0;background:#17261d;color:#e7e3da;border:1px solid #707762;border-radius:8px;font:inherit}
html body[data-member-session="signed-out"] main:has(#previewAuth){display:block!important}
html body[data-member-session] #previewAuth[hidden]{display:none!important}
`;
export const sessionRuntime=String.raw`(()=>{
 'use strict';const body=document.body,box=document.getElementById('memberSessionStatus');if(!box)return;
 let running=false;
 function state(value){body.dataset.memberSession=value;box.hidden=value==='ready';}
 async function check(onReady){
  if(running)return;running=true;state('pending');box.replaceChildren();const message=document.createElement('p');message.setAttribute('role','status');message.textContent='Checking your sign-in…';box.append(message);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch('/v1/me',{credentials:'include',cache:'no-store',signal:controller.signal});
   if(response.status===401){state('signed-out');message.textContent='Sign in to open your private My Timber account.';const auth=document.getElementById('previewAuth');if(auth){auth.hidden=false;box.hidden=true}else{const link=document.createElement('a');link.textContent='Sign in';link.href='/member-login?returnTo='+encodeURIComponent(location.pathname+location.search+location.hash);box.append(link)}return;}
   if(!response.ok)throw Error('unavailable');const data=await response.json();if(!data?.user?.id)throw Error('invalid session response');
   state('ready');if(onReady)await onReady();
  }catch{state('error');message.textContent='We could not check your sign-in. Your saved information has not changed.';const retry=document.createElement('button');retry.type='button';retry.textContent='Retry sign-in check';retry.onclick=()=>check(onReady);box.append(retry);}
  finally{clearTimeout(timer);running=false;}
 }
 window.SST_MEMBER_SESSION={check,ready:()=>state('ready')};
 document.addEventListener('DOMContentLoaded',()=>{if(!document.getElementById('previewAuth'))check();if(location.hash==='#forgot-password')document.querySelector('[data-forgot-password]')?.click()},{once:true});
})();`;

export function withSessionState(html){
 if(html.includes('id="previewRegister"')&&!html.includes('data-forgot-password')&&!html.includes('data-dashboard-password-recovery'))html=html.replace(/(<label>Password<input\b[^>]*name="password"[^>]*><\/label>)/,'$1<a data-dashboard-password-recovery href="/member-login?returnTo=%2Fmember%2Fdashboard#forgot-password" style="display:block;padding:12px 16px;margin:8px 0;border:1px solid #707762;border-radius:8px;background:#e7e3da!important;color:#050505!important;-webkit-text-fill-color:#050505!important;text-decoration:underline">Forgotten your password?</a>');
 if(html.includes('id="memberSessionStatus"'))return html;
 const dashboard=html.includes('id="previewAuth"');
 if(dashboard){
  const start=html.indexOf('async function existing()'),end=html.indexOf('function setMode(',start),authEnd=html.indexOf('async function authenticate(',start);
  const stop=Math.min(...[end,authEnd].filter(n=>n>start));
  if(start<0||!Number.isFinite(stop))return html;
  html=html.slice(0,start)+'async function existing(){await window.SST_MEMBER_SESSION.check(showMember)}\n      '+html.slice(stop);
  html=html.replace('async function showMember(){','async function showMember(){window.SST_MEMBER_SESSION.ready();');
  html=html.replace('const destination=requestedDestination();',String.raw`const destination=requestedDestination()||(/^\/member-login(?:\.html)?\/?$/.test(location.pathname)?'/member/dashboard'+location.hash:'');`);
  html=html.replace(/(<section\b[^>]*id="previewAuth")([^>]*>)/,'$1 hidden$2');
 }
 return html.replace(/<body\b([^>]*)>/,'<body$1 data-member-session="pending"><section id="memberSessionStatus" aria-label="Account access"><p role="status">Checking your sign-in…</p></section>')
  .replace('</head>','<style>'+sessionStyles+'</style></head>')
  .replace(/(<section id="memberSessionStatus"[\s\S]*?<\/section>)/,'$1<script src="/assets/member-experience/session.mjs"></script>');
}
