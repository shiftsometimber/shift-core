const BASE='https://api.shiftsometimber.co.uk/v1/hq/clinical/commissioning';
const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
let selected=null,record=null,tab='member',busy=false;
const labels={pending:'Pending',to_action:'To action',referred_back:'Referred back',signed_off:'Signed off',rejected:'Rejected',dispatched:'Test dispatched',full_length:'Full-length photo',weight:'Weight photo',previous_treatment:'Previous treatment',identity:'Identity fixture'};
const label=v=>labels[v]||v.replaceAll('_',' ');
function button(text,fn){const b=el('button',text);b.type='button';b.disabled=busy;b.addEventListener('click',fn);return b;}
function notice(text){$('notice').textContent=text;}
async function api(path='',body){const r=await fetch(BASE+path,{credentials:'include',cache:'no-store',...(body!==undefined?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});let b;try{b=await r.json();}catch{throw Error('The service did not return a valid response. No success has been assumed.');}if(!r.ok){if([401,403].includes(r.status)){record=null;selected=null;$('orders').replaceChildren();$('detail').replaceChildren(el('h2','HQ sign-in & MFA required'),el('p','Complete your own MFA enrolment in HQ, then refresh this workspace. No access controls have been bypassed.'));$('create').disabled=true;}throw Error(label(b.error||'service_unavailable'));}return b;}
async function task(fn){if(busy)return;busy=true;$('refresh').disabled=true;$('create').disabled=true;for(const b of document.querySelectorAll('#detail button'))b.disabled=true;try{await fn();notice('Saved on the server · synthetic test only · messages withheld.');}catch(e){notice(e.message);}finally{busy=false;$('refresh').disabled=false;for(const b of document.querySelectorAll('#orders button'))b.disabled=false;if(record){$('create').disabled=false;render();}}}
async function loadOrders(){const b=await api();$('orders').replaceChildren();$('create').disabled=false;for(const o of b.orders){const n=button(o.orderNumber+' · '+label(o.status),()=>task(()=>open(o.orderNumber)));n.className='record';n.setAttribute('aria-pressed',String(selected===o.orderNumber));$('orders').append(n);}if(!b.orders.length)$('orders').append(el('p','No test orders yet. Create one to begin.'));return b;}
async function open(number){const b=await api('/'+number);selected=number;record=b;await loadOrders();render();}
async function action(action,document){await task(async()=>{const b=await api('/'+selected+'/action',{version:record.order.version,action,...document?{document}:{}});record=b;await loadOrders();});}
function list(parent,title,items){const card=el('section',undefined,'card');card.append(el('h3',title));const ul=el('ul');for(const text of items)ul.append(el('li',text));card.append(ul);parent.append(card);}
function render(){if(!record)return;const root=$('detail'),s=record.order;root.replaceChildren();root.append(el('p','INTERNAL TEST · '+s.orderNumber,'eyebrow'),el('h2','Alex Example · '+label(s.status)),el('p','Saved revision '+s.version+' · '+new Date(s.updatedAt).toLocaleString('en-GB')));
 const tabs=el('div',undefined,'actions');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Test perspective');for(const [key,title]of [['member','My Shift'],['clinician','Clinician'],['dispensing','Dispensing'],['communications','Notifications'],['audit','Audit history']]){const b=button(title,()=>{tab=key;render();});b.setAttribute('aria-pressed',String(tab===key));tabs.append(b);}root.append(tabs);
 if(tab==='member'){
  if(s.actionNeeded){const a=el('section',undefined,'attention');a.append(el('h3','Action needed'),el('p',record.views.member.message),button('Submit synthetic response',()=>action('member_respond')));root.append(a);}else root.append(el('p',record.views.member.message));
  list(root,'Recent activity',record.views.member.recentActivity.slice(0,8).map(e=>label(e.action)+' · '+new Date(e.at).toLocaleString('en-GB')));
  list(root,'Documents',s.documents.map(d=>label(d.kind)+' · '+label(d.status)+' · revision '+d.revision));
  const app=el('details');app.append(el('summary','My Timber updates'),el('p',s.app.source+' · weight '+s.app.weightKg+' kg · '+s.app.wellbeing));root.append(app);
  list(root,'Prescriptions & tracking',s.prescription?['Synthetic reference: '+s.prescription.id,'Not a legally issued prescription',s.fulfilment?.tracking?'Test tracking: '+s.fulfilment.tracking.number+' — no parcel sent':'Not dispatched']:['No prescription history for this test order.']);
 }else if(tab==='clinician'){
  root.append(el('p','Clinical perspective — owner-led synthetic acceptance, not a prescriber session. No member email, telephone or delivery address is exposed.','muted'));
  list(root,'Member card',['Alex Example','Date of birth: '+s.member.dateOfBirth,'Current order: '+s.orderNumber]);
  if(s.status==='pending')root.append(button('Start review',()=>action('review')));
  for(const d of s.documents){const card=el('section',undefined,'card');card.append(el('h3',label(d.kind)),el('p',label(d.status)+' · revision '+d.revision),el('p','Synthetic document placeholder. No real image has been uploaded.'));
   if(d.kind==='identity')card.append(el('p','No AI identity decision is made by this fixture.'));
   else if(s.status==='to_action'){const actions=el('div',undefined,'actions');actions.append(button('Approve '+label(d.kind),()=>action('approve_picture',d.kind)),button('Reject '+label(d.kind),()=>action('reject_picture',d.kind)));if(d.kind==='full_length')actions.append(button('Request replacement photo',()=>action('query_photo')));card.append(actions);}root.append(card);}
  if(s.status==='to_action'){const a=el('div',undefined,'actions');a.append(button('Ask for more information',()=>action('query_info')),button('Sign off test assessment',()=>action('sign_off')),button('Reject test assessment',()=>action('reject')));root.append(a);}list(root,'Prescription history',s.prescription?[s.prescription.id+' · synthetic, not legally issued']:['None for this test order.']);
 }else if(tab==='dispensing'){
  root.append(el('p','Uses the production dispensing state-transition rules with fixed test-only prescription and stock fixtures. This does not verify a pharmacy integration.','muted'));
  if(!s.fulfilment)root.append(el('p','Awaiting clinical sign-off.'));
  else{list(root,'Dispensing card',['Order: '+s.orderNumber,'State: '+label(s.fulfilment.status),'Stock fixture: '+(s.stockAvailable?'available':'no stock')]);const a=el('div',undefined,'actions');
   if(['received','query'].includes(s.fulfilment.status))a.append(button('Accept test prescription',()=>action('accept')));
   if(s.fulfilment.status==='accepted')a.append(button('Start test dispensing',()=>action('prepare')));
   if(s.fulfilment.status==='preparing')a.append(button('Record test dispatch',()=>action('dispatch')));
   if(['received','query','accepted','preparing'].includes(s.fulfilment.status))a.append(button(s.stockAvailable?'Set test stock unavailable':'Set test stock available',()=>action(s.stockAvailable?'stock_off':'stock_on')),button('Query test supply',()=>action('pharmacy_query')),button('Reject test supply',()=>action('pharmacy_reject')));root.append(a);}
 }else if(tab==='communications'){
  root.append(el('h3','Trigger previews — never sent'),el('p','No recipient, email sender or WhatsApp sender is connected to this queue. Exact production wording and recipients still require Matt’s approval.'));
  for(const n of record.notifications){const card=el('section',undefined,'card');card.append(el('h3',label(n.channel)+' · '+label(n.template)),el('p',n.body),el('p','Withheld · '+new Date(n.created_at).toLocaleString('en-GB'),'muted'));root.append(card);}if(!record.notifications.length)root.append(el('p','No notification triggers yet.'));
 }else{root.append(el('p','Each state change is recorded transactionally. Read-access events are retained separately in the same immutable audit table.'));list(root,'Order audit',record.events.map(e=>new Date(e.created_at).toLocaleString('en-GB')+' · '+label(e.action)+' · HQ actor '+e.actor_id));}
}
$('refresh').addEventListener('click',()=>task(async()=>{await loadOrders();if(selected)await open(selected);}));
$('create').addEventListener('click',()=>task(async()=>{const b=await api('',{});selected=b.order.orderNumber;record=b;await loadOrders();}));
task(async()=>{const b=await loadOrders();if(b.orders.length)await open(b.orders[0].orderNumber);else $('detail').replaceChildren(el('h2','Ready for internal testing'),el('p','Create a fixed synthetic order. No patient information is requested.'));});
