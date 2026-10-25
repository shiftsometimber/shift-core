import test from 'node:test';import assert from 'node:assert/strict';
import rows from './fixtures/radar-catchup-public-edition-20261019.json' with {type:'json'};
import {latestPublishedEditionItems,PUBLISHED_TICKER_EDITION} from '../radar-published-ticker-v1.js';
import {tickerClient} from '../public-navigation-policy.mjs';
test('completed exact publication snapshots give dated catch-up links without changing the original edition',async()=>{
 const before=structuredClone(rows),items=await latestPublishedEditionItems(rows);
 assert.equal(items.length,7);assert.deepEqual(rows,before);assert.equal(PUBLISHED_TICKER_EDITION.edition_id,'published-newsroom-20260917');
 for(const item of items){assert.match(item.published_at,/^2026-10-19T/);assert.match(item.url,/^\/medicine-news\//)}
 const cbl=items.find(x=>x.id===1368);assert.equal(cbl.source_published_at,'2026-09-23');assert.equal(cbl.published_at,'2026-10-19T20:14:06.000Z');
});
test('a source change, withdrawal, altered frozen package, evidence, canonical or incomplete publication cannot enter the edition',async()=>{
 for(const mutate of [r=>r.status='hold',r=>r.publication_status='failed',r=>r.completed_at=null,r=>r.site_payload_json='{}',r=>r.source_evidence_json='[]',r=>{const p=JSON.parse(r.content_package_json);p.article_markdown+=' changed';r.content_package_json=JSON.stringify(p)},r=>{const p=JSON.parse(r.content_package_json);p.seo.canonical='https://other.test/story';r.content_package_json=JSON.stringify(p)}]){
  const x=structuredClone(rows);mutate(x.find(r=>r.id===1368));assert.equal((await latestPublishedEditionItems(x)).some(r=>r.id===1368),false);
 }
 assert.equal((await latestPublishedEditionItems(rows,new Map([[1263,{}]]))).some(r=>r.id===1263),false);
});
test('review timestamps never replace first actual publication or turn a partial edition into a current wire',async()=>{
 const x=structuredClone(rows);for(const r of x){r.reviewed_at='2030-01-01T00:00:00Z';r.updated_at=r.reviewed_at}
 assert.deepEqual(await latestPublishedEditionItems(x),await latestPublishedEditionItems(rows));
 assert.match(tickerClient,/Review incomplete/);assert.match(tickerClient,/published_edition\?\.current_wire === false/);
 const y=structuredClone(rows);for(const r of y)r.first_published_at=null;assert.deepEqual(await latestPublishedEditionItems(y),[]);
});
