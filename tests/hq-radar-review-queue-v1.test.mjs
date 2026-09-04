import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hqRadarReviewUrl,isRelevantRadarRow} from '../radar-integration-v1.js';
import {parseAuthoritativeFeed,parseRelevantHtmlLinks} from '../radar-authoritative-scan-v1.js';
import {sortPublishedEvents} from '../radar-public-v1.js';

test('scheduled Radar prepares relevant verified events for Matt review',()=>{
  const scheduled=fs.readFileSync(new URL('../radar-scheduled-scan-v1.js',import.meta.url),'utf8');
  const integration=fs.readFileSync(new URL('../radar-integration-v1.js',import.meta.url),'utf8');
  const scanner=fs.readFileSync(new URL('../radar-authoritative-scan-v1.js',import.meta.url),'utf8');
  assert.match(scheduled,/prepareVerifiedRadarQueue/);
  assert.match(integration,/status IN \('verified','needs_more_evidence'\)/);
  assert.match(integration,/status='ready_for_review'/);
  assert.match(integration,/ready_for_review','approved','hold','publish_failed/);
  assert.match(integration,/radarPortalWithPublish/);
  assert.match(integration,/Publish approved update/);
  assert.match(integration,/Retry (?:publication|failed publish)/);
  assert.match(integration,/\/hq\/radar-controls/);
  assert.match(integration,/Nothing publishes from here until you approve it/);
  assert.match(integration,/\/v1\/hq\/radar\/intake/);
  assert.match(integration,/Add an update you have found/);
  assert.match(integration,/Primary research via DOI/);
  assert.match(scanner,/relevantItems/);
  assert.match(scanner,/eutils\.ncbi\.nlm\.nih\.gov/);
  assert.match(scanner,/peer_reviewed_research/);
  assert.match(scanner,/clinicaltrials\.gov\/api\/v2\/studies/);
  assert.match(scanner,/ClinicalTrials\.gov/);
  assert.match(scanner,/europepmc\/webservices\/rest\/search/);
  assert.match(scanner,/Europe PMC/);
  assert.match(scanner,/Authoritative registry, index or manufacturer source; claims require primary-source corroboration/);
  assert.match(scanner,/tier===1\?'verified':'needs_more_evidence'/);
  assert.match(scanner,/Promise\.all/);
  assert.match(scanner,/source_changed/);
  assert.match(scanner,/ST INTERNAL — REVIEW — SHIFT AI/);
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

test('feed dates are normalised and tracking fragments are removed before ingestion',()=>{
  const source={id:'mhra',authority:'MHRA',region:'UK',eventType:'drug_safety_update'};
  const [item]=parseAuthoritativeFeed('<entry><title>MHRA GLP-1 safety update</title><link href="https://www.gov.uk/example?utm_source=email#top"/><updated>Wed, 02 Sep 2026 09:30:00 GMT</updated></entry>',source);
  assert.equal(item.url,'https://www.gov.uk/example');
  assert.equal(item.source_date,'2026-09-02T09:30:00.000Z');
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

test('public newsroom chronology is Shift publish date, source date, then id',()=>{
  const rows=[
    {id:1,reviewed_at:'2026-09-02T10:00:00Z',source_evidence_json:JSON.stringify([{source_date:'2026-09-02T09:00:00Z'}])},
    {id:3,reviewed_at:'2026-09-03T10:00:00Z',source_evidence_json:JSON.stringify([{source_date:'2026-08-20T09:00:00Z'}])},
    {id:2,reviewed_at:'2026-09-02T10:00:00Z',source_evidence_json:JSON.stringify([{source_date:'2026-09-02T09:00:00Z'}])}
  ];
  assert.deepEqual(sortPublishedEvents(rows).map(x=>x.id),[3,2,1]);
});

test('approval and publication remain distinct audited actions',()=>{
  const integration=fs.readFileSync(new URL('../radar-integration-v1.js',import.meta.url),'utf8');
  assert.match(integration,/audit\(env,id,'approved'/);
  assert.match(integration,/recordPublicationHistory\(env,\{eventId:event.id,jobId:job.id,action:'published'/);
  assert.match(integration,/owner_approval_required/);
  assert.match(integration,/publication_destination_required/);
});

test('social distribution requires website publication and a second hash-locked approval',()=>{
  const integration=fs.readFileSync(new URL('../radar-integration-v1.js',import.meta.url),'utf8');
  const portal=fs.readFileSync(new URL('../radar-social-portal-v1.js',import.meta.url),'utf8');
  for(const channel of ['instagram','facebook','linkedin','x']){
    assert.ok(integration.includes(channel));
    assert.ok(portal.includes(channel));
  }
  assert.match(integration,/website_publication_required_first/);
  assert.match(integration,/social_copy_changed_after_approval/);
  assert.match(integration,/social-draft/);
  assert.match(integration,/social_draft_ready/);
  assert.match(integration,/social_approved/);
  assert.match(integration,/social_published/);
  assert.match(portal,/Approve social copy/);
  assert.match(portal,/Generate platform drafts/);
  assert.match(portal,/Publish approved social copy/);
});

test('48-hour editorial cadence fails quiet without credible unused evidence',()=>{
  const scheduled=fs.readFileSync(new URL('../radar-scheduled-scan-v1.js',import.meta.url),'utf8');
  const integration=fs.readFileSync(new URL('../radar-integration-v1.js',import.meta.url),'utf8');
  assert.match(scheduled,/runRadarEditorialCadence/);
  assert.match(integration,/datetime\('now','-48 hours'\)/);
  assert.match(integration,/no_credible_unused_development/);
  assert.match(integration,/human approval required/);
});

test('approval email deep-links to one exact HQ decision',()=>{
  const integration=fs.readFileSync(new URL('../radar-integration-v1.js',import.meta.url),'utf8');
  assert.equal(hqRadarReviewUrl({},180),'https://hq.shiftsometimber.co.uk/?view=radar&event=180');
  assert.equal(hqRadarReviewUrl({HQ_PUBLIC_URL:'https://hq.example.test/'},'a/b'),'https://hq.example.test/?view=radar&event=a%2Fb');
  assert.doesNotMatch(integration,/HQ_API_URL\|\|'https:\/\/api\.shiftsometimber\.co\.uk'/);
  assert.match(integration,/Review this exact item/);
  assert.match(integration,/Response\.redirect\(hqRadarReviewUrl/);
});
