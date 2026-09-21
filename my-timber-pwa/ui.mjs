export const client=String.raw`(()=>{
'use strict';
const box=document.getElementById('myTimberApp');if(!box)return;
const el=id=>document.getElementById(id),standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let prompt=null,registration=null,settings=null,subscription=null,busy=false,loaded=false;
const status=text=>{el('pwaStatus').textContent=text};
function installCopy(){
 el('pwaInstall').hidden=standalone();
 el('pwaInstallHelp').textContent=standalone()?'You’re using the My Timber app.':ios?'On iPhone: open this page in Safari, tap Share → Add to Home Screen → Open as Web App → Add. Then open the S-in-a-circle icon.':prompt?'Add the S-in-a-circle icon to open My Timber in its own window.':'Use your browser’s Install app or Add to Home screen menu. If it is unavailable, try Safari on iPhone or Chrome on Android.';
}
addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;installCopy()});
addEventListener('appinstalled',()=>{prompt=null;el('pwaInstall').hidden=true;el('pwaInstallHelp').textContent='My Timber has been installed.'});
el('pwaInstall').onclick=async()=>{if(!prompt){installCopy();return}const request=prompt;prompt=null;await request.prompt();const choice=await request.userChoice;el('pwaInstallHelp').textContent=choice.outcome==='accepted'?'Installation requested. Look for the S-in-a-circle icon.':'No problem. You can add it later.'};
installCopy();
const supported=()=>isSecureContext&&'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window;
async function api(path,method='GET',body){const response=await fetch('/v1/my-timber-pwa'+path,{method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(Error(data.message||'The change could not be confirmed. Please retry.'),{status:response.status});return data}
function state(){
 const active=!!settings?.enabled;
 el('pwaHour').disabled=busy||!settings;el('pwaEnable').disabled=busy||!settings||!registration||Notification.permission==='denied';el('pwaEnable').textContent=active?'Save reminder time':'Turn on check-in reminders';
 el('pwaDisable').hidden=!active;el('pwaTest').hidden=!active;el('pwaDisable').disabled=busy;el('pwaTest').disabled=busy;
 el('pwaCapability').textContent=Notification.permission==='denied'?'Notifications are blocked. You can change this in your device or browser settings.':active?'Check-in reminders are on for this device. Signing out pauses them.':'Check-in reminders are off. We only ask permission when you tap Turn on.';
}
async function load(){
 if(busy)return;busy=true;el('pwaRetry').hidden=true;
 try{
  if(ios&&!standalone()){el('pwaCapability').textContent='On iPhone, install My Timber first, then open it from the home-screen icon to enable notifications.';return}
  if(!supported()){el('pwaCapability').textContent='Device notifications are not supported in this browser. My Timber still works on the web.';return}
  registration=await navigator.serviceWorker.register('/shift-push-sw-v1.js',{scope:'/',updateViaCache:'none'});
  await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('App setup is still loading. Please retry.')),12000))]);
  subscription=await registration.pushManager.getSubscription();
  settings=await api('/status','POST',{endpoint:subscription?.endpoint||''});
  el('pwaHour').value=String(settings.hour||19);loaded=true;
  status(settings.enabled?'You can send a test below. Delivery is only proved when you see it arrive.':'Choose a time if a daily check-in nudge would help.');
 }catch(error){settings=null;el('pwaCapability').textContent=error.status===401?'Sign in to set up reminders for your account.':'Notification setup could not be checked.';status(error.status===401?'Your existing My Timber sign-in is required.':error.message);el('pwaRetry').hidden=false}
 finally{busy=false;if(settings)state();else{el('pwaHour').disabled=true;el('pwaEnable').disabled=true;el('pwaDisable').hidden=true;el('pwaTest').hidden=true}}
}
function bytes(value){const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'='));return Uint8Array.from(raw,c=>c.charCodeAt(0))}
el('pwaEnable').onclick=async()=>{
 if(busy||!settings||!registration)return;
 // Call immediately within the actual click, before any network work (iOS).
 const permission=Notification.permission==='granted'?Promise.resolve('granted'):Notification.requestPermission();
 busy=true;state();status('Saving your choice…');let created=false;
 try{
  if(await permission!=='granted')throw Error('Notifications were not allowed. No new reminder has been enabled.');
  subscription=await registration.pushManager.getSubscription();
  if(!subscription){subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes(settings.publicKey)});created=true}
  settings=await api('/subscription','PUT',{subscription:subscription.toJSON(),hour:Number(el('pwaHour').value)});
  status('Saved. One check-in reminder a day on this device, unless you’ve already checked in.');
 }catch(error){if(created&&subscription){await subscription.unsubscribe().catch(()=>{});subscription=null}status(error.message);el('pwaRetry').hidden=false}
 finally{busy=false;state()}
};
el('pwaDisable').onclick=async()=>{if(busy)return;busy=true;state();try{await api('/subscription','DELETE',{endpoint:subscription?.endpoint||''});settings.enabled=false;status('Check-in reminders are off on this device. Your other notification choices are unchanged.')}catch(error){status(error.message)}finally{busy=false;state()}};
el('pwaTest').onclick=async()=>{if(busy)return;busy=true;state();try{await api('/test','POST',{endpoint:subscription?.endpoint||''});status('Test accepted by the push service. Check your device for the notification; acceptance alone does not prove arrival.')}catch(error){status(error.message)}finally{busy=false;state()}};
el('pwaRetry').onclick=load;box.addEventListener('toggle',()=>{if(box.open&&!loaded)load()});
if(box.open)load();
// Clear this device’s indicator when it is opened, never infer completion from it.
if(standalone()&&navigator.clearAppBadge)navigator.clearAppBadge().catch(()=>{});
})();`;
