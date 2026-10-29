import assert from 'node:assert/strict';
import {createHash,createHmac} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import test from 'node:test';
import {medicineCommerceRoutes} from '../medicine-commerce-v1.js';

class D1Statement {
  constructor(database,sql){this.database=database;this.sql=sql;this.args=[]}
  bind(...args){this.args=args;return this}
  async first(){return this.database.prepare(this.sql).get(...this.args)||null}
  async all(){return{success:true,results:this.database.prepare(this.sql).all(...this.args)}}
  async run(){const result=this.database.prepare(this.sql).run(...this.args);return{success:true,meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid||0)}}}
}

class D1TestDatabase {
  constructor(){this.database=new DatabaseSync(':memory:')}
  prepare(sql){return new D1Statement(this.database,sql)}
  async batch(statements){const results=[];this.database.exec('BEGIN');try{for(const statement of statements)results.push(await statement.run());this.database.exec('COMMIT');return results}catch(error){this.database.exec('ROLLBACK');throw error}}
  async exec(sql){this.database.exec(sql);return{success:true}}
  close(){this.database.close()}
}

const sha=value=>createHash('sha256').update(value).digest('hex');
const memberRequest=(path,init={})=>new Request(`https://api.shiftsometimber.co.uk${path}`,{
  ...init,
  headers:{Origin:'https://shiftsometimber.co.uk',Cookie:'sst_session=e2e-member-session',...(init.headers||{})},
});
const partnerRequest=(path,body)=>new Request(`https://api.shiftsometimber.co.uk${path}`,{
  method:'POST',headers:{authorization:'Bearer pharmacy-e2e-secret','content-type':'application/json'},body:JSON.stringify(body),
});

async function setup(){
  const DB=new D1TestDatabase();
  await DB.exec(`
    CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT NOT NULL,first_name TEXT,last_name TEXT);
    CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE user_sessions(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,token_hash TEXT NOT NULL UNIQUE,expires_at TEXT NOT NULL,revoked_at TEXT);
    CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,preferences TEXT NOT NULL DEFAULT '{}');
    CREATE TABLE audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,action TEXT NOT NULL,entity_type TEXT,entity_id TEXT,metadata TEXT,created_at TEXT NOT NULL);
    CREATE TABLE medicine_products(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,active_ingredient TEXT NOT NULL,form TEXT NOT NULL,status TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE medicine_variants(id INTEGER PRIMARY KEY AUTOINCREMENT,medicine_id INTEGER NOT NULL,strength_label TEXT NOT NULL,cost_pence INTEGER NOT NULL DEFAULT 0,selling_price_pence INTEGER NOT NULL DEFAULT 0,target_margin_bps INTEGER NOT NULL DEFAULT 6000,status TEXT NOT NULL,sort_order INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(medicine_id,strength_label));
    CREATE TABLE medicine_inventory(variant_id INTEGER PRIMARY KEY,stock_on_hand INTEGER NOT NULL DEFAULT 0,reserved INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE commerce_discount_codes(id INTEGER PRIMARY KEY AUTOINCREMENT,code TEXT UNIQUE,discount_type TEXT,discount_value INTEGER,active INTEGER,starts_at TEXT,ends_at TEXT,usage_limit INTEGER,usage_count INTEGER DEFAULT 0,minimum_subtotal_pence INTEGER DEFAULT 0,eligible_products_json TEXT DEFAULT '[]');
    INSERT INTO users VALUES(42,'member@example.test','Test','Member');
    INSERT INTO user_auth VALUES(42,1);
    INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(42,'${sha('e2e-member-session')}','2099-01-01T00:00:00.000Z');
    INSERT INTO member_state(user_id,preferences) VALUES(42,'{}');
    INSERT INTO medicine_products(id,name,active_ingredient,form,status,description,sort_order) VALUES
      (1,'Mounjaro','tirzepatide','injection','available','E2E test medicine',10),
      (2,'Foundayo','orforglipron','tablet','available','Provisional record',20);
    INSERT INTO medicine_variants(id,medicine_id,strength_label,cost_pence,selling_price_pence,target_margin_bps,status,sort_order) VALUES
      (11,1,'2.5 mg',6760,16900,6000,'available',1),
      (21,2,'0.8 mg',5160,12900,6000,'available',1);
    INSERT INTO medicine_inventory VALUES(11,1,0,CURRENT_TIMESTAMP),(21,9,0,CURRENT_TIMESTAMP);
    ALTER TABLE medicine_products ADD COLUMN partner TEXT;
    ALTER TABLE medicine_products ADD COLUMN sellable INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE medicine_products ADD COLUMN availability_state TEXT NOT NULL DEFAULT 'unavailable';
    ALTER TABLE medicine_variants ADD COLUMN partner TEXT;
    ALTER TABLE medicine_variants ADD COLUMN sellable INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE medicine_variants ADD COLUMN availability_state TEXT NOT NULL DEFAULT 'unavailable';
    UPDATE medicine_products SET partner='TEST_PHARMACY',sellable=1,availability_state='available' WHERE id=1;
    UPDATE medicine_variants SET partner='TEST_PHARMACY',sellable=1,availability_state='available' WHERE id=11;
  `);
  const foundayoLock=await readFile(new URL('../migrations/019_foundayo_option_stock_lock.sql',import.meta.url),'utf8');
  await DB.exec(foundayoLock);
  return DB;
}

test('one treatment order completes verification, Stripe test payment, tracker, Journey and dispatch',async()=>{
  const DB=await setup(),outbound=globalThis.fetch,seen={pharmacy:false,stripe:false};
  globalThis.fetch=async(input,init={})=>{
    const url=String(input);
    if(url==='https://pharmacy.example.test/clinical-intake'){
      seen.pharmacy=true;
      assert.equal(init.headers.authorization,'Bearer pharmacy-e2e-secret');
      assert.equal(init.body.get('memberReference'),'42');
      assert.equal(init.body.get('variantId'),'11');
      assert.equal(init.body.get('insulinUse'),'no');
      assert.equal(init.body.get('journeyStage'),'prepay_verification');
      for(const field of ['photoId','bodyFront','bodySide'])assert.ok(init.body.get(field) instanceof File,field);
      return Response.json({reference:'PHA-E2E-0001',patientReference:'PAT-E2E-42',status:'verified',verified:true});
    }
    if(url==='https://api.stripe.com/v1/checkout/sessions'){
      seen.stripe=true;
      assert.match(init.headers.authorization,/^Bearer sk_test_/);
      const stripeBody=new URLSearchParams(init.body);
      assert.equal(stripeBody.get('line_items[0][price_data][unit_amount]'),'16900');
      assert.match(stripeBody.get('success_url'),/\/order-success\?session_id=\{CHECKOUT_SESSION_ID\}$/);
      return Response.json({id:'cs_test_shift_e2e_1',url:'https://checkout.stripe.test/c/pay/shift-e2e'});
    }
    throw new Error(`Unexpected outbound request: ${url}`);
  };
  const env={DB,STRIPE_MODE:'test',STRIPE_SECRET_KEY:'sk_test_shift_e2e',STRIPE_WEBHOOK_SECRET:'whsec_shift_e2e',PHARMACY_CLINICAL_INTAKE_URL:'https://pharmacy.example.test/clinical-intake',PHARMACY_INTEGRATION_SECRET:'pharmacy-e2e-secret',PUBLIC_SITE_URL:'https://shiftsometimber.co.uk'};
  try{
    const catalogueResponse=await medicineCommerceRoutes(memberRequest('/v1/catalogue/medicines'),env,{}),catalogue=await catalogueResponse.json();
    assert.equal(catalogueResponse.status,200);
    assert.deepEqual(catalogue.products.map(product=>product.name),['Mounjaro','Foundayo']);
    assert.equal(catalogue.products[0].variants[0].pricePence,16900);
    assert.equal(catalogue.products[0].variants[0].status,'available');
    assert.equal('costPence' in catalogue.products[0].variants[0],false);
    assert.equal('targetMarginBps' in catalogue.products[0].variants[0],false);
    assert.equal(catalogue.products[1].variants[0].pricePence,12900);
    assert.equal(catalogue.products[1].variants[0].status,'out_of_stock');
    assert.equal(catalogue.products[1].variants[0].remaining,0);

    const blocked=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({variantId:11,insulinUse:'no',eligibility:{heightCm:173,weightKg:92.4,weightRelatedCondition:'no'}})}),env,{});
    assert.equal(blocked.status,409);
    assert.equal((await blocked.json()).error,'prepay_verification_required');
    assert.equal(seen.stripe,false);

    const clinical=new FormData();
    for(const [key,value] of Object.entries({patientFirstName:'Test',patientLastName:'Member',patientPhone:'01610000000',patientAddress1:'1 Test Street',patientTown:'Test town',patientPostcode:'AA1 1AA',variantId:'11',insulinUse:'no',weightRelatedCondition:'no',dateOfBirth:'1981-08-03',heightCm:'173',weightKg:'92.4',conditions:'none declared',medicines:'none declared',previousTreatment:'yes',previousMedicine:'Mounjaro',previousDose:'2.5 mg',lastDoseDate:'2026-09-01',gpName:'Dr Test',gpPractice:'Test Practice',gpAddress:'1 Test Street',gpPostcode:'SK10 1AA',gpPhone:'01610000000',nhsNumber:'9999999999'}))clinical.set(key,value);
    for(const key of ['gpContactConsent','imageConsent','answersConfirmed'])clinical.set(key,'on');
    for(const key of ['photoId','bodyFront','bodySide'])clinical.set(key,new File([new Uint8Array([0xff,0xd8,0xff,0xd9])],`${key}.jpg`,{type:'image/jpeg'}));
    const intakeResponse=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-clinical-intake',{method:'POST',body:clinical}),env,{}),intake=await intakeResponse.json();
    assert.equal(intakeResponse.status,200);
    assert.equal(intake.verified,true);
    assert.equal(intake.nextStep,'payment');
    assert.ok(intake.verificationToken);
    assert.equal(seen.pharmacy,true);

    const checkoutResponse=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({variantId:11,insulinUse:'no',eligibility:{heightCm:173,weightKg:92.4,weightRelatedCondition:'no'},verificationToken:intake.verificationToken})}),env,{}),checkout=await checkoutResponse.json();
    assert.equal(checkoutResponse.status,201);
    assert.equal(checkout.totalPence,16900);
    assert.equal(checkout.checkoutUrl,'https://checkout.stripe.test/c/pay/shift-e2e');
    assert.equal(seen.stripe,true);

    const reuse=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({variantId:11,insulinUse:'no',eligibility:{heightCm:173,weightKg:92.4,weightRelatedCondition:'no'},verificationToken:intake.verificationToken})}),env,{});
    assert.equal(reuse.status,201);
    assert.equal((await reuse.json()).orderNumber,checkout.orderNumber,'retry resumes the same verified purchase');
    for(const insulinUse of ['yes',undefined]){
      const stopped=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({variantId:11,verificationToken:intake.verificationToken,insulinUse,eligibility:{heightCm:173,weightKg:92.4}})}),env,{});
      assert.match((await stopped.json()).error,/insulin_(service_exclusion|answer_required)/,'Existing checkout session cannot waive a current answer');
    }
    assert.equal((await DB.prepare('SELECT COUNT(*) count FROM medicine_orders').first()).count,1);

    const timestamp=Math.floor(Date.now()/1000),event={id:'evt_shift_e2e_paid',type:'checkout.session.completed',data:{object:{id:'cs_test_shift_e2e_1',client_reference_id:checkout.orderNumber,payment_status:'paid',payment_intent:'pi_shift_e2e',metadata:{order_type:'medicine',order_number:checkout.orderNumber}}}},payload=JSON.stringify(event),signature=createHmac('sha256',env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${payload}`).digest('hex');
    const webhook=await medicineCommerceRoutes(new Request('https://api.shiftsometimber.co.uk/v1/commerce/stripe/webhook',{method:'POST',headers:{'stripe-signature':`t=${timestamp},v1=${signature}`},body:payload}),env,{});
    assert.equal(webhook.status,200);

    const confirmation=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-order-status?session_id=cs_test_shift_e2e_1'),env,{}),confirmed=await confirmation.json();
    assert.equal(confirmation.status,200);
    assert.equal(confirmed.paymentStatus,'paid');
    assert.equal(confirmed.clinicalStatus,'assessment_pending');
    assert.equal(confirmed.medicineName,'Mounjaro');

    const approve=await medicineCommerceRoutes(partnerRequest('/v1/integrations/pharmacy/treatment-status',{orderNumber:checkout.orderNumber,status:'approved'}),env,{});
    assert.equal(approve.status,200);
    let tracker=await (await medicineCommerceRoutes(memberRequest('/v1/treatment/orders'),env,{})).json();
    assert.equal(tracker.orders[0].journeySetupRequired,true);
    assert.equal(tracker.orders[0].canReorder,false);

    const incompleteJourney=JSON.stringify({myJourney:{setup:{startDate:'2026-09-06',targetMode:'loss'},weight:{startKg:92.4,currentKg:92.4,targetKg:80}}});
    await DB.prepare('UPDATE member_state SET preferences=? WHERE user_id=42').bind(incompleteJourney).run();
    const blockedJourney=await medicineCommerceRoutes(memberRequest('/v1/treatment/journey-setup-complete',{method:'POST'}),env,{});
    assert.equal(blockedJourney.status,409);

    const journey=JSON.stringify({myJourney:{setup:{startDate:'2026-09-06',targetMode:'loss'},weight:{startKg:92.4,currentKg:92.4,targetKg:80},lifeBack:{priorities:['energy']}}});
    await DB.prepare('UPDATE member_state SET preferences=? WHERE user_id=42').bind(journey).run();
    const journeyComplete=await medicineCommerceRoutes(memberRequest('/v1/treatment/journey-setup-complete',{method:'POST'}),env,{});
    assert.equal(journeyComplete.status,200);
    assert.equal((await journeyComplete.json()).completed,1);

    const skippedPrescription=await medicineCommerceRoutes(partnerRequest('/v1/integrations/pharmacy/treatment-status',{orderNumber:checkout.orderNumber,status:'dispensing',eventReference:'skip-event',prescriptionReference:'rx-e2e',occurredAt:'2026-09-06T12:00:00Z'}),env,{});
    assert.equal(skippedPrescription.status,409);
    for(const status of ['prescription_signed','sent_to_pharmacy','pharmacy_received','dispensing','dispatched']){
      const transition=await medicineCommerceRoutes(partnerRequest('/v1/integrations/pharmacy/treatment-status',{orderNumber:checkout.orderNumber,status,eventReference:'event-'+status,prescriptionReference:'rx-e2e',occurredAt:'2026-09-06T12:00:00.000Z',...(status==='prescription_signed'?{signedRecordReference:'signed-record-e2e',prescriberReference:'prescriber-e2e',prescription:{medicineName:'Mounjaro',strengthLabel:'2.5 mg',formulation:'Injection',directions:'As prescribed',quantity:'1 pen'}}:{}),...(status==='pharmacy_received'?{pharmacyReceiptReference:'receipt-e2e'}:{})}),env,{});
      assert.equal(transition.status,200,status);
    }
    const fulfilled=await medicineCommerceRoutes(partnerRequest('/v1/integrations/pharmacy/treatment-status',{orderNumber:checkout.orderNumber,status:'fulfilled',eventReference:'event-fulfilled',prescriptionReference:'rx-e2e',occurredAt:'2026-09-06T12:00:00.000Z',reorderEligibleAt:'2026-09-01T00:00:00.000Z'}),env,{});
    assert.equal(fulfilled.status,200);
    tracker=await (await medicineCommerceRoutes(memberRequest('/v1/treatment/orders'),env,{})).json();
    assert.equal(tracker.orders[0].clinicalStatus,'fulfilled');
    assert.equal(tracker.orders[0].prescription.reference,'rx-e2e');
    assert.equal(tracker.orders[0].prescription.pharmacyReceivedAt,'2026-09-06T12:00:00.000Z');
    assert.ok(!JSON.stringify(tracker).includes('signed-record-e2e'));
    assert.equal((await DB.prepare('SELECT pharmacy_receipt_reference FROM medicine_orders WHERE order_number=?').bind(checkout.orderNumber).first()).pharmacy_receipt_reference,'receipt-e2e');
    assert.equal(tracker.orders[0].journeySetupRequired,false);
    assert.equal(tracker.orders[0].journeySetupComplete,true);
    assert.equal(tracker.orders[0].canReorder,true);

    const inventory=await DB.prepare('SELECT stock_on_hand,reserved FROM medicine_inventory WHERE variant_id=11').first();
    assert.equal(inventory.stock_on_hand,0);
    assert.equal(inventory.reserved,0);
    const storedIntake=await DB.prepare('SELECT evidence_manifest_json,gp_contact_consent,status FROM medicine_clinical_intakes').first();
    assert.deepEqual(JSON.parse(storedIntake.evidence_manifest_json),{photoId:true,bodyFront:true,bodySide:true});
    assert.equal(storedIntake.gp_contact_consent,1);
    assert.equal(storedIntake.status,'verified');
    const changedPrescription={medicineName:'Clinician-selected alternative',strengthLabel:'Changed strength'};
    await DB.prepare('UPDATE medicine_orders SET prescription_json=? WHERE order_number=?').bind(JSON.stringify(changedPrescription),checkout.orderNumber).run();
    const unsafeRepeat=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({variantId:11,reorderOfOrderNumber:checkout.orderNumber,insulinUse:'no',eligibility:{heightCm:173,weightKg:92.4,weightRelatedCondition:'no'}})}),env,{});
    assert.equal(unsafeRepeat.status,409);
    assert.equal((await unsafeRepeat.json()).error,'repeat_requires_clinical_reconciliation');

  }finally{
    globalThis.fetch=outbound;
    DB.close();
  }
});

test('SHIFT eligibility blocks insulin, missing answers and low BMI before new, repeat or resumed checkout',async()=>{
  const DB=await setup(),outbound=globalThis.fetch;let sent=0;
  globalThis.fetch=async()=>{sent++;throw Error('Blocked eligibility must not contact a partner or Stripe')};
  const env={DB,STRIPE_MODE:'test',STRIPE_SECRET_KEY:'sk_test_eligibility',PHARMACY_PREPAY_VERIFICATION_URL:'https://pharmacy.example.test/verify',PHARMACY_CLINICAL_INTAKE_URL:'https://pharmacy.example.test/intake',PHARMACY_INTEGRATION_SECRET:'test'};
  try{
    const heightCm=173,weightKg=92.4;
    for(const route of ['/v1/commerce/medicine-checkout','/v1/commerce/medicine-prepay-verification']){
      for(const [answer,weight,expected]of [['yes',weightKg,'insulin_service_exclusion'],[undefined,weightKg,'insulin_answer_required'],['no',65,'bmi_service_exclusion']]){
        const assessment={heightCm,weightKg:weight,weightRelatedCondition:'no',insulinUse:answer};
        for(const reorderOfOrderNumber of [undefined,'OLD-FULFILLED-ORDER']){
          const body={variantId:11,insulinUse:answer,eligibility:assessment,assessment,verificationToken:'old-verified-token',reorderOfOrderNumber};
          const r=await medicineCommerceRoutes(memberRequest(route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env,{});
          assert.equal((await r.json()).error,expected,route);
        }
      }
    }
    for(const answer of ['yes','',null]){
      const form=new FormData();form.set('variantId','11');if(answer!==null)form.set('insulinUse',answer);
      const r=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-clinical-intake',{method:'POST',body:form}),env,{});
      assert.match((await r.json()).error,/insulin_(service_exclusion|answer_required)/);
    }
    assert.equal(sent,0);
    assert.equal(DB.database.prepare('SELECT count(*) n FROM medicine_orders').get().n,0);
    assert.equal(DB.database.prepare("SELECT count(*) n FROM sqlite_master WHERE name='checkout_attempts'").get().n,0,'Blocked eligibility does not even create the checkout store');
    assert.equal(DB.database.prepare('SELECT reserved FROM medicine_inventory WHERE variant_id=11').get().reserved,0);
  }finally{globalThis.fetch=outbound;DB.close()}
});

test('invalid or underage intake cannot forward images or obtain prepayment verification',async()=>{
  const DB=await setup(),outbound=globalThis.fetch;let sent=0;
  globalThis.fetch=async()=>{sent++;throw Error('Rejected birth dates must not contact a partner or Stripe')};
  const env={DB,PHARMACY_PREPAY_VERIFICATION_URL:'https://pharmacy.example.test/verify',PHARMACY_CLINICAL_INTAKE_URL:'https://pharmacy.example.test/intake',PHARMACY_INTEGRATION_SECRET:'test'};
  try{
    for(const [dateOfBirth,error,status] of [['','date_of_birth_invalid',400],['2008-02-30','date_of_birth_invalid',400],['2099-01-01','date_of_birth_invalid',400],['2015-01-01','adult_service_required',422]]){
      const assessment={dateOfBirth,heightCm:173,weightKg:92.4,weightRelatedCondition:'no',insulinUse:'no'};
      const form=new FormData();form.set('variantId','11');
      for(const [key,value] of Object.entries(assessment))form.set(key,String(value));
      form.set('photoId',new File(['fictional evidence'],'test.jpg',{type:'image/jpeg'}));
      const intake=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-clinical-intake',{method:'POST',body:form}),env,{});
      assert.equal(intake.status,status);assert.equal((await intake.json()).error,error);
      const verification=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-prepay-verification',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({variantId:11,assessment})}),env,{});
      assert.equal(verification.status,status);assert.equal((await verification.json()).error,error);
    }
    assert.equal(sent,0);
    assert.equal(DB.database.prepare('SELECT count(*) n FROM medicine_clinical_intakes').get().n,0);
    assert.equal(DB.database.prepare('SELECT count(*) n FROM medicine_prepay_verifications').get().n,0);
    assert.equal(DB.database.prepare('SELECT reserved FROM medicine_inventory WHERE variant_id=11').get().reserved,0);
  }finally{globalThis.fetch=outbound;DB.close()}
});

function completeIntake(overrides={}){
  const form=new FormData();
  for(const[key,value]of Object.entries({submissionId:crypto.randomUUID(),variantId:'11',patientFirstName:'Test',patientLastName:'Member',patientPhone:'01610000000',patientAddress1:'1 Test Street',patientAddress2:'',patientTown:'Test town',patientPostcode:'SK10 1AA',dateOfBirth:'1981-08-03',heightCm:'173',weightKg:'92.4',weightRelatedCondition:'no',insulinUse:'no',conditions:'none declared',medicines:'none declared',previousTreatment:'no',gpName:'Dr Test',gpPractice:'Test Practice',gpAddress:'1 Test Street',gpPostcode:'SK10 1AA',gpContactConsent:'on',answersConfirmed:'on',imageConsent:'on',...overrides}))if(value!==undefined)form.set(key,value);
  for(const name of ['photoId','bodyFront','bodySide'])form.set(name,new File([new Uint8Array([0xff,0xd8,0xff,0xd9])],name+'.jpg',{type:'image/jpeg'}));
  return form;
}
async function withPharmacy(run,handler=()=>Response.json({reference:'PHA-COMPLETE',patientReference:'PAT-42',status:'submitted'})){
  const DB=await setup(),original=globalThis.fetch,calls=[];
  const env={DB,PHARMACY_CLINICAL_INTAKE_URL:'https://pharmacy.example.test/intake',PHARMACY_CLINICAL_RESUME_URL:'https://pharmacy.example.test/resume',PHARMACY_PORTAL_ORIGIN:'https://portal.example.test',PHARMACY_INTEGRATION_SECRET:'pharmacy-e2e-secret'};
  globalThis.fetch=async(url,init)=>{calls.push({url:String(url),init});return handler(url,init,calls.length)};
  const submit=form=>medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-clinical-intake',{method:'POST',body:form}),env,{});
  try{await run({DB,env,calls,submit})}finally{globalThis.fetch=original;DB.close()}
}

test('handover explicitly maps patient contact, authoritative treatment, full answers, consent and attachment receipts',async()=>{
  await withPharmacy(async({DB,calls,submit})=>{
    const long='Full medical history '.repeat(45),response=await submit(completeIntake({conditions:long}));
    assert.equal(response.status,202);
    const {init}=calls[0],sent=init.body;
    assert.equal(init.redirect,'error');assert.ok(init.signal);
    assert.equal(sent.get('patientEmail'),'member@example.test');
    for(const field of ['patientFirstName','patientLastName','patientPhone','patientAddress1','patientTown','patientPostcode','gpName','gpPractice','gpAddress','gpPostcode'])assert.ok(sent.get(field),field);
    assert.equal(sent.get('medicineName'),'Mounjaro');assert.equal(sent.get('strengthLabel'),'2.5 mg');
    assert.equal(sent.get('conditions'),long.trim());assert.equal(sent.get('gpContactConsent'),'true');
    assert.match(sent.get('consentVersion'),/^medicine-clinical/);assert.ok(Number.isFinite(Date.parse(sent.get('consentRecordedAt'))));
    assert.equal(init.headers['Idempotency-Key'],sent.get('clientReference'));
    const evidence=JSON.parse(sent.get('evidenceReceipts'));
    for(const key of ['photoId','bodyFront','bodySide']){assert.equal(evidence[key].bytes,4);assert.equal(evidence[key].sha256,sha(new Uint8Array([0xff,0xd8,0xff,0xd9])));}
    const intake=await DB.prepare('SELECT * FROM medicine_clinical_intakes').first();
    assert.equal(intake.provider_patient_reference,'PAT-42');
    assert.deepEqual(JSON.parse(intake.evidence_receipts_json),evidence);
    assert.equal(JSON.stringify(intake).includes(long),false);
  });
});

test('same submission and concurrent duplicate have one provider delivery and one assessment',async()=>{
  let release;const barrier=new Promise(resolve=>release=resolve);
  await withPharmacy(async({DB,calls,submit})=>{
    const id=crypto.randomUUID(),first=submit(completeIntake({submissionId:id}));
    while(!calls.length)await new Promise(r=>setImmediate(r));
    const duplicate=await submit(completeIntake({submissionId:id}));assert.equal(duplicate.status,202);
    release();const a=await(await first).json(),b=await(await submit(completeIntake({submissionId:id}))).json();
    assert.equal(a.intakeReference,b.intakeReference);assert.equal(calls.length,1);
    assert.equal((await DB.prepare('SELECT COUNT(*) n FROM medicine_clinical_intakes').first()).n,1);
    const changed=await submit(completeIntake({submissionId:id,conditions:'new answer'}));assert.equal(changed.status,409);assert.equal(calls.length,1);
  },async()=>{await barrier;return Response.json({reference:'PHA-ONE',patientReference:'PAT-42',status:'submitted'})});
});

test('lost pharmacy response is recoverable by correlation callback without another submission',async()=>{
  await withPharmacy(async({DB,env,calls,submit})=>{
    const id=crypto.randomUUID(),first=await submit(completeIntake({submissionId:id})),result=await first.json();
    assert.equal(first.status,503);assert.equal(result.status,'delivery_unconfirmed');
    assert.equal((await submit(completeIntake({submissionId:id}))).status,202);assert.equal(calls.length,1);
    const callback={clientReference:result.intakeReference,partnerReference:'PHA-RECOVERED',patientReference:'PAT-42',status:'verified'};
    const recovered=await medicineCommerceRoutes(partnerRequest('/v1/integrations/pharmacy/clinical-intake-status',callback),env,{});assert.equal(recovered.status,200);
    const again=await medicineCommerceRoutes(partnerRequest('/v1/integrations/pharmacy/clinical-intake-status',callback),env,{});assert.equal((await again.json()).duplicate,true);
    const status=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-clinical-intake-status?reference='+result.intakeReference),env,{}),current=await status.json();
    assert.equal(current.verified,true);assert.equal(current.prescribingApproved,false);assert.ok(current.verificationToken);
    const stale=await medicineCommerceRoutes(partnerRequest('/v1/integrations/pharmacy/clinical-intake-status',{...callback,status:'submitted'}),env,{});assert.equal(stale.status,409);
    const row=await DB.prepare('SELECT consent_version,evidence_receipts_json FROM medicine_clinical_intakes').first();assert.match(row.consent_version,/medicine-clinical/);assert.equal(Object.keys(JSON.parse(row.evidence_receipts_json)).length,3);
  },()=>{throw Error('simulated lost response; private details must not escape')});
});

test('provider cannot open payment with only our internal member ID or contradictory verification',async()=>{
  for(const reply of [{reference:'PHA-NO-PATIENT',verified:true},{reference:'PHA-CONTRADICTION',patientReference:'PAT-42',verified:true,status:'declined'},{reference:'X'.repeat(161),status:'submitted'}]){
    await withPharmacy(async({DB,submit})=>{
      const response=await submit(completeIntake());assert.equal(response.status,503);
      assert.equal((await DB.prepare('SELECT COUNT(*) n FROM medicine_prepay_verifications').first()).n,0);
      assert.equal(JSON.stringify(await response.json()).includes('simulated'),false);
    },()=>Response.json(reply));
  }
});

test('secure clarification resumes the same owned provider assessment and accepts only a short-lived allowed origin',async()=>{
  await withPharmacy(async({DB,env,submit})=>{
    const intake=await(await submit(completeIntake())).json();
    await DB.prepare("UPDATE medicine_clinical_intakes SET status='more_information_required'").run();
    const open=()=>medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-clinical-intake-resume',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({intakeReference:intake.intakeReference})}),env,{});
    let response=await open();assert.equal(response.status,200);assert.equal((await response.json()).resumeUrl,'https://portal.example.test/assessment?session=opaque');
    await DB.prepare('UPDATE medicine_clinical_intakes SET user_id=99').run();response=await open();assert.equal(response.status,404);
  },(url,init)=>String(url).endsWith('/resume')?Response.json({reference:'PHA-COMPLETE',patientReference:'PAT-42',resumeUrl:'https://portal.example.test/assessment?session=opaque',expiresAt:new Date(Date.now()+60000).toISOString()}):Response.json({reference:'PHA-COMPLETE',patientReference:'PAT-42',status:'submitted'}));
  for(const resumeUrl of ['https://evil.example.test/questions','http://portal.example.test/questions','https://user:password@portal.example.test/questions']){
    await withPharmacy(async({env,submit})=>{
      const a=await(await submit(completeIntake())).json();
      const r=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-clinical-intake-resume',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({intakeReference:a.intakeReference})}),env,{});assert.equal(r.status,503);assert.equal(JSON.stringify(await r.json()).includes('evil'),false);
    },url=>String(url).endsWith('/resume')?Response.json({reference:'PHA-COMPLETE',patientReference:'PAT-42',resumeUrl,expiresAt:new Date(Date.now()+60000).toISOString()}):Response.json({reference:'PHA-COMPLETE',patientReference:'PAT-42',status:'submitted'}));
  }
});

test('missing contact, contradictory enum, bad origin and stock cannot send an assessment',async()=>{
  await withPharmacy(async({DB,env,calls,submit})=>{
    for(const fields of [{patientPhone:''},{patientAddress1:''},{patientLastName:''},{weightRelatedCondition:'maybe'}])assert.equal((await submit(completeIntake(fields))).status,400);
    const evil=await medicineCommerceRoutes(new Request('https://api.shiftsometimber.co.uk/v1/commerce/medicine-clinical-intake',{method:'POST',headers:{Origin:'https://evil.example.test',Cookie:'sst_session=e2e-member-session'},body:completeIntake()}),env,{});assert.equal(evil.status,403);
    await DB.prepare('UPDATE medicine_inventory SET stock_on_hand=0 WHERE variant_id=11').run();assert.equal((await submit(completeIntake())).status,409);assert.equal(calls.length,0);
  });
});

test('refresh uses the same assessment; session expiry and another account expose no references or answers',async()=>{
  await withPharmacy(async({DB,env,submit})=>{
    const intake=await(await submit(completeIntake())).json();
    const get=()=>medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-clinical-intake-status?variant=11'),env,{});
    assert.equal((await(await get()).json()).intakeReference,intake.intakeReference);
    await DB.prepare("UPDATE user_sessions SET expires_at='2000-01-01T00:00:00Z'").run();
    let response=await get();assert.equal(response.status,401);assert.equal(JSON.stringify(await response.json()).includes(intake.intakeReference),false);
    await DB.prepare("UPDATE user_sessions SET expires_at='2099-01-01T00:00:00Z',user_id=43").run();
    await DB.prepare("INSERT INTO users VALUES(43,'other@example.test','Other','Member')").run();
    await DB.prepare('INSERT INTO user_auth VALUES(43,1)').run();
    response=await get();assert.equal(response.status,404);
  });
});

test('duplicate clinical decision callback produces no extra audit or notification',async()=>{
  await withPharmacy(async({DB,env})=>{
    // Establish schema through an authenticated read, with no clinical/order writes.
    await medicineCommerceRoutes(memberRequest('/v1/treatment/orders'),env,{});
    await DB.prepare("INSERT INTO medicine_orders(order_number,user_id,email,medicine_id,variant_id,medicine_name,strength_label,unit_price_pence,total_pence,status,clinical_status) VALUES('SST-DUP',42,'member@example.test',1,11,'Mounjaro','2.5 mg',16900,16900,'paid','assessment_pending')").run();
    const invoke=()=>medicineCommerceRoutes(partnerRequest('/v1/integrations/pharmacy/treatment-status',{orderNumber:'SST-DUP',status:'more_information_required'}),env,{});
    assert.equal((await invoke()).status,200);assert.equal((await(await invoke()).json()).duplicate,true);
    assert.equal((await DB.prepare("SELECT COUNT(*) n FROM audit_log WHERE action='medicine.clinical_status'").first()).n,1);
  });
});

test('unknown and duplicated answers cannot be silently dropped',async()=>{
  await withPharmacy(async({calls,submit})=>{
    const unknown=completeIntake();unknown.set('allergies','A future field must be mapped before use');assert.equal((await submit(unknown)).status,400);
    const duplicate=completeIntake();duplicate.append('medicines','contradictory second answer');assert.equal((await submit(duplicate)).status,400);assert.equal(calls.length,0);
  });
});

