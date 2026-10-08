import {continuityScorecard} from './continuity-measurement/scorecard.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function londonMidnight(day){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day)throw Error('invalid_date');
 const nominal=Date.parse(day+'T00:00:00Z');const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 const parts=Object.fromEntries(fmt.formatToParts(new Date(nominal)).map(x=>[x.type,x.value]));const local=Date.UTC(+parts.year,+parts.month-1,+parts.day,+parts.hour,+parts.minute,+parts.second);return new Date(nominal-(local-nominal)).toISOString();
}
export function reportWindow(start,end){const since=londonMidnight(start),endDay=new Date(end+'T00:00:00Z');if(!Number.isFinite(endDay.getTime())||endDay.toISOString().slice(0,10)!==end)throw Error('invalid_date');endDay.setUTCDate(endDay.getUTCDate()+1);const until=londonMidnight(endDay.toISOString().slice(0,10));const days=(Date.parse(until)-Date.parse(since))/86400000;if(days<=0||days>367)throw Error('invalid_range');return{start,end,since,until,timezone:'Europe/London'};}
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
  await read('registrations','New registrations','crm_read',['users'],"SELECT COUNT(*) value FROM users u WHERE julianday(u.created_at)>=julianday(?) AND julianday(u.created_at)<julianday(?) AND lower(u.email) NOT LIKE '%@example.invalid' AND lower(u.email) NOT LIKE '%@example.test'"+(tables.has('hq_users')?" AND NOT EXISTS(SELECT 1 FROM hq_users h WHERE lower(h.email)=lower(u.email))":''),[period.since,period.until]);
  limitations.push('Registration count excludes HQ email matches and example.invalid/example.test addresses; other unlabelled test identities may remain.');
 }
 if(['management','sales'].includes(kind)){
  const condition=" FROM orders o JOIN commerce_order_details d ON d.order_id=o.id WHERE d.stripe_checkout_session_id LIKE 'cs_live_%' AND o.currency='GBP' AND julianday(o.created_at)>=julianday(?) AND julianday(o.created_at)<julianday(?)";
  await read('paid_value','Paid order value (GBP)','commerce_read',['orders','commerce_order_details'],"SELECT COALESCE(SUM(o.total_pence),0) value"+condition+" AND o.payment_status='paid'",[period.since,period.until],'pence','Orders created in selected period, currently paid; not accounting revenue');
  await read('orders','Live orders created','commerce_read',['orders','commerce_order_details'],"SELECT COUNT(*) value"+condition,[period.since,period.until]);
  await read('refunds','Live refunds recorded (GBP)','commerce_read',['commerce_refunds','orders'],"SELECT COALESCE(SUM(r.amount_pence),0) value FROM commerce_refunds r JOIN orders o ON o.id=r.order_id WHERE r.environment='live' AND o.currency='GBP' AND julianday(r.created_at)>=julianday(?) AND julianday(r.created_at)<julianday(?)",[period.since,period.until],'pence','Refund records created in selected period');
  limitations.push('Commerce figures include live GBP orders only. Paid order value is grouped by order creation date and current payment status. Refunds use refund creation date; subtracting these figures is not a cashflow or accounting calculation.');
 }
 if(['management','members'].includes(kind)){
  if(!permit(permissions,'intelligence_read')){unavailable('week4','Week-4 return rate','Your role cannot access this source.');unavailable('helped','Steps rated helpful','Your role cannot access this source.');}
  else try{const c=await continuityScorecard(DB,{days:90});for(const [key,label] of [['week4','Week-4 return rate'],['helped','Steps rated helpful']]){const v=c[key];if(v?.ratePct!=null)metrics.push({...metric(key,label,v.ratePct,'continuity first-Today scorecard','Trailing 90-day Today cohort as of generation; independent of selected dates','percent'),numerator:v.numerator,denominator:v.denominator});else unavailable(key,label,v?.reason||v?.status||c.reason||'No eligible evidence yet.');}limitations.push(...(c.limitations||[]));}catch{unavailable('week4','Week-4 return rate','Continuity query failed.');unavailable('helped','Steps rated helpful','Continuity query failed.');}
 }
 if(kind==='management'){
  await read('support','Open support requests','support_read',['support_tickets'],"SELECT COUNT(*) value FROM support_tickets WHERE status NOT IN ('closed','resolved')",[],'count','Current snapshot at generation');
  await read('tasks','Overdue tasks','crm_read',['hq_tasks'],"SELECT COUNT(*) value FROM hq_tasks WHERE status NOT IN ('done','cancelled') AND due_at IS NOT NULL AND julianday(due_at)<julianday(?)",[new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())],'count','Current snapshot at generation');
 }
 if(['management','growth'].includes(kind)){unavailable('organic','Organic search visits','Analytics reporting is not connected to HQ.');unavailable('conversion','Search-to-registration conversion','Verified attribution is not connected to HQ.');}
 return{ok:true,kind,period,generatedAt:new Date().toISOString(),metrics,limitations:[...new Set(limitations)],privacy:'Aggregate only. No member identities, health measurements or free text.',definitions:'Unavailable figures are not zero. Cohort and snapshot measures carry their own labelled scope.'};
}
export async function managementRoute(request,env,ctx,authenticate){
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
