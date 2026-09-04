import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {medicineCommerceRoutes,medicineCommerceInternals} from '../medicine-commerce-v1.js';

test('public medicine catalogue remains harmless without a database',async()=>{
  const response=await medicineCommerceRoutes(new Request('https://api.shiftsometimber.co.uk/v1/catalogue/medicines'),{},{});
  assert.equal(response.status,200);
  assert.deepEqual((await response.json()).products,[]);
});

test('medicine checkout requires a signed-in member before touching Stripe',async()=>{
  const response=await medicineCommerceRoutes(new Request('https://api.shiftsometimber.co.uk/v1/commerce/medicine-checkout',{method:'POST',headers:{Origin:'https://shiftsometimber.co.uk','content-type':'application/json'},body:JSON.stringify({variantId:1})}),{DB:{}},{});
  assert.equal(response.status,401);
  assert.equal((await response.json()).error,'account_required');
});

test('a stale host cookie cannot hide a valid shared member session at checkout',async()=>{
  const validHash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('valid-token'))).toString('hex');
  const DB={prepare(){return{args:[],bind(...args){this.args=args;return this},async first(){return this.args[0]===validHash?{id:42,email:'member@example.test',first_name:'Member',last_name:'Test',email_verified:1,expires_at:'2099-01-01T00:00:00.000Z',revoked_at:null}:null}}}};
  const response=await medicineCommerceRoutes(new Request('https://api.shiftsometimber.co.uk/v1/commerce/medicine-checkout',{method:'POST',headers:{Origin:'https://shiftsometimber.co.uk','content-type':'application/json',Cookie:'sst_session=stale-host-token; sst_session=valid-token'},body:JSON.stringify({variantId:1})}),{DB},{});
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,'payments_not_configured');
});

test('stock is a server-side quantity and zero never reaches Stripe',async()=>{
  const source=await readFile(new URL('../medicine-commerce-v1.js',import.meta.url),'utf8');
  assert.match(source,/stock_on_hand-reserved>0/);
  assert.match(source,/UPDATE medicine_inventory SET reserved=reserved\+1/);
  assert.match(source,/stock_on_hand=MAX\(0,stock_on_hand-1\)/);
  assert.match(source,/error:\s*["']out_of_stock["']/);
  assert.match(source,/https:\/\/api\.stripe\.com\/v1\/checkout\/sessions/);
  assert.doesNotMatch(source,/managed_payments/);
  assert.match(source,/medicineName === "liraglutide"/);
  assert.match(source,/"3\.0 mg"/);
  assert.match(source,/reconcileExpiredReservations/);
  assert.match(source,/status='expired'/);
  assert.match(source,/expires_at/);
  assert.match(source,/status='checkout_open'/);
  assert.match(source,/medicine_product_images/);
  assert.match(source,/imageUrl/);
});

test('the public order page consumes the governed catalogue and checkout',async()=>{
  const source=await readFile(new URL('../../pages-commercial-final/treatment-order-prototype-v1.js',import.meta.url),'utf8');
  assert.match(source,/\/v1\/catalogue\/medicines/);
  assert.match(source,/\/v1\/commerce\/medicine-checkout/);
  assert.match(source,/variantId:\s*variant\.id/);
  assert.match(source,/Currently out of stock/);
  assert.match(source,/op-live-product-image/);
});

test('payment hands medicine orders into clinical assessment and never straight to fulfilment',async()=>{
  const source=await readFile(new URL('../medicine-commerce-v1.js',import.meta.url),'utf8');
  assert.match(source,/status='paid',clinical_status='assessment_pending'/);
  assert.match(source,/PHARMACY_INTEGRATION_SECRET/);
  assert.match(source,/invalid_status_transition/);
  assert.match(source,/journey_setup_required/);
  assert.match(source,/reorder_not_eligible/);
  assert.match(source,/\/member\/dashboard\?treatment=paid&session_id=\{CHECKOUT_SESSION_ID\}#today/);
});

test('approved treatment requires a complete Journey before support and reorder',()=>{
  const complete=JSON.stringify({myJourney:{setup:{startDate:'2026-09-04',targetMode:'loss'},weight:{startKg:100,currentKg:95,targetKg:80}}});
  assert.equal(medicineCommerceInternals.journeyComplete(complete),true);
  assert.equal(medicineCommerceInternals.journeyComplete('{}'),false);
  const blocked=medicineCommerceInternals.memberTreatmentView({order_number:'SST-1',medicine_name:'Mounjaro',strength_label:'2.5 mg',total_pence:16900,currency:'GBP',status:'paid',clinical_status:'approved',journey_setup_required:1},false);
  assert.equal(blocked.journeySetupRequired,true);
  assert.equal(blocked.canReorder,false);
  const reorder=medicineCommerceInternals.memberTreatmentView({order_number:'SST-1',medicine_name:'Mounjaro',strength_label:'2.5 mg',total_pence:16900,currency:'GBP',status:'paid',clinical_status:'fulfilled',journey_setup_required:1},true);
  assert.equal(reorder.canReorder,true);
});

test('clinical transitions are deliberately narrow',()=>{
  const transitions=medicineCommerceInternals.clinicalTransitions;
  assert.equal(transitions.assessment_pending.has('approved'),true);
  assert.equal(transitions.assessment_pending.has('fulfilled'),false);
  assert.equal(transitions.declined.has('refunded'),true);
  assert.equal(transitions.refunded.size,0);
});

test('member treatment UI and preference intake use controlled choices',async()=>{
  const [ui,journey,adapter]=await Promise.all([
    readFile(new URL('../frontend/member/member-treatment-journey-v1.js',import.meta.url),'utf8'),
    readFile(new URL('../frontend/member/member-my-journey-v1.js',import.meta.url),'utf8'),
    readFile(new URL('../frontend/member/api-adapter-v33d.js',import.meta.url),'utf8'),
  ]);
  assert.match(ui,/Payment<\/span><span>Clinical checks/);
  assert.match(ui,/Complete the two-minute setup/);
  assert.match(adapter,/getTreatmentOrders/);
  for(const field of ['footballTeam','boxer','f1Driver','rugbyTeam','activityLevel','favouriteFood','favouriteDrink','apparelBrand','injury','illness'])assert.match(journey,new RegExp(`select name="${field}"`));
  assert.match(journey,/Not applicable \/ no preference/);
  assert.doesNotMatch(journey,/input[^>]+name="(?:footballTeam|boxer|f1Driver|rugbyTeam|activityLevel|favouriteFood|favouriteDrink|apparelBrand|injury|illness)"/);
});
