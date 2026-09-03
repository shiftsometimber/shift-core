import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {medicineCommerceRoutes} from '../medicine-commerce-v1.js';

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
  assert.match(source,/reconcileExpiredReservations/);
  assert.match(source,/status='expired'/);
  assert.match(source,/expires_at/);
  assert.match(source,/status='checkout_open'/);
  assert.match(source,/medicine_product_images/);
  assert.match(source,/imageUrl/);
});

test('the public catalogue removes malformed medicine variants and normalises pack labels',async()=>{
  const rows=[
    {medicine_id:4,name:'Orlistat',active_ingredient:'orlistat',form:'capsule',description:'',medicine_status:'out_of_stock',variant_id:7,strength_label:'120 mg · 42 capsules',selling_price_pence:5900,variant_status:'out_of_stock',stock_on_hand:0,reserved:0},
    {medicine_id:4,name:'Orlistat',active_ingredient:'orlistat',form:'capsule',description:'',medicine_status:'out_of_stock',variant_id:29,strength_label:'42',selling_price_pence:5900,variant_status:'out_of_stock',stock_on_hand:0,reserved:0},
    {medicine_id:4,name:'Orlistat',active_ingredient:'orlistat',form:'capsule',description:'',medicine_status:'out_of_stock',variant_id:30,strength_label:'168',selling_price_pence:12900,variant_status:'out_of_stock',stock_on_hand:0,reserved:0},
    {medicine_id:6,name:'Liraglutide',active_ingredient:'liraglutide',form:'injection',description:'',medicine_status:'out_of_stock',variant_id:26,strength_label:'1.2 mg',selling_price_pence:19900,variant_status:'out_of_stock',stock_on_hand:0,reserved:0},
    {medicine_id:6,name:'Liraglutide',active_ingredient:'liraglutide',form:'injection',description:'',medicine_status:'out_of_stock',variant_id:13,strength_label:'1.8 mg — 3-pen pack',selling_price_pence:19900,variant_status:'out_of_stock',stock_on_hand:0,reserved:0},
  ];
  const statement={bind(){return this},run:async()=>({}),all:async()=>({results:rows})};
  const DB={batch:async()=>[],prepare(){return statement}};
  const response=await medicineCommerceRoutes(new Request('https://api.shiftsometimber.co.uk/v1/catalogue/medicines'),{DB},{});
  const products=(await response.json()).products;
  assert.deepEqual(products.find(x=>x.name==='Orlistat').variants.map(x=>x.strengthLabel),['120 mg · 42 capsules','120 mg · 168 capsules']);
  assert.deepEqual(products.find(x=>x.name==='Liraglutide').variants.map(x=>x.strengthLabel),['1.8 mg — 3-pen pack']);
});

test('the public order page consumes the governed catalogue and checkout',async()=>{
  const source=await readFile(new URL('../../pages-commercial-final/treatment-order-prototype-v1.js',import.meta.url),'utf8');
  assert.match(source,/\/v1\/catalogue\/medicines/);
  assert.match(source,/\/v1\/commerce\/medicine-checkout/);
  assert.match(source,/variantId:\s*variant\.id/);
  assert.match(source,/Currently out of stock/);
  assert.match(source,/op-live-product-image/);
});
