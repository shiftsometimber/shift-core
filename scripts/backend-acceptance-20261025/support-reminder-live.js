(async()=>{
 const out=window.__shiftSupportSavedReminderQA20261025={state:'running',startedAt:new Date().toISOString(),messagesRequested:0,devicesRegistered:0,physicalReceiptClaimed:false,attempt:2,requestSteps:[]};
 const ensure=(ok,m)=>{if(!ok)throw Error(m)};
 const http=async(path,method='GET',body)=>{await new Promise(resolve=>setTimeout(resolve,900));const started=Date.now();out.currentOperation={path,method,startedAt:new Date().toISOString()};const r=await fetch(location.origin+path,{method,credentials:'include',cache:'no-store',signal:AbortSignal.timeout(30000),...(body===undefined?{}:{body:JSON.stringify(body),headers:{'Content-Type':'application/json'}})});const privateResponse=/private|no-store/i.test(r.headers.get('Cache-Control')||'');let data;try{data=await r.json()}catch{}out.requestSteps.push({path,method,status:r.status,durationMs:Date.now()-started});out.currentOperation=null;return{status:r.status,data,private:privateResponse}};
 const good=r=>{ensure(r.status>=200&&r.status<300,'HTTP '+r.status+' '+(r.data?.error||''));ensure(r.private,'Private response required');return r.data};
 let created=false,revision=null,lastState=null,originalConsent=false,consentKnown=false,reminderId=null;
 const root='/v1/my-timber-support';
 try{
  const identity=good(await http('/v1/me')),id=Number(identity.user?.id);ensure([11251,11252].includes(id)&&identity.user.source==='owner_authorised_internal_test','Approved internal test account required');out.accountId=id;
  const consents=good(await http('/v1/consents')).consents||[];
  const prior=consents.filter(x=>x.consent_type==='good_to_talk_followthrough').sort((a,b)=>Number(b.id)-Number(a.id))[0];originalConsent=Number(prior?.granted||0)===1;consentKnown=true;
  const before=good(await http(root));ensure(before.account===String(id),'Support ownership differs');ensure(before.state===null&&!before.deviceEnabled,'Preserve existing saved support or device data; this case needs an empty approved test account');
  const originalExport=good(await http('/v1/privacy/export','POST',{})).goodToTalkFollowThrough;
  ensure(originalExport&&originalExport.state===null&&(originalExport.deliveryHistory||[]).length===0&&(originalExport.deliveries||[]).length===0&&(originalExport.deviceReminders||[]).length===0,'Preserve existing support receipt history');
  const body={step:'review',status:'not_contacted',reminderAt:new Date(Date.now()+86400000).toISOString(),consent:true,revision:before.revision,operationId:crypto.randomUUID()};
  const first=await http(root,'PUT',body),saved=good(first);ensure(first.status===201&&saved.state?.reminder?.id,'Actual saved future reminder required');created=true;revision=saved.revision;lastState=saved.state;reminderId=saved.state.reminder.id;out.syntheticReminderId=reminderId;
  const replay=good(await http(root,'PUT',body));ensure(replay.revision===revision&&replay.state?.reminder?.id===reminderId,'Known successful operation was not idempotent');
  const stale=await http(root,'PUT',{...body,operationId:crypto.randomUUID()});ensure(stale.status===409&&stale.data?.error==='changed_in_another_tab','Stale save was not rejected');
  const reopened=good(await http(root));ensure(reopened.state?.reminder?.id===reminderId&&!reopened.deviceEnabled,'Actual saved reminder did not reload without a device');
  const exported=good(await http('/v1/privacy/export','POST',{}));ensure(Number(exported.user?.id)===id&&exported.goodToTalkFollowThrough?.state?.reminder?.id===reminderId,'Actual own-account export omitted the saved reminder');
  const cal=await fetch(location.origin+root+'/calendar.ics',{credentials:'include',cache:'no-store',signal:AbortSignal.timeout(30000)}),calendar=await cal.text();ensure(cal.status===200&&/private|no-store/i.test(cal.headers.get('Cache-Control')||''),'Calendar was not private');ensure(calendar.includes('UID:'+reminderId+'@shiftsometimber.co.uk')&&calendar.includes('CLASS:PRIVATE')&&calendar.includes('SUMMARY:My Timber reminder'),'Calendar does not match this chosen private reminder');
  const cancelled=good(await http(root,'PUT',{...body,reminderAt:null,revision,operationId:crypto.randomUUID()}));ensure(cancelled.state?.reminder===null,'Reminder was not cancelled');revision=cancelled.revision;lastState=cancelled.state;
  const absent=await http(root+'/calendar.ics');ensure(absent.status===409&&absent.data?.error==='no_reminder','Cancelled reminder still has an active calendar event');
  out.serverCases={savedAndReopened:true,knownOperationIdempotent:true,staleWriteStatus:409,ownExportIncludesReminder:true,privateCalendarVerified:true,cancellationVerified:true,noDeviceRegistered:true};
 }catch(e){out.error=String(e.message).slice(0,260)}
 finally{
  try{
   if(created){
    const current=good(await http(root));ensure(current.revision===revision&&JSON.stringify(current.state)===JSON.stringify(lastState)&&!current.deviceEnabled,'Another writer changed this support record; automatic cleanup paused');
    const cleared=good(await http(root,'DELETE',{revision:current.revision}));ensure(cleared.state===null,'Synthetic saved step was not cleared');
    if(originalConsent)good(await http('/v1/consents','POST',{type:'good_to_talk_followthrough',granted:true,version:'backend-launch-qa-restore-20261025'}));
    const final=good(await http(root));ensure(final.state===null&&!final.deviceEnabled,'Original empty support/device state not restored');
    const list=good(await http('/v1/consents')).consents||[],last=list.filter(x=>x.consent_type==='good_to_talk_followthrough').sort((a,b)=>Number(b.id)-Number(a.id))[0];ensure((Number(last?.granted||0)===1)===originalConsent,'Original support consent was not restored');
    const exp=good(await http('/v1/privacy/export','POST',{})).goodToTalkFollowThrough;ensure(exp.state===null&&(exp.deliveryHistory||[]).length===0&&(exp.deviceReminders||[]).length===0,'Unexpected retained test support data');
    out.originalEmptyStateAndConsentRestored=true;
   }
  }catch(e){out.cleanupError=String(e.message).slice(0,260)}
  out.ok=!!out.serverCases&&out.originalEmptyStateAndConsentRestored===true&&!out.error&&!out.cleanupError;out.state='completed';out.finishedAt=new Date().toISOString();
 }
})();'Finite isolated saved-reminder QA started';