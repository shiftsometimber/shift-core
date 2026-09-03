import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateDiscount} from '../hq-commerce-content-v1.js';

test('NEWSHIFT25 calculates 25 percent once in integer pence',()=>{
  assert.deepEqual(calculateDiscount({discount_type:'percent',discount_value:25},16900),{discountPence:4225,totalPence:12675});
  assert.deepEqual(calculateDiscount({discount_type:'percent',discount_value:25},9900),{discountPence:2475,totalPence:7425});
});

test('fixed discounts cannot create a negative total',()=>{
  assert.deepEqual(calculateDiscount({discount_type:'fixed',discount_value:20000},9900),{discountPence:9900,totalPence:0});
});


test('published HQ wording uses strong durable delivery and no-store responses',()=>{
  const source=fs.readFileSync(new URL('../hq-commerce-content-v1.js',import.meta.url),'utf8');
  assert.match(source,/'cache-control':'no-store'/);
  assert.match(source,/SITE_CONTENT_STATE/);
  assert.match(source,/contentStateCall\(env,'\/read'/);
  assert.match(source,/contentStateCall\(env,'\/publish'/);
  assert.match(source,/contentStateCall\(env,'\/pause'/);
  assert.match(source,/Changes appear on the next page load\./);
  assert.match(source,/path\.startsWith\('\/v1\/site-content\/'\)/);
  assert.match(source,/content_state_not_committed/);
  assert.match(source,/content_delivery_not_committed/);
  assert.match(source,/action==='preview'/);
  assert.match(source,/action==='rollback'/);
  assert.match(source,/site_content\.rolled_back/);
  assert.match(source,/rolledBack:true/);
  assert.match(source,/data-preview=/);
  assert.match(source,/Preview only — nothing published/);
  assert.match(source,/portalWithLifecycleStatus/);
  assert.match(source,/Website action committed/);
  assert.match(source,/Website action failed/);
  assert.match(source,/data-rollback=/);
  assert.match(source,/request\.method==='POST'/);
  assert.doesNotMatch(source,/public,max-age=60/);
});


test('synthetic HQ cleanup reads primary and removes interrupted-run rows',()=>{
  const source=fs.readFileSync(new URL('../commissioning-ops-v1.js',import.meta.url),'utf8');
  assert.match(source,/withSession\('first-primary'\)/);
  assert.match(source,/content_key LIKE 'hq-closeout-%'/);
});
