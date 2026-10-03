export const deviceHealthRuntime=String.raw`(()=>{
 'use strict';let state=null,preview=null,busy=false;
 const host=document.getElementById('deviceHealth');if(!host)return;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const label=p=>p==='apple_health'?'Apple Health':'Health Connect';
 async function api(body){const r=await fetch('/v1/device-health',{method:body?'POST':'GET',credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});const data=await r.json();if(!r.ok)throw Error(data.message||'Your device records could not be loaded.');return data;}
 function reading(r){return (r.kind==='heart_rate'?r.heartRate+' bpm':r.kind==='weight'?r.weightKg+' kg':r.systolic+'/'+r.diastolic+' mmHg')+' · '+new Date(r.at).toLocaleString('en-GB')+' · '+r.source;}
 function button(text,fn){const b=el('button',text);b.type='button';b.className='btn btn-ghost';b.disabled=busy;b.onclick=async()=>{if(busy)return;busy=true;b.disabled=true;try{await fn();}catch(e){msg.textContent=e.message;}finally{busy=false;host.querySelectorAll('button').forEach(n=>n.disabled=false);}};return b;}
 const msg=el('p');msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');
 function render(){
  host.replaceChildren(el('h2','Your device health readings'),el('p','Bring heart rate, blood pressure and weight into My Timber when you choose. This is your record, not clinical monitoring. Readings are not used for prescribing, advertising or employer reports.'));
  const native=window.SST_NATIVE_HEALTH;
  if(native){
   const p=native.platform,box=el('label'),check=el('input');check.type='checkbox';box.append(check,document.createTextNode(' I consent to SHIFT saving the heart-rate, blood-pressure and weight readings I select from '+label(p)+' in my private My Timber account.'));host.append(box);
   const connect=button('Preview '+label(p)+' readings',async()=>{
    if(!check.checked)throw Error('Tick the import consent choice first.');
    if(!state.trackingEnabled){if(!await window.SST_HEALTH_CONSENT?.ensure())throw Error('Optional health tracking must be on before importing.');}
    state=await api({action:'connect',platform:p,expectedAccountId:state.accountId,agreed:true});
    const accountId=state.accountId,result=await native.request(accountId);
    const fresh=await api();if(fresh.accountId!==accountId)throw Error('Your account changed. Reload and preview again.');state=fresh;
    preview={platform:p,accountId,readings:result.readings||[]};render();
    msg.textContent=preview.readings.length?'Review and select the readings to save. Nothing has been imported yet.':'No readings are available to this app. There may be no recent data, or access may be off. Review permissions in your phone’s Health settings.';
   });host.append(connect,el('p','Each preview reads up to the latest 50 readings of each type from the last 30 days. No background sync or write access to your phone’s health store.'));
  }else host.append(el('p','To import from your phone, use the My Timber app build with health integration. You can view and manage readings saved to this account here.'));
  if(preview&&preview.accountId===state.accountId&&preview.readings.length){
   const panel=el('fieldset');panel.append(el('legend','Choose what to import'));const selected=[];
   for(const r of preview.readings){const l=el('label'),c=el('input');c.type='checkbox';c.checked=true;l.append(c,document.createTextNode(reading(r)));l.style.display='block';panel.append(l);selected.push({c,r});}
   panel.append(button('Save selected readings',async()=>{const readings=selected.filter(x=>x.c.checked).map(x=>x.r);if(!readings.length)throw Error('Choose at least one reading.');state=await api({action:'import',platform:preview.platform,expectedAccountId:preview.accountId,readings});preview=null;render();msg.textContent='Selected readings saved to your My Timber account.';}),button('Cancel preview',async()=>{preview=null;render();msg.textContent='Preview cleared. Nothing imported.';}));host.append(panel);
  }
  host.append(el('h3','Your saved readings'),el('p',(state.readings.length||0)+' of '+state.limit+' readings saved. '+(state.lastImportedAt?'Last import: '+new Date(state.lastImportedAt).toLocaleString('en-GB')+'.':'')));
  const list=el('ul');for(const r of state.readings)list.append(el('li',label(r.platform)+' · '+reading(r)));host.append(list);
  for(const p of ['apple_health','health_connect']){
   if(state.permissions[p])host.append(button('Disconnect '+label(p)+' imports',async()=>{state=await api({action:'disconnect',platform:p,expectedAccountId:state.accountId});preview=null;render();msg.textContent='Imports disconnected. Existing copies remain until you delete them. You can also revoke access in your phone’s Health settings.';}));
   if(state.readings.some(r=>r.platform===p))host.append(button('Delete imported '+label(p)+' copies',async()=>{if(!confirm('Delete these imported copies and stop imports? Your phone’s original readings stay intact.'))return;state=await api({action:'erase',platform:p,expectedAccountId:state.accountId});preview=null;render();msg.textContent='Imported copies deleted and imports disconnected.';}));
  }
  host.append(el('p','Download your readings using Export my data in the privacy controls. Erasing health-tracking history also removes imported readings.'),msg);
 }
 async function boot(){try{const fresh=await api();if(state&&fresh.accountId!==state.accountId)preview=null;state=fresh;render();}catch(e){host.replaceChildren(el('p',e.message));}}
 window.addEventListener('sst-native-health-ready',()=>{if(state)render();});window.addEventListener('pageshow',boot);boot();
})();`;
