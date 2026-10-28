import test from 'node:test';
import assert from 'node:assert/strict';
import {rangeProducts} from './catalogue.mjs';
import {testingContent,faqItems} from './public.mjs';
import {testingSEO,testingSitemap} from './seo.mjs';
import {renderDocument} from '../health-nutrition/public.mjs';
import worker from '../health-nutrition/worker.mjs';
test('all twenty products expose six specific explanations and matching factual schema without invented offers',()=>{
 const descriptions=new Set();
 for(const p of rangeProducts){const path='/shift-health/testing/'+p.id,view=testingContent(path),html=view.content,seo=testingSEO(path),graph=seo.graph['@graph'];
  for(const id of ['about','why','evidence','suitability','included','why-shift'])assert(html.includes('id="'+id+'"'),p.id+' '+id);
  descriptions.add(view.description);const product=graph.find(n=>n['@type']==='Product');assert.equal(product.url,'https://shiftsometimber.co.uk'+path);assert(product.image.every(url=>url.startsWith('https://shiftsometimber.co.uk/shift-health/assets/testing-')));assert(!Object.hasOwn(product,'offers'));assert(!Object.hasOwn(product,'aggregateRating'));assert(!Object.hasOwn(product,'review'));
  const questions=graph.find(n=>n['@type']==='FAQPage').mainEntity;assert.deepEqual(questions.map(q=>q.name),faqItems(p).map(q=>q[0]));assert(questions.every(q=>q.acceptedAnswer.text.length>30));
  assert(!/newfoundland|supplier_sku|trade_price|£39\.99|\"price\":0/.test(JSON.stringify(graph)));assert(html.includes('zero stock')||html.includes('Zero stock')||html.includes('0 in stock'));
 }
 assert.equal(descriptions.size,20);
});
test('the rendered document has one canonical graph, visible answers, primary evidence links and a crawlable collection',()=>{
 const shell='<html><head><title>Old page</title><script type="application/ld+json">{"@type":"Event"}</script></head><body><main></main></body></html>';
 const html=renderDocument(shell,'/shift-health/testing/prostate-health',new URLSearchParams());const blocks=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];assert.equal(blocks.length,1);assert.doesNotThrow(()=>JSON.parse(blocks[0][1]));assert.equal((html.match(/rel="canonical"/g)||[]).length,1);assert(html.includes('does not provide the same detailed numerical report'));assert(html.includes('https://www.nhs.uk/tests-and-treatments/psa-test/'));
 const list=testingSEO('/shift-health/testing').graph['@graph'].find(x=>x['@type']==='CollectionPage').mainEntity;assert.equal(list.numberOfItems,20);assert.equal(list.itemListElement.length,20);
});
test('the scoped testing sitemap returns all twenty-one canonical URLs without changing unrelated sitemap ownership',async()=>{
 const xml=testingSitemap();assert.equal((xml.match(/<url>/g)||[]).length,21);assert([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].every(m=>!m[1].includes('?')));const result=await worker.fetch(new Request('https://shiftsometimber.co.uk/shift-health/testing/sitemap.xml'),{},{});assert.equal(result.status,200);assert.match(result.headers.get('Content-Type'),/application\/xml/);assert.equal(await result.text(),xml);
});
