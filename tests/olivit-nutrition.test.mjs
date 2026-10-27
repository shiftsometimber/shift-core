import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {renderShiftHealthDocument,healthSlugs} from '../shift-health-public.mjs';
import {renderNutritionSection,nutritionStyle,nutritionRange} from '../shift-health-nutrition.mjs';
const root = new URL('../',import.meta.url);
const base = 'afa38107c8d663dc233114982039a8814ca64229';
const before = execFileSync('git',['show',base+':shift-health-public.mjs'],{encoding:'utf8'}).replace(/from '(\.\/[^']+)'/g,(_,p)=>"from '"+new URL(p,root).href+"'");
const previous = await import('data:text/javascript;base64,'+Buffer.from(before).toString('base64'));
const shell = '<html><head><title>Original</title></head><body class="programme-page"><header>Header</header><main>Old</main><footer>Footer</footer></body></html>';
test('all fourteen existing clinical and device pages remain byte-identical',()=>{
 assert.equal(healthSlugs.length,14);
 for(const slug of healthSlugs) assert.equal(renderShiftHealthDocument(shell,slug),previous.renderShiftHealthDocument(shell,slug),slug);
});
test('the only hub output changes are the nutrition section and its scoped style',()=>{
 const current=renderShiftHealthDocument(shell);
 assert.equal(current.split('id="supplements-nutrition"').length-1,1);
 assert(current.indexOf('id="supplements-nutrition"')>current.indexOf('class="shv-weight"'));
 assert(current.indexOf('id="supplements-nutrition"')<current.indexOf('class="shv-more"'));
 assert.equal(current.replace(renderNutritionSection(),'').replace(nutritionStyle,''),previous.renderShiftHealthDocument(shell));
});
test('draft candidates cannot be mistaken for live stock, prices or checkout',()=>{
 assert.equal(nutritionRange.status,'draft-not-for-sale');
 assert.equal(nutritionRange.groups.length,4);
 const products=nutritionRange.groups.flatMap(g=>g.products);
 assert.equal(products.length,8); assert.equal(new Set(products.map(p=>p.id)).size,8);
 for(const p of products){assert.equal(p.saleEnabled,false);assert.equal(p.stockQuantity,null);assert.equal(p.retailPriceIncVatPence,null);assert.equal(p.supplierSku,null);}
 const html=renderNutritionSection();
 assert.match(html,/Ordering is not open yet/);
 assert.equal((html.match(/<details class="snh-group"/g)||[]).length,4);
 assert.doesNotMatch(html,/<form|<button|<script|data-product-id|add.to.basket|checkout|application\/ld\+json|href="https?:|InStock|OutOfStock/i);
 assert.equal(nutritionRange.integration.publicExampleIsContractedRate,false);
 assert.equal(nutritionRange.account.discountPercent,null);
});
test('new styling uses only the approved palette and remains inside the nutrition section',()=>{
 const colours=[...nutritionStyle.matchAll(/#[0-9a-f]{6}/gi)].map(x=>x[0].toLowerCase());
 assert(colours.length>0);
 for(const colour of colours)assert(['#050505','#e7e3da','#707762'].includes(colour),colour);
 assert.match(nutritionStyle,/max-width:700px/);
 assert.match(nutritionStyle,/:focus-visible/);
 assert.match(nutritionStyle,/grid-template-columns:1fr/);
});
