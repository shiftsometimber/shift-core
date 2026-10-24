import {londonMidnight} from './hq-london-period.mjs';
import {serviceJobHealth} from './hq-service-job-runs.mjs';
import {commercePopulationSql} from './hq-report-population.mjs';
// Aggregate-only additions to the existing permissioned HQ report.
// No account writes, emails, job execution or provider calls occur here.
const allowed=(permissions,key)=>permissions.includes('*')||permissions.includes(key);
export async function appendLaunchMetrics(DB,report,permissions=[],now=new Date()){
 const tables=new Set((await DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(r=>r.name));
 const metrics=report.metrics,period=report.period,limitations=report.limitations;
 const unavailable=(key,label,reason,scope='Current snapshot')=>{const m={key,label,value:null,status:'unavailable',reason,scope};metrics.push(m);return m};
 async function read(key,label,permission,required,sql,params=[],unit='count',scope='Current snapshot'){
  if(!allowed(permissions,permission))return unavailable(key,label,'Your role cannot access this source.',scope);
  if(required.some(t=>!tables.has(t)))return unavailable(key,label,'Source not connected.',scope);
  try{const row=await DB.prepare(sql).bind(...params).first();if(!row||row.value==null||!Number.isFinite(Number(row.value)))return unavailable(key,label,'Source did not return a valid aggregate.',scope);
   const m={key,label,value:Number(row.value),status:'available',source:required.join(', '),unit,scope};metrics.push(m);return m;
  }catch{return unavailable(key,label,'Source query failed.',scope)}
 }
 const commerce=['management','sales'].includes(report.kind),management=report.kind==='management';
 if(commerce){
  const scope='Live GBP medicine orders created in selected London calendar dates; current payment state. Not accounting revenue.',bounds=[period.since,period.until];
  const population=commercePopulationSql(tables,'m','email');
  const condition=" FROM medicine_orders m WHERE substr(stripe_checkout_session_id,1,8)='cs_live_' AND currency='GBP' AND julianday(created_at)>=julianday(?) AND julianday(created_at)<julianday(?) AND "+population;
  const medicineOrders=await read('medicine_orders','Live medicine orders created','commerce_read',['medicine_orders','users','audit_log'],'SELECT COUNT(*) value'+condition,bounds,'count',scope);
  await read('medicine_paid_orders','Paid live medicine orders','commerce_read',['medicine_orders','users','audit_log'],"SELECT COUNT(*) value"+condition+" AND status='paid'",bounds,'count',scope);
  await read('shop_paid_orders','Paid live shop orders','commerce_read',['orders','commerce_order_details','users','audit_log'],"SELECT COUNT(*) value FROM orders o JOIN commerce_order_details d ON d.order_id=o.id WHERE substr(d.stripe_checkout_session_id,1,8)='cs_live_' AND o.currency='GBP' AND o.payment_status='paid' AND julianday(o.created_at)>=julianday(?) AND julianday(o.created_at)<julianday(?) AND "+commercePopulationSql(tables,'o','customer_email'),bounds,'count',scope);
  const medicinePaid=await read('medicine_paid_value','Paid medicine order value (GBP)','commerce_read',['medicine_orders','users','audit_log'],"SELECT COALESCE(SUM(total_pence),0) value"+condition+" AND status='paid'",bounds,'pence',scope);
  const aggregate=(key,label,parts,unit)=>{
   if(parts.every(m=>m?.status==='available'))metrics.push({key,label,status:'available',value:parts.reduce((sum,m)=>sum+m.value,0),unit,source:parts.map(m=>m.source).join('; '),scope:'Shop plus medicine sources, live GBP orders created in selected period. Distinct channel orders; not accounting revenue.'});
   else unavailable(key,label,'Both shop and medicine sources must be available.','Selected period');
  };
  const shopOrders=metrics.find(m=>m.key==='orders'),shopPaid=metrics.find(m=>m.key==='paid_value');
  if(shopOrders)shopOrders.label='Live shop orders created';if(shopPaid)shopPaid.label='Paid shop order value (GBP)';
  aggregate('all_live_orders','Live orders created — shop and medicines',[shopOrders,medicineOrders],'count');
  aggregate('all_paid_order_value','Paid order value — shop and medicines (GBP)',[shopPaid,medicinePaid],'pence');
  await read('medicine_waiting_assessment','Paid medicine orders awaiting clinical assessment','commerce_read',['medicine_orders','users','audit_log'],"SELECT COUNT(*) value FROM medicine_orders m WHERE substr(stripe_checkout_session_id,1,8)='cs_live_' AND status='paid' AND clinical_status IN ('assessment_pending','more_information_required') AND "+population);
  const repeatTables=['orders','commerce_order_details','medicine_orders','users','audit_log'];
  const paidCte=`WITH paid AS (SELECT o.user_id member_id,'shop:'||o.id order_reference,o.created_at FROM orders o JOIN commerce_order_details d ON d.order_id=o.id WHERE substr(d.stripe_checkout_session_id,1,8)='cs_live_' AND o.currency='GBP' AND o.payment_status='paid' AND o.user_id IS NOT NULL AND ${commercePopulationSql(tables,'o','customer_email')} UNION ALL SELECT m.user_id,'medicine:'||m.id,m.created_at FROM medicine_orders m WHERE substr(m.stripe_checkout_session_id,1,8)='cs_live_' AND m.currency='GBP' AND m.status='paid' AND m.user_id IS NOT NULL AND ${population}), cohort AS (SELECT member_id,MIN(julianday(created_at)) first_paid,COUNT(DISTINCT order_reference) paid_orders FROM paid WHERE julianday(created_at)<julianday(?) GROUP BY member_id)`;
  const repeatScope='Members whose first retained currently-paid live GBP order is in the selected London dates; subsequent retained currently-paid orders through the period end. Unlinked orders cannot establish a member cohort. Not mature retention or recognised revenue.';
  const denominator=await read('paid_member_cohort','Members in first-paid-order cohort','commerce_read',repeatTables,paidCte+' SELECT COUNT(*) value FROM cohort WHERE first_paid>=julianday(?)',[period.until,period.since],'count',repeatScope);
  const numerator=await read('repeat_paid_members','Cohort members with at least two paid orders','commerce_read',repeatTables,paidCte+' SELECT COUNT(*) value FROM cohort WHERE first_paid>=julianday(?) AND paid_orders>=2',[period.until,period.since],'count',repeatScope);
  if(denominator.status==='available'&&numerator.status==='available'&&denominator.value>0)metrics.push({key:'repeat_paid_member_rate',label:'Repeat paid-order member rate',status:'available',value:Math.round(10000*numerator.value/denominator.value)/100,unit:'percent',numerator:numerator.value,denominator:denominator.value,source:repeatTables.join(', '),scope:repeatScope});
  else unavailable('repeat_paid_member_rate','Repeat paid-order member rate',denominator.status==='available'?'No eligible paid-member cohort.':'Paid-member cohort sources unavailable.','Selected first-paid cohort');
  unavailable('service_order_value','Separately billed service order value','No authoritative separately billed service ledger is connected. Pharmacy fulfilment records must not be counted as additional sales.');
  unavailable('net_revenue','Accounting net revenue (GBP)','Accounting recognition and seller basis have not been connected.','Accounting period');
  unavailable('contribution_margin','Contribution after provider, product and fulfilment costs','Complete order cost snapshots, payment fees and fulfilment costs are not connected.','Order cohort');
  limitations.push('Shop and medicine totals use channel-specific order records and live checkout references. No provider order is counted again as a separate sale. Failed, unclassified and test checkout references are excluded. Paid value is not accounting revenue, cashflow or contribution.');
 }
 if(!management)return report;
 const stamp=now.toISOString();
 await read('unassigned_tasks','Unassigned open tasks','crm_read',['hq_tasks'],"SELECT COUNT(*) value FROM hq_tasks WHERE status NOT IN ('done','cancelled') AND (assigned_to IS NULL OR trim(assigned_to)='')");
 const overdue=metrics.find(m=>m.key==='tasks');if(overdue&&allowed(permissions,'crm_read')){
  const corrected=await read('overdue_tasks_now','Overdue tasks as of report generation','crm_read',['hq_tasks'],"SELECT COUNT(*) value FROM hq_tasks WHERE status NOT IN ('done','cancelled') AND due_at IS NOT NULL AND ((length(due_at)=10 AND due_at<?) OR (length(due_at)<>10 AND julianday(due_at)<julianday(?)))",[new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),stamp]);
  if(corrected.status==='available'){
   overdue.value=corrected.value;overdue.scope='Current snapshot at generation; date-only deadlines end at London midnight.';overdue.oldestAgeHours=null;
   if(corrected.value>0)try{
    const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
    const rows=(await DB.prepare("SELECT due_at FROM hq_tasks WHERE status NOT IN ('done','cancelled') AND due_at IS NOT NULL AND ((length(due_at)=10 AND due_at<?) OR (length(due_at)<>10 AND julianday(due_at)<julianday(?))) LIMIT 1001").bind(day,stamp).all()).results;
    if(rows.length<=1000){const deadlines=rows.map(r=>{if(r.due_at.length!==10)return Date.parse(r.due_at);const next=new Date(r.due_at+'T00:00:00Z');next.setUTCDate(next.getUTCDate()+1);return Date.parse(londonMidnight(next.toISOString().slice(0,10)))});if(deadlines.length&&deadlines.every(Number.isFinite))overdue.oldestAgeHours=Math.max(0,(now.getTime()-Math.min(...deadlines))/3600000);}
   }catch{overdue.ageUnavailable=true}
  }
 }
 await read('pending_privacy_requests','Pending account-deletion requests','crm_read',['data_requests'],"SELECT COUNT(*) value FROM data_requests WHERE request_type='deletion' AND status NOT IN ('completed','cancelled')");
 await read('unassigned_support','Unassigned open support requests','support_read',['support_tickets'],"SELECT COUNT(*) value FROM support_tickets WHERE status NOT IN ('closed','resolved') AND assigned_hq_user_id IS NULL");
 await read('partner_handovers_waiting','Partner handovers still open','commerce_read',['hq_partner_handovers'],"SELECT COUNT(*) value FROM hq_partner_handovers WHERE status NOT IN ('completed','closed','cancelled')");
 await read('failed_integration_events','Failed or unprocessed pharmacy webhooks','commerce_read',['integration_webhooks'],"SELECT COUNT(*) value FROM integration_webhooks WHERE processed=0 OR (processing_error IS NOT NULL AND trim(processing_error)<>'')");
 // These queues contain approval and delivery information. Restrict them to
 // existing owner/admin '*' permission, not ordinary content or clinical roles.
 const mailScope='Retained HQ service-message recipients; provider accepted is not inbox receipt.';
 for(const [key,label,condition]of [
  ['comms_pending_approval','Service messages awaiting owner approval',"status='draft'"],
  ['comms_held','Service messages held or expired',"status IN ('held','expired')"],
  ['comms_overdue','Approved service messages overdue by 10 minutes',"status='scheduled' AND julianday(scheduled_at)<julianday(?,'-10 minutes')"]
 ])await read(key,label,'*',['hq_comms_drafts'],'SELECT COUNT(*) value FROM hq_comms_drafts WHERE '+condition,key==='comms_overdue'?[stamp]:[]);
 for(const [key,label,condition]of [
  ['comms_provider_accepted','Service-email recipients accepted by provider',"r.status='provider_accepted'"],
  ['comms_unknown','Service-message attempts needing reconciliation',"r.status='unknown' OR (r.status='processing' AND julianday(r.at)<julianday(?,'-1 hour'))"],
  ['comms_suppressed','Service-message recipients suppressed',"r.status='suppressed'"]
 ])await read(key,label,'*',['hq_comms_recipients'],'SELECT COUNT(*) value FROM hq_comms_recipients r WHERE '+condition,key==='comms_unknown'?[stamp]:[],'count',mailScope);
 await read('auth_email_failures_24h','Authentication and transactional email failures (24 hours)','*',['auth_delivery_events'],"SELECT COUNT(*) value FROM auth_delivery_events WHERE status IN ('failed','binding_missing') AND julianday(created_at)>=julianday(?,'-24 hours')",[stamp]);
 await read('signup_alert_failures','Signup operator alerts needing attention','*',['member_signup_alerts'],"SELECT COUNT(*) value FROM member_signup_alerts WHERE state NOT IN ('accepted','suppressed')");
 await read('staff_active','Active HQ staff accounts','*',['hq_users'],"SELECT COUNT(*) value FROM hq_users WHERE status='active'");
 await read('staff_without_mfa','Active HQ staff without MFA','*',['hq_users'],"SELECT COUNT(*) value FROM hq_users WHERE status='active' AND mfa_enabled<>1");
 await read('owners_active','Active HQ owners','*',['hq_users'],"SELECT COUNT(*) value FROM hq_users WHERE status='active' AND role='owner'");
 await read('historical_unlinked_shop_orders','Historical shop rows without linked accounts','commerce_read',['orders'],"SELECT COUNT(*) value FROM orders WHERE user_id IS NULL",[],'count','All retained environments, including historical test/unclassified cancelled orders; not a live financial-failure count.');
 await read('unlinked_medicine_orders','Medicine rows without linked accounts','commerce_read',['medicine_orders'],"SELECT COUNT(*) value FROM medicine_orders WHERE user_id IS NULL");
 await read('unlinked_pharmacy_orders','Pharmacy rows without linked accounts','commerce_read',['pharmacy_orders'],"SELECT COUNT(*) value FROM pharmacy_orders WHERE user_id IS NULL");
 await read('owners_without_mfa','Active HQ owners without MFA','*',['hq_users'],"SELECT COUNT(*) value FROM hq_users WHERE status='active' AND role='owner' AND mfa_enabled<>1");
 await read('workflow_failures_24h','General CRM workflow failures (24 hours)','*',['workflow_runs'],"SELECT COUNT(*) value FROM workflow_runs WHERE status='failed' AND julianday(created_at)>=julianday(?,'-24 hours')",[stamp]);
 await read('active_workflows','Active general CRM workflows','*',['workflows'],"SELECT COUNT(*) value FROM workflows WHERE status='active'");
 if(allowed(permissions,'*')){
  const jobs=await serviceJobHealth(DB,now);report.schedulerHealth=jobs;
  for(const job of jobs){if(job.ageMinutes===null)unavailable('job_'+job.job+'_age','Scheduled execution: '+job.job,'No successful retained execution. State: '+job.state);else metrics.push({key:'job_'+job.job+'_age',label:'Minutes since '+job.job+' completed',value:job.ageMinutes,status:'available',unit:'minutes',source:'hq_service_job_runs',scope:'Current execution evidence; expected cadence '+job.cadenceMinutes+' minutes. Last outcome: '+job.lastOutcome+'. This does not prove an unused business integration.'});}
 }
 await read('operational_exceptions_open','Owned operational exceptions still requiring resolution','*',['hq_operational_exceptions'],"SELECT COUNT(*) value FROM hq_operational_exceptions WHERE status IN ('open','acknowledged')");
 await read('operational_exceptions_overdue','Owned operational exceptions past due','*',['hq_operational_exceptions'],"SELECT COUNT(*) value FROM hq_operational_exceptions WHERE status IN ('open','acknowledged') AND julianday(due_at)<julianday(?)",[stamp]);
 await read('notification_oldest_pending_hours','Age of oldest notification awaiting review','*',['hq_notification_intents'],"SELECT COALESCE((julianday(?)-julianday(MIN(created_at)))*24,0) value FROM hq_notification_intents WHERE state='awaiting_review'",[stamp],'hours');
 unavailable('support_first_response_hours','Support first-response time','A reliable first-response timestamp is not installed for every support channel. Updated-at is not substituted.');
 await read('support_resolved_in_period','Support tickets resolved in selected period','support_read',['support_tickets'],"SELECT COUNT(*) value FROM support_tickets WHERE status IN ('closed','resolved') AND julianday(closed_at)>=julianday(?) AND julianday(closed_at)<julianday(?)",[period.since,period.until],'count','Operational ticket count, including commissioning tickets; not a customer cohort.');
 await read('support_resolution_hours','Mean resolution time for resolved support tickets','support_read',['support_tickets'],"SELECT AVG((julianday(closed_at)-julianday(created_at))*24) value FROM support_tickets WHERE status IN ('closed','resolved') AND julianday(closed_at)>=julianday(?) AND julianday(closed_at)<julianday(?) AND julianday(closed_at)>=julianday(created_at)",[period.since,period.until],'hours','Operational tickets resolved in selected London dates. No resolved tickets is unavailable.');
 await read('notification_events_review','Triggered notifications awaiting review','*',['hq_notification_intents'],"SELECT COUNT(*) value FROM hq_notification_intents WHERE state='awaiting_review'");
 await read('notification_job_failures','Notification reconciliation failures (24 hours)','*',['hq_notification_runs'],"SELECT COUNT(*) value FROM hq_notification_runs WHERE status='failed' AND julianday(started_at)>=julianday(?,'-24 hours')",[stamp]);
 await read('notification_job_age_minutes','Minutes since successful notification reconciliation','*',['hq_notification_runs'],"SELECT (julianday(?)-julianday(MAX(completed_at)))*1440 value FROM hq_notification_runs WHERE status='completed'",[stamp],'minutes','Current snapshot; five-minute schedule. No completed run is unavailable, never zero.');
 limitations.push('Readiness counters are current operational snapshots, not customer growth or proof that an unused integration works. New security and delivery aggregates require existing owner/admin permission. No member identities, message bodies, clinical details, endpoints or secrets are returned. All-account MFA enrolment and enforcement are unchanged.');
 report.version='hq-launch-report-v3.2-20261024';
 return report;
}
