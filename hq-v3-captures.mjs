// Read-only projection over immutable native checkout receipts. This does not
// create a payment, infer bank cash, or backfill legacy capture timestamps.
const missing=reason=>({status:'unavailable',value:null,unit:'pence',currency:'GBP',owner:'Finance owner',reason});
export async function medicineCaptureProjection(DB,period,{synthetic=false,partition='TEST'}={}){
 if(!['TEST','LIVE'].includes(partition)||partition==='LIVE'&&synthetic)throw Error('invalid_projection_scope');
 if(!Number.isFinite(Date.parse(period?.since))||!Number.isFinite(Date.parse(period?.until))||Date.parse(period.since)>=Date.parse(period.until))throw Error('invalid_capture_period');
 const mode=partition==='LIVE'?'live':'test',session='cs_'+mode+'_';
 const scope=partition==='LIVE'?"m.order_number NOT GLOB 'TEST-*' AND m.medicine_name NOT GLOB 'TEST-*' AND length(trim(m.email))>0 AND lower(trim(m.email)) NOT LIKE '%@example.invalid' AND lower(trim(m.email)) NOT LIKE '%@example.test'":synthetic?"(lower(trim(m.email)) LIKE '%@example.invalid' OR lower(trim(m.email)) LIKE '%@example.test')":"m.order_number GLOB 'TEST-*' AND lower(trim(m.email)) LIKE '%@example.invalid'";
 try{
  for(const [table,required]of [['medicine_payment_receipts',['event_id','order_number','session_id','payment_intent','mode','amount_pence','currency','occurred_at','payload_digest']],['medicine_orders',['order_number','email','medicine_name','stripe_checkout_session_id','stripe_payment_intent_id','total_pence','currency','status','created_at']]]){
   const columns=new Set(((await DB.prepare('PRAGMA table_info('+table+')').all()).results||[]).map(r=>r.name));
   if(required.some(n=>!columns.has(n)))return missing('The canonical medicine receipt or payment-snapshot schema is unavailable. Legacy order status is insufficient.');
  }
  const snapshot="r.session_id=m.stripe_checkout_session_id AND r.payment_intent=m.stripe_payment_intent_id AND r.amount_pence=m.total_pence AND r.currency=upper(m.currency)";
  const unknownTime=await DB.prepare(`SELECT COUNT(*) n FROM medicine_payment_receipts r JOIN medicine_orders m ON m.order_number=r.order_number WHERE ${scope} AND m.stripe_checkout_session_id GLOB ? AND r.mode=? AND (julianday(r.occurred_at) IS NULL OR r.occurred_at NOT GLOB '????-??-??T??:??:??.???Z')`).bind(session+'*',mode).first();
  if(unknownTime?.n)return missing('A canonical receipt has no valid source-event time. The capture period cannot be established.');
  const records=(await DB.prepare(`SELECT r.event_id,r.order_number,r.session_id,r.payment_intent,r.amount_pence,r.currency,r.occurred_at,r.payload_digest,CASE WHEN ${snapshot} THEN 1 ELSE 0 END snapshot_matches,
   (SELECT COUNT(*) FROM medicine_payment_receipts x WHERE x.mode=r.mode AND x.payment_intent=r.payment_intent) receipt_count,
   (SELECT COUNT(DISTINCT json_array(x.order_number,x.session_id,x.amount_pence,x.currency)) FROM medicine_payment_receipts x WHERE x.mode=r.mode AND x.payment_intent=r.payment_intent) snapshot_count
   FROM medicine_payment_receipts r JOIN medicine_orders m ON m.order_number=r.order_number
   WHERE ${scope} AND m.stripe_checkout_session_id GLOB ? AND r.mode=?
   AND r.event_id=(SELECT x.event_id FROM medicine_payment_receipts x WHERE x.mode=r.mode AND x.payment_intent=r.payment_intent ORDER BY julianday(x.occurred_at),x.event_id LIMIT 1)
   AND julianday(r.occurred_at)>=julianday(?) AND julianday(r.occurred_at)<julianday(?)
   ORDER BY julianday(r.occurred_at),r.event_id LIMIT 10001`).bind(session+'*',mode,period.since,period.until).all()).results||[];
  if(records.length>10000)return {...missing('The receipt cohort exceeds 10,000 captures. The total is withheld rather than truncated.'),status:'partial'};
  const invalid=records.filter(r=>r.snapshot_matches!==1||r.snapshot_count!==1||!Number.isSafeInteger(r.amount_pence)||r.amount_pence<0||r.currency!=='GBP'||!/^evt_[A-Za-z0-9_]+$/.test(r.event_id)||!r.session_id.startsWith(session)||!/^pi_[A-Za-z0-9_]+$/.test(r.payment_intent)||!/^[a-f0-9]{64}$/.test(r.payload_digest)||!Number.isFinite(Date.parse(r.occurred_at))||new Date(r.occurred_at).toISOString()!==r.occurred_at);
  if(invalid.length)return {...missing('A canonical receipt conflicts with its retained payment snapshot. Finance review is required; no total is reported.'),conflicting_groups:invalid.length};
  const value=records.reduce((n,r)=>n+r.amount_pence,0);if(!Number.isSafeInteger(value))return missing('The receipt total exceeds the supported integer range.');
  const legacy=await DB.prepare(`SELECT COUNT(*) n FROM medicine_orders m WHERE ${scope} AND m.stripe_checkout_session_id GLOB ? AND m.status IN ('paid','succeeded','completed','fulfilled','refunded') AND julianday(m.created_at)>=julianday(?) AND julianday(m.created_at)<julianday(?) AND NOT EXISTS(SELECT 1 FROM medicine_payment_receipts r WHERE r.mode=? AND r.order_number=m.order_number AND ${snapshot})`).bind(session+'*',period.since,period.until,mode).first();
  return {status:'available',value,unit:'pence',currency:'GBP',owner:'Finance owner',partition,source:'medicine_payment_receipts',recognition_basis:'First verified successful-checkout event time per payment intent; end-exclusive selected period.',reason:'Medicine payment receipts only. Additional price-adjustment payments, shop payments, refunds, accounting revenue, costs and bank cash are separate sources.',capture_count:records.length,receipt_count:records.reduce((n,r)=>n+r.receipt_count,0),legacy_paid_orders_in_creation_cohort:Number(legacy?.n||0),legacy_basis:'Orders created in this period without a matching receipt are excluded; no capture time or zero receipt is invented.',records:records.map(r=>({order_ref:r.order_number,amount_pence:r.amount_pence,occurred_at:r.occurred_at,source_receipt_count:r.receipt_count}))};
 }catch{return missing('The authoritative medicine capture query failed. No order-status or creation-time fallback was used.');}
}
