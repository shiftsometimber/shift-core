import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Miniflare}=require(process.env.SHIFT_MINIFLARE_PATH||'miniflare');
const mf=new Miniflare({workers:[{name:'report',modules:true,compatibilityDate:'2026-09-11',script:readFileSync(process.env.SHIFT_HQ_REPORT_BUNDLE,'utf8'),d1Databases:{DB:'hq-report-runtime-fixture'},serviceBindings:{CORE:async(request)=>{
 assert.equal(request.url,'https://api.shiftsometimber.co.uk/v1/hq/me');
 return request.headers.get('Cookie')==='hq=fixture'?Response.json({ok:true,user:{id:1},permissions:['crm_read']}):Response.json({ok:false,error:'hq_unauthorized'},{status:401});
}}}]});
try{
 const db=await mf.getD1Database('DB');
 await db.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,created_at TEXT); CREATE TABLE hq_users(email TEXT); CREATE TABLE audit_log(user_id INTEGER,action TEXT); INSERT INTO users VALUES(1,'member@example.com','2026-10-18T12:00:00Z'),(2,'shiftsometimber+runtime@gmail.com','2026-10-18T12:00:00Z'),(3,'appletest@shiftsometimber.co.uk','2026-10-18T12:00:00Z'),(4,'marked@example.com','2026-10-18T12:00:00Z'); INSERT INTO audit_log VALUES(4,'auth.commissioning_identity_verified');");
 const url='https://api.shiftsometimber.co.uk/v1/hq/management/report?kind=growth&start=2026-10-08&end=2026-10-18';
 const response=await mf.dispatchFetch(url,{headers:{Cookie:'hq=fixture',Origin:'https://hq.shiftsometimber.co.uk'}});
 assert.equal(response.status,200);const body=await response.json();assert.equal(body.metrics.find(x=>x.key==='registrations').value,1);assert.equal(response.headers.get('access-control-allow-origin'),'https://hq.shiftsometimber.co.uk');
 const denied=await mf.dispatchFetch(url);assert.equal(denied.status,401);
 const unrelated=await mf.dispatchFetch('https://api.shiftsometimber.co.uk/v1/hq/management/report-extra');assert.equal(unrelated.status,404);
 console.log('PASS compiled Workers runtime at production compatibility date: real Request/service-binding/D1; corrected registrations=1; anonymous401; unrelated404.');
}finally{await mf.dispose();}
