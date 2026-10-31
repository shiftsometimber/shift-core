import test from 'node:test';
import assert from 'node:assert/strict';
import rows from './fixtures/radar-catchup-public-edition-20261019.json' with {type:'json'};
import {radarPublicationPayloads} from '../radar-integration-v1.js';
import {latestPublishedEditionItems} from '../radar-published-ticker-v1.js';
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
