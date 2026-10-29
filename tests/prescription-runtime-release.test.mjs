import test from 'node:test';
import assert from 'node:assert/strict';
import {wrapperSource,assertPreservedVersion,assertPredecessor,ORIGINAL_MODULES,PREDECESSOR} from '../release/prescription-runtime-20261029.mjs';
const source='a'.repeat(40);
const data=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
test('scoped runtime delegates unrelated requests and preserves scheduled and Durable Object exports',async()=>{
  const legacy=data("export class SiteContentState{};export default {scheduled(){return 'scheduled'},fetch(request){return new Response('original:'+new URL(request.url).pathname)}}");
  const medicine=data("export async function medicineCommerceRoutes(request){return new Response('prescription',{status:401,headers:{'Cache-Control':'no-store'}})}");
  const entry=wrapperSource('my-timber-login-pattern-fix-20261027.mjs',source,'tracker');
  const text=entry.replaceAll("'./my-timber-login-pattern-fix-20261027.mjs'",JSON.stringify(legacy)).replace("'./shift-prescription-lifecycle.mjs'",JSON.stringify(medicine));
  const module=await import(data(text));assert.equal(typeof module.SiteContentState,'function');assert.equal(module.default.scheduled(),'scheduled');
  for(const path of ['/','/member-login','/v1/commerce/stripe/webhook','/v1/commerce/medicine-clinical-intake','/v1/catalogue/medicines']){
    const r=await module.default.fetch(new Request('https://shiftsometimber.co.uk'+path),{},{});assert.equal(await r.text(),'original:'+path);assert.equal(r.headers.get('X-Shift-Prescription-Workflow'),null);
  }
  const tracker=await module.default.fetch(new Request('https://www.shiftsometimber.co.uk/member-treatment-journey-v1.js'),{},{});assert.equal(await tracker.text(),'tracker');
  const orders=await module.default.fetch(new Request('https://api.shiftsometimber.co.uk/v1/treatment/orders'),{},{});assert.equal(orders.status,401);assert.equal(orders.headers.get('Cache-Control'),'no-store');assert.equal(orders.headers.get('X-Shift-Prescription-Source'),source);
  const other=await module.default.fetch(new Request('https://unrelated.example.test/v1/treatment/orders'),{},{});assert.equal(await other.text(),'original:/v1/treatment/orders');
});
test('release refuses changed source modules, split traffic, settings or bindings',()=>{
  const original={version:{id:PREDECESSOR},deployment:{versions:[{version_id:PREDECESSOR,percentage:100}]},entry:'my-timber-login-pattern-fix-20261027.mjs',modules:Object.entries(ORIGINAL_MODULES).map(([name,sha256])=>({name,sha256}))};
  assertPredecessor(original);assert.throws(()=>assertPredecessor({...original,modules:[]}));assert.throws(()=>assertPredecessor({...original,deployment:{versions:[{version_id:PREDECESSOR,percentage:50}]}}));
  const version={resources:{bindings:[{name:'DB',type:'d1',id:'original'},{name:'SECRET',type:'secret_text'}],script_runtime:{compatibility_date:'2026-08-09',assets:{serve_directly:false}}}};
  assertPreservedVersion(version,structuredClone(version));
  const changed=structuredClone(version);changed.resources.bindings[0].id='other';assert.throws(()=>assertPreservedVersion(version,changed));
  const runtime=structuredClone(version);runtime.resources.script_runtime.assets.serve_directly=true;assert.throws(()=>assertPreservedVersion(version,runtime));
});
