export const client=String.raw`(()=>{
'use strict';
const box=document.getElementById('myTimberApp'),reminders=document.getElementById('pwaReminderSettings');
if(!box&&!reminders)return;
const el=id=>document.getElementById(id),standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const android=/Android/i.test(navigator.userAgent);
let prompt=null,registration=null,settings=null,subscription=null,busy=false,editing=false;

if(box){
 const installCopy=()=>{
  el('pwaInstall').hidden=standalone();
  el('pwaInstallHelp').textContent=standalone()?'You’re using My Timber from your home screen.':ios?'On iPhone: open this page in Safari, tap Share → Add to Home Screen → Open as Web App → Add. Then open the S-in-a-circle icon.':android?'On Android: open My Timber in Chrome, tap ⋮ → Add to Home screen → Install. Then open the S-in-a-circle icon.':prompt?'Use the button above to install My Timber and open it in its own window.':'On a computer: use your browser’s Install app option if available. On your phone, open My Timber in Safari on iPhone or Chrome on Android.';
 };
 addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;installCopy()});
 addEventListener('appinstalled',()=>{prompt=null;el('pwaInstall').hidden=true;el('pwaInstallHelp').textContent='My Timber has been installed.'});
 el('pwaInstall').onclick=async()=>{if(!prompt){installCopy();return}const request=prompt;prompt=null;await request.prompt();const choice=await request.userChoice;el('pwaInstallHelp').textContent=choice.outcome==='accepted'?'Installation requested. Look for the S-in-a-circle icon.':'No problem. You can add it later.'};
 installCopy();
 function openSetup(){if(location.hash==='#myTimberApp'){box.open=true;box.scrollIntoView?.({block:'start'})}}
 addEventListener('hashchange',openSetup);openSetup();
 if(new URLSearchParams(location.search).get('setup')==='app'){box.open=true;box.scrollIntoView?.({block:'start'})}
}

if(!reminders)return;
const supported=()=>isSecureContext&&'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window;
const status=text=>{el('pwaReminderStatus').textContent=text};
const clock=h=>String(h).padStart(2,'0')+':00';
async function api(path,method='GET',body){const response=await fetch('/v1/my-timber-pwa'+path,{method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(Error(data.message||'The change could not be confirmed. Please retry.'),{status:response.status});return data}
function state(){
 const active=!!settings?.enabled,blocked=typeof Notification!=='undefined'&&Notification.permission==='denied';
 el('pwaReminderSummary').textContent=blocked?'Notifications are blocked in your phone or browser settings.':active?'Reminders on · '+clock(settings.hour||19):'Reminders off';
 el('pwaReminderEditor').hidden=active&&!editing;
 el('pwaHour').disabled=busy||!settings;
 el('pwaEnable').hidden=active&&!editing;
 el('pwaEnable').disabled=busy||!settings||!registration||blocked;
 el('pwaEnable').textContent=active?'Save reminder time':'Turn on notifications';
 el('pwaChange').hidden=!active||editing;el('pwaChange').disabled=busy;
 el('pwaDisable').hidden=!active;el('pwaDisable').disabled=busy;
}
async function load(){
 if(busy)return;busy=true;el('pwaRetry').hidden=true;status('');
 try{
  if(ios&&!standalone()){el('pwaReminderSummary').textContent='Install My Timber to your iPhone home screen first, then manage notifications here.';return}
  if(!supported()){el('pwaReminderSummary').textContent='Notifications are not supported on this device. My Timber still works normally.';return}
  registration=await navigator.serviceWorker.register('/shift-push-sw-v1.js',{scope:'/',updateViaCache:'none'});
  await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Notification settings are still loading. Please retry.')),12000))]);
  subscription=await registration.pushManager.getSubscription();
  settings=await api('/status','POST',{endpoint:subscription?.endpoint||''});
  el('pwaHour').value=String(settings.hour||19);editing=!settings.enabled;state();
 }catch(error){settings=null;el('pwaReminderSummary').textContent=error.status===401?'Sign in again to manage notifications.':'Notification settings could not be checked.';status(error.status===401?'Your My Timber sign-in is required.':error.message);el('pwaRetry').hidden=false}
 finally{busy=false;if(settings)state();else{el('pwaHour').disabled=true;el('pwaEnable').disabled=true;el('pwaChange').hidden=true;el('pwaDisable').hidden=true}}
}
function bytes(value){const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'='));return Uint8Array.from(raw,c=>c.charCodeAt(0))}
el('pwaEnable').onclick=async()=>{
 if(busy||!settings||!registration)return;
 const permission=Notification.permission==='granted'?Promise.resolve('granted'):Notification.requestPermission();
 busy=true;state();status('Saving…');let created=false;
 try{
  if(await permission!=='granted')throw Error('Notifications were not allowed. No reminder has been enabled.');
  subscription=await registration.pushManager.getSubscription();
  if(!subscription){subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes(settings.publicKey)});created=true}
  settings=await api('/subscription','PUT',{subscription:subscription.toJSON(),hour:Number(el('pwaHour').value)});
  editing=false;status('Saved.');
 }catch(error){if(created&&subscription){await subscription.unsubscribe().catch(()=>{});subscription=null}status(error.message);el('pwaRetry').hidden=false}
 finally{busy=false;state()}
};
el('pwaChange').onclick=()=>{editing=true;state();el('pwaHour').focus()};
el('pwaDisable').onclick=async()=>{if(busy)return;busy=true;state();status('Switching off…');try{await api('/subscription','DELETE',{endpoint:subscription?.endpoint||''});settings.enabled=false;editing=true;status('Notifications are off on this device.')}catch(error){status(error.message)}finally{busy=false;state()}};
el('pwaRetry').onclick=load;
load();
if(standalone()&&navigator.clearAppBadge)navigator.clearAppBadge().catch(()=>{});
})();`;
