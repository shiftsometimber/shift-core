export const client=String.raw`(()=>{
'use strict';
const box=document.getElementById('myTimberApp'),reminders=document.getElementById('pwaReminderSettings'),firstRun=document.getElementById('pwaReminderFirstRun');
if(!box&&!reminders&&!firstRun)return;
const el=id=>document.getElementById(id),standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const android=/Android/i.test(navigator.userAgent);
let prompt=null,registration=null,settings=null,subscription=null,busy=false,editing=false;
const decisionCookie='sst_pwa_reminder_prompt=v1';
const decided=()=>document.cookie.split(';').some(v=>v.trim()===decisionCookie);
const rememberDecision=()=>{document.cookie=decisionCookie+'; Max-Age=31536000; Path=/; Secure; SameSite=Lax'};

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

if(!reminders&&!firstRun)return;
const supported=()=>isSecureContext&&'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window;
const settingsStatus=text=>{if(el('pwaReminderStatus'))el('pwaReminderStatus').textContent=text};
const firstStatus=text=>{if(el('pwaReminderFirstRunStatus'))el('pwaReminderFirstRunStatus').textContent=text};
const clock=h=>String(h).padStart(2,'0')+':00';
async function api(path,method='GET',body){const response=await fetch('/v1/my-timber-pwa'+path,{method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(Error(data.message||'The change could not be confirmed. Please retry.'),{status:response.status});return data}
function settingsState(){
 if(!reminders)return;
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
function firstRunState(){
 if(!firstRun)return;
 if(!standalone()||decided()||settings?.enabled||Notification.permission==='denied'){firstRun.hidden=true;return}
 firstRun.hidden=false;
 el('pwaReminderYes').disabled=busy||!settings||!registration;
 el('pwaReminderNo').disabled=busy;
}
async function load(){
 if(busy)return;busy=true;if(el('pwaRetry'))el('pwaRetry').hidden=true;settingsStatus('');firstStatus('');
 try{
  if(ios&&!standalone()){
   if(reminders)el('pwaReminderSummary').textContent='Install My Timber to your iPhone home screen first, then manage notifications here.';
   if(firstRun)firstRun.hidden=true;
   return;
  }
  if(!supported()){
   if(reminders)el('pwaReminderSummary').textContent='Notifications are not supported on this device. My Timber still works normally.';
   if(firstRun)firstRun.hidden=true;
   return;
  }
  registration=await navigator.serviceWorker.register('/shift-push-sw-v1.js',{scope:'/',updateViaCache:'none'});
  await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Notification settings are still loading. Please retry.')),12000))]);
  subscription=await registration.pushManager.getSubscription();
  settings=await api('/status','POST',{endpoint:subscription?.endpoint||''});
  if(reminders){el('pwaHour').value=String(settings.hour||19);editing=!settings.enabled}
  if(settings.enabled)rememberDecision();
 }catch(error){
  settings=null;
  if(reminders){el('pwaReminderSummary').textContent=error.status===401?'Sign in again to manage notifications.':'Notification settings could not be checked.';settingsStatus(error.status===401?'Your My Timber sign-in is required.':error.message);el('pwaRetry').hidden=false}
  if(firstRun){firstRun.hidden=true}
 }finally{busy=false;if(settings){settingsState();firstRunState()}else if(reminders){el('pwaHour').disabled=true;el('pwaEnable').disabled=true;el('pwaChange').hidden=true;el('pwaDisable').hidden=true}}
}
function bytes(value){const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'='));return Uint8Array.from(raw,c=>c.charCodeAt(0))}
async function enable(hour,fromFirstRun=false){
 if(busy||!settings||!registration)return false;
 const permission=Notification.permission==='granted'?Promise.resolve('granted'):Notification.requestPermission();
 busy=true;settingsState();firstRunState();fromFirstRun?firstStatus('Saving…'):settingsStatus('Saving…');let created=false;
 try{
  if(await permission!=='granted'){rememberDecision();if(firstRun)firstRun.hidden=true;throw Error('Notifications were not allowed. You can change this later in Settings.')}
  subscription=await registration.pushManager.getSubscription();
  if(!subscription){subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes(settings.publicKey)});created=true}
  settings=await api('/subscription','PUT',{subscription:subscription.toJSON(),hour:Number(hour)});
  rememberDecision();editing=false;if(firstRun)firstRun.hidden=true;
  if(reminders&&el('pwaHour'))el('pwaHour').value=String(settings.hour||hour);
  fromFirstRun?firstStatus('Saved.'):settingsStatus('Saved.');
  return true;
 }catch(error){
  if(created&&subscription){await subscription.unsubscribe().catch(()=>{});subscription=null}
  fromFirstRun?firstStatus(error.message):settingsStatus(error.message);
  if(!fromFirstRun&&el('pwaRetry'))el('pwaRetry').hidden=false;
  return false;
 }finally{busy=false;settingsState();firstRunState()}
}
if(reminders){
 el('pwaEnable').onclick=()=>enable(el('pwaHour').value,false);
 el('pwaChange').onclick=()=>{editing=true;settingsState();el('pwaHour').focus()};
 el('pwaDisable').onclick=async()=>{if(busy)return;busy=true;settingsState();settingsStatus('Switching off…');try{await api('/subscription','DELETE',{endpoint:subscription?.endpoint||''});settings.enabled=false;editing=true;rememberDecision();settingsStatus('Notifications are off on this device.')}catch(error){settingsStatus(error.message)}finally{busy=false;settingsState()}};
 el('pwaRetry').onclick=load;
}
if(firstRun){
 el('pwaReminderYes').onclick=()=>enable(19,true);
 el('pwaReminderNo').onclick=()=>{rememberDecision();firstRun.hidden=true};
}
load();
if(standalone()&&navigator.clearAppBadge)navigator.clearAppBadge().catch(()=>{});
})();`;
