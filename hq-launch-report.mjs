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
  const condition=" FROM medicine_orders WHERE stripe_checkout_session_id LIKE 'cs_live_%' AND currency='GBP' AND julianday(created_at)>=julianday(?) AND julianday(created_at)<julianday(?)";
  const medicineOrders=await read('medicine_orders','Live medicine orders created','commerce_read',['medicine_orders'],'SELECT COUNT(*) value'+condition,bounds,'count',scope);
  const medicinePaid=await read('medicine_paid_value','Paid medicine order value (GBP)','commerce_read',['medicine_orders'],"SELECT COALESCE(SUM(total_pence),0) value"+condition+" AND status='paid'",bounds,'pence',scope);
  const aggregate=(key,label,parts,unit)=>{
   if(parts.every(m=>m?.status==='available'))metrics.push({key,label,status:'available',value:parts.reduce((sum,m)=>sum+m.value,0),unit,source:parts.map(m=>m.source).join('; '),scope:'Shop plus medicine sources, live GBP orders created in selected period. Distinct channel orders; not accounting revenue.'});
   else unavailable(key,label,'Both shop and medicine sources must be available.','Selected period');
  };
  const shopOrders=metrics.find(m=>m.key==='orders'),shopPaid=metrics.find(m=>m.key==='paid_value');
  if(shopOrders)shopOrders.label='Live shop orders created';if(shopPaid)shopPaid.label='Paid shop order value (GBP)';
  aggregate('all_live_orders','Live orders created — shop and medicines',[shopOrders,medicineOrders],'count');
  aggregate('all_paid_order_value','Paid order value — shop and medicines (GBP)',[shopPaid,medicinePaid],'pence');
  await read('medicine_waiting_assessment','Paid medicine orders awaiting clinical assessment','commerce_read',['medicine_orders'],"SELECT COUNT(*) value FROM medicine_orders WHERE stripe_checkout_session_id LIKE 'cs_live_%' AND status='paid' AND clinical_status IN ('assessment_pending','more_information_required')");
  unavailable('net_revenue','Accounting net revenue (GBP)','Accounting recognition and seller basis have not been connected.','Accounting period');
  unavailable('contribution_margin','Contribution after provider, product and fulfilment costs','Complete order cost snapshots, payment fees and fulfilment costs are not connected.','Order cohort');
  limitations.push('Shop and medicine totals use channel-specific order records and live checkout references. No provider order is counted again as a separate sale. Failed, unclassified and test checkout references are excluded. Paid value is not accounting revenue, cashflow or contribution.');
 }
 if(!management)return report;
 const stamp=now.toISOString();
 await read('unassigned_tasks','Unassigned open tasks','crm_read',['hq_tasks'],"SELECT COUNT(*) value FROM hq_tasks WHERE status NOT IN ('done','cancelled') AND (assigned_to IS NULL OR trim(assigned_to)='')");
 const overdue=metrics.find(m=>m.key==='tasks');if(overdue&&allowed(permissions,'crm_read')){
  const corrected=await read('overdue_tasks_now','Overdue tasks as of report generation','crm_read',['hq_tasks'],"SELECT COUNT(*) value FROM hq_tasks WHERE status NOT IN ('done','cancelled') AND due_at IS NOT NULL AND julianday(due_at)<julianday(?)",[stamp]);
  if(corrected.status==='available'){overdue.value=corrected.value;overdue.scope='Current snapshot at generation, including time-based due dates';}
 }
 await read('pending_privacy_requests','Pending account-deletion requests','crm_read',['data_requests'],"SELECT COUNT(*) value FROM data_requests WHERE request_type='deletion' AND status<>'completed'");
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
 await read('owners_without_mfa','Active HQ owners without MFA','*',['hq_users'],"SELECT COUNT(*) value FROM hq_users WHERE status='active' AND role='owner' AND mfa_enabled<>1");
 await read('workflow_failures_24h','General CRM workflow failures (24 hours)','*',['workflow_runs'],"SELECT COUNT(*) value FROM workflow_runs WHERE status='failed' AND julianday(created_at)>=julianday(?,'-24 hours')",[stamp]);
 await read('active_workflows','Active general CRM workflows','*',['workflows'],"SELECT COUNT(*) value FROM workflows WHERE status='active'");
 await read('notification_events_review','Triggered notifications awaiting review','*',['hq_notification_intents'],"SELECT COUNT(*) value FROM hq_notification_intents WHERE state='awaiting_review'");
 await read('notification_job_failures','Notification reconciliation failures (24 hours)','*',['hq_notification_runs'],"SELECT COUNT(*) value FROM hq_notification_runs WHERE status='failed' AND julianday(started_at)>=julianday(?,'-24 hours')",[stamp]);
 await read('notification_job_age_minutes','Minutes since successful notification reconciliation','*',['hq_notification_runs'],"SELECT (julianday(?)-julianday(MAX(completed_at)))*1440 value FROM hq_notification_runs WHERE status='completed'",[stamp],'minutes','Current snapshot; five-minute schedule. No completed run is unavailable, never zero.');
 limitations.push('Readiness counters are current operational snapshots, not customer growth or proof that an unused integration works. New security and delivery aggregates require existing owner/admin permission. No member identities, message bodies, clinical details, endpoints or secrets are returned. All-account MFA enrolment and enforcement are unchanged.');
 report.version='hq-launch-report-v1-20261024';
 return report;
}
