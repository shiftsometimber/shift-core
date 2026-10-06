import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sources, medicines, REVIEWED_AT} from './data.mjs';
import {projectSourceHealth, REVIEW_INTERVAL_MS} from './monitor.mjs';

const receipt = JSON.parse(readFileSync(new URL('./reviews/2026-09-23-source-review.json', import.meta.url)));
const nhsReceipt = JSON.parse(readFileSync(new URL('./reviews/2026-09-24-mounjaro-nhs-renewal.json', import.meta.url)));
const latestNhsReceipt = JSON.parse(readFileSync(new URL('./reviews/2026-10-01-mounjaro-nhs-renewal.json', import.meta.url)));
const foundayoReceipt = JSON.parse(readFileSync(new URL('./reviews/2026-09-29-foundayo-nice-schedule.json', import.meta.url)));
const overdueReceipt = JSON.parse(readFileSync(new URL('./reviews/2026-09-30-overdue-source-renewal.json', import.meta.url)));
const octoberOverdueReceipt = JSON.parse(readFileSync(new URL('./reviews/2026-10-06-overdue-source-renewal.json', import.meta.url)));
const foundayoPredictedRiskReceipt = JSON.parse(readFileSync(new URL('./reviews/2026-10-03-authorised-foundayo-predicted-risk.json', import.meta.url)));
const foundayoAttainMaintainReceipt = JSON.parse(readFileSync(new URL('./reviews/2026-10-04-authorised-foundayo-attain-maintain.json', import.meta.url)));
const wegovyMashReceipt = JSON.parse(readFileSync(new URL('./reviews/2026-10-03-authorised-wegovy-mash-correction.json', import.meta.url)));
const reviewTime = Date.parse(receipt.reviewedAt);
const rowFor = (source, now = reviewTime) => ({
  source_url: source.url, check_url: source.checkUrl,
  last_attempt_at: new Date(now).toISOString(), last_success_at: new Date(now).toISOString(),
  attempt_status: 'succeeded', last_http_status: 200,
  last_fingerprint: source.reviewedFingerprint, last_withdrawn: 0,
});

test('source-only review binds twelve complete primary responses without clinical approval', () => {
  assert.equal(receipt.reviewType, 'AI-assisted factual source review; not clinical approval');
  assert.equal(receipt.sources.length, 12);
  assert.equal(new Set(receipt.sources.map(s => s.id)).size, 12);
  for (const proof of receipt.sources) {
    const source = sources.find(s => s.id === proof.id);
    const currentProof = octoberOverdueReceipt.sources.find(source => source.id === proof.id)
      ?? wegovyMashReceipt.sources.find(source => source.id === proof.id)
      ?? overdueReceipt.sources.find(source => source.id === proof.id)
      ?? (proof.id === 'foundayo-nice' ? foundayoReceipt.sources[0] : proof);
    assert.equal(source.url, currentProof.url);
    assert.equal(source.checkUrl, currentProof.checkUrl);
    assert.equal(source.reviewedAt, currentProof.reviewedAt);
    assert.equal(source.reviewedFingerprint, currentProof.reviewedFingerprint);
    assert.equal(source.sourcePublishedAt, currentProof.sourcePublishedAt);
    assert.equal(currentProof.httpStatus, 200);
    assert.ok(currentProof.bytes > 0 && currentProof.bytes <= 2 * 1024 * 1024);
    assert.match(currentProof.responseSha256, /^[a-f0-9]{64}$/);
    assert.equal(currentProof.withdrawn, false);
    assert.equal(currentProof.wordingChanged, false);
    assert.ok(currentProof.assessment.length > 100);
    const currentReviewTime = Date.parse(currentProof.reviewedAt);
    assert.equal(projectSourceHealth(source, rowFor(source, currentReviewTime), currentReviewTime).status, 'current');
  }
});

test('sixteen overdue reviews are renewed only from complete unchanged evidence', () => {
  assert.equal(overdueReceipt.reviewType, 'AI-assisted factual source review; not clinical approval');
  assert.equal(overdueReceipt.sources.length, 16);
  assert.equal(new Set(overdueReceipt.sources.map(source => source.id)).size, 16);
  assert.equal(overdueReceipt.liveObservation.status, 'awaiting_review');
  assert.deepEqual(new Set(overdueReceipt.liveObservation.reviewDue), new Set(overdueReceipt.sources.map(source => source.id)));
  for (const proof of overdueReceipt.sources) {
    const source = sources.find(candidate => candidate.id === proof.id);
    const currentProof = wegovyMashReceipt.sources.find(candidate => candidate.id === proof.id) ?? proof;
    for (const key of ['url', 'checkUrl', 'reviewedAt', 'reviewedFingerprint', 'sourcePublishedAt']) {
      assert.equal(source[key], currentProof[key]);
    }
    assert.ok(Date.parse(proof.reviewedAt) > Date.parse(proof.previousReviewedAt) + REVIEW_INTERVAL_MS);
    assert.equal(proof.previousReviewedFingerprint, proof.reviewedFingerprint);
    assert.equal(proof.httpStatus, 200);
    assert.ok(proof.bytes > 1000 && proof.bytes <= 2 * 1024 * 1024);
    assert.match(proof.responseSha256, /^[a-f0-9]{64}$/);
    assert.equal(proof.withdrawn, false);
    assert.equal(proof.wordingChanged, false);
    assert.ok(proof.assessment.length > 130);
    const time = Date.parse(currentProof.reviewedAt);
    assert.equal(projectSourceHealth(source, rowFor(source, time), time).status, 'current');
    const old = {...source, reviewedAt: proof.previousReviewedAt};
    assert.ok(projectSourceHealth(old, rowFor(old, time), time).reasons.includes('review_due'));
  }
  assert.equal(overdueReceipt.clinicalApproval, null);
  assert.equal(overdueReceipt.transientChecks.length, 2);
  assert.ok(overdueReceipt.transientChecks.every(check => check.directFingerprintMatched && check.disposition.includes('retained')));
});

test('eight 6 October overdue reviews are renewed from unchanged primary evidence only', () => {
  assert.equal(octoberOverdueReceipt.reviewType, 'AI-assisted factual source review; not clinical approval');
  assert.equal(octoberOverdueReceipt.clinicalApproval, null);
  assert.equal(octoberOverdueReceipt.disposition, 'source_reviews_renewed_without_wording_change');
  assert.equal(octoberOverdueReceipt.sources.length, 8);
  assert.equal(new Set(octoberOverdueReceipt.sources.map(source => source.id)).size, 8);
  assert.deepEqual(new Set(octoberOverdueReceipt.liveObservation.reviewDue), new Set(octoberOverdueReceipt.sources.map(source => source.id)));
  for (const proof of octoberOverdueReceipt.sources) {
    const source = sources.find(candidate => candidate.id === proof.id);
    assert.ok(source, proof.id);
    for (const key of ['url', 'checkUrl', 'reviewedAt', 'reviewedFingerprint', 'sourcePublishedAt']) {
      assert.equal(source[key], proof[key], `${proof.id} ${key}`);
    }
    assert.ok(Date.parse(proof.reviewedAt) > Date.parse(proof.previousReviewedAt) + REVIEW_INTERVAL_MS);
    assert.equal(proof.previousReviewedFingerprint, proof.reviewedFingerprint);
    assert.equal(proof.httpStatus, 200);
    assert.ok(proof.bytes > 1000 && proof.bytes <= 2 * 1024 * 1024);
    assert.match(proof.responseSha256, /^[a-f0-9]{64}$/);
    assert.equal(proof.withdrawn, false);
    assert.equal(proof.wordingChanged, false);
    assert.ok(proof.assessment.length > 140);
    const time = Date.parse(proof.reviewedAt);
    assert.equal(projectSourceHealth(source, rowFor(source, time), time).status, 'current');
    const old = {...source, reviewedAt: proof.previousReviewedAt};
    assert.ok(projectSourceHealth(old, rowFor(old, time), time).reasons.includes('review_due'));
  }
  assert.equal(octoberOverdueReceipt.liveObservation.unchangedSeparateFailure.id, 'zealand-zp6590-pipeline');
  assert.equal(octoberOverdueReceipt.liveObservation.unchangedSeparateFailure.error, 'http_403');
});

test('review expiry, changed content and failures still fail closed', () => {
  for (const proof of receipt.sources) {
    const source = sources.find(s => s.id === proof.id);
    const currentReviewTime = Date.parse(source.reviewedAt);
    const expired = currentReviewTime + REVIEW_INTERVAL_MS + 1;
    assert.ok(projectSourceHealth(source, rowFor(source, expired), expired).reasons.includes('review_due'));
    assert.ok(projectSourceHealth(source, {...rowFor(source, currentReviewTime), last_fingerprint: 'f'.repeat(64)}, currentReviewTime).reasons.includes('source_changed'));
    assert.notEqual(projectSourceHealth(source, {...rowFor(source, currentReviewTime), attempt_status: 'failed', last_http_status: 403}, currentReviewTime).status, 'current');
    assert.ok(projectSourceHealth(source, {...rowFor(source, currentReviewTime), last_withdrawn: 1}, currentReviewTime).reasons.includes('source_withdrawn'));
  }
});

test('separate NHS tirzepatide expiry is renewed only after reading the complete unchanged source', () => {
  assert.equal(nhsReceipt.reviewType, 'AI-assisted factual source review; not clinical approval');
  assert.equal(nhsReceipt.sources.length, 1);
  const proof = nhsReceipt.sources[0];
  const source = sources.find(s => s.id === proof.id);
  assert.equal(proof.id, 'mounjaro-nhs');
  for (const key of ['url', 'checkUrl', 'reviewedAt', 'reviewedFingerprint', 'sourcePublishedAt']) {
    const currentProof = {...latestNhsReceipt.source, checkUrl: latestNhsReceipt.source.url, reviewedAt: latestNhsReceipt.reviewedAt};
    assert.equal(source[key], currentProof[key]);
  }
  assert.equal(latestNhsReceipt.source.previousReviewedAt, nhsReceipt.reviewedAt);
  assert.equal(latestNhsReceipt.source.reviewedFingerprint, proof.reviewedFingerprint);
  assert.equal(latestNhsReceipt.clinicalApproval, null);
  assert.equal(latestNhsReceipt.source.withdrawn, false);
  assert.equal(latestNhsReceipt.source.httpStatus, 200);
  assert.ok(Date.parse(latestNhsReceipt.source.retrievedAt) <= Date.parse(latestNhsReceipt.reviewedAt));
  assert.match(latestNhsReceipt.source.responseSha256, /^[a-f0-9]{64}$/);
  assert.equal(proof.previousReviewedAt, '2026-09-17T05:45:00Z');
  assert.equal(proof.previousReviewedFingerprint, proof.reviewedFingerprint);
  assert.ok(Date.parse(proof.reviewedAt) > Date.parse(proof.previousReviewedAt) + REVIEW_INTERVAL_MS);
  assert.equal(proof.httpStatus, 200);
  assert.ok(proof.bytes > 1000 && proof.bytes <= 2 * 1024 * 1024);
  assert.match(proof.responseSha256, /^[a-f0-9]{64}$/);
  assert.equal(proof.withdrawn, false);
  assert.equal(proof.wordingChanged, false);
  assert.ok(proof.assessment.length > 150);
  const time = Date.parse(latestNhsReceipt.reviewedAt);
  assert.equal(projectSourceHealth(source, rowFor(source, time), time).status, 'current');
  const old = {...source, reviewedAt: proof.previousReviewedAt};
  assert.ok(projectSourceHealth(old, rowFor(old, time), time).reasons.includes('review_due'));
});

test('changed SmPC metadata preserves the medicine catalogue and separately evidenced renewals', () => {
  assert.equal(REVIEWED_AT, '2026-09-15T21:28:30Z');
  assert.equal(sources.find(s => s.id === 'wegovy-injection-smpc').sourcePublishedAt, '2026-09-22');
  assert.equal(medicines.find(m => m.id === 'wegovy-injection').reviewedAt, wegovyMashReceipt.reviewedAt);
  const renewal = JSON.parse(readFileSync(new URL('./reviews/2026-09-23-product-information-renewal.json', import.meta.url)));
  for (const proof of renewal.sources) {
    const currentProof = wegovyMashReceipt.sources.find(candidate => candidate.id === proof.id)
      ?? overdueReceipt.sources.find(candidate => candidate.id === proof.id) ?? proof;
    assert.equal(proof.previousReviewedAt, '2026-09-16T17:44:34Z');
    assert.equal(currentProof.previousReviewedAt, proof.reviewedAt);
    assert.equal(sources.find(s => s.id === proof.id).reviewedAt, currentProof.reviewedAt);
    assert.ok(!receipt.sources.some(s => s.id === proof.id));
  }
  assert.equal(sources.find(s => s.id === 'wegovy-tablet-private').reviewedAt, JSON.parse(readFileSync(new URL('./reviews/2026-10-04-wegovy-tablet-provider-renewal.json', import.meta.url))).reviewedAt);
  assert.equal(sources.find(s => s.id === 'mounjaro-nhs').reviewedAt, latestNhsReceipt.reviewedAt);
});

test('Foundayo predicted-risk evidence is bounded to post-hoc modelling, not observed outcomes', () => {
  const foundayo = medicines.find(medicine => medicine.id === 'foundayo');
  const evidence = foundayo.evidenceLinks.find(link => link.url === foundayoPredictedRiskReceipt.primarySource.url);
  assert.equal(foundayoPredictedRiskReceipt.reviewType, 'AI-assisted primary-source factual review; not clinical approval');
  assert.equal(foundayoPredictedRiskReceipt.clinicalApproval, null);
  assert.equal(foundayoPredictedRiskReceipt.automatedMonitorChanges, false);
  assert.equal(evidence.sourcePublishedAt, '2026-10-01');
  assert.equal(evidence.reviewedAt, foundayoPredictedRiskReceipt.reviewedAt);
  assert.match(evidence.checkScope, /predicted risks, not observed diabetes diagnoses or cardiovascular events/i);
  assert.match(evidence.checkScope, /investigational formulation/i);
  assert.match(evidence.checkScope, /does not change the separate UK authorisation, NHS access or actual-supply statements/i);
  assert.doesNotMatch(foundayo.benefit, /diabetes|cardiovascular|risk/i);
  assert.equal(foundayoPredictedRiskReceipt.catalogueCounts.totalBefore, foundayoPredictedRiskReceipt.catalogueCounts.totalAfter);
  assert.equal(foundayoPredictedRiskReceipt.configuredSourcePass.reviewRenewals, false);
  assert.equal(foundayoPredictedRiskReceipt.configuredSourcePass.baselineChanges, false);
});

test('Foundayo ATTAIN-MAINTAIN evidence separates trial switching from the authorised UK regimen', () => {
  const foundayo = medicines.find(medicine => medicine.id === 'foundayo');
  const paper = foundayo.evidenceLinks.find(link => link.url === foundayoAttainMaintainReceipt.primarySource.url);
  const registry = foundayo.evidenceLinks.find(link => link.url === foundayoAttainMaintainReceipt.registrySources[0].url);
  assert.equal(foundayoAttainMaintainReceipt.reviewType, 'AI-assisted primary-source factual review; not clinical approval');
  assert.equal(foundayoAttainMaintainReceipt.clinicalApproval, null);
  assert.equal(foundayoAttainMaintainReceipt.primarySource.sourcePublishedAt, '2026-05-13');
  assert.equal(paper.reviewedAt, foundayoAttainMaintainReceipt.reviewedAt);
  assert.match(paper.checkScope, /investigational orforglipron capsules/i);
  assert.match(paper.checkScope, /not the authorised UK Foundayo tablet regimen/i);
  assert.match(paper.checkScope, /placebo rescue design/i);
  assert.match(paper.checkScope, /Lilly funding\/involvement/i);
  assert.equal(registry.reviewedAt, foundayoAttainMaintainReceipt.reviewedAt);
  assert.equal(foundayoAttainMaintainReceipt.registrySources[0].lifecycle.status, 'COMPLETED');
  assert.equal(foundayoAttainMaintainReceipt.registrySources[0].lifecycle.hasResults, false);
  assert.equal(foundayoAttainMaintainReceipt.catalogueCounts.totalBefore, foundayoAttainMaintainReceipt.catalogueCounts.totalAfter);
  assert.equal(foundayoAttainMaintainReceipt.configuredSourcePass.reviewRenewals, false);
  assert.equal(foundayoAttainMaintainReceipt.configuredSourcePass.baselineChanges, false);
});

test('Wegovy MASH correction separates UK authorisation, NICE appraisal and NHS access', () => {
  const wegovy = medicines.find(medicine => medicine.id === 'wegovy-injection');
  const smpcProof = wegovyMashReceipt.sources.find(source => source.id === 'wegovy-injection-smpc');
  const niceProof = wegovyMashReceipt.sources.find(source => source.id === 'wegovy-mash-nice');
  const sponsorProof = wegovyMashReceipt.sources.find(source => source.id === 'novo-step-up-liver-20261001');
  assert.equal(wegovyMashReceipt.reviewType, 'AI-assisted primary-source factual review; not clinical approval');
  assert.equal(wegovyMashReceipt.clinicalApproval, null);
  assert.match(wegovy.authorisation, /non-cirrhotic MASH/i);
  assert.match(wegovy.authorisation, /F2 to F3/i);
  assert.match(wegovy.access.nhsEngland, /appraisal .*still in development/i);
  assert.match(wegovy.access.nhsEngland, /no NHS England MASH access is confirmed/i);
  assert.ok(wegovy.sourceIds.includes('wegovy-mash-nice'));
  assert.equal(sources.find(source => source.id === 'wegovy-mash-nice').reviewedFingerprint, niceProof.reviewedFingerprint);
  assert.equal(sources.find(source => source.id === 'wegovy-injection-smpc').reviewedFingerprint, smpcProof.reviewedFingerprint);
  assert.equal(sources.find(source => source.id === 'wegovy-injection-smpc').reviewedAt, wegovyMashReceipt.reviewedAt);
  assert.equal(wegovy.reviewedAt, wegovyMashReceipt.reviewedAt);
  assert.match(niceProof.assessment, /not a recommendation/i);
  assert.match(sponsorProof.assessment, /55 participants/i);
  assert.match(sponsorProof.assessment, /pooled/i);
  const evidence = wegovy.evidenceLinks.find(link => link.url === sponsorProof.url);
  assert.equal(evidence.reviewedAt, wegovyMashReceipt.reviewedAt);
  assert.match(evidence.checkScope, /exploratory post-hoc/i);
  assert.match(evidence.checkScope, /not a comparison between those doses/i);
  assert.equal(wegovyMashReceipt.configuredSourceChange.before, 50);
  assert.equal(wegovyMashReceipt.configuredSourceChange.after, 51);
  assert.equal(wegovyMashReceipt.catalogueCounts.totalBefore, wegovyMashReceipt.catalogueCounts.totalAfter);
});
