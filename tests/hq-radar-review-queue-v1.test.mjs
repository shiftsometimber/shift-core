import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('hourly Radar prepares relevant verified events for Matt review',()=>{
  const scheduled=fs.readFileSync(new URL('../radar-scheduled-scan-v1.js',import.meta.url),'utf8');
  const integration=fs.readFileSync(new URL('../radar-integration-v1.js',import.meta.url),'utf8');
  const scanner=fs.readFileSync(new URL('../radar-authoritative-scan-v1.js',import.meta.url),'utf8');
  assert.match(scheduled,/prepareVerifiedRadarQueue/);
  assert.match(integration,/status='verified'/);
  assert.match(integration,/status='ready_for_review'/);
  assert.match(integration,/\/hq\/radar-controls/);
  assert.match(integration,/Nothing publishes from here until you approve it/);
  assert.match(integration,/\/v1\/hq\/radar\/intake/);
  assert.match(integration,/Add an update you have found/);
  assert.match(integration,/Peer-reviewed journal via DOI/);
  assert.match(scanner,/relevantItems/);
  assert.match(scanner,/eutils\.ncbi\.nlm\.nih\.gov/);
  assert.match(scanner,/peer_reviewed_research/);
  for(const term of ['semaglutide','tirzepatide','retatrutide','cagrisema'])assert.ok(scanner.includes(term));
});

test('commerce controls link to all owner management surfaces',()=>{
  const source=fs.readFileSync(new URL('../hq-commerce-content-v1.js',import.meta.url),'utf8');
  assert.match(source,/\/hq\/catalogue-controls/);
  assert.match(source,/\/hq\/radar-controls/);
});
