import {parseJSON} from './fulfilment-model.mjs';
const fail=(message,status=400,code='invalid_request')=>Object.assign(new Error(message),{status,code});
const all=async(DB,sql,args=[])=>((await DB.prepare(sql).bind(...args).all()).results||[]);
export const catalogue="SELECT id,sku,name,supplier_sku,supplier_state FROM testing_products UNION ALL SELECT id,sku,name,supplier_sku,supplier_state FROM testing_range_extras";
export const sourceSQL=`WITH catalogue AS (${catalogue}) SELECT oi.id source_line_id,o.id source_order_id,o.order_number,o.customer_name,o.customer_email,o.created_at,o.updated_at order_updated_at,o.payment_status,o.status order_status,oi.sku,oi.quantity,p.id catalogue_id,p.name,p.supplier_sku,p.supplier_state,d.shipping_name,d.shipping_address_json,d.stripe_checkout_session_id,d.stripe_payment_status,COALESCE((SELECT SUM(amount_pence) FROM commerce_refunds WHERE order_id=o.id),0) refunded_pence FROM orders o JOIN commerce_order_items oi ON oi.order_id=o.id LEFT JOIN catalogue p ON p.sku=oi.sku LEFT JOIN commerce_order_details d ON d.order_id=o.id WHERE (p.id IS NOT NULL OR oi.sku LIKE 'SST-NF-%')`;
export const sourceRows=(DB,ids)=>all(DB,sourceSQL+' AND o.id IN (SELECT value FROM json_each(?)) ORDER BY o.id,oi.id',[JSON.stringify(ids)]);
export function guards(rows){return rows.map(r=>({line_id:r.source_line_id,order_id:r.source_order_id,sku:r.sku,quantity:r.quantity,supplier_sku:r.supplier_sku,order_updated_at:r.order_updated_at,customer_name:r.customer_name,customer_email:r.customer_email,shipping_name:r.shipping_name,shipping_address_json:r.shipping_address_json,session:r.stripe_checkout_session_id}));}
export function liveGuard(snapshot,revision,ownBatch=''){
 const ids=JSON.stringify(snapshot.order_ids),expected=JSON.stringify(snapshot.guards);
 return {sql:`EXISTS(SELECT 1 FROM testing_fulfilment_config WHERE id=1 AND revision=? AND template_confirmed=1 AND delivery_confirmed=1)
 AND NOT EXISTS(SELECT 1 FROM testing_fulfilment_items WHERE active=1 AND source_order_id IN (SELECT value FROM json_each(?)) AND batch_id<>?)
 AND NOT EXISTS(SELECT 1 FROM json_each(?) s LEFT JOIN commerce_order_items oi ON oi.id=json_extract(s.value,'$.line_id') LEFT JOIN orders o ON o.id=oi.order_id LEFT JOIN commerce_order_details d ON d.order_id=o.id LEFT JOIN catalogue p ON p.sku=oi.sku
 WHERE oi.id IS NULL OR o.id IS NOT json_extract(s.value,'$.order_id') OR oi.sku IS NOT json_extract(s.value,'$.sku') OR oi.quantity IS NOT json_extract(s.value,'$.quantity') OR p.supplier_sku IS NOT json_extract(s.value,'$.supplier_sku') OR o.updated_at IS NOT json_extract(s.value,'$.order_updated_at') OR o.customer_name IS NOT json_extract(s.value,'$.customer_name') OR o.customer_email IS NOT json_extract(s.value,'$.customer_email') OR d.shipping_name IS NOT json_extract(s.value,'$.shipping_name') OR d.shipping_address_json IS NOT json_extract(s.value,'$.shipping_address_json') OR d.stripe_checkout_session_id IS NOT json_extract(s.value,'$.session') OR o.payment_status<>'paid' OR d.stripe_payment_status<>'paid' OR d.stripe_checkout_session_id NOT LIKE 'cs_live_%' OR o.status NOT IN ('new','paid','processing') OR p.supplier_state='coming_soon' OR EXISTS(SELECT 1 FROM commerce_refunds WHERE order_id=o.id AND amount_pence>0))
 AND (SELECT COUNT(*) FROM commerce_order_items oi LEFT JOIN catalogue p ON p.sku=oi.sku WHERE oi.order_id IN (SELECT value FROM json_each(?)) AND (p.id IS NOT NULL OR oi.sku LIKE 'SST-NF-%'))=json_array_length(?)`,args:[revision,ids,ownBatch,expected,ids,expected]};
}
export async function fresh(DB,b){
 if(b.status==='cancelled')throw fail('This export was cancelled. Prepare a new batch.',409,'batch_cancelled');
 if(b.mode==='test'||b.status!=='prepared')return;
 const guard=liveGuard(parseJSON(b.snapshot_json),b.config_revision,b.id);
 const row=await DB.prepare(`WITH catalogue AS (${catalogue}) SELECT 1 valid WHERE ${guard.sql}`).bind(...guard.args).first();
 if(!row)throw fail('An order, product code or CSV setup changed. Cancel this draft and prepare a fresh export.',409,'batch_outdated');
}
