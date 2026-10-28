// In-memory synthetic data for focused tests and local UI review only.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {defaultColumns} from './fulfilment-model.mjs';
export function fulfilmentFixture(){
 const db=new DatabaseSync(':memory:');
 db.exec(readFileSync(new URL('./migration.sql',import.meta.url),'utf8'));
 db.exec(`CREATE TABLE orders(id INTEGER PRIMARY KEY,order_number TEXT UNIQUE,customer_name TEXT,customer_email TEXT,created_at TEXT,updated_at TEXT,payment_status TEXT,status TEXT);
 CREATE TABLE commerce_order_details(order_id INTEGER PRIMARY KEY,shipping_name TEXT,shipping_address_json TEXT,stripe_checkout_session_id TEXT,stripe_payment_status TEXT);
 CREATE TABLE commerce_order_items(id INTEGER PRIMARY KEY,order_id INTEGER,sku TEXT,quantity INTEGER);
 CREATE TABLE commerce_refunds(id INTEGER PRIMARY KEY,order_id INTEGER,amount_pence INTEGER);`);
 function order(id,{sku='SST-NF-PROSTATE-HEALTH',payment='paid',status='paid',session='cs_live_fixture',name='Synthetic Customer',lineId=id*10}={}){
  db.prepare('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?)').run(id,'FIXTURE-'+String(id).padStart(4,'0'),name,'fixture@example.invalid','2026-10-28T10:00:00Z','2026-10-28T10:00:00Z',payment,status);
  db.prepare('INSERT INTO commerce_order_details VALUES(?,?,?,?,?)').run(id,name,JSON.stringify({line1:'Flat 1, Example House',line2:'12 Example Road',city:'Example Town',state:'Example County',postal_code:'TE1 1ST',country:'GB'}),session+'_'+id,payment);
  db.prepare('INSERT INTO commerce_order_items VALUES(?,?,?,?)').run(lineId,id,sku,1);
 }
 order(1,{name:'Synthetic "Example", Customer'});db.prepare('INSERT INTO commerce_order_items VALUES(11,1,?,2)').run('SST-NF-VITAMIN-D');order(2,{sku:'SST-NF-DIABETES'});order(3,{payment:'pending',status:'new'});
 const wrap=(sql,args=[])=>({bind:(...values)=>wrap(sql,values),async all(){return {results:db.prepare(sql).all(...args)};},async first(){return db.prepare(sql).get(...args)||null;},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:r.changes,last_row_id:Number(r.lastInsertRowid)}};}});
 let serial=Promise.resolve();
 const DB={db,prepare:wrap,batch(statements){const run=serial.then(async()=>{db.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}});serial=run.catch(()=>{});return run;}};
 function ready(){db.exec("UPDATE testing_products SET supplier_sku='FIXTURE-'||id;UPDATE testing_range_extras SET supplier_sku='FIXTURE-'||id;UPDATE testing_fulfilment_config SET template_name='Synthetic fixture layout',template_confirmed=1,delivery_method='email',destination='fulfilment@example.invalid',delivery_confirmed=1;");}
 let authCalls=0,mailCalls=0;
 const env={DB,CORE:{fetch:async request=>{authCalls++;if(new URL(request.url).pathname!=='/v1/hq/me')throw Error('Unexpected upstream call');return Response.json({user:{id:1,email:'fixture-owner@example.invalid',role:'owner'}});}},EMAIL:{send:()=>{mailCalls++;throw Error('Email is prohibited in this test');}}};
 return {db,DB,env,ready,order,authCalls:()=>authCalls,mailCalls:()=>mailCalls,configBody:()=>({revision:1,template_name:'Synthetic fixture layout',columns:defaultColumns,delimiter:',',utf8_bom:false,template_confirmed:true,delivery_method:'email',destination:'fulfilment@example.invalid',delivery_confirmed:true})};
}
