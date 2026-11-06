import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {CATALOGUE_POLICY,ensureCatalogueGovernanceSchema,catalogueAuthority,readCatalogueAuthority,hasCatalogueWriteGrant,validateSupplierRoutes,catalogueReservationGuard,catalogueReservationStatements,settleCatalogueReservationStatements} from '../../hq-catalogue-governance-v31.mjs';
import {saveTestSupplierRoutes,auditedCatalogueMutation} from '../../hq-catalogue-admin-v31.mjs';
const now=new Date('2026-11-06T10:00:00Z'),future='2026-12-01T00:00:00.000Z';
class D1{constructor(){this.db=new DatabaseSync(':memory:')}prepare(sql){const db=this.db;const make=args=>({sql,args,bind(...v){return make(v)},async all(){return {results:db.prepare(sql).all(...args)}},async first(){return db.prepare(sql).get(...args)||null},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}}});return make([])}async batch(statements){this.db.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());this.db.exec('COMMIT');return results}catch(e){this.db.exec('ROLLBACK');throw e}}}
const route=(id,role,stock=2,ready='ready')=>({partner_id:id,role,readiness:ready,stock_on_hand:stock,authority:true,availability:'available',authority_until:future,evidence_ref:'TEST-STOCK-'+id});
const approval={product_version:1,variant_version:1,actor_id:3,approved_at:'2026-11-06T09:00:00Z',valid_until:future,evidence_ref:'TEST-RX-APPROVAL',policy_version:CATALOGUE_POLICY,auth_current:true};
const base={product:{status:'available',sellable:1,availability_state:'available',catalogue_version:1},variant:{id:1,status:'available',sellable:1,availability_state:'available',catalogue_version:1},inventory:{stock_on_hand:5,reserved:0},routes:[{...route('TEST-PHARMACY-A','primary'),reserved:0,partner_ready:true},{...route('TEST-PHARMACY-B','backup'),reserved:0,partner_ready:true}],approval,now};
test('Medicine sellability requires current version-bound prescriber evidence and a separately authorised ready supplier',()=>{
 assert.equal(catalogueAuthority(base).canBuy,true);
 for(const bad of [{...base,approval:null},{...base,approval:{...approval,variant_version:0}},{...base,approval:{...approval,product_version:0}},{...base,approval:{...approval,auth_current:false}},{...base,approval:{...approval,valid_until:'2026-11-01T00:00:00Z'}},{...base,approval:{...approval,approved_at:future}},{...base,inventory:{stock_on_hand:0,reserved:0}},{...base,routes:base.routes.map(r=>({...r,partner_ready:false}))},{...base,routes:base.routes.map(r=>({...r,readiness:'pending'}))}])assert.equal(catalogueAuthority(bad).canBuy,false);
 const backup=catalogueAuthority({...base,routes:[{...base.routes[0],stock_on_hand:0},base.routes[1]]});assert.equal(backup.selectedPartner,'TEST-PHARMACY-B');assert.equal(backup.selectedRole,'backup');
 assert.equal(catalogueAuthority({...base,routes:[{...base.routes[0],stock_on_hand:0},{...base.routes[1],readiness:'pending'}]}).canBuy,false);
});
test('Catalogue mutation grant is separate from operations or clinical role; supplier input excludes forged approval fields',()=>{
 for(const role of ['operations','support','clinical','marketing','readonly'])assert.equal(hasCatalogueWriteGrant({id:2,role},null,now),false);
 assert.equal(hasCatalogueWriteGrant({id:1,role:'owner'},null,now),true);
 assert.equal(hasCatalogueWriteGrant({id:2,role:'operations'},[{user_id:2,permission:'catalogue_write',approval_ref:'TEST-OWNER',expires_at:future}],now),true);
 assert.equal(hasCatalogueWriteGrant({id:2,role:'operations'},[{user_id:2,permission:'catalogue_write',approval_ref:'TEST-OWNER',expires_at:'2026-01-01T00:00:00Z'}],now),false);
 for(const bad of [[route('A','backup')],[route('A','primary'),route('B','primary')],[route('A','primary'),route('A','backup')],[{...route('A','primary'),prescriber_approval:approval}],[{...route('A','primary'),stock_on_hand:-1}],[{...route('A','primary'),authority_until:'2026-01-01T00:00:00Z'}]])assert.throws(()=>validateSupplierRoutes(bad,now));
});
async function setup(){const DB=new D1();DB.db.exec(`CREATE TABLE medicine_products(id INTEGER PRIMARY KEY,name TEXT,status TEXT,sellable INTEGER,availability_state TEXT);CREATE TABLE medicine_variants(id INTEGER PRIMARY KEY,medicine_id INTEGER,status TEXT,sellable INTEGER,availability_state TEXT,updated_at TEXT);CREATE TABLE medicine_inventory(variant_id INTEGER PRIMARY KEY,stock_on_hand INTEGER,reserved INTEGER);CREATE TABLE hq_users(id INTEGER PRIMARY KEY,status TEXT,mfa_enabled INTEGER,role TEXT);CREATE TABLE partner_staff(hq_user_id INTEGER,version INTEGER,state_json TEXT);CREATE TABLE partner_organisations(id TEXT PRIMARY KEY,version INTEGER,state_json TEXT);CREATE TABLE hq_audit(id INTEGER PRIMARY KEY,hq_user_id INTEGER,action TEXT,entity_type TEXT,entity_id TEXT,metadata TEXT,created_at TEXT);INSERT INTO medicine_products VALUES(1,'TEST-MED-A','available',1,'available');INSERT INTO medicine_variants VALUES(1,1,'available',1,'available','2026-11-06T09:00:00Z');INSERT INTO medicine_inventory VALUES(1,5,0);INSERT INTO hq_users VALUES(3,'active',1,'clinical');`);
 for(const id of ['TEST-PHARMACY-A','TEST-PHARMACY-B','TEST-CLINIC'])DB.db.prepare('INSERT INTO partner_organisations VALUES(?,1,?)').run(id,JSON.stringify({kind:id==='TEST-CLINIC'?'clinical':'pharmacy',status:'approved',expiresAt:future}));
 DB.db.prepare('INSERT INTO partner_staff VALUES(3,1,?)').run(JSON.stringify({kind:'clinician',status:'active'}));await ensureCatalogueGovernanceSchema(DB);return DB;}
async function approve(DB,version=2){await DB.prepare('INSERT INTO catalogue_prescriber_approvals VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind('TEST-APPROVAL',1,1,version,3,'TEST-CLINIC',1,1,'2026-11-06T09:00:00Z',future,'TEST-RX-APPROVAL',CATALOGUE_POLICY).run();}
test('Supplier saves are atomic, idempotent and audited; a new version invalidates previous sign-off',async()=>{
 const DB=await setup();try{
 const body={version:1,request_id:crypto.randomUUID(),routes:[route('TEST-PHARMACY-A','primary'),route('TEST-PHARMACY-B','backup')]};
 await assert.rejects(saveTestSupplierRoutes(DB,{id:4,role:'support'},1,body,null,now),/catalogue_commerce_grant_required/);
 const saved=await saveTestSupplierRoutes(DB,{id:1,role:'owner'},1,body,null,now);assert.equal(saved.version,2);assert.equal(saved.signoffRequired,true);assert.equal((await readCatalogueAuthority(DB,1,now)).canBuy,false);
 const again=await saveTestSupplierRoutes(DB,{id:1,role:'owner'},1,body,null,now);assert.equal(again.replayed,true);assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM hq_audit').get().n,1);
 await assert.rejects(saveTestSupplierRoutes(DB,{id:1,role:'owner'},1,{...body,routes:[route('TEST-PHARMACY-B','primary')]},null,now),/idempotency_payload_conflict/);
 await approve(DB);let truth=await readCatalogueAuthority(DB,1,now);assert.equal(truth.canBuy,true);assert.equal(truth.signoff.who,3);assert.ok(!JSON.stringify(truth).includes('professional'));
 await saveTestSupplierRoutes(DB,{id:1,role:'owner'},1,{version:2,request_id:crypto.randomUUID(),routes:body.routes},null,now);truth=await readCatalogueAuthority(DB,1,now);assert.equal(truth.canBuy,false);assert.equal(truth.signoff.variant_version,3);
 }finally{DB.db.close()}
});
test('Audit failure rolls back supplier changes and version; reserved stock cannot be overwritten or removed',async()=>{
 const DB=await setup();try{
 let body={version:1,request_id:crypto.randomUUID(),routes:[route('TEST-PHARMACY-A','primary')]};
 DB.db.exec("CREATE TRIGGER fail_catalogue_audit BEFORE INSERT ON hq_audit BEGIN SELECT RAISE(ABORT,'audit_failed'); END;");
 await assert.rejects(saveTestSupplierRoutes(DB,{id:1,role:'owner'},1,body,null,now),/audit_failed/);assert.equal(DB.db.prepare('SELECT catalogue_version FROM medicine_variants').get().catalogue_version,1);assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM catalogue_supply_routes').get().n,0);
 DB.db.exec('DROP TRIGGER fail_catalogue_audit');await saveTestSupplierRoutes(DB,{id:1,role:'owner'},1,body,null,now);DB.db.exec('UPDATE catalogue_supply_routes SET reserved=2');
 body={version:2,request_id:crypto.randomUUID(),routes:[route('TEST-PHARMACY-A','primary',1)]};await assert.rejects(saveTestSupplierRoutes(DB,{id:1,role:'owner'},1,body,null,now),/version_stock_or_reservation_changed/);assert.equal(DB.db.prepare('SELECT catalogue_version FROM medicine_variants').get().catalogue_version,2);
 await assert.rejects(saveTestSupplierRoutes(DB,{id:1,role:'owner'},1,{...body,request_id:crypto.randomUUID(),routes:[route('TEST-PHARMACY-B','primary')]},null,now),/version_stock_or_reservation_changed/);
 }finally{DB.db.close()}
});
test('The checkout transaction rechecks versions, stock, authority and revocation; supplier reservation settles once',async()=>{
 const DB=await setup();try{
 await saveTestSupplierRoutes(DB,{id:1,role:'owner'},1,{version:1,request_id:crypto.randomUUID(),routes:[route('TEST-PHARMACY-A','primary')]},null,now);await approve(DB);
 const truth=await readCatalogueAuthority(DB,1,now),guard=catalogueReservationGuard(truth,now);assert.equal(DB.db.prepare('SELECT 1 ok WHERE '+guard.sql).get(...guard.args).ok,1);
 DB.db.exec("UPDATE hq_users SET status='disabled' WHERE id=3");assert.equal(DB.db.prepare('SELECT 1 ok WHERE '+guard.sql).get(...guard.args),undefined);DB.db.exec("UPDATE hq_users SET status='active' WHERE id=3");
 await DB.batch(catalogueReservationStatements(DB,truth,'TEST-ORD-1','1=1',now.toISOString()));assert.equal(DB.db.prepare('SELECT reserved FROM catalogue_supply_routes').get().reserved,1);
 await DB.batch(settleCatalogueReservationStatements(DB,'TEST-ORD-1','paid','1=1',[],now.toISOString()));await DB.batch(settleCatalogueReservationStatements(DB,'TEST-ORD-1','paid','1=1',[],now.toISOString()));
 const stock=DB.db.prepare('SELECT stock_on_hand,reserved FROM catalogue_supply_routes').get();assert.equal(stock.stock_on_hand,1);assert.equal(stock.reserved,0);
 DB.db.exec('UPDATE medicine_variants SET catalogue_version=catalogue_version+1');assert.equal(DB.db.prepare('SELECT 1 ok WHERE '+guard.sql).get(...guard.args),undefined);
 }finally{DB.db.close()}
});
test('Existing catalogue updates and their audit append share one rollback boundary',async()=>{
 const DB=await setup();try{
  const update=()=>DB.prepare("UPDATE medicine_products SET name='TEST-AMENDED' WHERE id=1");
  DB.db.exec("CREATE TRIGGER fail_catalogue_audit BEFORE INSERT ON hq_audit BEGIN SELECT RAISE(ABORT,'audit_failed'); END;");
  await assert.rejects(auditedCatalogueMutation(DB,{id:1},[update()],'medicine.updated','medicine',1,{before:'TEST-MED-A',after:'TEST-AMENDED'}),/audit_failed/);
  assert.equal(DB.db.prepare('SELECT name FROM medicine_products WHERE id=1').get().name,'TEST-MED-A');
  DB.db.exec('DROP TRIGGER fail_catalogue_audit');await auditedCatalogueMutation(DB,{id:1},[update()],'medicine.updated','medicine',1,{before:'TEST-MED-A',after:'TEST-AMENDED'});
  assert.equal(DB.db.prepare('SELECT name FROM medicine_products WHERE id=1').get().name,'TEST-AMENDED');assert.equal(DB.db.prepare('SELECT COUNT(*) n FROM hq_audit').get().n,1);
 }finally{DB.db.close()}
});
