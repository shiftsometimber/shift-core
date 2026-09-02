import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateMargin} from '../hq-catalogue-v1.js';

test('medicine margin is calculated from cost and selling price',()=>{
  assert.deepEqual(calculateMargin(12000,16900),{costPence:12000,sellingPence:16900,marginPence:4900,marginPercent:28.99});
});

test('HQ exposes controlled product images and medicine variants',()=>{
  const source=fs.readFileSync(new URL('../hq-catalogue-v1.js',import.meta.url),'utf8');
  for(const contract of ['commerce_product_images','medicine_products','medicine_variants','/hq/catalogue-controls','/v1/hq/catalogue/products','/v1/hq/medicines','strengthLabel','marginPercent'])assert.ok(source.includes(contract),contract);
  assert.match(source,/image\/(jpeg|png|webp)/);
  assert.match(source,/base64\.length\s*>\s*2097152/);
  assert.match(source,/out_of_stock/);
});

test('HQ catalogue is wired before the legacy Worker fallback',()=>{
  const entry=fs.readFileSync(new URL('../worker-entry-v6.js',import.meta.url),'utf8');
  assert.match(entry,/import \{hqCatalogueRoutes\}/);
  assert.ok(entry.indexOf('hqCatalogueRoutes(request')<entry.indexOf('hqCommerceContentRoutes(request'));
});
