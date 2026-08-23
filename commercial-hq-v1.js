import {ensureCommercialCatalogueSchema,evaluateCommercialGate} from './commercial-catalogue-v1.js';
import {ensureTreatmentCatalogueSchema} from './treatment-catalogue-v1.js';

const HQ_ORIGINS=new Set(['https://hq.shiftsometimber.co.uk']);
const EDITABLE_FIELDS=new Set([
  'supplier_id','supplier_sku','actual_cost_pence','actual_cost_status','cost_basis','vat_treatment',
  'p_and_p_cost_pence','p_and_p_cost_status','payment_cost_pence','expected_refund_decline_cost_pence',
  'direct_support_cost_pence','contribution_cost_status','lead_time_min_days','lead_time_max_days',
  'lead_time_status','target_gm_bps','minimum_contribution_pence','commercial_state','source_reference',
  'approver','effective_at','next_review_at'
]);
const INTEGER_FIELDS=new Set(['supplier_id','actual_cost_pence','p_and_p_cost_pence','payment_cost_pence','expected_refund_decline_cost_pence','direct_support_cost_pence','lead_time_min_days','lead_time_max_days','target_gm_bps','minimum_contribution_pence']);

function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}})}
function cors(request){const origin=request.headers.get('Origin')||'';return HQ_ORIGINS.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, PATCH, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Shift-Admin-Key','Vary':'Origin'}:{}}
async function digest(value){return new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value))))}
async function sameSecret(a,b){const [left,right]=await Promise.all([digest(a),digest(b)]);let diff=left.length^right.length;for(let i=0;i<Math.max(left.length,right.length);i++)diff|=(left[i%left.length]??0)^(right[i%right.length]??0);return diff===0}
async function authorised(request,env){const expected=String(env.ADMIN_API_KEY||''),supplied=String(request.headers.get('x-shift-admin-key')||'');return Boolean(expected&&supplied&&await sameSecret(expected,supplied))}
async function body(request){const declared=Number(request.headers.get('content-length')||0);if(declared>32768)return null;const text=await request.text();if(new TextEncoder().encode(text).length>32768)return null;try{return JSON.parse(text)}catch{return null}}

async function ensureAuditSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS catalogue_audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, treatment_strength_id INTEGER,
    action TEXT NOT NULL, actor TEXT NOT NULL, request_id TEXT NOT NULL,
    before_json TEXT, after_json TEXT, occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id), FOREIGN KEY(treatment_strength_id) REFERENCES treatment_strengths(id))`).run();
}
async function ensure(env){await ensureCommercialCatalogueSchema(env);await ensureTreatmentCatalogueSchema(env);await ensureAuditSchema(env)}

async function listPhysical(env){
  const {results}=await env.DB.prepare(`SELECT p.id,p.sku,p.name,p.price_pence,p.status,
    c.supplier_id,c.supplier_sku,c.actual_cost_pence,c.actual_cost_status,c.cost_basis,c.vat_treatment,
    c.p_and_p_cost_pence,c.p_and_p_cost_status,c.payment_cost_pence,c.expected_refund_decline_cost_pence,
    c.direct_support_cost_pence,c.contribution_cost_status,c.lead_time_min_days,c.lead_time_max_days,c.lead_time_status,
    c.target_gm_bps,c.minimum_contribution_pence,c.commercial_state,c.source_reference,c.approver,c.effective_at,c.next_review_at,
    s.legal_name supplier_legal_name,s.trading_name supplier_trading_name,s.registered_address supplier_address,
    s.contact_email supplier_email,s.contact_phone supplier_phone,s.website supplier_website,s.status supplier_status
    FROM products p LEFT JOIN catalogue_commercial_control c ON c.product_id=p.id
    LEFT JOIN catalogue_suppliers s ON s.id=c.supplier_id WHERE p.product_type='physical' ORDER BY p.id`).all();
  return (results||[]).map(row=>({...row,gate:evaluateCommercialGate(row)}));
}
async function listTreatments(env){
  const {results}=await env.DB.prepare(`SELECT ts.id,tf.family_key family,tfo.formulation_key formulation,tfo.route,tfo.routine,
    ts.strength_label,ts.proposed_price_pence,ts.selling_price_pence,ts.target_gm_bps,ts.actual_cost_pence,ts.cost_status,
    ts.stock_state,ts.stock_source,ts.stock_confirmed_at,ts.claims_state,ts.cta_state,
    GROUP_CONCAT(o.offer_type||':'||o.availability_state||':'||o.commercial_state,'|') offers
    FROM treatment_strengths ts JOIN treatment_formulations tfo ON tfo.id=ts.formulation_id
    JOIN treatment_families tf ON tf.id=tfo.family_id LEFT JOIN treatment_offers o ON o.strength_id=ts.id
    GROUP BY ts.id ORDER BY tf.family_key,tfo.formulation_key,ts.id`).all();
  return results||[];
}

async function updatePhysical(request,env,productId){
  const input=await body(request);if(!input||typeof input.changes!=='object'||Array.isArray(input.changes))return json({ok:false,error:'invalid_body'},400,cors(request));
  const current=await env.DB.prepare(`SELECT p.price_pence,c.*,s.status supplier_status FROM products p LEFT JOIN catalogue_commercial_control c ON c.product_id=p.id LEFT JOIN catalogue_suppliers s ON s.id=c.supplier_id WHERE p.id=? AND p.product_type='physical'`).bind(productId).first();
  if(!current)return json({ok:false,error:'product_not_found'},404,cors(request));
  const entries=Object.entries(input.changes).filter(([key])=>EDITABLE_FIELDS.has(key));if(!entries.length||entries.length!==Object.keys(input.changes).length)return json({ok:false,error:'invalid_change_set'},400,cors(request));
  const values=[];for(const [key,value] of entries){if(INTEGER_FIELDS.has(key)&&value!==null&&(!Number.isInteger(value)||value<0))return json({ok:false,error:'invalid_value',field:key},400,cors(request));values.push(value)}
  const proposed={...current,...input.changes};if(proposed.lead_time_min_days!==null&&proposed.lead_time_max_days!==null&&Number(proposed.lead_time_max_days)<Number(proposed.lead_time_min_days))return json({ok:false,error:'invalid_lead_time'},400,cors(request));
  if(input.changes.commercial_state==='approved'){
    const supplier=input.changes.supplier_id!==undefined?await env.DB.prepare('SELECT status FROM catalogue_suppliers WHERE id=?').bind(input.changes.supplier_id).first():{status:current.supplier_status};
    const gate=evaluateCommercialGate({...proposed,supplier_status:supplier?.status});if(!gate.ok)return json({ok:false,error:'activation_gate_failed',gate},409,cors(request));
  }
  const requestId=crypto.randomUUID(),actor=String(input.actor||'HQ operator').trim().slice(0,120);
  const assignments=entries.map(([key])=>`${key}=?`).join(',');
  await env.DB.batch([
    env.DB.prepare(`UPDATE catalogue_commercial_control SET ${assignments},updated_at=CURRENT_TIMESTAMP WHERE product_id=?`).bind(...values,productId),
    env.DB.prepare(`INSERT INTO catalogue_audit_events(product_id,action,actor,request_id,before_json,after_json) VALUES(?,'commercial_update',?,?,?,?)`).bind(productId,actor,requestId,JSON.stringify(current),JSON.stringify(input.changes))
  ]);
  const updated=(await listPhysical(env)).find(row=>Number(row.id)===productId);
  return json({ok:true,requestId,product:updated},200,cors(request));
}

export async function commercialHqRoutes(request,env){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(!path.startsWith('/v1/hq/catalogue'))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(request)});
  if(!HQ_ORIGINS.has(request.headers.get('Origin')||''))return json({ok:false,error:'origin_not_allowed'},403,cors(request));
  if(!await authorised(request,env))return json({ok:false,error:'unauthorised'},401,cors(request));
  await ensure(env);
  if(request.method==='GET'&&path==='/v1/hq/catalogue')return json({ok:true,physical:await listPhysical(env),treatments:await listTreatments(env)},200,cors(request));
  const match=path.match(/^\/v1\/hq\/catalogue\/physical\/(\d+)$/);if(request.method==='PATCH'&&match)return updatePhysical(request,env,Number(match[1]));
  return json({ok:false,error:'not_found'},404,cors(request));
}
