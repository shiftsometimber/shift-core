import test from 'node:test';
import assert from 'node:assert/strict';
import rows from './fixtures/radar-catchup-public-edition-20261019.json' with {type:'json'};
import {radarPublicationPayloads} from '../radar-integration-v1.js';
import {latestPublishedEditionItems} from '../radar-published-ticker-v1.js';
import {repairTechnicalHtml,APPROVED_YELLOW_CARD_PATH,APPROVED_YELLOW_CARD_TITLE} from '../public-seo-technical.mjs';
test('the approved Yellow Card schema repair changes only its exact clipped canonical headline',()=>{
 const make=(headline,canonical)=>({ '@type':'Article',headline,mainEntityOfPage:canonical,datePublished:'2026-10-31T16:59:15.000Z',author:{name:'SHIFT AI Newsroom'}});
 const canonical='https://shiftsometimber.co.uk'+APPROVED_YELLOW_CARD_PATH;
 for(const [path,identity,expected] of [
  [APPROVED_YELLOW_CARD_PATH,canonical,APPROVED_YELLOW_CARD_TITLE],
  ['/medicine-news/another-story',canonical,APPROVED_YELLOW_CARD_TITLE.slice(0,70)],
  [APPROVED_YELLOW_CARD_PATH,'https://example.test/story',APPROVED_YELLOW_CARD_TITLE.slice(0,70)]
 ]){
  const original=make(APPROVED_YELLOW_CARD_TITLE.slice(0,70),identity);
  const html='<h1>'+APPROVED_YELLOW_CARD_TITLE+'</h1><script type="application/ld+json">'+JSON.stringify(original)+'</script>';
  const after=repairTechnicalHtml(html,path),schema=JSON.parse(after.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(schema,{...original,headline:expected});
  assert.equal(repairTechnicalHtml(after,path),after);
 }
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

test('legacy rows without a separate ticker line preserve the published headline',async()=>{
 const row=structuredClone(rows[0]),pkg=JSON.parse(row.content_package_json);delete pkg.ticker_line;
 row.content_package_json=JSON.stringify(pkg);const before=structuredClone(row);
 const [item]=await latestPublishedEditionItems([row]);
 assert.equal(item.ticker_line,pkg.headline);assert.equal(item.headline,pkg.headline);assert.deepEqual(row,before);
});
