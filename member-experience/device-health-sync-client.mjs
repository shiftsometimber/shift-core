// Foreground only. Never store health readings or credentials on the device.
export function createHealthSync({api,native,storage,active=()=>true,now=()=>Date.now(),notify=()=>{}}){
 const key='my-timber-health-auto-v1';let busy=false,connecting=false,generation=0,lastStatus=null;
 const bridge=()=>native();
 const binding=()=>{try{return JSON.parse(storage.getItem(key)||'null')}catch{return null}};
 const clear=()=>{generation++;try{storage.removeItem(key)}catch{}};
 const supported=()=>bridge()?.automaticImportVersion===1;
 const config=(s,p)=>s.automaticSync?.[p];
 const same=(s,b)=>s.accountId===b?.accountId&&s.trackingEnabled&&s.permissions?.[b.platform]&&config(s,b.platform)?.enabled&&config(s,b.platform)?.connectionId===b.connectionId;
 function store(value){storage.setItem(key,JSON.stringify(value));}
 function status(message,state='idle'){lastStatus={message,state};notify(lastStatus);}
 async function sync(force=false){
  if(busy||!active()||!supported())return;
  busy=true;const token=generation;
  try{
   const b=binding();if(!b||b.platform!==bridge().platform)return;
   const s=await api();if(!same(s,b)){clear();status('Automatic imports are off on this device.');return;}
   if(!force&&now()-(b.lastAttemptAt||0)<60000)return;
   if(token!==generation||!active())return;
   store({...b,lastAttemptAt:now()});status('Checking for new health readings…','checking');
   const result=await bridge().requestAutomatic(s.accountId,config(s,b.platform).kinds,false);
   if(token!==generation||!active())return;
   const fresh=await api();if(!same(fresh,b)){clear();throw Error('Your account or connection changed. Nothing imported.');}
   const saved=await api({action:'sync',platform:b.platform,expectedAccountId:s.accountId,connectionId:b.connectionId,readings:result.readings||[]});
   if(token!==generation)return;
   status((result.readings||[]).length?'Health readings checked and saved without duplicates.':'No readable readings found. There may be no recent data, or phone access may be off.','checked');
   return saved;
  }catch(e){status(e.message||'Health readings could not be synced. Try Sync now.','error');}
  finally{busy=false;}
 }
 async function connect(kinds){
  if(busy)throw Error('A health check is already running. Try again shortly.');
  if(!supported())throw Error('Update the installed My Timber app to use automatic imports.');
  // Storage failure must not enable a connection which this device cannot remember.
  storage.setItem(key+'-probe','1');storage.removeItem(key+'-probe');
  busy=true;connecting=true;const token=generation;
  try{
   const before=await api();if(!before.trackingEnabled)throw Error('Switch on optional health tracking first.');
   await bridge().requestAutomatic(before.accountId,kinds,true);
   if(token!==generation||!active())throw Error('The page changed. Connection not enabled.');
   const fresh=await api();if(fresh.accountId!==before.accountId)throw Error('Your account changed. Connection not enabled.');
   const saved=await api({action:'auto-connect',platform:bridge().platform,expectedAccountId:before.accountId,agreed:true,kinds});
   const c=config(saved,bridge().platform);store({accountId:saved.accountId,platform:bridge().platform,connectionId:c.connectionId,lastAttemptAt:0});
   status('Automatic imports enabled on this device. Phone access is checked when reading.','connected');return saved;
  }finally{busy=false;connecting=false;}
 }
 async function disconnect(platform,accountId){clear();return api({action:'disconnect',platform,expectedAccountId:accountId});}
 return {sync,connect,disconnect,cancel:reason=>{if(reason==='hidden'&&connecting)return;generation++;},forget:clear,supported,deviceConnected:s=>same(s,binding()),get lastStatus(){return lastStatus},get busy(){return busy}};
}
export const deviceHealthSyncRuntime='('+function(create){
 if(window.SST_HEALTH_SYNC)return;
 const api=async body=>{const response=await fetch('/v1/device-health',{method:body?'POST':'GET',credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});const data=await response.json();if(!response.ok)throw Error(data.message||'Sign in to manage your health connection.');return data;};
 const sync=create({api,native:()=>window.SST_NATIVE_HEALTH,storage:{getItem:k=>window.localStorage.getItem(k),setItem:(k,v)=>window.localStorage.setItem(k,v),removeItem:k=>window.localStorage.removeItem(k)},active:()=>document.visibilityState!=='hidden',notify:detail=>window.dispatchEvent(new CustomEvent('sst-health-sync-status',{detail}))});
 window.SST_HEALTH_SYNC=sync;
 const check=()=>{void sync.sync();};
 window.addEventListener('sst-native-health-ready',check);
 window.addEventListener('sst-app-active',check);
 window.addEventListener('pageshow',check);
 window.addEventListener('pagehide',()=>sync.cancel());
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')sync.cancel('hidden');else check();});
 // Browser/PWA and old native builds never read or import automatically.
 check();
}.toString()+')('+createHealthSync.toString()+');';
