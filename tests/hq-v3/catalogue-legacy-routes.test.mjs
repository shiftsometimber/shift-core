import {test} from 'node:test';
import assert from 'node:assert/strict';
import {env,DB,cookies} from '../../hq-management-acceptance.mjs';
import {hqCatalogueRoutes} from '../../hq-catalogue-v1.js';
const call=async(path,method='GET',body,cookie=cookies.owner)=>{
 const response=await hqCatalogueRoutes(new Request('https://api.shiftsometimber.co.uk'+path,{method,headers:{Origin:'https://hq.shiftsometimber.co.uk',Cookie:cookie,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}),env,{});
 return {response,data:await response.json()};
};
let medicineId;
test('Retained medicine creation is replay-safe and atomic with its real HQ audit',async()=>{
 const input={name:'TEST-MED-LEGACY',activeIngredient:'TEST ingredient',form:'tablet',status:'draft'};
 let result=await call('/v1/hq/medicines','POST',input);assert.equal(result.response.status,201);assert.equal(result.data.auditRecorded,true);medicineId=result.data.id;
 result=await call('/v1/hq/medicines','POST',input);assert.equal(result.data.id,medicineId);assert.equal(result.data.replayed,true);
 assert.equal(DB.sqlite.prepare("SELECT COUNT(*) n FROM medicine_products WHERE name='TEST-MED-LEGACY'").get().n,1);
 result=await call('/v1/hq/medicines','POST',{...input,status:'available'});assert.equal(result.response.status,409);
 DB.sqlite.exec("CREATE TRIGGER fail_medicine_create BEFORE INSERT ON hq_audit WHEN NEW.action='medicine.created' BEGIN SELECT RAISE(ABORT,'audit unavailable'); END;");
 result=await call('/v1/hq/medicines','POST',{...input,name:'TEST-MED-ROLLBACK'});assert.equal(result.response.status,503);assert.equal(DB.sqlite.prepare("SELECT COUNT(*) n FROM medicine_products WHERE name='TEST-MED-ROLLBACK'").get().n,0);
 DB.sqlite.exec('DROP TRIGGER fail_medicine_create');result=await call('/v1/hq/medicines','POST',{...input,name:'TEST-MED-ROLLBACK'});assert.equal(result.response.status,201);
 result=await call('/v1/hq/medicines','POST',{...input,name:'TEST-MED-DENIED'},cookies.content);assert.equal(result.response.status,403);assert.equal(DB.sqlite.prepare("SELECT COUNT(*) n FROM medicine_products WHERE name='TEST-MED-DENIED'").get().n,0);
});
test('Retained strength POST invalidates old sign-off when amended, while exact replay does not change its version',async()=>{
 const path='/v1/hq/medicines/'+medicineId+'/variants',input={strengthLabel:'TEST 5 mg',costPence:10000,grossMarginPercent:60,status:'available',stockOnHand:3};
 let result=await call(path,'POST',input);assert.equal(result.response.status,201);const id=result.data.id;assert.equal(result.data.version,1);assert.equal(result.data.auditRecorded,true);
 result=await call(path,'POST',input);assert.equal(result.response.status,200);assert.equal(result.data.replayed,true);assert.equal(result.data.version,1);
 const auditCount=DB.sqlite.prepare("SELECT COUNT(*) n FROM hq_audit WHERE action='medicine.variant_saved' AND entity_id=?").get(String(id)).n;assert.equal(auditCount,1);
 result=await call(path,'POST',{...input,costPence:11000});assert.equal(result.response.status,201);assert.equal(result.data.version,2);
 const changed=DB.sqlite.prepare("SELECT metadata FROM hq_audit WHERE action='medicine.variant_saved' AND entity_id=? ORDER BY id DESC LIMIT 1").get(String(id));assert.equal(JSON.parse(changed.metadata).signoffInvalidated,true);assert.equal(JSON.parse(changed.metadata).before.version,1);assert.equal(JSON.parse(changed.metadata).after.version,2);
 result=await call(path,'POST',{...input,version:1,costPence:12000});assert.equal(result.response.status,409);
 DB.sqlite.prepare('UPDATE medicine_inventory SET reserved=2 WHERE variant_id=?').run(id);result=await call(path,'POST',{...input,stockOnHand:1});assert.equal(result.response.status,409);assert.equal(DB.sqlite.prepare('SELECT catalogue_version FROM medicine_variants WHERE id=?').get(id).catalogue_version,2);
 DB.sqlite.exec("CREATE TRIGGER fail_strength_audit BEFORE INSERT ON hq_audit WHEN NEW.action='medicine.variant_saved' BEGIN SELECT RAISE(ABORT,'audit unavailable'); END;");
 result=await call(path,'POST',{...input,costPence:12000,stockOnHand:4});assert.equal(result.response.status,503);assert.equal(DB.sqlite.prepare('SELECT catalogue_version FROM medicine_variants WHERE id=?').get(id).catalogue_version,2);assert.equal(DB.sqlite.prepare('SELECT stock_on_hand FROM medicine_inventory WHERE variant_id=?').get(id).stock_on_hand,3);
 DB.sqlite.exec('DROP TRIGGER fail_strength_audit');
});
test('Retained image removal rolls back on audit failure and cannot delete the medicine or its strength history',async()=>{
 const png=Buffer.from([137,80,78,71,13,10,26,10]).toString('base64'),path='/v1/hq/medicines/'+medicineId+'/image';
 let result=await call(path,'PUT',{mimeType:'image/png',imageBase64:png,altText:'TEST medicine image'});assert.equal(result.response.status,200);
 DB.sqlite.exec("CREATE TRIGGER fail_image_removal BEFORE INSERT ON hq_audit WHEN NEW.action='medicine.image_removed' BEGIN SELECT RAISE(ABORT,'audit unavailable'); END;");
 await assert.rejects(call(path,'DELETE'),/audit unavailable/);assert.equal(DB.sqlite.prepare('SELECT COUNT(*) n FROM medicine_product_images WHERE medicine_id=?').get(medicineId).n,1);
 DB.sqlite.exec('DROP TRIGGER fail_image_removal');result=await call(path,'DELETE');assert.equal(result.response.status,200);assert.equal(DB.sqlite.prepare('SELECT COUNT(*) n FROM medicine_product_images WHERE medicine_id=?').get(medicineId).n,0);
 assert.equal(DB.sqlite.prepare('SELECT COUNT(*) n FROM medicine_products WHERE id=?').get(medicineId).n,1);assert.equal(DB.sqlite.prepare('SELECT COUNT(*) n FROM medicine_variants WHERE medicine_id=?').get(medicineId).n,1);assert.equal(DB.sqlite.prepare('SELECT COUNT(*) n FROM medicine_variant_price_history').get().n,2);
});
