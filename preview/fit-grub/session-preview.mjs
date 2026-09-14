import assert from 'node:assert/strict';

export function applySessionPreview(source){
  const replace=(from,to)=>{assert.ok(source.includes(from),`Preview renderer hook missing: ${from.slice(0,55)}`);source=source.replace(from,to);};
  replace("'Resistance band','Dumbbells','Full gym'","'Resistance band','Dumbbells','Wall','Fixed counter','Full gym'");
  replace('1,326 reviewed exercise options','300 movement guides');
  replace('26 core movement patterns','2,688 source protocols');
  replace('Built around UK activity guidance','Content preview · technique review pending');
  replace('const dose=[x.sets','const dose=formatPreviewDose(x.dose_text)||[x.sets');
  replace('function exercise(x,allowFeedback=true){',`function formatPreviewDose(value){return String(value||'').replace(/sets: (\\d+)/g,'$1 sets').replace(/reps: ([^\\n]+)/g,'$1 reps').replace(/time seconds: (\\d+)/g,(_,n)=>Number(n)%60===0?Number(n)/60+' min':n+' sec').replace(/rest seconds: (\\d+)/g,'$1 sec rest').replace(/\\n/g,' · ')}\nfunction exercise(x,allowFeedback=true){`);
  replace('preferences:`${p.goal}. ${p.notes}`,limitations:p.limitations','preferences:`${p.goal}. ${p.notes}`,goal:p.goal,notes:p.notes,limitations:p.limitations');
  // Swap with the profile which built the session, not unsaved form edits.
  replace('const p=readProfile(),exclude=',"const p=memberState.preferences?.fit||readProfile(),exclude=");
  replace('preferences:`${p.goal}. ${p.notes}`,limitations:p.limitations','preferences:`${p.goal}. ${p.notes}`,goal:p.goal,notes:p.notes,minutes_per_day:p.minutes,limitations:p.limitations');
  replace("await SST_API.fitFeedback({entity_id:id,sentiment:'nay',context:{surface:'fit_programme_uk',reason:'swap_requested'}});",'');
  replace("if(!r.exercise)throw new Error('No suitable replacement found.');","if(!r.exercise)throw new Error('No suitable replacement found.');await SST_API.fitFeedback({entity_id:id,sentiment:'nay',context:{surface:'fit_programme_uk',reason:'swap_requested'}});");
  replace('Saved. Your next plan will use this automatically.','Saved in this preview browser.');
  replace('Device notifications are being securely configured. Email nudges work now.','Notifications and email are disabled in this preview.');
  replace("<span>${minutes} planned minutes</span>","<span>${minutes} ${p.timing_kind==='time_budget'?'minute time window':'planned minutes'}</span>");
  replace('Log it and Shift will put it into Progress and use it tomorrow.','Test the completion flow. This saves only in this preview browser.');
  replace('<button class="sf-primary" data-complete="0">','<label>Minutes actually completed<input id="sfActualMinutes" type="number" min="1" max="${minutes}" inputmode="numeric" placeholder="Enter minutes"></label><button class="sf-primary" data-complete="0">');
  replace("minutes=Number(session.dataset.minutes)||20;try{await SST_API.completeFitToday", "minutes=Number($('#sfActualMinutes')?.value);if(!Number.isFinite(minutes)||minutes<=0||minutes>Number(session.dataset.minutes)){button.disabled=false;$('#sfStatus').textContent='Enter the minutes actually completed, within this session’s time window.';return}try{await SST_API.completeFitToday");
  replace('You showed up. Shift has logged the session in Progress and will use it when choosing tomorrow’s movement.','${minutes} minutes saved in this preview browser. Your live Progress has not changed.');
  replace('<a class="sf-secondary" href="/member/dashboard">Back to My Timber</a>','<a class="sf-secondary" href="/member/fit">Back to Fit preview</a>');
  replace("$('#sfForm').onsubmit=saveProfile;","$('#sfForm').onsubmit=event=>{saveProfile(event).catch(()=>{$('#sfSave').textContent='Could not save. Your previous profile is kept; please retry.'})};");
  // A failure after a previous successful build must not leave a stale completable plan.
  replace("$('#sfStatus').textContent='Saving your profile and building today’s session…';", "$('#sfStatus').textContent='Saving your profile and building today’s session…';$('#sfResults').innerHTML='';currentPlan=null;");
  return source;
}
