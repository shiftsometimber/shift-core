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
      assert.equal(init.body.get('journeyStage'),'prepay_verification');
      for(const field of ['photoId','bodyFront','bodySide'])assert.ok(init.body.get(field) instanceof File,field);
      return Response.json({reference:'PHA-E2E-0001',status:'verified',verified:true});
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

    const blocked=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({variantId:11})}),env,{});
    assert.equal(blocked.status,409);
    assert.equal((await blocked.json()).error,'prepay_verification_required');
    assert.equal(seen.stripe,false);

    const clinical=new FormData();
    for(const [key,value] of Object.entries({variantId:'11',dateOfBirth:'1981-08-03',heightCm:'173',weightKg:'92.4',conditions:'none declared',medicines:'none declared',previousTreatment:'yes',previousMedicine:'Mounjaro',previousDose:'2.5 mg',lastDoseDate:'2026-09-01',gpName:'Dr Test',gpPractice:'Test Practice',gpAddress:'1 Test Street',gpPostcode:'SK10 1AA',gpPhone:'01610000000',nhsNumber:'9999999999'}))clinical.set(key,value);
    for(const key of ['gpContactConsent','imageConsent','answersConfirmed'])clinical.set(key,'on');
    for(const key of ['photoId','bodyFront','bodySide'])clinical.set(key,new File([new Uint8Array([0xff,0xd8,0xff,0xd9])],`${key}.jpg`,{type:'image/jpeg'}));
    const intakeResponse=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-clinical-intake',{method:'POST',body:clinical}),env,{}),intake=await intakeResponse.json();
    assert.equal(intakeResponse.status,200);
    assert.equal(intake.verified,true);
    assert.equal(intake.nextStep,'payment');
    assert.ok(intake.verificationToken);
    assert.equal(seen.pharmacy,true);

    const checkoutResponse=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({variantId:11,verificationToken:intake.verificationToken})}),env,{}),checkout=await checkoutResponse.json();
    assert.equal(checkoutResponse.status,201);
    assert.equal(checkout.totalPence,16900);
    assert.equal(checkout.checkoutUrl,'https://checkout.stripe.test/c/pay/shift-e2e');
    assert.equal(seen.stripe,true);

    const reuse=await medicineCommerceRoutes(memberRequest('/v1/commerce/medicine-checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({variantId:11,verificationToken:intake.verificationToken})}),env,{});
    assert.equal(reuse.status,409);
    assert.equal((await reuse.json()).error,'invalid_or_expired_verification');

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

    for(const status of ['dispensing','dispatched']){
      const transition=await medicineCommerceRoutes(partnerRequest('/v1/integrations/pharmacy/treatment-status',{orderNumber:checkout.orderNumber,status}),env,{});
      assert.equal(transition.status,200,status);
    }
    const fulfilled=await medicineCommerceRoutes(partnerRequest('/v1/integrations/pharmacy/treatment-status',{orderNumber:checkout.orderNumber,status:'fulfilled',reorderEligibleAt:'2026-09-01T00:00:00.000Z'}),env,{});
    assert.equal(fulfilled.status,200);
    tracker=await (await medicineCommerceRoutes(memberRequest('/v1/treatment/orders'),env,{})).json();
    assert.equal(tracker.orders[0].clinicalStatus,'fulfilled');
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
  }finally{
    globalThis.fetch=outbound;
    DB.close();
  }
});
