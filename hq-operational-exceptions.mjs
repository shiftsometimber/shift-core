import {serviceJobHealth} from './hq-service-job-runs.mjs';
// Persistent internal ownership. Acknowledgement never resolves a failure.
export const exceptionDDL=[
 `CREATE TABLE IF NOT EXISTS hq_operational_exceptions(event_key TEXT PRIMARY KEY,source TEXT NOT NULL,source_id TEXT NOT NULL,source_occurred_at TEXT,owner_name TEXT NOT NULL,next_action TEXT NOT NULL,opened_at TEXT NOT NULL,due_at TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','acknowledged','resolved')),acknowledged_by INTEGER,acknowledged_at TEXT,resolved_by INTEGER,resolved_at TEXT,resolution_note TEXT)`,
 `CREATE TABLE IF NOT EXISTS hq_operational_exception_audit(id TEXT PRIMARY KEY,event_key TEXT NOT NULL,actor_id INTEGER,action TEXT NOT NULL,note TEXT,at TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS hq_operational_monitor_runs(id TEXT PRIMARY KEY,observed_at TEXT NOT NULL,coverage_json TEXT NOT NULL)`
];
export const exceptionSources=[
 ['commerce_service_delivery',"SELECT event_key id,updated_at occurred_at FROM commerce_service_delivery WHERE status='unknown' OR (status='attempted' AND julianday(updated_at)<julianday(?,'-1 hour')) OR (status='queued' AND error_code IS NOT NULL)",'Reconcile the exact retained order-mail event and provider evidence. Repair a proven missing binding before any retry; accepted, historical unknown and uncertain attempts require exact review and must not be blindly replayed.',4,true],
 ['hq_tasks',"SELECT CAST(id AS TEXT) id,due_at occurred_at FROM hq_tasks WHERE status NOT IN ('done','cancelled') AND (assigned_to IS NULL OR trim(assigned_to)='')",'Review the original HQ task, confirm whether it is genuine or an authorised test, and assign a named owner plus a next action and due time. Preserve financial, privacy and reviewer history; do not perform erasure merely because a request exists.',4],
 ['data_requests',"SELECT CAST(id AS TEXT) id,received_at occurred_at FROM data_requests WHERE request_type='deletion' AND status NOT IN ('completed','cancelled')",'Review the account-erasure request and the originating authority in HQ. Confirm identity, ownership and retention obligations before any irreversible action. A request or acknowledgement is not completed erasure.',4],
 ['hq_service_job_runs',"SELECT r.id,r.started_at occurred_at FROM hq_service_job_runs r WHERE r.status='failed' AND NOT EXISTS(SELECT 1 FROM hq_service_job_runs newer WHERE newer.job_key=r.job_key AND newer.status='completed' AND julianday(newer.completed_at)>julianday(r.started_at))",'Review the failed scheduled execution and its per-message/provider outcomes. Restore the job, then verify an actual later run. Unknown deliveries require separate reconciliation.',1],
 ['hq_service_job_registry',"WITH latest AS (SELECT r.job_key,r.activated_at,r.cadence_minutes,MAX(CASE WHEN j.status='completed' THEN j.completed_at END) last_success FROM hq_service_job_registry r LEFT JOIN hq_service_job_runs j ON j.job_key=r.job_key GROUP BY r.job_key) SELECT job_key||':'||COALESCE(last_success,activated_at) id,COALESCE(last_success,activated_at) occurred_at FROM latest WHERE julianday(?)>julianday(COALESCE(last_success,activated_at))+(3.0*cadence_minutes)/1440",'Investigate a missed scheduler heartbeat. Verify the deployed schedule, bindings and a genuine completed execution; configuration alone is not recovery evidence.',1,true],

 ['integration_webhooks',"SELECT CAST(id AS TEXT) id,received_at occurred_at FROM integration_webhooks WHERE signature_valid=1 AND processing_error IS NOT NULL AND trim(processing_error)<>''",'Reconcile the signed partner callback against its authoritative order/case and provider receipt. Retry only after proving the earlier attempt did not complete.',1],
 ['stripe_events',"SELECT CAST(id AS TEXT) id,received_at occurred_at FROM stripe_events WHERE processing_error IS NOT NULL AND trim(processing_error)<>''",'Reconcile the retained Stripe event against the payment provider and order. Preserve environment and amounts; do not recreate charges.',1],
 ['medicine_stripe_events',"SELECT stripe_event_id id,received_at occurred_at FROM medicine_stripe_events WHERE processing_error IS NOT NULL AND trim(processing_error)<>''",'Reconcile the medicine payment event. Keep payment, clinical and fulfilment outcomes separate; do not recreate charges.',1],
 ['hq_comms_recipients',"SELECT draft_id||':'||lower(email) id,at occurred_at FROM hq_comms_recipients WHERE status='unknown' OR (status='pending' AND error_code='eligibility_source_unavailable')",'Check eligibility-source availability and the exact approved draft, recipient and provider evidence in Communications. No transport occurs while eligibility is unavailable. Reconcile any unknown send before retry.',4]
];
const keyFor=async(source,id)=>{const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id));return source+':'+[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')};
export async function reconcileExceptions(DB,now=new Date()){
 await DB.batch(exceptionDDL.map(sql=>DB.prepare(sql)));
 const tables=new Set((await DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(x=>x.name)),coverage=[];let created=0;
 for(const [source,sql,nextAction,hours,clocked] of exceptionSources){
  if(!tables.has(source)){coverage.push({source,status:'unavailable'});continue}
  try{
   const rows=(await DB.prepare(sql+' LIMIT 101').bind(...(clocked?[now.toISOString()]:[])).all()).results;coverage.push({source,status:'available',truncated:rows.length>100});
   for(const row of rows.slice(0,100)){
    const key=await keyFor(source,row.id),at=now.toISOString(),due=new Date(now.getTime()+hours*3600000).toISOString();
    // Never return the private recipient-key to the management browser.
    const result=await DB.batch([
     DB.prepare("INSERT OR IGNORE INTO hq_operational_exceptions(event_key,source,source_id,source_occurred_at,owner_name,next_action,opened_at,due_at) VALUES(?,?,?,?,'Matt O’Brien',?,?,?)").bind(key,source,row.id,row.occurred_at||null,nextAction,at,due),
     DB.prepare("INSERT OR IGNORE INTO hq_operational_exception_audit(id,event_key,action,at) SELECT ?,?,'opened',? WHERE EXISTS(SELECT 1 FROM hq_operational_exceptions WHERE event_key=?)").bind(key+':opened',key,at,key)
    ]);created+=Number(result[0].meta.changes||0);
    const reopenId=crypto.randomUUID();
    await DB.batch([
     DB.prepare("UPDATE hq_operational_exceptions SET status='open',opened_at=?,due_at=?,acknowledged_by=NULL,acknowledged_at=NULL,resolved_by=NULL,resolved_at=NULL,resolution_note=NULL WHERE event_key=? AND status='resolved'").bind(at,due,key),
     DB.prepare("INSERT INTO hq_operational_exception_audit(id,event_key,action,at) SELECT ?,?,'reopened',? WHERE EXISTS(SELECT 1 FROM hq_operational_exceptions WHERE event_key=? AND status='open' AND opened_at=?) AND changes()=1").bind(reopenId,key,at,key,at)
    ]);
   }
  }catch{coverage.push({source,status:'unavailable',reason:'source_query_failed'})}
 }
 await DB.prepare('INSERT INTO hq_operational_monitor_runs(id,observed_at,coverage_json) VALUES(?,?,?)').bind(crypto.randomUUID(),now.toISOString(),JSON.stringify(coverage.filter((v,i)=>coverage.findLastIndex(x=>x.source===v.source)===i))).run();
 return{created,coverage};
}
export async function exceptionView(DB,now=new Date()){
 const items=(await DB.prepare("SELECT event_key,source,source_occurred_at,owner_name,next_action,opened_at,due_at,status,acknowledged_at,resolved_at,resolution_note FROM hq_operational_exceptions ORDER BY CASE WHEN status='resolved' THEN 1 ELSE 0 END,due_at LIMIT 100").all()).results;
 const monitor=await DB.prepare('SELECT observed_at,coverage_json FROM hq_operational_monitor_runs ORDER BY observed_at DESC LIMIT 1').first();
 return{jobs:await serviceJobHealth(DB,now),monitor:monitor?{observedAt:monitor.observed_at,ageMinutes:Math.max(0,(now.getTime()-Date.parse(monitor.observed_at))/60000),coverage:JSON.parse(monitor.coverage_json)}:null,items:items.map(x=>({...x,overdue:x.status!=='resolved'&&Date.parse(x.due_at)<now.getTime(),openAgeHours:Math.max(0,(now.getTime()-Date.parse(x.opened_at))/3600000),sourceAgeHours:Number.isFinite(Date.parse(x.source_occurred_at))?Math.max(0,(now.getTime()-Date.parse(x.source_occurred_at))/3600000):null})),escalation:'At due time, open and acknowledged exceptions escalate to Matt. Review hourly until reconciled; no automatic external messages.',acknowledgedMeansResolved:false};
}
export async function changeException(DB,key,action,note,actor,now=new Date()){
 if(!['acknowledge','resolve'].includes(action)||typeof note!=='string'||note.trim().length<10||note.length>1000) return{status:400,error:'action_and_evidence_required'};
 const row=await DB.prepare('SELECT * FROM hq_operational_exceptions WHERE event_key=?').bind(key).first();if(!row)return{status:404,error:'exception_not_found'};
 if(row.status==='resolved')return{status:409,error:'already_resolved'};
 if(action==='resolve'){
  const source=exceptionSources.find(x=>x[0]===row.source);if(!source)return{status:409,error:'source_unavailable'};
  // Fail closed on absent source, query failure, or an unresolved source row.
  const current=await DB.prepare('SELECT id FROM ('+source[1]+') WHERE id=?').bind(...(source[4]?[now.toISOString()]:[]),row.source_id).first();if(current)return{status:409,error:'source_still_requires_reconciliation'};
 }
 const at=now.toISOString(),column=action==='resolve'?'resolved':'acknowledged',id=crypto.randomUUID();
 const results=await DB.batch([
  DB.prepare(`UPDATE hq_operational_exceptions SET status=?,${column}_by=?,${column}_at=?${action==='resolve'?',resolution_note=?':''} WHERE event_key=? AND status=?`).bind(column,actor.id,at,...(action==='resolve'?[note.trim()]:[]),key,row.status),
  DB.prepare(`INSERT INTO hq_operational_exception_audit(id,event_key,actor_id,action,note,at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM hq_operational_exceptions WHERE event_key=? AND ${column}_by=? AND ${column}_at=?) AND changes()=1`).bind(id,key,actor.id,action,note.trim(),at,key,actor.id,at)
 ]);
 return Number(results[0].meta.changes)===1?{status:200,state:column,noMessagesSent:true}:{status:409,error:'exception_changed'};
}
