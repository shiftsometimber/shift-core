import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {ensurePrescriptionSchema,applyPrescriptionEvent,memberPrescription} from '../prescription-workflow-v1.mjs';
import {medicineCommerceInternals,medicineCommerceRoutes} from '../medicine-commerce-v1.js';

class Statement {
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[]}
  bind(...args){this.args=args;return this}
  async first(){return this.db.prepare(this.sql).get(...this.args)||null}
  async all(){return {results:this.db.prepare(this.sql).all(...this.args)}}
  async run(){return {meta:{changes:Number(this.db.prepare(this.sql).run(...this.args).changes)}}}
}
async function setup(){
  const sql=new DatabaseSync(':memory:');
  const DB={prepare:q=>new Statement(sql,q),batch:async statements=>{sql.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());sql.exec('COMMIT');return out}catch(e){sql.exec('ROLLBACK');throw e}}};
  sql.exec(`CREATE TABLE medicine_orders(id INTEGER PRIMARY KEY,order_number TEXT,status TEXT,clinical_status TEXT,clinical_updated_at TEXT,updated_at TEXT,reorder_eligible_at TEXT);
    INSERT INTO medicine_orders VALUES(1,'TEST-1','paid','approved',NULL,NULL,NULL),(2,'TEST-2','paid','approved',NULL,NULL,NULL);
    CREATE TABLE order_reference_registry(order_number TEXT PRIMARY KEY,status TEXT,updated_at TEXT);
    INSERT INTO order_reference_registry VALUES('TEST-1','approved',NULL),('TEST-2','approved',NULL);`);
  await ensurePrescriptionSchema(DB);
  return {sql,DB,row:()=>sql.prepare('SELECT * FROM medicine_orders WHERE id=1').get(),close:()=>sql.close()};
}
function event(status,extra={}){return {status,orderNumber:'TEST-1',eventReference:'event-'+status,prescriptionReference:'RX-TEST',occurredAt:'2026-09-01T12:00:00Z',...(status==='prescription_signed'?{signedRecordReference:'private-signed-document',prescriberReference:'private-prescriber',prescription:{medicineName:'Test GLP medicine',strengthLabel:'Test strength',formulation:'Injection',directions:'Synthetic test directions',quantity:'One test pack'}}:{}),...(status==='pharmacy_received'?{pharmacyReceiptReference:'PHARMACY-RECEIPT'}:{}),...extra}}
const stages=['prescription_signed','sent_to_pharmacy','pharmacy_received','dispensing','dispatched','fulfilled'];
for(const medicineName of ['Test GLP medicine','Test testosterone medicine'])test(`${medicineName}: signed record to fulfilment has six immutable confirmed events`,async()=>{
  const f=await setup();try{
    for(const status of stages){const e=event(status);if(e.prescription)e.prescription.medicineName=medicineName;assert.equal((await applyPrescriptionEvent(f.DB,f.row(),e)).ok,true,status)}
    assert.equal(f.row().clinical_status,'fulfilled');assert.equal(f.row().pharmacy_receipt_reference,'PHARMACY-RECEIPT');
    assert.equal(f.sql.prepare('SELECT count(*) n FROM medicine_prescription_events').get().n,6);
    assert.equal(f.sql.prepare("SELECT status FROM order_reference_registry WHERE order_number='TEST-1'").get().status,'fulfilled');
    const visible=memberPrescription(f.row());assert.equal(visible.medicine.medicineName,medicineName);assert.ok(visible.signedAt&&visible.sentAt&&visible.pharmacyReceivedAt);assert.ok(!JSON.stringify(visible).includes('private-'));
  }finally{f.close()}
});
test('no signing before approval, no skipped pharmacy receipt, no unpaid prescription',async()=>{
  const f=await setup();try{
    assert.equal((await applyPrescriptionEvent(f.DB,f.row(),event('dispensing'))).httpStatus,409);
    for(const state of ['assessment_pending','declined','refund_pending','refunded']){f.sql.prepare('UPDATE medicine_orders SET clinical_status=?').run(state);assert.equal((await applyPrescriptionEvent(f.DB,f.row(),event('prescription_signed'))).ok,false)}
    f.sql.exec("UPDATE medicine_orders SET clinical_status='approved',status='refunded'");assert.equal((await applyPrescriptionEvent(f.DB,f.row(),event('prescription_signed'))).error,'paid_order_required');
    assert.equal(f.sql.prepare('SELECT count(*) n FROM medicine_prescription_events').get().n,0);
  }finally{f.close()}
});
test('a signed document reference, prescriber identity and complete medicine are compulsory',async()=>{
  const f=await setup();try{
    for(const key of ['signedRecordReference','prescriberReference','prescription']){const e=event('prescription_signed');delete e[key];assert.equal((await applyPrescriptionEvent(f.DB,f.row(),e)).ok,false)}
    for(const key of ['medicineName','strengthLabel','formulation','directions','quantity']){const e=event('prescription_signed');delete e.prescription[key];assert.equal((await applyPrescriptionEvent(f.DB,f.row(),e)).error,'prescribed_medicine_required')}
    assert.equal(f.row().clinical_status,'approved');
  }finally{f.close()}
});
test('exact replay is idempotent, changed replay and cross-order event reuse fail',async()=>{
  const f=await setup();try{
    const e=event('prescription_signed');assert.equal((await applyPrescriptionEvent(f.DB,f.row(),e)).ok,true);
    assert.equal((await applyPrescriptionEvent(f.DB,f.row(),e)).duplicate,true);
    assert.equal((await applyPrescriptionEvent(f.DB,f.row(),{...e,occurredAt:'2026-09-01T12:00:01Z'})).error,'prescription_event_conflict');
    const other=f.sql.prepare('SELECT * FROM medicine_orders WHERE id=2').get();assert.equal((await applyPrescriptionEvent(f.DB,other,{...e,orderNumber:'TEST-2'})).error,'prescription_event_conflict');
    assert.equal(f.sql.prepare('SELECT count(*) n FROM medicine_prescription_events').get().n,1);
  }finally{f.close()}
});
test('receipt is explicit, time cannot go backwards and signed contents cannot change',async()=>{
  const f=await setup();try{
    await applyPrescriptionEvent(f.DB,f.row(),event('prescription_signed'));
    assert.equal((await applyPrescriptionEvent(f.DB,f.row(),event('sent_to_pharmacy',{occurredAt:'2026-08-01T00:00:00Z'}))).error,'prescription_event_out_of_order');
    assert.equal((await applyPrescriptionEvent(f.DB,f.row(),event('sent_to_pharmacy',{prescription:{medicineName:'Changed'}}))).error,'prescription_already_signed');
    await applyPrescriptionEvent(f.DB,f.row(),event('sent_to_pharmacy'));
    assert.equal((await applyPrescriptionEvent(f.DB,f.row(),event('pharmacy_received',{pharmacyReceiptReference:undefined}))).error,'pharmacy_receipt_required');
    assert.equal((await applyPrescriptionEvent(f.DB,f.row(),event('pharmacy_received',{prescriptionReference:'another-rx'}))).error,'prescription_reference_mismatch');
    assert.equal(f.row().clinical_status,'sent_to_pharmacy');
  }finally{f.close()}
});
test('a stale concurrent order snapshot cannot overwrite progress or append an event',async()=>{
  const f=await setup();try{
    const stale=f.row();await applyPrescriptionEvent(f.DB,stale,event('prescription_signed'));
    const raced=await applyPrescriptionEvent(f.DB,stale,event('prescription_signed',{eventReference:'other-delivery'}));
    assert.equal(raced.error,'order_status_changed');assert.equal(f.sql.prepare('SELECT count(*) n FROM medicine_prescription_events').get().n,1);
    assert.equal(f.row().prescription_event_reference,'event-prescription_signed');
  }finally{f.close()}
});
test('ledger failure rolls back order and registry together',async()=>{
  const f=await setup();try{
    f.sql.exec("CREATE TRIGGER fail_ledger BEFORE INSERT ON medicine_prescription_events BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;");
    await assert.rejects(applyPrescriptionEvent(f.DB,f.row(),event('prescription_signed')),/synthetic failure/);
    assert.equal(f.row().clinical_status,'approved');assert.equal(f.row().prescription_reference,null);assert.equal(f.sql.prepare("SELECT status FROM order_reference_registry WHERE order_number='TEST-1'").get().status,'approved');
  }finally{f.close()}
});
test('legacy records remain readable and signing adopts the strict workflow',async()=>{
  const f=await setup();try{assert.equal(f.row().prescription_workflow_version,0);assert.equal(memberPrescription(f.row()),null);await ensurePrescriptionSchema(f.DB);await applyPrescriptionEvent(f.DB,f.row(),event('prescription_signed'));assert.equal(f.row().prescription_workflow_version,1);assert.equal((await applyPrescriptionEvent(f.DB,f.row(),event('dispensing'))).error,'invalid_prescription_transition')}finally{f.close()}
});
test('member sees the prescribed medicine separately from preference and no unsafe repeat',()=>{
  const row={prescription_reference:'RX',prescription_json:JSON.stringify(event('prescription_signed').prescription),medicine_name:'Preference',strength_label:'Requested strength',clinical_status:'fulfilled',reorder_eligible_at:'2020-01-01T00:00:00Z'};
  const visible=medicineCommerceInternals.memberTreatmentView(row,true);assert.equal(visible.medicineName,'Test GLP medicine');assert.equal(visible.requestedMedicineName,'Preference');assert.equal(visible.canReorder,false);
});
test('unauthenticated receipt cannot read or update a database',async()=>{
  for(const secret of [undefined,'actual-secret']){const response=await medicineCommerceRoutes(new Request('https://api.shiftsometimber.co.uk/v1/integrations/pharmacy/treatment-status',{method:'POST',headers:{authorization:'Bearer wrong'},body:'{}'}),{PHARMACY_INTEGRATION_SECRET:secret},{});assert.equal(response.status,secret?401:503)}
});
test('tracker renders confirmed progress, escapes provider text and refreshes without an unsafe repeat link',async()=>{
  const source=readFileSync(new URL('../frontend/member/member-treatment-journey-v1.js',import.meta.url),'utf8');
  const host={innerHTML:'',querySelectorAll:()=>[],querySelector:()=>null};let poll,calls=0;
  const order={orderNumber:'TEST',medicineName:'Test testosterone medicine',strengthLabel:'Test strength',clinicalStatus:'sent_to_pharmacy',headline:'Sent',message:'Confirmed',paymentStatus:'paid',canReorder:true,prescription:{reference:'<img src=x onerror=alert(1)>'}};
  const api={getTreatmentOrders:async()=>{calls++;return {orders:[order]}}};
  const document={hidden:false,readyState:'complete',getElementById:()=>host,querySelector:()=>null,createElement:()=>({dataset:{}}),head:{appendChild:()=>{}},addEventListener:()=>{}};
  vm.runInNewContext(source,{document,window:{SST_API:api},SST_API:api,location:{pathname:'/member/dashboard',search:''},Intl,URLSearchParams,setInterval:fn=>{poll=fn},setTimeout:()=>{}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(host.innerHTML.includes('aria-current="step" class="is-current">Sent to pharmacy'));
  assert.ok(host.innerHTML.includes('&lt;img src=x onerror=alert(1)&gt;'));assert.ok(!host.innerHTML.includes('<img'));assert.ok(!host.innerHTML.includes('/treatment-order?'));
  order.clinicalStatus='pharmacy_received';poll();await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,2);assert.ok(host.innerHTML.includes('aria-current="step" class="is-current">Received by pharmacy'));
  document.hidden=true;poll();await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,2);
});
