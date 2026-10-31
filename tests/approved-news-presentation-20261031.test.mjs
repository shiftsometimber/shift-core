import test from 'node:test';
import assert from 'node:assert/strict';
import rows from './fixtures/radar-catchup-public-edition-20261019.json' with {type:'json'};
import {radarSeoPackage,radarPublicationPayloads} from '../radar-integration-v1.js';
import {completeNewsTitle,radarNewsPageRoutes} from '../radar-news-pages-v1.js';
import {latestPublishedEditionItems} from '../radar-published-ticker-v1.js';
const title='Yellow Card reporting changes ahead of November’s medicines-safety week';
test('the approved 71-character title survives packaging; deliberately distinct SEO titles stay distinct',()=>{
 const row={headline:title,source_evidence_json:'[]',content_package_json:'{}'};
 const pkg={headline:title,standfirst:'The reporting service has changed; this does not announce a new medicine-specific hazard.',known_facts:[{claim:'A reporting-service change.'}]};
 assert.equal(title.length,71);
 assert.equal(radarSeoPackage(pkg,row).seo.title,title);
 assert.equal(completeNewsTitle(title.slice(0,70),title),title);
 assert.equal(completeNewsTitle('An independently edited shorter title',title),'An independently edited shorter title');
 assert.equal(completeNewsTitle('', 'x'.repeat(300)).length,160);
});
test('the existing published row renders the complete title and visible headline in schema without a content write',async()=>{
 const row=structuredClone(rows[0]),pkg=JSON.parse(row.content_package_json);
 pkg.headline=title;pkg.seo.title=title.slice(0,70);pkg.seo.slug='medicine-news/yellow-card-reporting-update-october-2026';
 row.headline=title;row.content_package_json=JSON.stringify(pkg);
 const before=structuredClone(row),original=globalThis.fetch;
 globalThis.fetch=async()=>new Response('<html><head><title>Old</title></head><body><main>Old</main></body></html>');
 try{
  const DB={prepare:()=>({all:async()=>({results:[row]})})};
  const response=await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk/'+pkg.seo.slug),{DB});
  const html=await response.text();assert.equal(response.status,200);
  assert(html.includes('<title>'+title+'</title>'));
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema.headline,title);assert.equal(schema.datePublished,'2026-10-19T20:25:37.000Z');
  assert.deepEqual(row,before);
 }finally{globalThis.fetch=original}
});
test('the fallback edition carries the approved ticker line, preserving article title, URL, dates and snapshot checks',async()=>{
 const row=structuredClone(rows[0]),pkg=JSON.parse(row.content_package_json);
 pkg.ticker_line='Oral VK2735: sponsor update and registry dates still differ';
 row.content_package_json=JSON.stringify(pkg);
 const payload=radarPublicationPayloads(row);
 row.site_payload_json=JSON.stringify(payload.site);row.brain_payload_json=JSON.stringify(payload.brain);row.search_payload_json=JSON.stringify(payload.search);
 const before=structuredClone(row),[item]=await latestPublishedEditionItems([row]);
 assert.equal(item.ticker_line,pkg.ticker_line);assert.equal(item.headline,pkg.headline);
 assert.equal(item.url,'/'+pkg.seo.slug);assert.equal(item.published_at,'2026-10-19T20:25:37.000Z');assert.deepEqual(row,before);
 row.site_payload_json='{}';assert.deepEqual(await latestPublishedEditionItems([row]),[]);
});
