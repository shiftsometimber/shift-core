export const checkinFollowupStyles=`
#dailyCheckinFollowup{margin:20px 0;padding:22px;border:1px solid #707762;border-radius:16px;background:#e7e3da;color:#050505;text-align:left}
#dailyCheckinFollowup[hidden]{display:none}
#dailyCheckinFollowup h2{margin:0 0 12px;font-size:1.5rem;color:#172113}
#dailyCheckinFollowup p{color:#172113;overflow-wrap:anywhere}
#dailyCheckinFollowup fieldset{border:0;padding:0;margin:18px 0;display:grid;gap:8px}
#dailyCheckinFollowup legend{font-weight:700;margin-bottom:10px}
#dailyCheckinFollowup label{display:flex;gap:10px;align-items:center;padding:10px;border:1px solid #707762;border-radius:8px;min-height:44px;cursor:pointer}
#dailyCheckinFollowup input{width:20px;height:20px;flex:0 0 20px;margin:0;appearance:auto}
#dailyCheckinFollowup button{padding:12px 18px;min-height:44px;border:1px solid #26391e;border-radius:8px;background:#26391e;color:#e7e3da;font:inherit;font-weight:700;cursor:pointer}
#dailyCheckinFollowup button:disabled{opacity:.65;cursor:wait}
#dailyCheckinFollowup a{color:#26391e;text-decoration:underline}
#dailyCheckinFollowup :focus-visible{outline:3px solid #487739;outline-offset:3px}
#checkinResult .checkin-action strong,#checkinResult .checkin-action small,#checkinResult .checkin-action p{color:#f5f2e9}
`;
export const checkinFollowupRuntime=String.raw`(()=>{
 'use strict';
 const labels={'helped':'It helped','not-fit':'It did not fit','not-tried':'I have not tried it yet','skip':'Skip this question'};
 let host,record,pending=false,generation=0,offered=null,dirty=false,operation=null;
 const element=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e};
 const params=new URLSearchParams(location.search),step=params.get('step'),shift=params.get('shift');
 const tool=/\/(?:grub|fit)(?:\.html)?$/.test(location.pathname);
 const endpoint=()=>String(window.SST_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'').replace(/\/v1$/,'')+'/v1/check-ins/follow-up';
 async function request(url,body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{const r=await fetch(url,{method:body?'POST':'GET',credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:controller.signal});const d=await r.json();if(!r.ok)throw Object.assign(Error(d.message||d.error||'Could not load or save feedback. Please try again.'),{status:r.status});return d}
  catch(e){if(e.name==='AbortError')throw Error('The request timed out. Reload to check your saved answer before retrying.');throw e}finally{clearTimeout(timer)}
 }
 function actionLink(a,r=record){const link=element('a',a.label||'Open this next step');const u=new URL(typeof a.href==='string'&&/^\/(?!\/)/.test(a.href)?a.href:'/member/dashboard#today',location.origin);if(r)u.searchParams.set(r.source==='life-back'?'shift':'step',r.id);link.href=u.pathname+u.search+u.hash;return link}
 function fromLife(action,active){if(action.kind==='clinic-quiet')action={...action,href:'/clinic-gone-quiet',label:'Prepare with the clinic-quiet guide'};return {source:'life-back',id:action.id,action,createdAt:action.createdAt,feedback:action.reviews?.at(-1)?.outcome,active};}
 function currentDestination(a){const path=new URL(a.href,location.origin).pathname;return path===location.pathname.replace('/staging/member-connected/','/member/');}
 function render(edit=false){
  document.dispatchEvent(new CustomEvent('sst:daily-feedback',{detail:record}));host.replaceChildren();host.hidden=!record;if(!record)return;
  const details=element('details'),summary=element('summary','After trying your step: did it help?');details.append(summary);details.open=edit||location.hash==='#dailyCheckinFollowup';host.append(details);
  details.append(element('h2','Did it help?'),element('p','Your saved step from '+new Date(record.createdAt).toLocaleDateString('en-GB')+':'),element('strong',record.action.title),element('p',record.action.detail));
  if(!tool)details.append(actionLink(record.action));
  const status=element('p');status.id='dailyFeedbackStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  if(record.feedback&&!edit){status.textContent='Feedback saved: '+labels[record.feedback]+'.';details.append(status);if(record.active!==false){const update=element('button','Update answer');update.type='button';update.addEventListener('click',()=>render(true));details.append(update)}const back=element('a','See your next step on Today →');back.href='/member/dashboard#today';details.append(back);return}
  if(record.active===false){details.append(element('p','This step has moved on. Open Today for your current step.'));return;}
  const form=element('form'),choices=element('fieldset');choices.append(element('legend','What happened?'));
  for(const [value,label]of Object.entries(labels)){const row=element('label'),input=element('input');input.type='radio';input.name='dailyFeedback';input.value=value;input.required=true;input.checked=record.feedback===value;row.append(input,element('span',label));choices.append(row)}
  const submit=element('button','Save feedback');submit.type='submit';form.append(choices,submit,status);details.append(element('p','Optional. Choosing a meal or opening Fit does not mean you ate it or completed a session. Answer after trying the step, or choose “I have not tried it yet”.'),form);
  form.addEventListener('change',()=>{dirty=true});
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(pending)return;const selected=form.querySelector('input:checked');if(!selected)return;
   pending=true;submit.disabled=true;choices.disabled=true;status.textContent='Saving feedback…';
   try{
    if(record.source==='life-back'){
     const signature=record.id+':'+selected.value;if(operation?.signature!==signature)operation={signature,id:crypto.randomUUID()};
     const saved=await request('/v1/life-back',{action:'shift-feedback',shiftId:record.id,outcome:selected.value,operationId:operation.id});
     const action=saved.progress.nextShift?.id===record.id?saved.progress.nextShift:saved.progress.shiftHistory.find(a=>a.id===record.id);
     record=fromLife(action,saved.progress.nextShift?.id===record.id);
    }else{
     const saved=await request(endpoint(),{actionId:record.id,revision:record.revision,outcome:selected.value});record=saved.followUp;
     if(record.action.loopId&&['helped','not-fit'].includes(record.feedback))record.active=false;
    }
    dirty=false;operation=null;render();host.querySelector('details').open=true;document.dispatchEvent(new CustomEvent('sst:action-reviewed'));
   }catch(e){status.textContent=e.status===401?'Please sign in again before saving feedback.':e.message;if(e.status===409){operation=null;const retry=element('button','Reload saved step');retry.type='button';retry.addEventListener('click',()=>{dirty=false;load()});status.append(retry)}}
   finally{pending=false;submit.disabled=false;choices.disabled=false}
  });
 }
 async function load(){
  if(!host||pending||dirty)return;const current=++generation;
  try{
   const data=await request(endpoint()+(step?'?actionId='+encodeURIComponent(step):''));if(current!==generation)return;
   record=data.followUp;
   if(data.trackingEnabled===false){record=null;render();return;}
   const life=await request('/v1/life-back');if(current!==generation)return;
   const active=life.progress?.nextShift;
   if(shift){const exact=[active,...(life.progress?.shiftHistory||[])].find(a=>a?.id===shift);record=exact?fromLife(exact,active?.id===shift):null;}
   else if(!step&&active&&(!record||active.createdAt>record.createdAt||record.action.loopId&&record.action.loopId!==active.id))record=fromLife(active,true);
   if(record?.action.loopId&&active?.id!==record.action.loopId)record.active=false;
   if(tool&&record&&!currentDestination(record.action))record=null;
   render();
  }catch(e){if(current!==generation)return;if(e.status===401){host.hidden=true;return}host.hidden=false;host.replaceChildren(element('h2','Your saved step'),element('p',e.message));const retry=element('button','Retry');retry.type='button';retry.addEventListener('click',load);host.append(retry)}
 }
 function boot(){
  host=document.getElementById('dailyCheckinFollowup');if(!host)return;
  const original=window.SST_API?.saveCheckIn;
  if(original){window.SST_API.saveCheckIn=async function(...args){const result=await original.apply(this,args);offered=result.nextStep;return result}}
  document.addEventListener('shift:mood-saved',()=>{
   ++generation;host.hidden=true;
   const card=document.querySelector('#checkinResult .checkin-action');if(!card||!offered)return;
   card.replaceChildren(element('small','YOUR SAVED NEXT STEP'),element('strong',offered.action.title),element('p',offered.action.detail),actionLink(offered.action,offered));
   const handoff=element('p','Saved to your private check-in history. After trying a food or movement step, you can say whether it helped on that page. One useful thing is enough.');const back=element('a','Back to Today →');back.href='/member/dashboard#today';card.append(handoff,back);
  });
  document.addEventListener('sst:today-rendered',()=>{const primary=document.querySelector('.mtm-next');if(primary)primary.after(host)});
  load();window.addEventListener('pageshow',event=>{if(event.persisted)load()});window.addEventListener('hashchange',()=>{if(location.hash==='#dailyCheckinFollowup'){const d=host.querySelector('details');if(d)d.open=true}else if(location.hash==='#today')load()});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();`;
