import {journeyPageHTML} from './journey-page.mjs';
export const v7PreferencesPath='/member/life-back/preferences';
export function preferencesBrowser(){
 'use strict';const root=document.getElementById('timberPreferences');if(!root)return;
 let owner=null,data=null,version=0,busy=false;
 const ready=()=>document.body.dataset.memberSession==='ready'&&document.body.dataset.accountDeleted!=='1'&&!document.hidden;
 const clear=()=>{version++;owner=null;data=null;root.replaceChildren();};
 const status=s=>{const n=root.querySelector('[role=status]');if(n)n.textContent=s;};
 function render(){
  if(!ready()||!data)return;
  root.innerHTML='<p><a href="/member/dashboard?timber=stuff#today">‹ More</a></p><h1>Preferences</h1><section class="tj-card"><label class="tj-switch"><strong>Show weight: '+(data.v7.preferences.showWeight?'On':'Off')+'</strong><input type="checkbox" data-v7-weight '+(data.v7.preferences.showWeight?'checked':'')+'></label><p>Turn off if you’d rather focus on strength, energy or measurements.</p></section><p role="status"></p>';
  root.querySelector('input').onchange=async e=>{
   if(busy)return;const chosen=e.target.checked,g=version;busy=true;e.target.disabled=true;
   try{
    const r=await fetch('/v1/life-back',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'v7-preferences',showWeight:chosen,revision:data.progress.revision,operationId:crypto.randomUUID(),expectedAccount:owner})}),d=await r.json();
    if(g!==version||!ready())return;if(!r.ok)throw Error(d.error||'Your preference could not be saved.');
    if(String(d.accountId)!==owner){clear();return;}data=d;render();
    document.documentElement.dataset.mtShowWeight=chosen?'on':'off';
    const c=typeof BroadcastChannel==='function'?new BroadcastChannel('my-timber-preferences'):null;c?.postMessage({changed:true});c?.close();status('Saved across your account.');
   }catch(error){if(g===version){render();status(error.message);}}finally{busy=false;}
  };
 }
 async function load(){
  if(!ready()||busy)return;busy=true;const g=version;root.innerHTML='<p role="status">Opening your private preferences…</p>';
  try{
   const me=window.MT_MEMBER_IDENTITY?await window.MT_MEMBER_IDENTITY():await(await fetch('/v1/me',{credentials:'same-origin',cache:'no-store'})).json();
   const r=await fetch('/v1/life-back',{credentials:'same-origin',cache:'no-store'}),d=await r.json();if(g!==version||!ready())return;
   if(!r.ok)throw Error(d.error||'Preferences could not load.');if(String(me.user?.id)!==String(d.accountId))throw Error('Your account changed. Reload this page.');
   owner=String(d.accountId);data=d;render();
  }catch(error){if(g===version)status(error.message);}finally{busy=false;}
 }
 new MutationObserver(()=>{clear();if(ready())load();}).observe(document.body,{attributes:true,attributeFilter:['data-member-session','data-account-deleted']});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else load();});addEventListener('pagehide',clear);if(ready())load();
}
export const preferencesRuntime='('+preferencesBrowser.toString()+')();';
export const preferencesHTML=journeyPageHTML.replace('id="timberJourney"','id="timberPreferences"').replace('<title>Your Journey · My Timber</title>','<title>Preferences · My Timber</title>').replace('/assets/member-experience/programme-journey.mjs','/assets/member-experience/programme-v7-preferences.mjs');
export function v7PreferencesRoutes(request){
 const p=new URL(request.url).pathname;if(![v7PreferencesPath,'/assets/member-experience/programme-v7-preferences.mjs'].includes(p))return null;
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});
 return new Response(request.method==='HEAD'?null:p===v7PreferencesPath?preferencesHTML:preferencesRuntime,{headers:{'Content-Type':p===v7PreferencesPath?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
}
