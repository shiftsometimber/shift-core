// Aggregate-only diagnostics: never emit customer data, webhook bodies or keys.
export async function commerceRecoveryHealth(DB){
 const definitions=[
  ['shopCallbacks','stripe_events','processed_at IS NULL','received_at'],
  ['medicineCallbacks','medicine_stripe_events','processed_at IS NULL','received_at'],
  ['receipts','commerce_receipt_delivery',"state<>'accepted'",'updated_at'],
  ['checkoutAttempts','checkout_attempts',"active=1 AND (state IN ('unknown','rejected') OR julianday(updated_at)<julianday('now','-30 minutes'))",'updated_at']
 ];
 const queues={};
 for(const [key,table,where,date]of definitions){
  try{
   const exists=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(table).first();
   if(!exists){queues[key]={verified:false,reason:'store_not_initialised'};continue}
   const row=await DB.prepare(`SELECT COUNT(*) count,MIN(${date}) oldest FROM ${table} WHERE ${where}`).first();
   queues[key]={verified:true,count:Number(row.count),oldest:row.oldest||null};
  }catch{queues[key]={verified:false,reason:'query_failed'}}
 }
 return {queues,checkedAt:new Date().toISOString(),humanAlertReceiptVerified:false};
}
