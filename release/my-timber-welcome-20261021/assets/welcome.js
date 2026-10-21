(()=>{'use strict';if(/^\/member-register(?:\.html)?\/?$/.test(location.pathname)){document.querySelector('[data-auth-mode="register"]')?.click();}const root=document.getElementById('mtWelcome');if(!root)return;
const login=root.querySelectorAll('a[href^="/member-login?"]'),join=root.querySelectorAll('a[href^="/member-register?"]');
const p=new URLSearchParams(location.search),requested=p.get('returnTo')||p.get('next');
const dest=requested&&/^\/(?!\/)/.test(requested)&&!/^\/member-(login|register)/.test(requested)?requested:location.pathname+location.search+location.hash;
if(/^\/member\/dashboard/.test(dest)){for(const a of login)a.href='/member-login?returnTo='+encodeURIComponent(dest);for(const a of join)a.href='/member-register?returnTo='+encodeURIComponent(dest);}
const btn=document.getElementById('mtwInstall'),help=document.getElementById('mtwInstallHelp'),now=document.getElementById('mtwInstallNow');let installEvent=null;
window.addEventListener('beforeinstallprompt',e=>{installEvent=e;now.hidden=false;});
btn.addEventListener('click',()=>{help.hidden=!help.hidden;btn.setAttribute('aria-expanded',String(!help.hidden));if(!help.hidden)help.scrollIntoView({block:'nearest',behavior:'auto'});});
now.addEventListener('click',async()=>{if(!installEvent)return;await installEvent.prompt();const r=await installEvent.userChoice;document.getElementById('mtwInstallStatus').textContent=r.outcome==='accepted'?'My Timber has been added to your device.':'You can add My Timber whenever you’re ready.';installEvent=null;now.hidden=true;});
window.addEventListener('appinstalled',()=>{document.getElementById('mtwInstallStatus').textContent='My Timber is installed on this device.';now.hidden=true;});
if(matchMedia('(display-mode: standalone)').matches||navigator.standalone){document.getElementById('mtwDeviceHelp').textContent='You’re already using My Timber as a web app. Sign in to open your account.';}
document.getElementById('mtwCookies').addEventListener('click',()=>document.getElementById('sstCookieSettings')?.click());
})();