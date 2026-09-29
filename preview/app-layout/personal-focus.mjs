// Uses the existing Life Back account record and consent gate. No browser storage.
export const focusStyles=`
html body[data-app-layout="preview"] #todayActions.app-today-v3 .today-focus{margin:0 0 20px;padding:18px 20px;border:1px solid #707762;border-radius:16px;background:#11160f;color:#e7e3da}
html body[data-app-layout="preview"] #todayActions.app-today-v3 .today-focus :is(p,label,summary){color:#e7e3da;font:14px/1.5 Arial,sans-serif}
html body[data-app-layout="preview"] #todayActions.app-today-v3 .today-focus h3{font:700 23px/1.2 Arial,sans-serif;color:#e7e3da;margin:6px 0 10px}
html body[data-app-layout="preview"] #todayActions.app-today-v3 .today-focus summary{cursor:pointer;min-height:44px;padding:10px 0;box-sizing:border-box}
html body[data-app-layout="preview"] #todayActions.app-today-v3 .today-focus form{display:grid;gap:12px;padding-top:12px}
html body[data-app-layout="preview"] #todayActions.app-today-v3 .today-focus :is(input,select){width:100%;min-height:46px;box-sizing:border-box;border:1px solid #707762;border-radius:8px;background:#e7e3da;color:#050505;font:16px Arial,sans-serif;padding:12px}
html body[data-app-layout="preview"] #todayActions.app-today-v3 .today-focus button{min-height:44px;border:1px solid #707762;border-radius:8px;background:#e7e3da;color:#050505;font:700 14px Arial,sans-serif;padding:12px;cursor:pointer}
html body[data-app-layout="preview"] #todayActions.app-today-v3 .today-focus [data-focus-alternative]{background:transparent;color:#e7e3da;margin-top:12px}
html body[data-app-layout="preview"] #todayActions.app-today-v3>.mtm-next{margin:0 0 20px!important}
`;
export const focusClient=String.raw`(()=>{
 let generation=0;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
 async function request(body){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const response=await fetch('/v1/life-back',{credentials:'same-origin',cache:'no-store',signal:controller.signal,...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok)throw Object.assign(Error(data.error||'Could not load your saved goal.'),{status:response.status});return data}finally{clearTimeout(timer)}}
 function mount(event){
  const root=document.querySelector('#todayActions.app-today-v3'),nav=root?.querySelector('.app-today-shortcuts');if(!nav||root.querySelector('.today-focus'))return;
  const token=++generation,c=event.detail?.connected||{},box=el('section');box.className='today-focus';box.setAttribute('aria-label','Your goal and what would help');
  const goal=c.lifeBack?.goal,personal=goal&&goal!=='Your personal goal';
  const heading=el('h3',personal?goal:'What would you like to get back?');box.append(el('p',personal?'WHAT MATTERS TO YOU':'MAKE THIS YOURS · OPTIONAL'),heading);
  if(personal)box.append(el('p','Your goal stays in view. Choose the everyday support that would help you take a step towards it.'));
  else box.append(el('p','More energy for your day? Keeping up with the kids? Tell us what matters, or go straight to Grub or Fit.'));
  if(c.lifeBack?.recordedWin)box.append(el('p','You recorded: “'+c.lifeBack.recordedWin+'”'));
  const details=el('details'),summary=el('summary',personal?'Change what would help today':'Choose your goal and a first step');details.append(summary);
  const form=el('form'),goalLabel=el('label','What do you want to get back? Optional.'),input=el('input');input.id='todayFocusGoal';input.maxLength=70;input.placeholder='For example: keep up with the kids';input.value=personal?goal:'';goalLabel.htmlFor=input.id;
  const needLabel=el('label','What’s getting in the way?'),select=el('select');select.id='todayFocusNeed';select.required=true;needLabel.htmlFor=select.id;
  for(const [value,label]of [['','Choose what fits today'],['food','Food needs to be easier'],['movement','I need manageable movement'],['routine','My evening routine has gone out of the window'],['confidence','I’ve lost momentum'],['steady','I want to keep a useful habit going']]){const option=el('option',label);option.value=value;select.append(option)}
  const save=el('button','Save and show my next step');save.type='submit';save.disabled=true;
  const status=el('p','Loading your saved choices…');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  form.append(goalLabel,input,needLabel,select,el('p','This saves to your existing Life Back record. Changing your goal starts a new set of ratings; your old entries stay in your history.'),save,status);details.append(form);box.append(details);nav.after(box);
  const next=root.querySelector('.mtm-next');if(c.next?.loopId&&next){box.after(next);const action=next.querySelector('.mt-now-action[href]');if(action){const key=new URL(action.href).pathname.split('/').pop();if(['grub','fit','life-back'].includes(key)&&!action.hasAttribute('data-fit-today-handoff'))action.dataset.appOpen=key}}
  let progress=null,busy=false,operation=null;
  const alternative=el('button','Try a different approach');alternative.type='button';alternative.dataset.focusAlternative='';alternative.hidden=true;details.append(alternative);
  async function load(){try{const data=await request();if(token!==generation||!box.isConnected)return;progress=data.progress;select.value=['food','movement','routine','confidence','steady'].includes(progress.supportNeed)?progress.supportNeed:'';save.disabled=false;status.textContent='';box.dataset.focusReady='true';alternative.hidden=!progress.nextShift||!['food','movement','routine','confidence','steady'].includes(progress.nextShift.kind)}catch(error){if(box.isConnected){status.textContent='Your saved choices could not load. You can still use Grub and Fit.';const retry=el('button','Retry');retry.type='button';retry.addEventListener('click',()=>{retry.remove();load()});status.append(retry)}}}
  async function submit(different=false){
   if(busy||!progress)return;const payload=different?{action:'focus',revision:progress.revision,supportNeed:progress.nextShift.kind,approach:'different'}:{action:'focus',revision:progress.revision,supportNeed:select.value,...(input.value.trim()?{goal:input.value.trim()}:{})};
   const signature=JSON.stringify(payload);if(operation?.signature!==signature)operation={signature,id:crypto.randomUUID()};payload.operationId=operation.id;busy=true;save.disabled=true;alternative.disabled=true;input.disabled=true;select.disabled=true;status.textContent='Saving your choice…';
   try{
    if(!window.SST_HEALTH_CONSENT||!await window.SST_HEALTH_CONSENT.ensure()){status.textContent='Nothing saved. You can still use Grub and Fit.';return}
    await request(payload);status.textContent='Saved. Updating your next step…';document.dispatchEvent(new CustomEvent('sst:refresh-today'));document.dispatchEvent(new CustomEvent('sst:focus-saved'));
   }catch(error){status.textContent=error.status===409?'Your saved choices changed. Reload them before trying again.':error.name==='AbortError'?'The save timed out. Reload your saved choices before trying again.':error.message;const retry=el('button','Reload saved choices');retry.type='button';retry.addEventListener('click',()=>{operation=null;retry.remove();load()});status.append(retry)}finally{busy=false;save.disabled=false;alternative.disabled=false;input.disabled=false;select.disabled=false}
  }
  form.addEventListener('submit',event=>{event.preventDefault();submit()});alternative.addEventListener('click',()=>submit(true));load();
 }
 document.addEventListener('sst:today-rendered',mount);
})();`;
