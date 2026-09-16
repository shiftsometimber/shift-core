import test from 'node:test';
import assert from 'node:assert/strict';
import { isRelevantNewsItem, newsRegion, ukCoverage, partitionNewsRows } from '../radar-uk-editorial-v1.js';
import { AUTHORITATIVE_RADAR_SOURCES, parseAuthoritativeFeed } from '../radar-authoritative-scan-v1.js';
import { isRelevantRadarRow, radarSeoPackage } from '../radar-integration-v1.js';

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
test('four-nation mental-health archive reaches HQ without admitting global or unknown sources', () => {
  for (const [region, regulator] of [['England','Department of Health and Social Care'],['Wales','Welsh Government'],['Scotland','Scottish Government'],['Northern Ireland','Department of Health Northern Ireland'],['UK','Mental Health UK']]) {
    assert.equal(isRelevantRadarRow({region, regulator, headline:'Mental health services and support update'}), true);
    assert.equal(isRelevantRadarRow({region:'GLOBAL', regulator, headline:'Mental health services and support update'}), false);
  }
  assert.equal(isRelevantNewsItem({region:'UK',authority:'Unverified health blog'}, {title:'Mental health services'}), false);
  assert.equal(isRelevantNewsItem({region:'England',authority:'NHS England'}, {title:'Men and NHS talking therapies'}), true);
});

 test('partial HQ SEO edits retain the SHIFT publication date and author, not the source date', () => {
  const publication='2026-09-13T07:35:00.000Z';
  const row={headline:'UK archive weight management research',source_evidence_json:JSON.stringify([{source_date:'2025-08-04',url:'https://www.ucl.ac.uk/news/study'}]),content_package_json:JSON.stringify({seo:{datePublished:publication,author:'SHIFT Newsroom'}})};
  const result=radarSeoPackage({headline:row.headline,standfirst:'Original UK research explained with clear context, evidence and limitations for readers.',known_facts:[{claim:'UK study'}],seo:{title:'An edited title about UK weight research'}},row);
  assert.equal(result.seo.datePublished,publication);
  assert.equal(result.seo.author,'SHIFT Newsroom');
  assert.equal(result.seo.title,'An edited title about UK weight research');
  assert.deepEqual(result.errors,[]);
 });

test('new SHIFT article date uses approval time while retaining historical source evidence', () => {
  const evidence=[{source_date:'2024-10-24',url:'https://www.gov.uk/drug-safety-update/example'}];
  const row={id:294,status:'ready_for_review',created_at:'2026-09-12T22:54:00.000Z',headline:'Bromocriptine reminder stresses blood pressure checks',source_evidence_json:JSON.stringify(evidence),content_package_json:'{}'};
  const before=Date.now();
  const result=radarSeoPackage({headline:row.headline,standfirst:'The MHRA’s 2024 review reinforced monitoring when the medicine is used after childbirth.',known_facts:[{claim:'The MHRA published the notice on 24 October 2024.',source_url:evidence[0].url}]},row);
  const after=Date.now();
  assert.ok(Date.parse(result.seo.datePublished)>=before && Date.parse(result.seo.datePublished)<=after);
  assert.notEqual(result.seo.datePublished,evidence[0].source_date);
  assert.notEqual(result.seo.datePublished,row.created_at);
  assert.deepEqual(JSON.parse(row.source_evidence_json),evidence);
  assert.deepEqual(result.errors,[]);
});
