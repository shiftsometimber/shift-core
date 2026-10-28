import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {tests,byId,supplements,bundles,rangeProducts} from './catalogue.mjs';
import {testingContent,testingPaths} from './public.mjs';
import {testingStyle} from './styles.mjs';
import {testingHQRoute,validateTestingDraft} from './hq-api.mjs';
import {renderDocument,renderContent} from '../health-nutrition/public.mjs';
import {hubTemplate} from '../health-nutrition/templates.mjs';
import worker from '../health-nutrition/worker.mjs';
const shell='<html><head><title>Original</title><script type="application/ld+json">{"@type":"Product"}</script></head><body><header>accepted navigation</header><main>old</main><footer>accepted footer and consent</footer></body></html>';
function database(){
 const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(new URL('./migration.sql',import.meta.url),'utf8'));
 const wrap=(sql,values=[])=>({bind:(...args)=>wrap(sql,args),async all(){return {results:db.prepare(sql).all(...values)}},async first(){return db.prepare(sql).get(...values)||null;},async run(){const r=db.prepare(sql).run(...values);return {meta:{changes:r.changes}};}});
 return {db,prepare:wrap,async batch(statements){db.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}};
}
const request=(path,body,origin='https://hq.shiftsometimber.co.uk')=>new Request('https://api.shiftsometimber.co.uk'+path,{method:body?'PATCH':'GET',headers:{Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
const owner=()=>({fetch:async()=>Response.json({user:{id:42,role:'owner'}})});
test('expanded range retains distinct Testosterone and Male Hormone products and the selected coming-soon split',()=>{
 assert.deepEqual(tests.map(p=>p.name),['Testosterone','Diabetes','PSA','Male Hormone','Heart Health','Bowel Health','Prostate Health','Male Fertility','Cholesterol','Vitamin D','Iron Deficiency','Thyroid','Kidney Health']);
 assert.equal(tests.filter(p=>p.type==='home').length,8);assert.deepEqual(tests.filter(p=>p.state==='coming_soon').map(p=>p.id),['psa-lab','male-hormone','heart-health']);
 assert.deepEqual(byId.diabetes.markers,['HbA1c']);assert.equal(byId['male-hormone'].markers.length,8);assert.equal(byId['heart-health'].markers.length,5);
 assert(tests.every(p=>p.supplierSku===null&&p.tradePricePence===null&&p.retailPricePence===null&&p.saleEnabled===false));
});
test('migration creates the expanded durable drafts, preserves later staff edits and cannot enable sales',()=>{
 const DB=database(),rows=DB.db.prepare('SELECT * FROM testing_products').all();assert.equal(rows.length,13);assert.equal(DB.db.prepare('SELECT count(*) n FROM testing_range_extras').get().n,7);
 assert(rows.every(p=>p.status==='draft'&&p.sale_enabled===0&&p.supplier_sku===null&&p.trade_price_pence===null&&p.retail_price_pence===null));
 DB.db.exec("UPDATE testing_products SET internal_notes='Keep my edit',trade_price_pence=500 WHERE id='iron'");DB.db.exec(fs.readFileSync(new URL('./migration.sql',import.meta.url),'utf8'));
 assert.equal(DB.db.prepare("SELECT internal_notes FROM testing_products WHERE id='iron'").get().internal_notes,'Keep my edit');
 assert.throws(()=>DB.db.exec("UPDATE testing_products SET sale_enabled=1 WHERE id='iron'"));assert.throws(()=>DB.db.exec("UPDATE testing_products SET status='active' WHERE id='iron'"));
});
test('all twenty-one pages preserve the shell and private pricing, and only offer disabled purchase controls',()=>{
 for(const path of testingPaths){const html=renderDocument(shell,path,new URLSearchParams());assert(html.includes('accepted navigation'));assert(html.includes('accepted footer and consent'));assert.equal((html.match(/<h1>/g)||[]).length,1);assert.equal((html.match(/rel="canonical"/g)||[]).length,1);assert(html.includes('https://shiftsometimber.co.uk'+path));assert(!/newfoundland|Checkout|supplier_sku|3999|£39\.99|trade_price_pence|"@type":"Product"/i.test(html));}
 const h=testingContent('/shift-health/testing').content;assert.equal((h.match(/data-test="/g)||[]).length,20);assert.equal((h.match(/<span class="nft-state">Coming soon<\/span>/g)||[]).length,3);
 assert.equal(testingContent('/shift-health/testing/missing'),null);
 assert(testingContent('/shift-health/testing/diabetes').content.includes('testing partner’s secure results portal'));
 assert(testingContent('/shift-health/testing/cholesterol').content.includes('separate HDL, LDL'));
});
test('home testing uses only approved chrome colours and adds one reversible block to approved Health',()=>{
 const colours=[...testingStyle.matchAll(/#[\da-f]{6}\b/gi)].map(x=>x[0].toUpperCase());assert(colours.every(c=>['#050505','#E7E3DA','#707762'].includes(c)));
 const html=renderContent('/shift-health',new URLSearchParams()).content;assert(html.includes('href="/shift-health/testing"'));
 assert.equal(html.replace(/<section class="nft-hub"[\s\S]*?<\/section>/,''),hubTemplate);
});
test('HQ supplier and cost fields need authentication and write permission',async()=>{
 const DB=database();let env={DB,CORE:{fetch:async()=>Response.json({error:'unauthorised'},{status:401})}};assert.equal((await testingHQRoute(request('/v1/hq/testing'),env)).status,401);
 env.CORE={fetch:async()=>Response.json({user:{role:'marketing'},permissions:[]})};assert.equal((await testingHQRoute(request('/v1/hq/testing'),env)).status,403);
 env.CORE={fetch:async()=>Response.json({user:{role:'readonly'},permissions:['commerce_read']})};assert.equal((await testingHQRoute(request('/v1/hq/testing'),env)).status,200);assert.equal((await testingHQRoute(request('/v1/hq/testing/iron',{revision:1,internal_notes:'x'}),env)).status,403);
});
test('HQ saves commercial drafts with audit and revision control, rejects cross-origin writes and activation',async()=>{
 const DB=database(),env={DB,CORE:owner()};let r=await testingHQRoute(request('/v1/hq/testing/iron',{revision:1,supplier_sku:'CONFIRMED-CODE',trade_price_pence:500,retail_price_pence:null}),env);assert.equal(r.status,200);assert.equal((await r.json()).product.revision,2);
 assert.equal(DB.db.prepare('SELECT count(*) n FROM testing_product_history').get().n,1);
 assert.equal((await testingHQRoute(request('/v1/hq/testing/iron',{revision:1,internal_notes:'stale'}),env)).status,409);
 assert.equal((await testingHQRoute(request('/v1/hq/testing/iron',{revision:2,internal_notes:'bad'},'https://other.example'),env)).status,403);
 assert.equal((await testingHQRoute(request('/v1/hq/testing/iron',{revision:2,sale_enabled:1}),env)).status,400);
 assert.throws(()=>validateTestingDraft({trade_price_pence:-1}));assert.throws(()=>validateTestingDraft({status:'active'}));
});
test('worker serves testing GET/HEAD/404; delegates Bloods, existing guides and homepage exactly',async()=>{
 const env={BLOG:{fetch:async()=>new Response(shell)},DB:database(),CORE:owner()};
 assert.equal((await worker.fetch(new Request('https://shiftsometimber.co.uk/shift-health/testing'),env)).status,200);
 assert.equal(await (await worker.fetch(new Request('https://shiftsometimber.co.uk/shift-health/testing/iron',{method:'HEAD'}),env)).text(),'');
 assert.equal((await worker.fetch(new Request('https://shiftsometimber.co.uk/shift-health/testing/missing'),env)).status,404);
 assert.equal((await worker.fetch(new Request('https://shiftsometimber.co.uk/shift-health/testing',{method:'POST'}),env)).status,405);
 for(const path of ['/','/shift-health/blood-tests','/shift-health/blood-tests/baseline','/shift-health/trt-explained']){const upstream=new Response('exact accepted page');assert.equal(await worker.fetch(new Request('https://shiftsometimber.co.uk'+path),{BLOG:{fetch:async()=>upstream}}),upstream);}
 const r=await worker.fetch(request('/v1/hq/testing'),env);assert.equal((await r.json()).products.length,20);
});
test('HQ retains existing extensions and adds testing with no secret projection into public pages',async()=>{
 const r=await worker.fetch(new Request('https://hq.shiftsometimber.co.uk/'),{HQ:{fetch:async()=>new Response('<html><body>Existing HQ</body></html>',{headers:{'Content-Type':'text/html'}})}}),h=await r.text();assert(h.includes('Existing HQ'));assert(h.includes('hq-nutrition.js'));assert(h.includes('hq-testing.js'));
 const DB=database();DB.db.exec("UPDATE testing_products SET supplier_sku='PRIVATE-CODE',internal_notes='PRIVATE-NOTE',trade_price_pence=123456");
 const html=await (await worker.fetch(new Request('https://shiftsometimber.co.uk/shift-health/testing'),{DB,BLOG:{fetch:async()=>new Response(shell)}})).text();assert(!/PRIVATE-CODE|PRIVATE-NOTE|123456/.test(html));
});

import {productMedia} from './media.mjs';
test('real product photographs and sample-specific instructions cover the expanded range',()=>{
 for(const p of rangeProducts)assert(productMedia[p.id].gallery.length>0,p.id);
 for(const p of tests)assert.equal(Object.keys(productMedia[p.id].steps).length,4,p.id);
 assert.equal(byId['kidney-health'].sample,'Urine sample');assert.equal(byId['bowel-health'].sample,'Stool sample');assert.equal(byId['male-fertility'].sample,'Semen sample');
 assert(!testingContent('/shift-health/testing/kidney-health').content.includes('Use the supplied lancet'));
 assert.equal(supplements.length,3);assert.equal(bundles.length,4);
});
