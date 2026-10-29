import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderContent,renderDocument} from './public.mjs';
import {editorialPresentation,editorialGuide,productEditorial} from './editorial.mjs';

const products=JSON.parse(fs.readFileSync(new URL('./seed.json',import.meta.url)));
const page=id=>renderContent('/shift-health/supplements-nutrition',new URLSearchParams({product:id}),products);

test('every reviewed product gives a substantial explanation, limitations, useful questions and sources without creating an offer',()=>{
  for(const product of products){
    const view=page(product.id),html=view.content;
    assert(html.includes('How it fits your day'),product.id);
    assert(html.includes('When to leave it'),product.id);
    assert(html.includes('Check before choosing'),product.id);
    assert(html.includes('Sources and product information'),product.id);
    assert(html.includes('Your questions, answered'),product.id);
    assert(html.includes('/member/dashboard'),product.id);
    assert(html.includes('Not yet available to order'),product.id);
    assert(html.includes('The exact pack, flavour, full label and orderable range are still being confirmed.'),product.id);
    assert(html.replace(/<[^>]*>/g,' ').split(/\s+/).length>250,product.id);
    assert(!/<details\s+open\b|<script\b|£\d|Add to basket|Buy now/i.test(html),product.id);
    assert(productEditorial(product).sources.every(source=>source.url.startsWith('https://')));
  }
});

test('both whey products prominently explain milk and the clear format does not imply dairy-free',()=>{
  assert(page('whey').content.includes('<strong>Contains milk.</strong>'));
  const clear=page('clear').content;
  assert(clear.includes('<strong>Contains milk. Not a dairy-free option.</strong>'));
  assert(clear.includes('not suitable for someone who needs to avoid milk because of an allergy'));
});

test('creatine explains the restricted exercise benefit, adult context, daily amount and water-weight change',()=>{
  for(const id of ['creatine','skill']){
    const html=page(id).content;
    assert(/adult/i.test(html));
    assert(/high.intensity/.test(html));
    assert(/daily[^<]*3 g of creatine|daily intake must provide 3 g of creatine/.test(html));
    assert(/water retention/i.test(html));
    assert(/weight-loss medicine|without buying creatine/.test(html));
    assert(!/clinically backed|builds muscle|fat burner|testosterone booster|quicker to absorb/i.test(html));
  }
});

test('hydration and snack pages help someone decide against an unnecessary purchase',()=>{
  for(const id of ['sticks','tablets'])assert(/water|usual drinks/i.test(page(id).content));
  assert(page('sticks').content.includes('does not automatically create a need for electrolytes'));
  assert(page('tablets').content.includes('not something to swallow whole'));
  for(const id of ['crunch','chunky'])assert(/not a complete meal replacement|not sold here as a complete meal replacement/.test(page(id).content));
  assert(page('chunky').content.includes('recipe includes collagen'));
});

test('approved replacements preserve newer HQ copy and refuse to attach to a repurposed product ID',()=>{
  const original=products.find(product=>product.id==='whey');
  const revised=editorialPresentation(original);
  assert.notEqual(revised.description,original.description);
  assert.notEqual(revised.shift_says,original.shift_says);
  const edited={...original,description:'Our current HQ description',shift_says:'Our current HQ recommendation'};
  assert.equal(editorialPresentation(edited).description,edited.description);
  assert.equal(editorialPresentation(edited).shift_says,edited.shift_says);
  for(const changed of [{...original,brand:'Different manufacturer'},{...original,name:'Different product'},{...original,id:'another-id'},{...original,illustrated_pack:'Different pack'},{...original,illustrated_flavour:'Different flavour'}]){
    assert.equal(productEditorial(changed),null);
    assert.equal(editorialGuide(changed),'');
    assert.equal(editorialPresentation(changed),changed);
  }
});

test('HQ text stays escaped and only the storefront receives the choice guide',()=>{
  const malicious=products.map(p=>({...p,description:'<script>PRIVATE_XSS()</script>',shift_says:'<img src=x onerror=PRIVATE_XSS()>'}));
  const shell='<html><head></head><body><header>Retained header</header><main>old</main><footer>Retained footer</footer></body></html>';
  const html=renderDocument(shell,'/shift-health/supplements-nutrition',new URLSearchParams({product:'whey'}),malicious);
  assert(!html.includes('<script>PRIVATE_XSS()'));
  assert(!html.includes('<img src=x'));
  assert(html.includes('&lt;script&gt;PRIVATE_XSS()&lt;/script&gt;'));
  assert(html.includes('Retained header')&&html.includes('Retained footer'));
  assert(renderContent('/shift-health/supplements-nutrition',new URLSearchParams(),products).content.includes('Start with your day.'));
  assert(!renderContent('/shift-health',new URLSearchParams(),products).content.includes('supplement-storefront-guide'));
});

test('a previously rendered Health shell cannot override new panels or duplicate the owned stylesheet',()=>{
  const shell='<html><head><style id="retained-chrome">header{padding:10px}</style></head><body><header>Header</header><main>old</main><footer>Footer</footer></body></html>';
  const first=renderDocument(shell,'/shift-health',new URLSearchParams(),products);
  const second=renderDocument(first,'/shift-health/supplements-nutrition',new URLSearchParams({product:'whey'}),products);
  assert.equal((second.match(/<style data-health-nutrition=/g)||[]).length,1);
  assert.equal((second.match(/id="retained-chrome"/g)||[]).length,1);
  assert(second.includes('#main-content #shift-health-range .supplement-topic{padding:25px!important;background:#E7E3DA!important;color:#050505!important;'));
});
