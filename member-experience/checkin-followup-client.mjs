export const checkinFollowupStyles=`
#dailyCheckinFollowup{margin:20px 0;padding:22px;border:1px solid #707762;border-radius:16px;background:#f5f2e9;color:#172113;text-align:left}
#dailyCheckinFollowup[hidden]{display:none}
#dailyCheckinFollowup h2{margin:0 0 12px;font-size:1.5rem;color:#172113}
#dailyCheckinFollowup p{color:#172113;overflow-wrap:anywhere}
#dailyCheckinFollowup fieldset{border:0;padding:0;margin:18px 0;display:grid;gap:8px}
#dailyCheckinFollowup legend{font-weight:700;margin-bottom:10px}
#dailyCheckinFollowup label{display:flex;gap:10px;align-items:center;padding:10px;border:1px solid #707762;border-radius:8px;min-height:44px;cursor:pointer}
#dailyCheckinFollowup input{width:20px;height:20px;flex:0 0 20px;margin:0;appearance:auto}
#dailyCheckinFollowup button{padding:12px 18px;min-height:44px;border:1px solid #26391e;border-radius:8px;background:#26391e;color:white;font:inherit;font-weight:700;cursor:pointer}
#dailyCheckinFollowup button:disabled{opacity:.65;cursor:wait}
#dailyCheckinFollowup a{color:#26391e;text-decoration:underline}
#dailyCheckinFollowup :focus-visible{outline:3px solid #487739;outline-offset:3px}
#checkinResult .checkin-action strong,#checkinResult .checkin-action small,#checkinResult .checkin-action p{color:#f5f2e9}
`;
export const checkinFollowupRuntime='('+function(){
 'use strict';
 const labels={'helped':'It helped','not-fit':'It did not fit','not-tried':'I have not tried it yet','skip':'Skip this question'};
 let host,record,pending=false,generation=0,offered=null;
 const element=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e};
 const endpoint=()=>String(window.SST_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'').replace(/\/v1$/,'')+'/v1/check-ins/follow-up';
 async function api(body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{const r=await fetch(endpoint(),{method:body?'POST':'GET',credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:controller.signal});const d=await r.json();if(!r.ok)throw Object.assign(Error(d.message||'Could not load or save feedback. Please try again.'),{status:r.status});return d}
  catch(e){if(e.name==='AbortError')throw Error('The request timed out. Reload to check your saved answer before retrying.');throw e}finally{clearTimeout(timer)}
 }
 function actionLink(a){const link=element('a',a.label||'Open this next step');link.href=typeof a.href==='string'&&/^\/(?!\/)/.test(a.href)?a.href:'/member/dashboard#today';return link}
 function render(edit=false){
  host.replaceChildren();host.hidden=!record;if(!record)return;
  host.append(element('h2','Did it help?'),element('p','Your next step from the check-in on '+new Date(record.createdAt).toLocaleDateString('en-GB')+':'),element('strong',record.action.title),element('p',record.action.detail),actionLink(record.action));
  const status=element('p');status.id='dailyFeedbackStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  if(record.feedback&&!edit){status.textContent='Feedback saved: '+labels[record.feedback]+'.';const update=element('button','Update answer');update.type='button';update.addEventListener('click',()=>render(true));host.append(status,update);return}
  const form=element('form'),choices=element('fieldset');choices.append(element('legend','What happened?'));
  for(const [value,label]of Object.entries(labels)){const row=element('label'),input=element('input');input.type='radio';input.name='dailyFeedback';input.value=value;input.required=true;input.checked=record.feedback===value;row.append(input,element('span',label));choices.append(row)}
  const submit=element('button','Save feedback');submit.type='submit';form.append(choices,submit,status);host.append(element('p','Optional. Opening a link does not mean you tried or completed the step.'),form);
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(pending)return;const selected=form.querySelector('input:checked');if(!selected)return;
   pending=true;submit.disabled=true;choices.disabled=true;status.textContent='Saving feedback…';
   try{const saved=await api({actionId:record.id,revision:record.revision,outcome:selected.value});record=saved.followUp;render()}
   catch(e){status.textContent=e.status===401?'Please sign in again before saving feedback.':e.message}
   finally{pending=false;submit.disabled=false;choices.disabled=false}
  });
 }
 async function load(){
  if(!host||pending)return;const current=++generation;
  try{const data=await api();if(current!==generation)return;record=data.followUp;render()}
  catch(e){if(current!==generation)return;if(e.status===401){host.hidden=true;return}host.hidden=false;host.replaceChildren(element('h2','Your check-in follow-up'),element('p',e.message));const retry=element('button','Retry');retry.type='button';retry.addEventListener('click',load);host.append(retry)}
 }
 function boot(){
  host=document.getElementById('dailyCheckinFollowup');if(!host)return;
  const original=window.SST_API?.saveCheckIn;
  if(original){window.SST_API.saveCheckIn=async function(...args){const result=await original.apply(this,args);offered=result.nextStep;return result}}
  document.addEventListener('shift:mood-saved',()=>{
   ++generation;host.hidden=true;
   const card=document.querySelector('#checkinResult .checkin-action');if(!card||!offered)return;
   card.replaceChildren(element('small','YOUR SAVED NEXT STEP'),element('strong',offered.action.title),element('p',offered.action.detail),actionLink(offered.action));
  });
  load();window.addEventListener('pageshow',event=>{if(event.persisted)load()});window.addEventListener('hashchange',()=>{if(location.hash==='#today')load()});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
}.toString()+')();';
