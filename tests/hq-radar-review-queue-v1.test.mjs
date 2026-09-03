import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isRelevantRadarRow} from '../radar-integration-v1.js';
import {parseRelevantHtmlLinks} from '../radar-authoritative-scan-v1.js';

test('hourly Radar prepares relevant verified events for Matt review',()=>{
  const scheduled=fs.readFileSync(new URL('../radar-scheduled-scan-v1.js',import.meta.url),'utf8');
  const integration=fs.readFileSync(new URL('../radar-integration-v1.js',import.meta.url),'utf8');
  const scanner=fs.readFileSync(new URL('../radar-authoritative-scan-v1.js',import.meta.url),'utf8');
  assert.match(scheduled,/prepareVerifiedRadarQueue/);
  assert.match(integration,/status='verified'/);
  assert.match(integration,/status='ready_for_review'/);
  assert.match(integration,/ready_for_review','approved','hold','publish_failed/);
  assert.match(integration,/radarPortalWithPublish/);
  assert.match(integration,/Publish approved update/);
  assert.match(integration,/Retry publication/);
  assert.match(integration,/\/hq\/radar-controls/);
  assert.match(integration,/Nothing publishes from here until you approve it/);
  assert.match(integration,/\/v1\/hq\/radar\/intake/);
  assert.match(integration,/Add an update you have found/);
  assert.match(integration,/Peer-reviewed journal via DOI/);
  assert.match(scanner,/relevantItems/);
  assert.match(scanner,/eutils\.ncbi\.nlm\.nih\.gov/);
  assert.match(scanner,/peer_reviewed_research/);
  assert.match(scanner,/clinicaltrials\.gov\/api\/v2\/studies/);
  assert.match(scanner,/ClinicalTrials\.gov/);
  assert.match(scanner,/europepmc\/webservices\/rest\/search/);
  assert.match(scanner,/Europe PMC/);
  assert.match(scanner,/Authoritative registry\/index record/);
  assert.match(scanner,/nice\.org\.uk\/guidance\/published/);
  assert.match(scanner,/investor\.lilly\.com\/news-releases/);
  assert.match(scanner,/novonordisk\.com\/news-and-media/);
  for(const term of ['semaglutide','tirzepatide','retatrutide','cagrisema'])assert.ok(scanner.includes(term));
});

test('official newsroom pages only yield relevant, deduplicated links',()=>{
  const source={id:'official-news',authority:'Official newsroom',region:'GLOBAL',url:'https://example.test/news',eventType:'manufacturer_update'};
  const items=parseRelevantHtmlLinks('<a href="/corporate">Board update</a><a href="/reta">Retatrutide phase 3 obesity update</a><a href="/reta">Retatrutide phase 3 obesity update</a>',source);
  assert.deepEqual(items.map(x=>[x.title,x.url]),[['Retatrutide phase 3 obesity update','https://example.test/reta']]);
});

test('Radar queue excludes unrelated medical-device and general-health notices',()=>{
  for(const headline of [
    'Parenteral nutrition filters: field safety notice',
    'Hip replacement system recall',
    'Rectal catheter device alert',
    "General men's health update"
  ])assert.equal(isRelevantRadarRow({headline}),false,headline);
  for(const headline of [
    'MHRA updates GLP-1 medicines safety advice',
    'Orforglipron obesity study reports results',
    'Retatrutide Phase 3 weight-loss development',
    'CagriSema and semaglutide update'
  ])assert.equal(isRelevantRadarRow({headline}),true,headline);
});

test('commerce controls link to all owner management surfaces',()=>{
  const source=fs.readFileSync(new URL('../hq-commerce-content-v1.js',import.meta.url),'utf8');
  assert.match(source,/\/hq\/catalogue-controls/);
  assert.match(source,/\/hq\/radar-controls/);
});
