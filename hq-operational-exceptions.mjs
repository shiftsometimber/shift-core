// Persistent internal ownership. Acknowledgement never resolves a failure.
export const exceptionDDL=[
 `CREATE TABLE IF NOT EXISTS hq_operational_exceptions(event_key TEXT PRIMARY KEY,source TEXT NOT NULL,source_id TEXT NOT NULL,owner_name TEXT NOT NULL,next_action TEXT NOT NULL,opened_at TEXT NOT NULL,due_at TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','acknowledged','resolved')),acknowledged_by INTEGER,acknowledged_at TEXT,resolved_by INTEGER,resolved_at TEXT,resolution_note TEXT)`,
 `CREATE TABLE IF NOT EXISTS hq_operational_exception_audit(id TEXT PRIMARY KEY,event_key TEXT NOT NULL,actor_id INTEGER,action TEXT NOT NULL,note TEXT,at TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS hq_operational_monitor_runs(id TEXT PRIMARY KEY,observed_at TEXT NOT NULL,coverage_json TEXT NOT NULL)`
];
export const exceptionSources=[
 ['integration_webhooks',"SELECT CAST(id AS TEXT) id,received_at occurred_at FROM integration_webhooks WHERE signature_valid=1 AND processing_error IS NOT NULL AND trim(processing_error)<>''",'Reconcile the signed partner callback against its authoritative order/case and provider receipt. Retry only after proving the earlier attempt did not complete.',1],
 ['stripe_events',"SELECT CAST(id AS TEXT) id,received_at occurred_at FROM stripe_events WHERE processing_error IS NOT NULL AND trim(processing_error)<>''",'Reconcile the retained Stripe event against the payment provider and order. Preserve environment and amounts; do not recreate charges.',1],
 ['medicine_stripe_events',"SELECT CAST(id AS TEXT) id,received_at occurred_at FROM medicine_stripe_events WHERE processing_error IS NOT NULL AND trim(processing_error)<>''",'Reconcile the medicine payment event. Keep payment, clinical and fulfilment outcomes separate; do not recreate charges.',1],
 ['hq_comms_recipients',"SELECT draft_id||':'||lower(email) id,COALESCE(at,'1970-01-01T00:00:00Z') occurred_at FROM hq_comms_recipients WHERE status='unknown'",'Check the exact approved draft, recipient and provider evidence in Communications. Do not retry an uncertain send.',4]
];
const keyFor=async(source,id)=>{const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id));return source+':'+[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')};
export async function reconcileExceptions(DB,now=new Date()){
 await DB.batch(exceptionDDL.map(sql=>DB.prepare(sql)));
 const tables=new Set((await DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(x=>x.name)),coverage=[];let created=0;
 for(const [source,sql,nextAction,hours] of exceptionSources){
  if(!tables.has(source)){coverage.push({source,status:'unavailable'});continue}
  try{
   const rows=(await DB.prepare(sql+' LIMIT 101').all()).results;coverage.push({source,status:'available',truncated:rows.length>100});
   for(const row of rows.slice(0,100)){
    const key=await keyFor(source,row.id),at=now.toISOString(),due=new Date(now.getTime()+hours*3600000).toISOString();
    // Never return the private recipient-key to the management browser.
    const result=await DB.batch([
     DB.prepare("INSERT OR IGNORE INTO hq_operational_exceptions(event_key,source,source_id,owner_name,next_action,opened_at,due_at) VALUES(?,?,?,'Matt O’Brien',?,?,?)").bind(key,source,row.id,nextAction,at,due),
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
 const items=(await DB.prepare("SELECT event_key,source,owner_name,next_action,opened_at,due_at,status,acknowledged_at,resolved_at,resolution_note FROM hq_operational_exceptions ORDER BY CASE WHEN status='resolved' THEN 1 ELSE 0 END,due_at LIMIT 100").all()).results;
 const monitor=await DB.prepare('SELECT observed_at,coverage_json FROM hq_operational_monitor_runs ORDER BY observed_at DESC LIMIT 1').first();
 return{monitor:monitor?{observedAt:monitor.observed_at,ageMinutes:Math.max(0,(now.getTime()-Date.parse(monitor.observed_at))/60000),coverage:JSON.parse(monitor.coverage_json)}:null,items:items.map(x=>({...x,overdue:x.status!=='resolved'&&Date.parse(x.due_at)<now.getTime(),ageHours:Math.max(0,(now.getTime()-Date.parse(x.opened_at))/3600000)})),escalation:'At due time, open and acknowledged exceptions escalate to Matt. Review hourly until reconciled; no automatic external messages.',acknowledgedMeansResolved:false};
}
export async function changeException(DB,key,action,note,actor,now=new Date()){
 if(!['acknowledge','resolve'].includes(action)||typeof note!=='string'||note.trim().length<10||note.length>1000) return{status:400,error:'action_and_evidence_required'};
 const row=await DB.prepare('SELECT * FROM hq_operational_exceptions WHERE event_key=?').bind(key).first();if(!row)return{status:404,error:'exception_not_found'};
 if(row.status==='resolved')return{status:409,error:'already_resolved'};
 if(action==='resolve'){
  const source=exceptionSources.find(x=>x[0]===row.source);if(!source)return{status:409,error:'source_unavailable'};
  // Fail closed on absent source, query failure, or an unresolved source row.
  const current=await DB.prepare('SELECT id FROM ('+source[1]+') WHERE id=?').bind(row.source_id).first();if(current)return{status:409,error:'source_still_requires_reconciliation'};
 }
 const at=now.toISOString(),column=action==='resolve'?'resolved':'acknowledged',id=crypto.randomUUID();
 const results=await DB.batch([
  DB.prepare(`UPDATE hq_operational_exceptions SET status=?,${column}_by=?,${column}_at=?${action==='resolve'?',resolution_note=?':''} WHERE event_key=? AND status=?`).bind(column,actor.id,at,...(action==='resolve'?[note.trim()]:[]),key,row.status),
  DB.prepare(`INSERT INTO hq_operational_exception_audit(id,event_key,actor_id,action,note,at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM hq_operational_exceptions WHERE event_key=? AND ${column}_by=? AND ${column}_at=?)`).bind(id,key,actor.id,action,note.trim(),at,key,actor.id,at)
 ]);
 return Number(results[0].meta.changes)===1?{status:200,state:column,noMessagesSent:true}:{status:409,error:'exception_changed'};
}
