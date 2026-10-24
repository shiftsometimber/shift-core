import {launchKpis} from './hq-launch-kpis.mjs';
import {appendAnalyticsSnapshots} from './hq-analytics-snapshots.mjs';
import {activationScorecard} from './activation-measurement/scorecard.mjs';
import {appendLaunchMetrics} from './hq-launch-report.mjs';
import {excludedMemberSql,commercePopulationSql} from './hq-report-population.mjs';
import {hqMemberGpRoute} from './gp-directory/hq-member-gp.mjs';
import {gpDirectoryHqRoute} from './gp-directory/hq.mjs';
import {continuityScorecard} from './continuity-measurement/scorecard.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
import {londonMidnight,reportWindow} from './hq-london-period.mjs';
export {londonMidnight,reportWindow} from './hq-london-period.mjs';
const permit=(permissions,p)=>permissions.includes('*')||permissions.includes(p);
const missing=(reason)=>({status:'unavailable',reason});
const metric=(key,label,value,source,scope='selected period',unit='count')=>({key,label,value,source,scope,unit,status:'available'});
export async function managementReport(DB,{permissions=[],start,end,kind='management'}={}){
 const period=reportWindow(start,end),metrics=[],limitations=[];let tables;
 try{tables=new Set((await DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(x=>x.name))}catch{return{ok:false,status:'unavailable',period,metrics:[],reason:'Data source unavailable.'}}
 const unavailable=(key,label,reason)=>metrics.push({key,label,...missing(reason),value:null});
 async function read(key,label,permission,required,sql,bind=[],unit='count',scope='selected period'){
  if(!permit(permissions,permission))return unavailable(key,label,'Your role cannot access this source.');
  if(required.some(x=>!tables.has(x)))return unavailable(key,label,'Source not connected.');
  try{const row=await DB.prepare(sql).bind(...bind).first();metrics.push(metric(key,label,Number(row?.value||0),required.join(', '),scope,unit))}catch{unavailable(key,label,'Source query failed.');}
 }
 if(['management','members','growth'].includes(kind)){
  await read('registrations','New registrations','crm_read',['users','audit_log'],"SELECT COUNT(*) value FROM users u WHERE julianday(u.created_at)>=julianday(?) AND julianday(u.created_at)<julianday(?) AND NOT "+excludedMemberSql(tables),[period.since,period.until]);
  limitations.push('Registration count excludes HQ email matches, audit-marked commissioning identities, example.invalid/example.test addresses, internal shiftsometimber+ Gmail aliases, explicitly approved named member test mailboxes and the retained Apple/Google reviewer accounts. Other unlabelled test identities may remain.');
 }
 if(['management','sales'].includes(kind)){
  const population=commercePopulationSql(tables,'o','customer_email');
  const condition=" FROM orders o JOIN commerce_order_details d ON d.order_id=o.id WHERE substr(d.stripe_checkout_session_id,1,8)='cs_live_' AND o.currency='GBP' AND julianday(o.created_at)>=julianday(?) AND julianday(o.created_at)<julianday(?) AND "+population;
  await read('paid_value','Paid order value (GBP)','commerce_read',['orders','commerce_order_details','users','audit_log'],"SELECT COALESCE(SUM(o.total_pence),0) value"+condition+" AND o.payment_status='paid'",[period.since,period.until],'pence','Orders created in selected period, currently paid; not accounting revenue');
  await read('orders','Live orders created','commerce_read',['orders','commerce_order_details','users','audit_log'],"SELECT COUNT(*) value"+condition,[period.since,period.until]);
  await read('refunds','Live refunds recorded (GBP)','commerce_read',['commerce_refunds','orders','users','audit_log'],"SELECT COALESCE(SUM(r.amount_pence),0) value FROM commerce_refunds r JOIN orders o ON o.id=r.order_id WHERE r.environment='live' AND o.currency='GBP' AND julianday(r.created_at)>=julianday(?) AND julianday(r.created_at)<julianday(?) AND "+population,[period.since,period.until],'pence','Refund records created in selected period');
  limitations.push('Commerce figures include live GBP orders only. Paid order value is grouped by order creation date and current payment status. Refunds use refund creation date; subtracting these figures is not a cashflow or accounting calculation.');
 }
 if(['management','members'].includes(kind)){
  if(!permit(permissions,'intelligence_read')){unavailable('week4','Week-4 return rate','Your role cannot access this source.');unavailable('helped','Steps rated helpful','Your role cannot access this source.');}
  else try{const c=await continuityScorecard(DB,{days:90});for(const [key,label] of [['week4','Week-4 return rate'],['helped','Steps rated helpful'],['firstWeekUsefulStep','First-week useful step'],['feedbackCoverage','Feedback coverage']]){const v=c[key];if(v?.ratePct!=null)metrics.push({...metric(key,label,v.ratePct,'continuity first-Today scorecard','Trailing 90-day Today cohort as of generation; independent of selected dates','percent'),numerator:v.numerator,denominator:v.denominator});else unavailable(key,label,v?.reason||v?.status||c.reason||'No eligible evidence yet.');}limitations.push(...(c.limitations||[]));}catch{unavailable('week4','Week-4 return rate','Continuity query failed.');unavailable('helped','Steps rated helpful','Continuity query failed.');}
 }
 if(kind==='management'){
  await read('support','Open support requests','support_read',['support_tickets'],"SELECT COUNT(*) value FROM support_tickets WHERE status NOT IN ('closed','resolved')",[],'count','Current snapshot at generation');
  await read('tasks','Overdue tasks','crm_read',['hq_tasks'],"SELECT COUNT(*) value FROM hq_tasks WHERE status NOT IN ('done','cancelled') AND due_at IS NOT NULL AND julianday(due_at)<julianday(?)",[new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())],'count','Current snapshot at generation');
 }
 if(['management','growth'].includes(kind)){
  if(permit(permissions,'intelligence_read'))try{
   const a=await activationScorecard(DB,{days:90}),scope='Trailing 90-day registration cohort as of '+a.asOf+'; ordered account stages, independent of selected London report dates.';
   if(!a.available)throw Error('activation_source_unavailable');
   const registered=a.stages.find(x=>x.name==='account_created')?.members;
   for(const stage of a.stages){metrics.push({...metric('activation_'+stage.name,'Activation cohort: '+stage.name.replaceAll('_',' '),stage.members,'users, user_auth, audit_log',scope),numerator:stage.members,denominator:registered});}
   for(const [name,v] of Object.entries(a.retention||{})){if(v.ratePct!=null)metrics.push({...metric('account_return_'+name,'Account return: '+name,v.ratePct,'users, user_auth, audit_log',scope+' '+v.window,'percent'),numerator:v.returned,denominator:v.eligible});else unavailable('account_return_'+name,'Account return: '+name,'No mature eligible account cohort.');}
   if(a.acquisition?.available){for(const source of a.acquisition.sources)metrics.push(metric('acquisition_'+source.source+'_'+source.medium,'First-touch registrations: '+source.source+' / '+source.medium,source.registered,'audit_log registration acquisition evidence',scope+' '+a.acquisition.model));limitations.push(...a.acquisition.limitations);}
   else unavailable('first_party_attribution','First-party registration attribution',a.acquisition?.reason||'Source evidence unavailable.');
   limitations.push(...a.limitations);
  }catch{unavailable('activation_cohort','Ordered account activation cohort','Activation source query failed or is unavailable.');}
  else unavailable('activation_cohort','Ordered account activation cohort','Your role cannot access this source.');
 }
 if(['management','growth'].includes(kind)){unavailable('organic','Organic search visits','Analytics reporting is not connected to HQ.');unavailable('conversion','Search-to-registration conversion','Verified attribution is not connected to HQ.');}
 const result=await appendAnalyticsSnapshots(DB,await appendLaunchMetrics(DB,{ok:true,kind,period,generatedAt:new Date().toISOString(),metrics,limitations:[...new Set(limitations)],privacy:'Aggregate only. No member identities, health measurements or free text.',definitions:'Unavailable figures are not zero. Cohort and snapshot measures carry their own labelled scope.'},permissions),permissions);
 if(kind==='management')result.kpiFramework=launchKpis(result);return result;
}
export async function managementRoute(request,env,ctx,authenticate){
 const memberGp=await hqMemberGpRoute(request,env,ctx,authenticate);if(memberGp)return memberGp;
 const gp=await gpDirectoryHqRoute(request,env,ctx,authenticate);if(gp)return gp;
 if(request.method==='OPTIONS')return null;
 const url=new URL(request.url),path=url.pathname;if(!['/v1/hq/management/report','/v1/hq/management/export'].includes(path))return null;
 if(!['GET','POST'].includes(request.method)||request.method==='POST'&&path.endsWith('/report')||request.method==='GET'&&path.endsWith('/export'))return json({ok:false,error:'method_not_allowed'},405);
 const auth=await authenticate(new Request(new URL('/v1/hq/me',request.url),{headers:request.headers}),env,ctx);if(!auth.ok)return auth;const a=await auth.json();const permissions=a.permissions||[];
 if(!['crm_read','commerce_read','support_read','intelligence_read'].some(p=>permit(permissions,p)))return json({ok:false,error:'hq_forbidden'},403);
 let b={};if(request.method==='POST'){const origin=request.headers.get('Origin');if(origin&&!['https://hq.shiftsometimber.co.uk',new URL(request.url).origin].includes(origin))return json({ok:false,error:'origin_not_allowed'},403);try{b=await request.json()}catch{return json({ok:false,error:'invalid_request'},400)}}
 const options={start:b.start||url.searchParams.get('start'),end:b.end||url.searchParams.get('end'),kind:b.kind||url.searchParams.get('kind')||'management',permissions};
 if(!['management','sales','members','growth'].includes(options.kind))return json({ok:false,error:'invalid_report'},400);
 if(request.method==='POST'&&!['csv','pdf'].includes(b.format))return json({ok:false,error:'invalid_format'},400);
 let report;try{report=await managementReport(env.DB,options)}catch{return json({ok:false,error:'invalid_date_range',message:'Choose valid start and end dates, up to one year apart.'},400)}
 if(!report.ok)return json(report,503);
 if(request.method==='POST'){
  if(!report.metrics.some(m=>m.status==='available'))return json({ok:false,error:'no_exportable_data'},409);
  const exportId=crypto.randomUUID();
  try{await env.DB.prepare('INSERT INTO hq_audit(hq_user_id,action,entity_type,entity_id,metadata,created_at) VALUES(?,?,?,?,?,?)').bind(a.user.id,'hq.report_export_prepared','management_report',exportId,JSON.stringify({kind:options.kind,format:b.format,period:report.period,metricKeys:report.metrics.filter(m=>m.status==='available').map(m=>m.key),generatedAt:report.generatedAt}),new Date().toISOString()).run();}catch{return json({ok:false,error:'export_audit_unavailable',message:'Export stopped because its audit record could not be saved.'},503)}
  return json({...report,exportId,auditRecorded:true,auditMeaning:'Export prepared; browser download completion cannot be verified server-side.'});
 }
 return json(report);
}
