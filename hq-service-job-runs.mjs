// Durable scheduler evidence; only fixed aggregate counters are retained.
export const serviceJobDDL=[
 `CREATE TABLE IF NOT EXISTS hq_service_job_registry(job_key TEXT PRIMARY KEY,activated_at TEXT NOT NULL,cadence_minutes INTEGER NOT NULL,owner_name TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS hq_service_job_runs(id TEXT PRIMARY KEY,job_key TEXT NOT NULL,scheduled_at TEXT,started_at TEXT NOT NULL,completed_at TEXT,status TEXT NOT NULL CHECK(status IN ('running','completed','failed')),counters_json TEXT,outcome TEXT,error_code TEXT)`,
 `CREATE INDEX IF NOT EXISTS hq_service_job_history ON hq_service_job_runs(job_key,started_at,status)`
];
export const serviceJobs={hq_communications:5,support_reminders:5,core_medicines_watch:15,core_intelligence:15,core_radar:15,core_knowledge:15,core_fit_reminders:15,core_article_email:15,core_checkin:15,core_signup_alerts:15,core_treatment:15,core_coaching:15};
const jobs=serviceJobs;
const counterKeys=new Set(['emailAccepted','inApp','pushAccepted','unknown','suppressed','delivered','accepted','failed','due','processed','created','candidates','sent','checked','expired','attempted']);
export async function recordServiceJob(DB,key,scheduledAt,work,clock=()=>new Date()){
 if(!jobs[key])throw Error('unsupported_service_job');
 const id=crypto.randomUUID(),start=clock().toISOString();
 await DB.batch(serviceJobDDL.map(sql=>DB.prepare(sql)));
 await DB.batch([DB.prepare("INSERT OR IGNORE INTO hq_service_job_registry(job_key,activated_at,cadence_minutes,owner_name) VALUES(?,?,?,'Matt O’Brien')").bind(key,start,jobs[key]),DB.prepare("INSERT INTO hq_service_job_runs(id,job_key,scheduled_at,started_at,status) VALUES(?,?,?,?,'running')").bind(id,key,scheduledAt,start)]);
 try{
  const result=await work(),counters=Object.fromEntries(Object.entries(result||{}).filter(([k,v])=>counterKeys.has(k)&&typeof v==='number'&&Number.isFinite(v)));
  const outcome=result?.disabled===true||result?.enabled===false?'disabled':['not_configured','binding_missing','blocked','not_ready','unavailable'].includes(result?.status||result?.reason)?(result.status||result.reason):'completed';
  await DB.prepare("UPDATE hq_service_job_runs SET status='completed',completed_at=?,counters_json=?,outcome=? WHERE id=?").bind(clock().toISOString(),JSON.stringify(counters),outcome,id).run();return result;
 }catch{
  await DB.prepare("UPDATE hq_service_job_runs SET status='failed',completed_at=?,error_code='service_job_failed' WHERE id=?").bind(clock().toISOString(),id).run();throw Error('service_job_failed');
 }
}
export async function serviceJobHealth(DB,now=new Date()){
 const expected=Object.entries(jobs).map(([key,cadence])=>"('"+key+"',"+cadence+")").join(',');
 try{
  const rows=(await DB.prepare(`WITH expected(job_key,cadence) AS (VALUES ${expected}) SELECT e.job_key,e.cadence,COUNT(r.id) runs,MAX(CASE WHEN r.status='completed' THEN r.completed_at END) last_success,MAX(CASE WHEN r.status='failed' THEN r.completed_at END) last_failure,SUM(CASE WHEN r.status='failed' AND julianday(r.started_at)>=julianday(?,'-24 hours') THEN 1 ELSE 0 END) failures_24h,(SELECT outcome FROM hq_service_job_runs latest WHERE latest.job_key=e.job_key ORDER BY started_at DESC LIMIT 1) last_outcome FROM expected e LEFT JOIN hq_service_job_runs r ON r.job_key=e.job_key GROUP BY e.job_key,e.cadence ORDER BY e.job_key`).bind(now.toISOString()).all()).results;
  return rows.map(row=>{
   const age=row.last_success?Math.max(0,(now.getTime()-Date.parse(row.last_success))/60000):null,cadence=Number(row.cadence);
   return{job:row.job_key,owner:'Matt O’Brien',cadenceMinutes:cadence,lastSuccess:row.last_success||null,lastFailure:row.last_failure||null,lastOutcome:row.last_outcome||null,ageMinutes:age,overdue:age!==null&&age>cadence*3,state:row.last_failure&&(!row.last_success||Date.parse(row.last_failure)>Date.parse(row.last_success))?'failed':age===null?'unverified':age>cadence*3?'overdue':'recent',failures24h:Number(row.runs)>0?Number(row.failures_24h||0):null};
  });
 }catch{return Object.entries(jobs).map(([job,cadence])=>({job,owner:'Matt O’Brien',cadenceMinutes:cadence,state:'unavailable',lastSuccess:null,ageMinutes:null,failures24h:null}))}
}
