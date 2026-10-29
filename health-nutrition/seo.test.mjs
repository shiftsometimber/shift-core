import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderDocument,renderContent} from './public.mjs';
import {productSearchMetadata,supplementSitemap} from './seo.mjs';

const products=JSON.parse(fs.readFileSync(new URL('./seed.json',import.meta.url)));
const shell='<html lang="en-GB"><head><meta name="robots" content="index,follow"><title>Old</title></head><body><header>Navigation</header><main>old</main><footer>Footer</footer></body></html>';
const render=query=>renderDocument(shell,'/shift-health/supplements-nutrition',new URLSearchParams(query),products);
const graph=html=>JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];

test('supplement sitemap has unique canonical guide URLs without filter noise or fabricated modification dates',()=>{
 const xml=supplementSitemap([...products,...products,{...products[0],id:'not-reviewed'}]);
 const locations=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
 assert.equal(locations.length,9);assert.equal(new Set(locations).size,9);
 assert(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
 assert(!/category=|sort=|not-reviewed|lastmod|priority|changefreq|Offer|PRIVATE/.test(xml));
});

test('each reviewed item has unique useful search copy, its own canonical and a matching product image',()=>{
 const titles=new Set(),descriptions=new Set();
 for(const product of products){
  const metadata=productSearchMetadata(product),html=render({product:product.id});
  titles.add(metadata.title);descriptions.add(metadata.description);
  assert(metadata.title.endsWith('| SHIFT'));
  assert(metadata.description.length>100&&metadata.description.length<180);
  assert(!/buy now|best price|guaranteed|clinically proven/i.test(metadata.description));
  assert(html.includes('href="https://shiftsometimber.co.uk/shift-health/supplements-nutrition?product='+product.id+'"'));
  assert(html.includes('property="og:image" content="https://shiftsometimber.co.uk/shift-health/assets/'+product.id+'.webp"'));
  assert(html.includes('name="twitter:image" content="https://shiftsometimber.co.uk/shift-health/assets/'+product.id+'.webp"'));
  assert.equal((html.match(/<title>/g)||[]).length,1);
  assert.equal((html.match(/name="description"/g)||[]).length,1);
 }
 assert.equal(titles.size,8);assert.equal(descriptions.size,8);
});

test('structured data describes the visible guide and breadcrumb without fabricated offers or credentials',()=>{
 for(const product of products){
  const html=render({product:product.id}),nodes=graph(html),page=nodes.find(x=>x['@type']==='WebPage');
  assert(page);assert.equal(page.inLanguage,'en-GB');
  assert.equal(page.about.name,product.brand+' '+product.name);
  assert.equal(page.publisher.name,'Shift Some Timber Ltd');
  assert(page.citation.every(url=>html.includes('href="'+url+'"')));
  const crumbs=nodes.find(x=>x['@type']==='BreadcrumbList').itemListElement;
  assert.deepEqual(crumbs.map(x=>x.position),[1,2,3]);
  assert.equal(crumbs.at(-1).name,product.name);assert.equal(crumbs.at(-1).item,page.url);
  assert(!nodes.some(x=>['Product','Offer','Review','FAQPage','Person'].includes(x['@type'])));
  assert(!/aggregateRating|priceCurrency|reviewedBy|medicalSpecialty/.test(JSON.stringify(nodes)));
 }
});

test('collection markup matches the filtered visible products and uses the clean range canonical',()=>{
 const html=render({category:'creatine',sort:'name-desc',q:'creatine'}),nodes=graph(html);
 const list=nodes.find(x=>x['@type']==='ItemList');
 assert.equal(list.numberOfItems,2);
 const visible=[...html.matchAll(/<h3><a href="([^"]+)">([^<]+)<\/a><\/h3>/g)].map(x=>x[2]);
 assert.deepEqual(list.itemListElement.map(x=>x.name),visible);
 assert.equal(nodes[0].url,'https://shiftsometimber.co.uk/shift-health/supplements-nutrition');
 assert(!nodes[0].url.includes('category='));
 assert.equal((render({product:'whey',category:'snacks'}).match(/rel="canonical"/g)||[]).length,1);
});

test('all comparison links are server rendered, reciprocal and restricted to reviewed current peers',()=>{
 for(const product of products){
  const html=renderContent('/shift-health/supplements-nutrition',new URLSearchParams({product:product.id}),products).content;
  const peer=products.find(p=>p.id!==product.id&&p.category===product.category);
  assert(html.includes('Compare with '+peer.name));
  assert(html.includes('href="/shift-health/supplements-nutrition?product='+peer.id+'"'));
  const changed=products.map(p=>p.id===peer.id?{...p,illustrated_pack:'Unreviewed pack'}:p);
  const updated=renderContent('/shift-health/supplements-nutrition',new URLSearchParams({product:product.id}),changed).content;
  assert(!updated.includes('Compare with '+peer.name));
 }
});

test('metadata and JSON-LD remain safe for malicious HQ text and never inherit an unrelated guide',()=>{
 const changed=products.map(p=>p.id==='whey'?{...p,name:'</script><script>BAD()</script>',description:'<script>BAD()</script>'}:p);
 const html=renderDocument(shell,'/shift-health/supplements-nutrition',new URLSearchParams({product:'whey'}),changed);
 const nodes=graph(html);
 assert.equal(nodes[0].about.name,'Applied Nutrition </script><script>BAD()</script>');
 assert(!html.includes('</script><script>BAD()'));
 assert(!nodes[0].citation);
 assert(!html.includes('Compare with Clear Whey Protein'));
 assert.equal(productSearchMetadata(changed[0]),null);
});

test('visible question answers need no JavaScript and existing index controls are preserved',()=>{
 const html=render({product:'clear'});
 assert(html.includes('Is clear whey suitable for someone with a milk allergy?'));
 assert(html.includes('It contains milk and is not suitable'));
 assert(html.includes('<meta name="robots" content="index,follow">'));
 assert(!/llms\.txt|application\/json\+ai|meta name="keywords"/.test(html));
});
