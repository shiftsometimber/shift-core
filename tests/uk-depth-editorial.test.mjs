import test from 'node:test';
import assert from 'node:assert/strict';
import {archiveBatch} from '../editorial/uk-depth-20260913.mjs';
import {isRelevantNewsItem} from '../radar-uk-editorial-v1.js';
import {classifyNewsFilters} from '../radar-newsroom-filters-v1.js';
import {radarSeoPackage} from '../radar-integration-v1.js';

test('new UK sources stay scoped to relevant UK reporting',()=>{
 for(const authority of ['SAMH','Public Health Scotland','NIHR','University of Oxford','University of Bristol']){
  assert.equal(isRelevantNewsItem({authority,region:'UK'},{title:'Mental health support'}),true);
  assert.equal(isRelevantNewsItem({authority,region:'GLOBAL'},{title:'Mental health support'}),false);
  assert.equal(isRelevantNewsItem({authority,region:'UK'},{title:'Annual staff awards'}),false);
 }
 assert.equal(isRelevantNewsItem({authority:'Unknown blog',region:'UK'},{title:'ADHD support'}),false);
});
test('archive articles retain source precision, publication identity and discoverable topics',()=>{
 for(const a of archiveBatch){
  const row={headline:a.headline,region:a.region,regulator:a.authority,content_package_json:JSON.stringify(a.content),source_evidence_json:JSON.stringify(a.evidence)};
  const tags=classifyNewsFilters(row);
  assert.equal(tags.region,'uk');
  assert.ok(tags.topics.length,a.slug+' has no useful topic');
  assert.deepEqual(radarSeoPackage(a.content,row).errors,[]);
  assert.equal(a.content.seo.author,'SHIFT Newsroom');
  assert.ok(a.content.seo.datePublished.startsWith('2026-09-13'));
  assert.ok(a.content.article_markdown.includes('## Related UK reporting'));
 }
 for(const slug of ['uk-archive-game-of-stones-men-weight-loss-followup','uk-archive-reduce-antidepressant-review-support']){
  const a=archiveBatch.find(x=>x.slug===slug);
  assert.equal(a.date.length,7);
  assert.doesNotMatch(a.content.standfirst,/Original report: \d/);
 }
 const adhd=archiveBatch.find(x=>x.slug.includes('adult-adhd'));
 assert.ok(classifyNewsFilters({headline:adhd.headline,region:'England'}).topics.includes('mental-health'));
});
