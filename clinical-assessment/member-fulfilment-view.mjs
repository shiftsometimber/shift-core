const labels={received:'With the dispensing team',accepted:'Accepted for dispensing',preparing:'Being prepared',dispatched:'Dispatched',delivered:'Delivery recorded',delivery_exception:'Delivery needs attention',returned:'Returned to the pharmacy',cancelled:'Supply cancelled',rejected:'Supply declined',query:'More information needed'};
const activities={prescription_received:'Prescription handover received',fulfilment_accept:'Dispensing team accepted the handover',fulfilment_prepare:'Preparation started',fulfilment_dispatch:'Dispatch recorded',fulfilment_delivered:'Delivery recorded by the pharmacy',fulfilment_delivery_exception:'Delivery exception recorded',fulfilment_returned:'Return recorded',fulfilment_cancel:'Supply cancelled',fulfilment_reject:'Supply declined',fulfilment_query:'Dispensing team requested information',member_fulfilment_reply:'Your reply was received'};
const date=v=>{const d=new Date(v);return Number.isFinite(d.valueOf())?d.toLocaleString('en-GB'):'Date unavailable';};
export function fulfilmentPanel(data,{node,button,onReply}){
 if(!data)return null;
 const box=node('section');box.className='fulfilment-card'+(data.actionNeeded?' needs-attention':'');box.setAttribute('aria-label','Your dispensing and delivery');
 box.append(node('p','MY SHIFT / '+data.orderNumber),node('h2',labels[data.status]||'Order update'),node('p','Last updated: '+date(data.updatedAt)));
 if(data.message)box.append(node('p',data.message));
 if(data.actionNeeded)box.append(node('strong','Action needed from you'));
 if(data.canReply){const input=node('textarea');input.maxLength=2000;input.setAttribute('aria-label','Your reply to the dispensing team');box.append(input,button('Submit reply to dispensing team',async()=>{if(!input.value.trim())throw Error('Enter your reply before submitting.');await onReply({version:data.version,queryId:data.queryId,message:input.value});}));}
 if(data.memberReply)box.append(node('h3','Your latest reply'),node('p',data.memberReply.message),node('p','Received '+date(data.memberReply.createdAt)));
 if(data.prescriptionId)box.append(node('p','Prescription reference: '+data.prescriptionId));
 if(data.tracking){const details=node('div');details.append(node('h3','Tracking'),node('p','Reference: '+data.tracking.number));
  if(typeof data.tracking.url==='string'&&/^https:\/\/(www\.royalmail\.com|track\.dpd\.co\.uk)\//.test(data.tracking.url)){const a=node('a','Track with the courier');a.href=data.tracking.url;a.target='_blank';a.rel='noopener noreferrer';details.append(a);}box.append(details);
 }
 if(data.deliveryUpdate)box.append(node('p','Delivery update recorded by the pharmacy on '+date(data.deliveryUpdate.recordedAt)+'. This is not an independently verified courier event.'));
 if(data.events?.length){const history=node('details');history.append(node('summary','Order activity'));const list=node('ol');for(const e of [...data.events].reverse().slice(0,50))list.append(node('li',(activities[e.action]||'Order update')+' · '+date(e.created_at)));history.append(list);box.append(history);}
 return box;
}
