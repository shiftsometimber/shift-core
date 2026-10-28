import {emailDraft,parseJSON,sha256,testRecipient} from './fulfilment-model.mjs';

export const mailFrom='orders@shiftsometimber.co.uk';
export const mailReplyTo='partners@shiftsometimber.co.uk';
export const mailZone='Europe/London';
export const mailFail=(message,status=400,code='invalid_request')=>Object.assign(new Error(message),{status,code});
export function orderContext(batch){
 const snapshot=parseJSON(batch.snapshot_json),rows=snapshot.rows||[];
 return (snapshot.orders||[]).map(order=>{
  const matching=rows.filter(row=>row.order_reference===order.reference);
  return {...order,placedAt:order.placedAt||null,customerName:order.customerName||matching[0]?.recipient||'',recipient:order.recipient||matching[0]?.recipient||'',products:(order.products||[]).map((product,index)=>({...product,supplierSku:product.supplierSku||matching[index]?.supplier_sku||null}))};
 });
}
export async function reviewedEnvelope(batch){
 const draft=emailDraft(batch),orders=orderContext(batch),test=batch.mode==='test';
 const refs=orders.map(order=>order.reference).join(', ');
 const body=draft.body+'\n\nBatch context\nOrder references: '+refs+'\nOrders: '+batch.order_count+'\nProduct lines: '+batch.row_count+'\nPrepared: '+batch.created_at+'\nBatch reference: '+batch.id;
 const envelope={partner:test?'SHIFT test mailbox':'Testing partner',from:mailFrom,replyTo:mailReplyTo,to:test?[testRecipient]:draft.to,cc:[],subject:draft.subject,body,attachments:draft.attachments,orders};
 const reviewHash=await sha256(JSON.stringify({envelope,batchRevision:batch.revision,configRevision:batch.config_revision,csvHash:batch.csv_sha256}));
 return {envelope,reviewHash};
}
const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:mailZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function londonParts(milliseconds){const p=Object.fromEntries(formatter.formatToParts(new Date(milliseconds)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;}
export function londonSchedule(date,time,now=Date.now(),offsetChoice){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!/^\d{2}:\d{2}$/.test(time||''))throw mailFail('Choose a valid date and time.');
 const local=date+'T'+time,base=Date.parse(local+':00Z');
 if(!Number.isFinite(base)||new Date(base).toISOString().slice(0,16)!==local)throw mailFail('Choose a valid date and time.');
 const candidates=[base-3600000,base].filter(value=>londonParts(value)===local);
 if(!candidates.length)throw mailFail('That UK time does not exist because the clocks change. Choose another time.');
 if(candidates.length>1&&!['first','second'].includes(offsetChoice))throw mailFail('That UK time occurs twice because the clocks change. Choose the first or second occurrence.',400,'ambiguous_time');
 const value=candidates[offsetChoice==='second'?1:0];
 if(value<now+60000)throw mailFail('Choose a send time at least one minute in the future.');
 if(value>now+90*86400000)throw mailFail('Choose a date within the next 90 days.');
 return {utc:new Date(value).toISOString(),local,timeZone:mailZone,offsetMinutes:(base-value)/60000};
}
export function providerMessage(batch,envelope){
 if(batch.mode==='test'&&(envelope.to.length!==1||envelope.to[0]!==testRecipient))throw mailFail('Synthetic emails can only go to the SHIFT Gmail test account.',409);
 // Send explicit binary bytes. The live binding treated a base64 string as
 // literal text despite the documented string example; binary is unambiguous.
 const bytes=new TextEncoder().encode(batch.csv_text);
 return {from:{email:envelope.from,name:'SHIFT Health'},replyTo:envelope.replyTo,to:envelope.to,subject:envelope.subject,text:envelope.body,attachments:[{filename:envelope.attachments[0].filename,type:'text/csv; charset=utf-8',disposition:'attachment',content:bytes.buffer}]};
}
