import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash,createHmac} from 'node:crypto';
import {ensureCommerceSchema,commerceStripeRoutes} from '../commerce-stripe-v1.js';
import {ensureHealthCommerce,readHealthProduct,healthPurchaseState,updateHealthProduct,reserveHealthStock} from '../health-commerce-v1.js';
function database(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../preview/testosterone-hub/bootstrap.sql',import.meta.url),'utf8'));
 const DB={exec:async sql=>db.exec(sql),prepare(sql){let args=[];return {bind(...a){args=a;return this},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}}}},async batch(stmts){db.exec('BEGIN');try{const r=[];for(const s of stmts)r.push(await s.run());db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}};return {db,DB};
}
async function setup(){const {db,DB}=database();await ensureCommerceSchema({DB});await ensureHealthCommerce(DB);db.exec("INSERT INTO users(id,email) VALUES(1,'test@example.test'); INSERT INTO user_auth(user_id,password_hash,email_verified) VALUES(1,'unused',1)");db.prepare('INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(1,?,?)').run(createHash('sha256').update('fixture').digest('hex'),'2099-01-01');return {db,DB}}
const ready={pricePence:6500,stockOnHand:1,deliveryPence:0,status:'active',partner:'Test fixture partner',sellable:true,pathwayReady:true,fulfilmentReady:true};
const origin='https://preview.example.test';
function request(items=[{sku:'SH-TE',quantity:1}],extra={}){return new Request(origin+'/v1/commerce/checkout',{method:'POST',headers:{Origin:origin,Cookie:'sst_session=fixture','Content-Type':'application/json',...extra},body:JSON.stringify({items,pricePence:1,stock:100})})}
test('zero stock, readiness and finite inventory fail closed; seeds never overwrite configured stock',async()=>{
 const {DB,db}=await setup();assert.equal(healthPurchaseState(await readHealthProduct(DB)).canBuy,false);
 await updateHealthProduct(DB,ready);await ensureHealthCommerce(DB);assert.equal(healthPurchaseState(await readHealthProduct(DB)).canBuy,true);
 for(const key of ['sellable','pathwayReady','fulfilmentReady']){await updateHealthProduct(DB,{...ready,[key]:false});assert.equal(healthPurchaseState(await readHealthProduct(DB)).canBuy,false)}
 await updateHealthProduct(DB,ready);db.exec("UPDATE commerce_inventory SET stock_on_hand=NULL WHERE product_id=(SELECT id FROM products WHERE sku='SH-TE')");assert.equal(healthPurchaseState(await readHealthProduct(DB)).canBuy,false);
 await updateHealthProduct(DB,ready);const p=await readHealthProduct(DB);assert.equal(await reserveHealthStock(DB,p.id),true);assert.equal(await reserveHealthStock(DB,p.id),false);await assert.rejects(updateHealthProduct(DB,{...ready,stockOnHand:0}),/stock_below_reserved/);
});
test('shared checkout rejects unavailable, unverified, mixed and cross-origin carts before Stripe',async()=>{
 const {DB,db}=await setup(),env={DB,STRIPE_SECRET_KEY:'sk_test_fixture',STRIPE_MODE:'test'};
 assert.equal((await commerceStripeRoutes(request(),env,{})).status,409);
 await updateHealthProduct(DB,ready);
 assert.equal((await commerceStripeRoutes(request([{sku:'SH-TE'},{sku:'OTHER'}]),env,{})).status,400);
 assert.equal((await commerceStripeRoutes(request(undefined,{Origin:'https://evil.example'}),env,{})).status,403);
 db.exec('UPDATE user_auth SET email_verified=0');assert.equal((await commerceStripeRoutes(request(),env,{})).status,403);
 assert.equal(db.prepare('SELECT count(*) n FROM orders').get().n,0);
});
test('shared order and Stripe form use server price; signed completion consumes stock once',async()=>{
 const {DB,db}=await setup();await updateHealthProduct(DB,ready);
 const env={DB,STRIPE_SECRET_KEY:'sk_test_fixture',STRIPE_MODE:'test',STRIPE_WEBHOOK_SECRET:'fixture_webhook',PUBLIC_SITE_URL:origin};
 const oldFetch=globalThis.fetch;let form;
 globalThis.fetch=async(url,opts)=>{assert.equal(url,'https://api.stripe.com/v1/checkout/sessions');form=opts.body;return Response.json({id:'cs_test_fixture',url:'https://checkout.stripe.com/c/pay/cs_test_fixture'})};
 let response;try{response=await commerceStripeRoutes(request(),env,{})}finally{globalThis.fetch=oldFetch}
 assert.equal(response.status,201);const result=await response.json();assert.equal(form.get('line_items[0][price_data][unit_amount]'),'6500');assert.match(form.get('cancel_url'),/testosterone-energy/);
 const order=db.prepare('SELECT * FROM orders').get();assert.equal(order.total_pence,6500);assert.equal(order.payment_status,'pending');assert.equal(healthPurchaseState(await readHealthProduct(DB)).stock,0);
 const payload=JSON.stringify({id:'evt_fixture',type:'checkout.session.completed',data:{object:{id:'cs_test_fixture',client_reference_id:result.orderNumber,metadata:{order_number:result.orderNumber},payment_status:'paid',payment_intent:'pi_fixture'}}});
 const t=Math.floor(Date.now()/1000),sig=createHmac('sha256',env.STRIPE_WEBHOOK_SECRET).update(t+'.'+payload).digest('hex');
 const hook=()=>new Request(origin+'/v1/commerce/stripe/webhook',{method:'POST',headers:{'stripe-signature':`t=${t},v1=${sig}`},body:payload});
 const r=await commerceStripeRoutes(hook(),env,{});assert.ok(r,'webhook route');assert.equal(r.status,200);assert.equal(db.prepare('SELECT payment_status FROM orders').get().payment_status,'paid');
 assert.equal((await readHealthProduct(DB)).stock_on_hand,0);assert.equal((await readHealthProduct(DB)).reserved,0);
 assert.equal((await (await commerceStripeRoutes(hook(),env,{})).json()).duplicate,true);
});
test('Stripe creation failure releases the home-test reservation',async()=>{
 const {DB,db}=await setup();await updateHealthProduct(DB,ready);const oldFetch=globalThis.fetch;
 globalThis.fetch=async()=>Response.json({error:{type:'fixture_failure'}},{status:400});
 try{assert.equal((await commerceStripeRoutes(request(),{DB,STRIPE_MODE:'test',STRIPE_SECRET_KEY:'sk_test_fixture'},{})).status,502)}finally{globalThis.fetch=oldFetch}
 assert.equal((await readHealthProduct(DB)).reserved,0);assert.equal((await readHealthProduct(DB)).stock_on_hand,1);assert.equal(db.prepare('SELECT payment_status FROM orders').get().payment_status,'failed');
});
