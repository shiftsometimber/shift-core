// Shift Some Timber V3.2D — browser adapter for Shift Core.
(function(){
  'use strict';
  const API_ROOT=(window.SST_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
  const V1=API_ROOT+'/v1';
  const DEFAULT_TIMEOUT=15000;
  const PERSISTENCE_TIMEOUT=30000;
  const GENERATION_TIMEOUT=60000;
  let memberStateInFlight=null,memberStateCached=null,memberStateCachedAt=0;
  function apiError(body,status){
    const code=(body&&typeof body==='object'&&(body.error||body.code))||`http_${status}`;
    const messages={invalid_credentials:'Email or password not recognised.',email_in_use:'An account already exists for that email.',invalid_registration:'Please check your email address and password.',temporarily_locked:'Too many failed attempts. Please try again in 15 minutes.',session_expired:'Your session has expired. Please sign in again.',unauthorised:'Please sign in to continue.',unauthorized:'Please sign in to continue.'};
    const e=new Error((body&&body.message)||messages[code]||`Shift Core returned ${status}.`);e.status=status;e.code=code;e.body=body;return e;
  }
  async function request(path,options={}){
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),options.timeout||DEFAULT_TIMEOUT);
    const headers=new Headers(options.headers||{});if(options.body!==undefined&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
    try{
      const res=await fetch(V1+path,{credentials:'include',cache:'no-store',...options,headers,signal:controller.signal});
      const ct=res.headers.get('content-type')||'';let body=null;if(res.status!==204)body=ct.includes('application/json')?await res.json():await res.text();
      if(!res.ok)throw apiError(body,res.status);return body;
    }catch(err){
      if(err&&err.name==='AbortError'){const e=new Error('Shift Core took too long to respond. Please try again.');e.code='timeout';throw e;}
      if(err instanceof TypeError){const e=new Error('We could not reach Shift Core. Check your connection and try again.');e.code='network_error';throw e;}
      throw err;
    }finally{clearTimeout(timer)}
  }
  async function getMemberState(){
    if(memberStateCached&&Date.now()-memberStateCachedAt<10000)return memberStateCached;
    if(memberStateInFlight)return memberStateInFlight;
    memberStateInFlight=request('/member-state').then(result=>{memberStateCached=result;memberStateCachedAt=Date.now();return result}).finally(()=>{memberStateInFlight=null});
    return memberStateInFlight;
  }
  async function saveMemberState(data){
    const result=await request('/member-state',{method:'PATCH',body:JSON.stringify(data),timeout:PERSISTENCE_TIMEOUT});
    memberStateCached=null;memberStateCachedAt=0;
    return result;
  }

  async function visualise(file,direction){
    const form=new FormData();form.append('image',file,'shift-progress.jpg');form.append('direction',direction);form.append('consent','true');
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
    try{
      const res=await fetch(V1+'/shift/visualise',{method:'POST',credentials:'include',cache:'no-store',body:form,signal:controller.signal});
      const body=await res.json();if(!res.ok)throw apiError(body,res.status);return body;
    }finally{clearTimeout(timer)}
  }

  async function saveProgressPhoto(file,meta={}){
    const form=new FormData();
    form.append('image',file,'shift-progress.jpg');
    form.append('consent','true');
    if(meta.weightKg) form.append('weightKg',String(meta.weightKg));
    if(meta.waistCm) form.append('waistCm',String(meta.waistCm));
    form.append('capturedAt',meta.capturedAt||new Date().toISOString());
    form.append('source',meta.source||'upload');
    try{
      const res=await fetch(V1+'/shift/progress-photo',{method:'POST',credentials:'include',cache:'no-store',body:form});
      const ct=res.headers.get('content-type')||'';const body=ct.includes('application/json')?await res.json():{message:await res.text()};
      if(!res.ok) throw apiError(body,res.status); return body;
    }catch(err){
      if(err instanceof TypeError){const e=new Error('Shift could not save the photo just then. Please try once more.');e.code='photo_network_error';throw e;}
      throw err;
    }
  }
  async function listProgressPhotos(){
    const res=await fetch(V1+'/shift/progress-photo',{credentials:'include',cache:'no-store'});
    const body=await res.json(); if(!res.ok) throw apiError(body,res.status); return body;
  }
  function progressPhotoUrl(id){return V1+'/shift/progress-photo/'+encodeURIComponent(id)+'/image';}
  async function deleteProgressPhoto(id){return request('/shift/progress-photo/'+encodeURIComponent(id),{method:'DELETE'});}

  async function health(){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);try{const res=await fetch(API_ROOT+'/health',{cache:'no-store',signal:controller.signal});const body=await res.json();if(!res.ok)throw apiError(body,res.status);return body;}finally{clearTimeout(timer)}}
  window.SST_API_BASE=API_ROOT;
  window.SST_API={version:'3.3I',connected:()=>true,health,
    register:data=>request('/auth/register',{method:'POST',body:JSON.stringify(data)}),login:data=>request('/auth/login',{method:'POST',body:JSON.stringify(data)}),logout:()=>request('/auth/logout',{method:'POST'}),requestPasswordReset:data=>request('/auth/request-password-reset',{method:'POST',body:JSON.stringify(data)}),resendVerification:data=>request('/auth/resend-verification',{method:'POST',body:JSON.stringify(data)}),
    getMe:()=>request('/me'),getProfile:()=>request('/profile'),saveProfile:data=>request('/profile',{method:'PATCH',body:JSON.stringify(data)}),getMemberState,saveMemberState,getMyJourney:()=>request('/journey'),saveMyJourney:data=>request('/journey',{method:'PATCH',body:JSON.stringify(data),timeout:PERSISTENCE_TIMEOUT}),deleteMyJourney:()=>request('/journey',{method:'DELETE',timeout:PERSISTENCE_TIMEOUT}),getJourneyExport:()=>request('/journey/export',{timeout:PERSISTENCE_TIMEOUT}),getJourneyCheckIn:()=>request('/journey/weekly-check-in'),saveJourneyCheckIn:data=>request('/journey/weekly-check-in',{method:'POST',body:JSON.stringify(data),timeout:PERSISTENCE_TIMEOUT}),getJourneyTrends:()=>request('/journey/trends'),
    getProgress:()=>request('/progress'),saveProgress:data=>request('/progress',{method:'POST',body:JSON.stringify(data)}),getMots:()=>request('/health-mot'),saveMot:data=>request('/health-mot',{method:'POST',body:JSON.stringify(data)}),getCheckIns:()=>request('/check-ins'),saveCheckIn:data=>request('/check-ins',{method:'POST',body:JSON.stringify(data)}),
    getCases:()=>request('/cases'),createCase:data=>request('/cases',{method:'POST',body:JSON.stringify(data)}),getOrders:()=>request('/commerce/orders'),getPharmacyOrders:()=>request('/pharmacy/orders'),createPharmacyOrder:data=>request('/pharmacy/orders',{method:'POST',body:JSON.stringify(data)}),getConsents:()=>request('/consents'),saveConsent:data=>request('/consents',{method:'POST',body:JSON.stringify(data)}),exportData:()=>request('/privacy/export',{method:'POST'}),eraseHealthTracking:()=>request('/privacy/health-tracking',{method:'DELETE'}),deleteAccount:()=>request('/privacy/account',{method:'DELETE'}),visualise,saveProgressPhoto,listProgressPhotos,deleteProgressPhoto,progressPhotoUrl,
    getShiftContext:()=>request('/shift/context'),
    getShiftToday:()=>request('/shift/today',{headers:todayHeaders()}),
    getMyTimberHelp:need=>request('/shift/today/help?need='+encodeURIComponent(need),{headers:todayHeaders()}),
    saveMyTimberHelp:data=>request('/shift/today/help',{method:'POST',headers:todayHeaders(),body:JSON.stringify(data||{})}),
    saveShiftTodayCheckIn:data=>request('/shift/today/check-in',{method:'POST',headers:todayHeaders(),body:JSON.stringify(data||{})}),
    saveShiftTodayGrub:data=>request('/shift/today/grub',{method:'POST',headers:todayHeaders(),body:JSON.stringify(data||{})}),
    saveShiftTodayMove:data=>request('/shift/today/move',{method:'POST',headers:todayHeaders(),body:JSON.stringify(data||{})}),
    saveShiftTodayTreatment:data=>request('/shift/today/treatment',{method:'POST',headers:todayHeaders(),body:JSON.stringify(data||{})}),
    saveShiftTreatmentContext:data=>request('/shift/treatment-context',{method:'PATCH',headers:todayHeaders(),body:JSON.stringify(data||{})}),
    getProgressSummary:()=>request('/progress/summary'),getPlanList:()=>request('/plan/list'),
    generateGrub:data=>request('/grub/plan',{method:'POST',body:JSON.stringify(data||{}),timeout:GENERATION_TIMEOUT}),replaceGrubMeal:data=>request('/grub/replace',{method:'POST',body:JSON.stringify(data||{})}),grubFeedback:data=>request('/grub/feedback',{method:'POST',body:JSON.stringify(data||{})}),
    generateFit:data=>request('/fit/plan',{method:'POST',headers:todayHeaders(),body:JSON.stringify(data||{}),timeout:GENERATION_TIMEOUT}),replaceFitExercise:data=>request('/fit/replace',{method:'POST',body:JSON.stringify(data||{})}),fitFeedback:data=>request('/fit/feedback',{method:'POST',body:JSON.stringify(data||{})}),completeFitToday:data=>request('/fit/today/complete',{method:'POST',headers:todayHeaders(),body:JSON.stringify(data||{})}),getDailyShift:()=>request('/shift/daily-plan',{headers:todayHeaders()}),saveDailyShiftAction:data=>request('/shift/daily-action',{method:'POST',headers:todayHeaders(),body:JSON.stringify(data||{})}),adjustDailyShift:data=>request('/shift/daily-adjust',{method:'POST',headers:todayHeaders(),body:JSON.stringify(data||{})}),saveDailyMeal:data=>request('/shift/daily-meal',{method:'POST',headers:todayHeaders(),body:JSON.stringify(data||{})}),saveDailyFeedback:data=>request('/shift/daily-feedback',{method:'POST',headers:todayHeaders(),body:JSON.stringify(data||{})}),seedPreviewBilly:()=>request('/shift/preview-billy',{method:'POST',headers:todayHeaders(),body:'{}'}),getFitReminder:()=>request('/fit/reminders'),saveFitReminder:data=>request('/fit/reminders',{method:'PATCH',body:JSON.stringify(data||{})}),enableFitPush:subscription=>request('/fit/push-subscription',{method:'POST',body:JSON.stringify({subscription})}),disableFitPush:endpoint=>request('/fit/push-subscription',{method:'DELETE',body:JSON.stringify({endpoint})}),
    generateHydration:data=>request('/hydration/plan',{method:'POST',body:JSON.stringify(data||{})}),logHydration:data=>request('/hydration/log',{method:'POST',body:JSON.stringify(data||{})}),getHydrationToday:()=>request('/hydration/today'),
    conundrum:data=>request('/grub/conundrum',{method:'POST',body:JSON.stringify(data||{})}),
    recommend:data=>request('/shift/recommend',{method:'POST',body:JSON.stringify(data||{})}),
    askShiftAI:data=>request('/ai/chat',{method:'POST',body:JSON.stringify(data||{}),timeout:GENERATION_TIMEOUT})
  };
  function todayHeaders(){const now=new Date();return{'X-Shift-Local-Date':now.toLocaleDateString('en-CA'),'X-Shift-Local-Hour':String(now.getHours())}}
})();
