import assert from 'node:assert/strict';
import {createHash,createHmac} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';

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


export {setup,memberRequest,partnerRequest};
