import {CONTRACT_VERSION,periodWindow,comparisonWindow,AI_ALLOWED_ACTIONS} from './hq-v3-contracts.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const unavailable=(reason,owner)=>({status:'unavailable',value:null,reason,owner});
const SOURCES=Object.freeze({
  members:{table:'users',fields:['id','date_of_birth','postcode'],owner:'Member data owner'},
  staff:{table:'hq_users',fields:['id','role','status','mfa_enabled'],owner:'Owner/admin'},
  shop_orders:{table:'orders',fields:['id','order_number','customer_email','currency','total_pence','created_at'],owner:'Commerce owner'},
  shop_lines:{table:'commerce_order_items',fields:['order_id','sku','product_name','quantity','unit_price_pence'],owner:'Commerce owner'},
  shop_payment:{table:'commerce_order_details',fields:['order_id','stripe_checkout_session_id'],owner:'Finance owner'},
  medicine_orders:{table:'medicine_orders',fields:['order_number','email','medicine_name','strength_label','unit_price_pence','discount_pence','total_pence','stripe_checkout_session_id','created_at'],owner:'Commerce owner'},
  support:{table:'support_tickets',fields:['reference','status','assigned_hq_user_id','created_at'],owner:'Support owner'},
  tasks:{table:'hq_tasks',fields:['id','status','assigned_to','due_at'],owner:'Operations owner'},
  partner_handovers:{table:'hq_partner_handovers',fields:['reference','partner_id','owner_name','next_action','due_date','status'],owner:'Partner operations owner'}
});
export async function sourceSchemaMap(DB){
  const output={};
  for(const [key,source] of Object.entries(SOURCES)){
    try{
      const exists=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(source.table).first();
      if(!exists){output[key]={...source,status:'unavailable',reason:'Source table not present.'};continue;}
      // Table names come only from the fixed map above, never request input.
      const columns=new Set((await DB.prepare('PRAGMA table_info('+source.table+')').all()).results.map(row=>row.name));
      const missing=source.fields.filter(field=>!columns.has(field));
      output[key]={...source,status:missing.length?'unavailable':'mapped',missing_fields:missing,proof:'Schema only. Coverage, freshness and integration acceptance remain NOT RUN.'};
    }catch{output[key]={...source,status:'unavailable',reason:'Source schema could not be inspected.'};}
  }
  return output;
}
export async function testPurchaseProjection(DB,period){
  const sources=await sourceSchemaMap(DB),orders=[],gaps=[];
  if(['shop_orders','shop_lines','shop_payment'].every(key=>sources[key].status==='mapped')){
    try{
      const rows=(await DB.prepare(`SELECT o.id,o.order_number,o.currency,o.total_pence,o.status,o.payment_status,o.created_at,i.sku,i.product_name,i.quantity,i.unit_price_pence FROM orders o JOIN commerce_order_details d ON d.order_id=o.id LEFT JOIN commerce_order_items i ON i.order_id=o.id WHERE o.order_number GLOB 'TEST-*' AND lower(o.customer_email) LIKE '%@example.invalid' AND d.stripe_checkout_session_id LIKE 'cs_test_%' AND julianday(o.created_at)>=julianday(?) AND julianday(o.created_at)<julianday(?) ORDER BY o.id,i.id LIMIT 501`).bind(period.since,period.until).all()).results;
      if(rows.length>500)gaps.push('Shop projection exceeds the 500-line limit; coverage is partial.');
      for(const row of rows.slice(0,500))orders.push({order_ref:row.order_number,type:'shop',catalogue_as_sold:row.product_name,sku:row.sku,quantity:row.quantity,unit_price_pence:row.unit_price_pence,order_total_pence:row.total_pence,currency:row.currency,payment_status:row.payment_status,last_commercial_stage:row.status,created_at:row.created_at,rx_case_ref:null,ref_mapping_status:'unavailable',line_discount_pence:null,line_discount_status:'Order discount allocation is not mapped.'});
    }catch{gaps.push('Shop purchase source query failed.');}
  }else gaps.push('Shop order/payment/line schema is incomplete.');
  if(sources.medicine_orders.status==='mapped'){
    try{
      const rows=(await DB.prepare(`SELECT order_number,medicine_name,strength_label,unit_price_pence,discount_pence,total_pence,currency,status,created_at FROM medicine_orders WHERE order_number GLOB 'TEST-*' AND lower(email) LIKE '%@example.invalid' AND stripe_checkout_session_id LIKE 'cs_test_%' AND julianday(created_at)>=julianday(?) AND julianday(created_at)<julianday(?) ORDER BY id LIMIT 501`).bind(period.since,period.until).all()).results;
      if(rows.length>500)gaps.push('Medicine projection exceeds the 500-order limit; coverage is partial.');
      for(const row of rows.slice(0,500))orders.push({order_ref:row.order_number,type:'medicine',catalogue_as_sold:row.medicine_name,strength_as_sold:row.strength_label,sku:null,sku_status:'Catalogue SKU is not mapped.',quantity:1,unit_price_pence:row.unit_price_pence,order_discount_pence:row.discount_pence,order_total_pence:row.total_pence,currency:row.currency,last_commercial_stage:row.status,created_at:row.created_at,rx_case_ref:null,ref_mapping_status:'unavailable',stage_semantics:'Commercial order status. No pharmacy acceptance, dispense or delivery inferred.'});
    }catch{gaps.push('Medicine purchase source query failed.');}
  }else gaps.push('Medicine purchase schema is incomplete.');
  return {status:gaps.length?'partial':'available',partition:'TEST',recognition_basis:'Order creation cohort; this is not capture-event revenue.',period,orders,gaps,captured:unavailable('A verified capture-event timestamp/receipt source is not mapped.','Finance owner'),accounting:unavailable('Accounting source not connected.','Finance owner'),cash:unavailable('Bank source not connected.','Finance owner'),contribution:unavailable('Verified costs and accounting sources not connected.','Finance owner'),privacy:'Commercial allowlist only. No addresses, assessment answers, prescribed-dose rationale, clinical message text or Health measures.'};
}
export async function hqV3Route(request,env,ctx,authenticate){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/v1/hq/management/v3/'))return null;
  if(request.method==='OPTIONS')return null;
  if(request.method!=='GET')return json({ok:false,error:'read_only_test_contract'},405);
  const authentication=await authenticate(new Request(new URL('/v1/hq/me',request.url),{headers:request.headers}),env,ctx);
  if(!authentication.ok)return authentication;
  const auth=await authentication.json();
  if(!['owner','admin'].includes(auth.user?.role))return json({ok:false,error:'hq_forbidden'},403);
  // This new projection cannot accidentally query production via an HQ cookie.
  if(env.HQ_V3_TEST_MODE!=='true'||env.DEPLOYMENT_ENVIRONMENT!=='test')return json({ok:false,error:'isolated_test_environment_required',message:'The v3 TEST projection is not enabled on this environment.'},503);
  if((url.searchParams.get('partition')||'TEST')!=='TEST')return json({ok:false,error:'test_partition_required'},403);
  let period;
  try{period=periodWindow({preset:url.searchParams.get('period')||'TODAY',start:url.searchParams.get('start'),end:url.searchParams.get('end')});}catch{return json({ok:false,error:'invalid_period'},400);}
  if(path.endsWith('/purchases'))return json({ok:true,definition_version:CONTRACT_VERSION,...await testPurchaseProjection(env.DB,period)});
  if(path.endsWith('/sources'))return json({ok:true,partition:'TEST',definition_version:CONTRACT_VERSION,sources:await sourceSchemaMap(env.DB),coverage_status:'NOT RUN'});
  if(path.endsWith('/contract')){
    let comparison;try{comparison=comparisonWindow(period);}catch{comparison=unavailable('The comparison wall-clock time is ambiguous or missing across daylight saving.','Reporting owner');}
    return json({ok:true,partition:'TEST',definition_version:CONTRACT_VERSION,period,comparison,ai:{allowed_suggestion_types:AI_ALLOWED_ACTIONS,execution_permitted:false},acceptance_status:'NOT RUN',supplier_path:'UNVERIFIED',device_receipt:'UNVERIFIED'});
  }
  return json({ok:false,error:'not_found'},404);
}
