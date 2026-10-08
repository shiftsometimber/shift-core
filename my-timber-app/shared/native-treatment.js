(() => {
 'use strict';
 if(window.top!==window||location.origin!=='https://shiftsometimber.co.uk'||window.SST_NATIVE_TREATMENT)return;
 const apple=window.webkit?.messageHandlers?.sstTreatment;
 if(!apple&&!window.sstTreatment)return;
 const pending=new Map();
 function request(action,extra={}){
  const requestId=crypto.randomUUID();
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{pending.delete(requestId);reject(Error('The phone action timed out.'));},60000);
   pending.set(requestId,{resolve,reject,timer});
   const body={action,requestId,...extra};
   if(apple)apple.postMessage(body);else window.sstTreatment.postMessage(JSON.stringify(body));
  });
 }
 window.SST_NATIVE_TREATMENT_RESULT=result=>{
  const item=pending.get(result?.requestId);if(!item)return;
  clearTimeout(item.timer);pending.delete(result.requestId);
  result.error?item.reject(Error(result.error)):item.resolve(result);
 };
 if(window.sstTreatment)window.sstTreatment.onmessage=e=>{try{window.SST_NATIVE_TREATMENT_RESULT(JSON.parse(e.data));}catch{}};
 window.SST_NATIVE_TREATMENT={
  enable:async()=>{await window.SST_NATIVE_TREATMENT.sync();return request('enable');},disable:()=>request('disable'),
  async sync(){
   const response=await fetch('/v1/member/treatment/native-reminders',{credentials:'include',cache:'no-store',redirect:'error'});
   if(!response.ok){await request('disable');if(response.status!==401&&response.status!==404)throw Error('Phone reminders could not be refreshed.');return;}
   const lease=await response.json();return request('sync',lease);
  },
  async pdf(url){
   const target=new URL(url,location.origin);
   if(target.origin!==location.origin||target.pathname!=='/v1/member/treatment/summary.pdf')throw Error('Invalid summary link.');
   const response=await fetch(target,{credentials:'include',cache:'no-store',redirect:'error'});
   if(!response.ok||!response.headers.get('Content-Type')?.includes('application/pdf'))throw Error('Your PDF could not be downloaded.');
   const bytes=new Uint8Array(await response.arrayBuffer());
   if(bytes.length>2000000)throw Error('This summary is too large. Choose a shorter period.');
   let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   return request('pdf',{base64:btoa(binary)});
  }
 };
 // Leaving the signed-in member area cancels this device's treatment reminders.
 if(!location.pathname.startsWith('/member/'))request('disable').catch(()=>{});
 else window.SST_NATIVE_TREATMENT.sync().catch(()=>request('disable').catch(()=>{}));
 window.dispatchEvent(new Event('sst-native-treatment-ready'));
})();
