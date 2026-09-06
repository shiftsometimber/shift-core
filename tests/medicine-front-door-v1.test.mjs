import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';

const root=new URL('../frontend/medicine-front-door/',import.meta.url);

test('front door ships the five locked hero routes from one template',async()=>{
  const files=await readdir(root);
  for(const name of ['mounjaro.html','wegovy-injection.html','wegovy-tablet.html','orlistat.html','foundayo.html'])assert.ok(files.includes(name),name);
  const pages=await Promise.all(['product.html','mounjaro.html','wegovy-injection.html','wegovy-tablet.html','orlistat.html','foundayo.html'].map(x=>readFile(new URL(x,root),'utf8')));
  for(const page of pages){
    assert.match(page,/medicine-front-door\.js/);
    assert.match(page,/THE BITS SALES PAGES HIDE/);
    assert.match(page,/No card is charged here/);
  }
});

test('prices and stock come only from the governed catalogue',async()=>{
  const js=await readFile(new URL('medicine-front-door.js',root),'utf8');
  assert.match(js,/\/v1\/catalogue\/medicines/);
  assert.match(js,/pricePence/);
  assert.match(js,/status==='available'/);
  assert.doesNotMatch(js,/£(?:59|79|99|129|169|199)/);
});

test('Foundayo is launch-ready but cannot open the till without HQ supply',async()=>{
  const js=await readFile(new URL('medicine-front-door.js',root),'utf8');
  assert.match(js,/foundayo:\{match:'foundayo',type:'ONCE-DAILY TABLET · SUPPLY LOCKED'/);
  assert.match(js,/Launch-ready · partner supply not yet confirmed/);
  assert.doesNotMatch(js,/if\(slug==='foundayo'\).*return/);
});

test('the paid order hands off to compulsory clinical assessment',async()=>{
  const source=await readFile(new URL('treatment-assessment.js',root),'utf8');
  assert.match(source,/\/v1\/commerce\/medicine-clinical-intake/);
  assert.match(source,/orderNumber/);
  assert.match(source,/new FormData\(form\)/);
});
