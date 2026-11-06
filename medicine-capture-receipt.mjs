import {digest} from './pharmacy-handover-v1.mjs';
export const CAPTURE_SCHEMA=[
 `CREATE TABLE IF NOT EXISTS medicine_payment_receipts(event_id TEXT PRIMARY KEY,order_number TEXT NOT NULL,session_id TEXT NOT NULL,payment_intent TEXT NOT NULL,mode TEXT NOT NULL CHECK(mode IN ('test','live')),amount_pence INTEGER NOT NULL CHECK(amount_pence>=0),currency TEXT NOT NULL CHECK(currency='GBP'),occurred_at TEXT NOT NULL,received_at TEXT NOT NULL,payload_digest TEXT NOT NULL)`,
 `CREATE INDEX IF NOT EXISTS medicine_payment_receipt_time ON medicine_payment_receipts(mode,occurred_at)`,
 `CREATE TRIGGER IF NOT EXISTS medicine_capture_snapshot BEFORE INSERT ON medicine_payment_receipts WHEN NOT EXISTS(SELECT 1 FROM medicine_orders m WHERE m.order_number=NEW.order_number AND m.stripe_checkout_session_id=NEW.session_id AND m.stripe_payment_intent_id=NEW.payment_intent AND m.total_pence=NEW.amount_pence AND upper(m.currency)=NEW.currency) BEGIN SELECT RAISE(ABORT,'medicine_capture_snapshot_changed'); END`,
 `CREATE TRIGGER IF NOT EXISTS medicine_capture_immutable_update BEFORE UPDATE ON medicine_payment_receipts BEGIN SELECT RAISE(ABORT,'immutable_capture_receipt'); END`,
 `CREATE TRIGGER IF NOT EXISTS medicine_capture_immutable_delete BEFORE DELETE ON medicine_payment_receipts BEGIN SELECT RAISE(ABORT,'immutable_capture_receipt'); END`
];
const invalid=()=>{throw Object.assign(Error('medicine_capture_receipt_mismatch'),{captureReceipt:true});};
export async function captureReceipt(event,order,mode,raw){
 const s=event?.data?.object;
 if(!['test','live'].includes(mode)||typeof event.livemode!=='boolean'||event.livemode!==(mode==='live')||!Number.isSafeInteger(event.created)||event.created<=0||event.created>Math.floor(Date.now()/1000)+300||!/^evt_[A-Za-z0-9_]+$/.test(event.id||''))invalid();
 if(!s||s.id!==order.stripe_checkout_session_id||!s.id.startsWith('cs_'+mode+'_')||s.metadata?.order_number!==order.order_number||s.client_reference_id!=null&&s.client_reference_id!==order.order_number||s.metadata?.user_id!=null&&String(s.metadata.user_id)!==String(order.user_id)||!Number.isSafeInteger(s.amount_total)||s.amount_total!==order.total_pence||s.currency!=='gbp'||String(order.currency).toUpperCase()!=='GBP'||!/^pi_[A-Za-z0-9_]+$/.test(s.payment_intent||'')||order.stripe_payment_intent_id&&order.stripe_payment_intent_id!==s.payment_intent||s.livemode!=null&&s.livemode!==event.livemode)invalid();
 return {eventId:event.id,orderNumber:order.order_number,sessionId:s.id,paymentIntent:s.payment_intent,mode,amountPence:s.amount_total,currency:'GBP',occurredAt:new Date(event.created*1000).toISOString(),payloadDigest:await digest(raw)};
}
export function captureStatement(DB,r,received){return DB.prepare('INSERT OR IGNORE INTO medicine_payment_receipts VALUES(?,?,?,?,?,?,?,?,?,?)').bind(r.eventId,r.orderNumber,r.sessionId,r.paymentIntent,r.mode,r.amountPence,r.currency,r.occurredAt,received,r.payloadDigest);}
