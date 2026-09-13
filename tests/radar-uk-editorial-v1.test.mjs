import test from 'node:test';
import assert from 'node:assert/strict';
import { isRelevantNewsItem, newsRegion, ukCoverage, partitionNewsRows } from '../radar-uk-editorial-v1.js';
import { AUTHORITATIVE_RADAR_SOURCES, parseAuthoritativeFeed } from '../radar-authoritative-scan-v1.js';
import { isRelevantRadarRow } from '../radar-integration-v1.js';

test('NHS pharmacy announcement survives feed and HQ relevance filters', () => {
  const source = AUTHORITATIVE_RADAR_SOURCES.find(x => x.id === 'nhs-england-news');
  const [item] = parseAuthoritativeFeed('<rss><channel><item><title>Patients to get quicker treatment for migraines, acne and 3 other everyday conditions at pharmacies</title><link>https://www.england.nhs.uk/2026/09/pharmacies/</link><pubDate>Thu, 10 Sep 2026 09:00:00 GMT</pubDate></item></channel></rss>', source);
  assert.equal(item.region, 'England');
  assert.equal(isRelevantNewsItem(source, item), true);
  assert.equal(isRelevantRadarRow({ headline: item.title, region: item.region, regulator: source.authority }), true);
});
test('broader UK health does not open the global queue to unrelated notices', () => {
  assert.equal(isRelevantNewsItem({ region: 'England', authority: 'NHS England' }, { title: 'New blood pressure checks at pharmacies' }), true);
  assert.equal(isRelevantNewsItem({ region: 'GLOBAL', authority: 'PubMed / NLM' }, { title: 'New blood pressure device trial' }), false);
  assert.equal(isRelevantNewsItem({ region: 'UK', authority: 'MHRA' }, { title: 'Medical device software licence amendment' }), false);
  assert.equal(isRelevantNewsItem({ region: 'UK', authority: 'MHRA' }, { title: 'UK authorises orforglipron for weight management' }), true);
});
test('UK evidence is classified by study scope, not index hostname or NHS mentions', () => {
  assert.equal(newsRegion({ region: 'GLOBAL' }, { title: 'SURMOUNT-REAL UK' }), 'UK');
  assert.equal(newsRegion({ region: 'GLOBAL' }, { countries: ['United Kingdom'] }), 'UK');
  assert.equal(newsRegion({ region: 'GLOBAL' }, { countries: ['United Kingdom', 'United States'] }), 'GLOBAL');
  assert.equal(newsRegion({ region: 'GLOBAL' }, { title: 'US results may interest NHS readers' }), 'GLOBAL');
  assert.equal(newsRegion({ region: 'England' }, {}), 'England');
});
test('missing or paused required UK feeds cannot be healthy coverage', () => {
  assert.equal(ukCoverage(AUTHORITATIVE_RADAR_SOURCES).complete, true);
  assert.deepEqual(ukCoverage(AUTHORITATIVE_RADAR_SOURCES.filter(x => x.id !== 'nhs-england-news')).missing, ['nhs-england-news']);
  assert.equal(ukCoverage([{ id: 'nhs-england-news', active: 0 }, { id: 'mhra-announcements', active: 1 }]).complete, false);
});
test('UK grouping preserves articles and their order within each section', () => {
  const rows = [{ id: 1, region: 'GLOBAL', headline: 'International study' }, { id: 2, region: 'England', headline: 'NHS pharmacy access' }, { id: 3, region: 'GLOBAL', headline: 'SURMOUNT-REAL UK' }];
  const result = partitionNewsRows(rows);
  assert.deepEqual(result.uk.map(x => x.id), [2, 3]);
  assert.deepEqual(result.international.map(x => x.id), [1]);
  assert.equal(rows[2].region, 'GLOBAL');
});
