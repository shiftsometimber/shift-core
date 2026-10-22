export const deviceHealthStyles=`#deviceHealth{margin:24px 0;padding:24px;border:1px solid #707762;border-radius:16px;background:#050505;color:#E7E3DA;overflow-wrap:anywhere}#deviceHealth .device-connection-summary>div{display:grid;gap:4px;padding:12px 0;border-bottom:1px solid #707762}#deviceHealth .device-connection-summary span{display:block}#deviceHealth summary{cursor:pointer;font-weight:700;min-height:44px;padding:10px 0}#deviceHealth details{margin:12px 0}#deviceHealth h2{font-size:clamp(24px,5vw,32px);line-height:1.2}#deviceHealth label{display:flex!important;align-items:flex-start;gap:12px;margin:12px 0}#deviceHealth input[type=checkbox]{width:22px;height:22px;flex:0 0 22px}#deviceHealth button{min-height:44px;margin:8px 12px 8px 0;padding:10px 16px;border:1px solid #707762;border-radius:10px;background:#E7E3DA;color:#050505;font-weight:700;max-width:100%;white-space:normal}#deviceHealth fieldset{border:1px solid #707762;padding:16px;min-width:0}#deviceHealth li{margin:14px 0}#deviceHealth :focus-visible{outline:3px solid #707762;outline-offset:3px}@media(max-width:560px){#deviceHealth{padding:16px}#deviceHealth button{width:100%;margin-right:0}}`;
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
  host.replaceChildren(el('h2','Connected health'),el('p','Connect your phone’s health store to keep your readings together. You choose what to import.'));
  const connections=el('div');connections.className='device-connection-summary';
  for(const p of ['apple_health','health_connect']){if(window.SST_NATIVE_HEALTH&&p!==window.SST_NATIVE_HEALTH.platform&&!state.readings.some(r=>r.platform===p))continue;const box=el('div'),enabled=!!state.permissions[p],records=state.readings.filter(r=>r.platform===p);box.append(el('strong',label(p)),el('span',enabled?(state.trackingEnabled?'Import connection enabled':'Paused · health tracking is off'):'Import connection off'));if(records.length){const latest=records.reduce((a,b)=>String(a.importedAt||a.at)>String(b.importedAt||b.at)?a:b);box.append(el('span',records.length+' saved readings'));if(latest.importedAt)box.append(el('span','Last import: '+new Date(latest.importedAt).toLocaleString('en-GB')));box.append(el('span','Latest saved reading: '+new Date(latest.at).toLocaleString('en-GB')))}else box.append(el('span','No readings saved from this source'));connections.append(box)}host.append(connections,el('p','Phone permissions control which readings are available. An enabled connection does not confirm access to every reading type.'));
  const sync=window.SST_HEALTH_SYNC,nativeBridge=window.SST_NATIVE_HEALTH;
  const automatic=state.automaticSync?.[nativeBridge?.platform];
  if(sync?.supported()){
   const panel=el('fieldset');panel.append(el('legend','Automatic imports'));
   panel.append(el('p','Import your selected reading types when you open or return to My Timber.'));const limits=el('details');limits.append(el('summary','How syncing works'),el('p','Checks run while the app is open, at most once a minute. Up to the latest 50 readings per type from the last 30 days; earlier or busier periods may be incomplete. No background sync or changes to your phone’s records.'));panel.append(limits);
   panel.append(el('p',sync.deviceConnected(state)?'Automatic imports enabled on this device.':'Automatic imports are off on this device.'));
   if(automatic?.lastCheckedAt)panel.append(el('p','Last completed check: '+new Date(automatic.lastCheckedAt).toLocaleString('en-GB')));
   if(automatic?.lastSavedAt)panel.append(el('p','Last new readings saved: '+new Date(automatic.lastSavedAt).toLocaleString('en-GB')));
   const choices=[];
   for(const [kind,text] of [['weight','Weight'],['blood_pressure','Blood pressure'],['heart_rate','Heart rate (optional)']]){const label=el('label'),input=el('input');input.type='checkbox';input.checked=automatic?.kinds?automatic.kinds.includes(kind):kind!=='heart_rate';label.append(input,document.createTextNode(text));panel.append(label);choices.push({kind,input});}
   const agreement=el('label'),agreed=el('input');agreed.type='checkbox';agreement.append(agreed,document.createTextNode(' I agree to automatic imports of these reading types into my private My Timber account on this device.'));panel.append(agreement);
   panel.append(button(sync.deviceConnected(state)?'Update automatic imports':'Connect '+label(nativeBridge.platform),async()=>{
    if(!agreed.checked)throw Error('Agree to automatic imports first.');
    const kinds=choices.filter(x=>x.input.checked).map(x=>x.kind);if(!kinds.length)throw Error('Choose at least one reading type.');
    if(!state.trackingEnabled&&!await window.SST_HEALTH_CONSENT?.ensure())throw Error('Optional health tracking must be on.');
    state=await sync.connect(kinds);render();await sync.sync(true);await boot();
   }));
   if(sync.deviceConnected(state))panel.append(button('Sync now',async()=>{await sync.sync(true);await boot();}));
   host.append(panel);
  }else if(nativeBridge)host.append(el('p','Automatic imports need an updated My Timber app. You can still preview and save readings individually below.'));
  const native=window.SST_NATIVE_HEALTH;
  const manual=el('details');manual.open=!!preview;manual.append(el('summary','Import individual readings'));host.append(manual);
  if(native){
   const p=native.platform,box=el('label'),check=el('input');check.type='checkbox';box.append(check,document.createTextNode(' I consent to SHIFT saving the heart-rate, blood-pressure and weight readings I select from '+label(p)+' in my private My Timber account.'));manual.append(box);
   const connect=button('Preview '+label(p)+' readings',async()=>{
    if(!check.checked)throw Error('Tick the import consent choice first.');
    if(!state.trackingEnabled){if(!await window.SST_HEALTH_CONSENT?.ensure())throw Error('Optional health tracking must be on before importing.');}
    state=await api({action:'connect',platform:p,expectedAccountId:state.accountId,agreed:true});
    const accountId=state.accountId,result=await native.request(accountId);
    const fresh=await api();if(fresh.accountId!==accountId)throw Error('Your account changed. Reload and preview again.');state=fresh;
    preview={platform:p,accountId,readings:result.readings||[]};render();
    msg.textContent=preview.readings.length?'Review and select the readings to save. Nothing has been imported yet.':'No readings are available to this app. There may be no recent data, or access may be off. Review permissions in your phone’s Health settings.';
   });manual.append(connect,el('p','Each preview reads up to the latest 50 readings of each type from the last 30 days. No background sync or write access to your phone’s health store.'));
  }else manual.append(el('p','To import from your phone, use the My Timber app build with health integration. You can view and manage readings saved to this account here.'));
  if(preview&&preview.accountId===state.accountId&&preview.readings.length){
   const panel=el('fieldset');panel.append(el('legend','Choose what to import'));const selected=[];
   for(const r of preview.readings){const l=el('label'),c=el('input');c.type='checkbox';c.checked=true;l.append(c,document.createTextNode(reading(r)));l.style.display='block';panel.append(l);selected.push({c,r});}
   panel.append(button('Save selected readings',async()=>{const readings=selected.filter(x=>x.c.checked).map(x=>x.r);if(!readings.length)throw Error('Choose at least one reading.');state=await api({action:'import',platform:preview.platform,expectedAccountId:preview.accountId,readings});preview=null;render();msg.textContent='Selected readings saved to your My Timber account.';}),button('Cancel preview',async()=>{preview=null;render();msg.textContent='Preview cleared. Nothing imported.';}));host.append(panel);
  }
  const savedReadings=el('details');savedReadings.append(el('summary','Saved readings ('+state.readings.length+')'),el('p',(state.readings.length||0)+' of '+state.limit+' readings saved. '+(state.lastImportedAt?'Last import: '+new Date(state.lastImportedAt).toLocaleString('en-GB')+'.':'')));
  host.append(savedReadings);
  const list=el('ul');for(const r of state.readings)list.append(el('li',label(r.platform)+' · '+reading(r)));savedReadings.append(list);
  for(const p of ['apple_health','health_connect']){
   if(state.permissions[p])host.append(button('Disconnect '+label(p)+' imports',async()=>{state=window.SST_HEALTH_SYNC?await window.SST_HEALTH_SYNC.disconnect(p,state.accountId):await api({action:'disconnect',platform:p,expectedAccountId:state.accountId});preview=null;render();msg.textContent='Imports disconnected. Existing copies remain until you delete them. You can also revoke access in your phone’s Health settings.';}));
   if(state.readings.some(r=>r.platform===p))host.append(button('Delete imported '+label(p)+' copies',async()=>{if(!confirm('Delete these imported copies and stop imports? Your phone’s original readings stay intact.'))return;window.SST_HEALTH_SYNC?.forget();state=await api({action:'erase',platform:p,expectedAccountId:state.accountId});preview=null;render();msg.textContent='Imported copies deleted and imports disconnected.';}));
  }
  if(window.SST_HEALTH_SYNC?.lastStatus)msg.textContent=window.SST_HEALTH_SYNC.lastStatus.message;
   const privacy=el('details');privacy.append(el('summary','About your data'),el('p','This is your record, not clinical monitoring. Readings are not used for prescribing, advertising or employer reports.'));host.append(privacy);
   host.append(el('p','Download your readings using Export my data in the privacy controls. Erasing health-tracking history also removes imported readings.'),msg);
 }
 window.addEventListener('sst-health-sync-status',e=>{msg.textContent=e.detail.message;});
 async function boot(){try{const fresh=await api();if(state&&fresh.accountId!==state.accountId)preview=null;state=fresh;render();}catch(e){const retry=el('button','Retry loading connections');retry.type='button';retry.onclick=boot;host.replaceChildren(el('h2','Connected health'),el('p',e.message),retry);}}
 window.addEventListener('sst-native-health-ready',()=>{if(state)render();});window.addEventListener('pageshow',boot);boot();
})();`;
