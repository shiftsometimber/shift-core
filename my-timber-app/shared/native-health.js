(() => {
 'use strict';
 if(window.top!==window||location.origin!=='https://shiftsometimber.co.uk')return;
 if(window.SST_NATIVE_HEALTH)return;
 const platform=window.webkit?.messageHandlers?.sstHealth?'apple_health':window.sstHealth?'health_connect':null;
 if(!platform)return;
 const pending=new Map();
 window.SST_NATIVE_HEALTH={platform,request(accountId){
  if(!/^\/member\/settings(?:\.html)?\/?$/.test(location.pathname)||!Number.isSafeInteger(accountId))return Promise.reject(Error('Open your signed-in Settings to import readings.'));
  if(pending.size)return Promise.reject(Error('Finish the current health preview first.'));
  const requestId=crypto.randomUUID();
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{pending.delete(requestId);reject(Error('The health preview timed out. Nothing has been imported.'));},120000);
   pending.set(requestId,{accountId,resolve,reject,timer});
   const body={action:'read',requestId,accountId};
   if(platform==='apple_health')window.webkit.messageHandlers.sstHealth.postMessage(body);else window.sstHealth.postMessage(JSON.stringify(body));
  });
 }};
 window.SST_NATIVE_HEALTH_RESULT=result=>{
  if(location.origin!=='https://shiftsometimber.co.uk'||!/^\/member\/settings(?:\.html)?\/?$/.test(location.pathname))return;
  const item=pending.get(result?.requestId);if(!item||item.accountId!==result.accountId)return;
  clearTimeout(item.timer);pending.delete(result.requestId);
  if(result.error)item.reject(Error(result.error));else item.resolve(result);
 };
 if(window.sstHealth)window.sstHealth.onmessage=event=>{try{window.SST_NATIVE_HEALTH_RESULT(JSON.parse(event.data));}catch{}};
 window.addEventListener('pagehide',()=>{for(const item of pending.values()){clearTimeout(item.timer);item.reject(Error('The page changed. Nothing has been imported.'));}pending.clear();});
 window.dispatchEvent(new Event('sst-native-health-ready'));
})();
