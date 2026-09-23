import messages from './generated/messages.mjs';
export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'};
 const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(request.method==='GET'&&path==='/')return json({preview:true,source:env.PROOF_SOURCE,recipients:messages.map(m=>m.to),productionData:false,testOnly:true});
 if(request.method!=='POST'||path!=='/__send-proof')return json({error:'not_found'},404);
 if(!env.PROOF_TOKEN||request.headers.get('Authorization')!=='Bearer '+env.PROOF_TOKEN||Date.now()>Number(env.PROOF_EXPIRES))return json({error:'unauthorized'},401);
 // Only two exact owner-requested mailboxes; no arbitrary destination or body.
 if(messages.length!==2||messages[0].to!=='hello@shiftsometimber.co.uk'||messages[1].to!=='orders@shiftsometimber.co.uk')return json({error:'unsafe_preview_recipients'},500);
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS operator_alert_preview_receipts(proof_key TEXT PRIMARY KEY,state TEXT,provider_id TEXT)').run();
 const results=[];
 for(const message of messages){
  const key=env.PROOF_SOURCE+':'+message.to;
  const claim=await env.DB.prepare("INSERT OR IGNORE INTO operator_alert_preview_receipts(proof_key,state) VALUES(?,'sending')").bind(key).run();
  if(!claim.meta.changes){results.push({to:message.to,duplicate:true,...await env.DB.prepare('SELECT state,provider_id FROM operator_alert_preview_receipts WHERE proof_key=?').bind(key).first()});continue;}
  let state='uncertain',id=null;
  try{const r=await env.EMAIL.send(message);state='accepted';id=String(r?.messageId||r?.id||'').slice(0,200)||null;}catch{state='uncertain';}
  await env.DB.prepare('UPDATE operator_alert_preview_receipts SET state=?,provider_id=? WHERE proof_key=?').bind(state,id,key).run();
  results.push({to:message.to,state,provider_id:id,duplicate:false});
 }
 return json({source:env.PROOF_SOURCE,results,inboxReceiptNotClaimed:true});
}};
