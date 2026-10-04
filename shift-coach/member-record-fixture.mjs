import {fixture} from '../health-passport/fixture.mjs';
export function ordersFixture(){
 const f=fixture({seed:false});
 f.db.exec(`CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER);
 CREATE TABLE products(id INTEGER PRIMARY KEY,name TEXT,sku TEXT);
 CREATE TABLE orders(id INTEGER PRIMARY KEY,user_id INTEGER,customer_email TEXT,order_number TEXT,quantity INTEGER,subtotal_pence INTEGER,total_pence INTEGER,currency TEXT,status TEXT,payment_status TEXT,notes TEXT,created_at TEXT,updated_at TEXT,product_id INTEGER);
 CREATE TABLE commerce_order_details(order_id INTEGER PRIMARY KEY,size TEXT,delivery_pence INTEGER,shipping_name TEXT,shipping_address_json TEXT,stripe_payment_intent_id TEXT);
 CREATE TABLE commerce_order_items(id INTEGER PRIMARY KEY,order_id INTEGER,sku TEXT,product_name TEXT,colour TEXT,size TEXT,quantity INTEGER,unit_price_pence INTEGER);
 INSERT INTO products VALUES(1,'Fictional shirt','TEST-TEE');
 INSERT INTO orders VALUES(1,2,'fictional-2@example.invalid','TEST-SHARED',1,1000,1299,'gbp','paid','paid','{}','2026-10-04','2026-10-04',1);
 INSERT INTO orders VALUES(2,1,'fictional-1@example.invalid','TEST-SHARED',1,1000,NULL,'gbp','dispatched','paid','null','2026-10-04','2026-10-04',1);
 INSERT INTO commerce_order_items(order_id,sku,product_name,colour,size,quantity,unit_price_pence) VALUES(1,'TEST-TEE','Other account item','Cream','M',1,1000),(2,'TEST-TEE','Own account item','Black','L',1,1000);`);
 return f;
}
