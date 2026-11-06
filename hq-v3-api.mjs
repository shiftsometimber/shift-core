import {CONTRACT_VERSION,periodWindow,comparisonWindow,AI_ALLOWED_ACTIONS} from './hq-v3-contracts.mjs';
import {METRIC_DICTIONARY,memberDemographics,supportMetadata,staffMfaMetadata,businessSourceHealth,learningCatalogue,scenarioProjection} from './hq-v3-business.mjs';
import {hqProjectionScope} from './hq-v3-scope.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const unavailable=(reason,owner)=>({status:'unavailable',value:null,reason,owner});
const SOURCES=Object.freeze({
  members:{table:'users',fields:['id','date_of_birth','postcode'],owner:'Member data owner'},
  staff:{table:'hq_users',fields:['id','role','status','mfa_enabled'],owner:'Owner/admin'},
  shop_orders:{table:'orders',fields:['id','order_number','customer_email','currency','total_pence','created_at'],owner:'Commerce owner'},
  shop_lines:{table:'commerce_order_items',fields:['order_id','sku','product_name','quantity','unit_price_pence'],owner:'Commerce owner'},
  shop_payment:{table:'commerce_order_details',fields:['order_id','stripe_checkout_session_id'],owner:'Finance owner'},
  medicine_orders:{table:'medicine_orders',fields:['order_number','email','medicine_name','strength_label','unit_price_pence','discount_pence','total_pence','stripe_checkout_session_id','created_at'],owner:'Commerce owner'},
  medicine_membership:{table:'medicine_orders',fields:['order_number','user_id'],owner:'Commerce owner'},
  clinical_refs:{table:'clinical_member_records',fields:['id','order_number','user_id'],owner:'Rx operations owner'},
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
export async function purchaseProjection(DB,period,{synthetic=false,partition='TEST'}={}){
  if(!['TEST','LIVE'].includes(partition)||partition==='LIVE'&&synthetic)throw Error('invalid_projection_scope');
  const sources=await sourceSchemaMap(DB),orders=[],gaps=[];
  // Native synthetic checkout keeps its normal order reference. Admit that
  // cohort only in the isolated synthetic environment, with BOTH a reserved
  // example-domain address and a Stripe test-session source. Never by ref alone.
  const live=partition==='LIVE',sessionPattern=live?'cs_live_*':'cs_test_*';
  const shopScope=live?"o.order_number NOT GLOB 'TEST-*' AND length(trim(o.customer_email))>0 AND lower(trim(o.customer_email)) NOT LIKE '%@example.invalid' AND lower(trim(o.customer_email)) NOT LIKE '%@example.test'":synthetic?"(lower(o.customer_email) LIKE '%@example.invalid' OR lower(o.customer_email) LIKE '%@example.test')":"o.order_number GLOB 'TEST-*' AND lower(o.customer_email) LIKE '%@example.invalid'";
  const medicineScope=live?"order_number NOT GLOB 'TEST-*' AND medicine_name NOT GLOB 'TEST-*' AND length(trim(email))>0 AND lower(trim(email)) NOT LIKE '%@example.invalid' AND lower(trim(email)) NOT LIKE '%@example.test'":synthetic?"(lower(email) LIKE '%@example.invalid' OR lower(email) LIKE '%@example.test')":"order_number GLOB 'TEST-*' AND lower(email) LIKE '%@example.invalid'";
  if(['shop_orders','shop_lines','shop_payment'].every(key=>sources[key].status==='mapped')){
    try{
      const rows=(await DB.prepare(`SELECT o.id,o.order_number,o.currency,o.total_pence,o.status,o.payment_status,o.created_at,i.sku,i.product_name,i.quantity,i.unit_price_pence FROM orders o JOIN commerce_order_details d ON d.order_id=o.id LEFT JOIN commerce_order_items i ON i.order_id=o.id WHERE ${shopScope} AND d.stripe_checkout_session_id GLOB ? AND julianday(o.created_at)>=julianday(?) AND julianday(o.created_at)<julianday(?) ORDER BY o.id,i.id LIMIT 501`).bind(sessionPattern,period.since,period.until).all()).results;
      if(rows.length>500)gaps.push('Shop projection exceeds the 500-line limit; coverage is partial.');
      for(const row of rows.slice(0,500))orders.push({order_ref:row.order_number,type:'shop',catalogue_as_sold:row.product_name,sku:row.sku,quantity:row.quantity,unit_price_pence:row.unit_price_pence,order_total_pence:row.total_pence,currency:row.currency,payment_status:row.payment_status,last_commercial_stage:row.status,created_at:row.created_at,rx_case_ref:null,ref_mapping_status:'unavailable',line_discount_pence:null,line_discount_status:'Order discount allocation is not mapped.'});
    }catch{gaps.push('Shop purchase source query failed.');}
  }else gaps.push('Shop order/payment/line schema is incomplete.');
  if(sources.medicine_orders.status==='mapped'){
    try{
      const rows=(await DB.prepare(`SELECT order_number,medicine_name,strength_label,unit_price_pence,discount_pence,total_pence,currency,status,created_at FROM medicine_orders WHERE ${medicineScope} AND stripe_checkout_session_id GLOB ? AND julianday(created_at)>=julianday(?) AND julianday(created_at)<julianday(?) ORDER BY id LIMIT 501`).bind(sessionPattern,period.since,period.until).all()).results;
      if(rows.length>500)gaps.push('Medicine projection exceeds the 500-order limit; coverage is partial.');
      for(const row of rows.slice(0,500))orders.push({order_ref:row.order_number,type:'medicine',catalogue_as_sold:row.medicine_name,strength_as_sold:row.strength_label,sku:null,sku_status:'Catalogue SKU is not mapped.',quantity:1,unit_price_pence:row.unit_price_pence,order_discount_pence:row.discount_pence,order_total_pence:row.total_pence,currency:row.currency,last_commercial_stage:row.status,created_at:row.created_at,rx_case_ref:null,ref_mapping_status:'unavailable',stage_semantics:'Commercial order status. No pharmacy acceptance, dispense or delivery inferred.'});
    }catch{gaps.push('Medicine purchase source query failed.');}
  }else gaps.push('Medicine purchase schema is incomplete.');
  if(sources.clinical_refs.status==='mapped'&&sources.medicine_membership.status==='mapped'){
    const refs=JSON.stringify([...new Set(orders.filter(o=>o.type==='medicine').map(o=>o.order_ref))]);
    try{const links=(await DB.prepare(`SELECT r.id,r.order_number FROM clinical_member_records r JOIN medicine_orders m ON m.order_number=r.order_number AND m.user_id=r.user_id WHERE r.order_number IN (SELECT value FROM json_each(?))`).bind(refs).all()).results;
      for(const order of orders.filter(o=>o.type==='medicine')){const matches=links.filter(r=>r.order_number===order.order_ref),link=matches.length===1?matches[0]:null;if(link&&typeof link.id==='string'&&link.id.length<=120&&!/[\s@]/.test(link.id)){order.rx_case_ref=link.id;order.ref_mapping_status='canonical_owned_record';}}
    }catch{gaps.push('Canonical RX case-reference lookup failed; no case reference inferred.');}
  }
  return {status:gaps.length?'partial':'available',partition,audience:'ops_meta',source_scope:{payment_mode:live?'live':'test',authority:'Retained checkout-session identifiers; manual and missing-session orders are excluded.',known_test_exclusions:live?'TEST order references, TEST medicine labels and reserved example.invalid/example.test email destinations.':'Reserved fictional destinations and test checkout sessions.'},recognition_basis:'Order creation cohort; this is not capture-event revenue.',period,orders,gaps,captured:unavailable('A verified capture-event timestamp/receipt source is not mapped.','Finance owner'),accounting:unavailable('Accounting source not connected.','Finance owner'),cash:unavailable('Bank source not connected.','Finance owner'),contribution:unavailable('Verified costs and accounting sources not connected.','Finance owner'),privacy:'Commercial allowlist only. No addresses, assessment answers, prescribed-dose rationale, clinical message text or Health measures.'};
}
// Retained test helper cannot be repurposed to request live records.
export const testPurchaseProjection=(DB,period,{synthetic=false}={})=>purchaseProjection(DB,period,{synthetic,partition:'TEST'});
export async function hqV3Route(request,env,ctx,authenticate){
  const url=new URL(request.url),path=url.pathname;
  if(!path.startsWith('/v1/hq/management/v3/'))return null;
  if(request.method==='OPTIONS')return null;
  if(request.method!=='GET')return json({ok:false,error:'read_only_contract'},405);
  const authentication=await authenticate(new Request(new URL('/v1/hq/me',request.url),{headers:request.headers}),env,ctx);
  if(!authentication.ok)return authentication;
  const auth=await authentication.json();
  if(!['owner','admin'].includes(auth.user?.role))return json({ok:false,error:'hq_forbidden'},403);
  const scope=hqProjectionScope(env,url.searchParams.getAll('partition'));
  if(scope.error)return json({ok:false,error:scope.error,message:'A matching, explicitly configured HQ read environment is required.'},scope.status);
  if(scope.partition==='LIVE'&&(auth.user.status!=='active'||auth.user.mfaEnabled!==true||!Array.isArray(auth.permissions)||!auth.permissions.some(p=>p==='*'||p==='commerce_read')))return json({ok:false,error:'active_mfa_commercial_session_required'},403);
  const {partition}=scope;
  const capturedNow=new Date();let period;
  try{period=periodWindow({now:capturedNow,preset:url.searchParams.get('period')||'TODAY',start:url.searchParams.get('start'),end:url.searchParams.get('end')});}catch{return json({ok:false,error:'invalid_period'},400);}
  if(path.endsWith('/purchases'))return json({ok:true,definition_version:CONTRACT_VERSION,...await purchaseProjection(env.DB,period,scope)});
  if(path.endsWith('/sources'))return json({ok:true,partition,audience:'ops_meta',definition_version:CONTRACT_VERSION,sources:await sourceSchemaMap(env.DB),coverage_status:'NOT RUN'});
  const configuration=key=>{try{return JSON.parse(env[key]||'null')}catch{return null}};
  const response=data=>json({ok:true,partition,audience:'ops_meta',definition_version:CONTRACT_VERSION,observed_at:new Date().toISOString(),period,...data});
  if(path==='/v1/hq/management/v3/dictionary')return response({metrics:METRIC_DICTIONARY.map(m=>({...m,partition}))});
  if(path==='/v1/hq/management/v3/demographics'){
    if([...url.searchParams.keys()].some(k=>!['period','partition','start','end'].includes(k)))return json({ok:false,error:'aggregate_crosscuts_not_permitted'},400);
    return response({demographics:partition==='TEST'?await memberDemographics(env.DB,configuration('HQ_V3_AGGREGATE_POLICY')):unavailable('An authoritative live member-directory partition is not mapped. Email exclusions alone cannot qualify age, population or coverage.','Member data owner')});
  }
  if(path==='/v1/hq/management/v3/support')return response({support:partition==='TEST'?await supportMetadata(env.DB,configuration('HQ_V3_SUPPORT_CALENDAR')):unavailable('An authoritative live support-record partition is not mapped. Original response deadlines and receipt coverage remain unverified.','Support owner')});
  if(path==='/v1/hq/management/v3/access')return response({staff:await staffMfaMetadata(env.DB,{partition})});
  if(path==='/v1/hq/management/v3/health')return response({health:await businessSourceHealth(env.DB,{partition})});
  if(path==='/v1/hq/management/v3/learning')return response({learning:learningCatalogue(configuration('HQ_V3_LEARNING_POLICY'))});
  if(path==='/v1/hq/management/v3/scenario'){
    try{
      const input=JSON.parse(url.searchParams.get('assumptions')||'null');
      return response({scenario:scenarioProjection(input)});
    }catch{return json({ok:false,error:'invalid_scenario',message:'Use a versioned TEST scenario, GBP and bounded integer assumptions. Unknown costs must stay empty.'},400);}
  }
  const detail=path.match(/^\/v1\/hq\/management\/v3\/purchases\/([A-Za-z0-9][A-Za-z0-9._-]{1,100})$/);
  if(detail){
    if(partition==='TEST'&&!scope.synthetic&&!detail[1].startsWith('TEST-'))return json({ok:false,error:'not_found'},404);
    const purchase=await purchaseProjection(env.DB,period,scope),lines=purchase.orders.filter(row=>row.order_ref===detail[1]);
    if(!lines.length)return json({ok:false,error:purchase.status==='available'?'not_found':'purchase_source_incomplete'},purchase.status==='available'?404:503);
    let refs=unavailable('Shared case/order mapping source is not connected.','Clinical operations owner');
    const mapped=lines.find(row=>row.ref_mapping_status==='canonical_owned_record'&&row.rx_case_ref);
    if(mapped)refs={status:'available',case_ref:mapped.rx_case_ref,order_ref:mapped.order_ref,rx_path:'/workspace/clinical#'+encodeURIComponent(mapped.rx_case_ref)};
    return response({purchase:{status:purchase.status,order_ref:detail[1],lines,refs,recognition_basis:purchase.recognition_basis,gaps:purchase.gaps,refund_receipt:unavailable('Verified refund lifecycle receipt is not yet mapped.','Finance owner'),supplier:unavailable('Authoritative supplier/pathway mapping is not yet connected.','Supplier integration owner'),tracking:unavailable('No verified parcel tracking source is mapped.','Pharmacy owner'),clinical_detail_in_hq:false}});
  }
  if(path.endsWith('/contract')){
    let comparison;try{comparison=comparisonWindow(period,capturedNow);}catch{comparison=unavailable('The comparison wall-clock time is ambiguous or missing across daylight saving.','Reporting owner');}
    return json({ok:true,partition,audience:'ops_meta',definition_version:CONTRACT_VERSION,period,comparison,ai:{allowed_suggestion_types:AI_ALLOWED_ACTIONS,execution_permitted:false},acceptance_status:'NOT RUN',supplier_path:'UNVERIFIED',device_receipt:'UNVERIFIED'});
  }
  return json({ok:false,error:'not_found'},404);
}
