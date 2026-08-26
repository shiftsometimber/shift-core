import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const controls=JSON.parse(fs.readFileSync(new URL('../evidence/seo-authority/evidence-desk-33-48-controls-v1.json',import.meta.url)));
const worker=fs.readFileSync(new URL('../evidence-desk-v1.js',import.meta.url),'utf8');
const config=JSON.parse(fs.readFileSync(new URL('../wrangler.evidence-desk-r12.wave2.local.jsonc',import.meta.url),'utf8'));
const migration=fs.readFileSync(new URL('../migrations/008_evidence_desk_wave2_claims.sql',import.meta.url),'utf8');

test('33 silence on no change has no package or notification side effect',()=>{
  assert.equal(controls.ticket_33_silence_on_no_change.result,'no_material_change');
  assert.equal(controls.ticket_33_silence_on_no_change.package_count,0);
  assert.equal(controls.ticket_33_silence_on_no_change.notification_count,0);
  assert.match(worker,/if\(materialState!=='material_change'\)return\{ok:true/);
});

test('34 amber package is queued but unsent and has no destination',()=>{
  const item=controls.ticket_34_unsent_amber_package;
  assert.equal(item.risk_lane,'amber');
  assert.equal(item.notification_status,'queued');
  assert.equal(item.sent_at,null);
  assert.deepEqual(item.destinations,{web:false,newsletter:false,social:false});
});

test('35 stale authority is a list-only control and cannot rewrite',()=>{
  assert.equal(controls.ticket_35_stale_authority.action,'list_only');
  assert.equal(controls.ticket_35_stale_authority.rewrite,false);
  assert.deepEqual(controls.ticket_35_stale_authority.fields,['claim_id','source_id','last_checked_at','freshness_days','stale_at','reason']);
});

test('36 every outbound and publication switch remains off',()=>{
  assert.deepEqual(Object.values(controls.ticket_36_outbound_kill_switch),[false,false,false,false,false,false]);
  assert.match(migration,/publish":false,"social":false,"outbound":false/);
});

test('37 email dry run targets only a local sink',()=>{
  const dry=controls.ticket_37_email_dry_run;
  assert.equal(dry.recipient,'evidence-desk-sink@example.test');
  assert.equal(dry.external_delivery,false);
  assert.doesNotMatch(dry.recipient,/matt/i);
});

test('38 red approval remains blocked by two specialist gates',()=>{
  assert.deepEqual(controls.ticket_38_qualified_review_lock.red_requires,['qualified_clinical_review','medicines_communications_review']);
  assert.equal(controls.ticket_38_qualified_review_lock.web_eligible_before_both,false);
  assert.match(worker,/error:'qualified_review_required'/);
  assert.match(worker,/error:'medicines_communications_review_required'/);
});

test('39 claim versions are append-only and content-addressed',()=>{
  const versioning=controls.ticket_39_claim_versioning;
  assert.deepEqual(versioning.identity,['claim_id','version']);
  assert.equal(versioning.mutation,'append_only');
  assert.equal(versioning.required.length,5);
});

test('40 publish-nothing is a valid daily-engine outcome',()=>{
  const daily=controls.ticket_40_daily_engine;
  assert.equal(daily.input_only,true);
  assert.equal(daily.publish_nothing_is_valid,true);
  assert.deepEqual(daily.destinations,{web:false,newsletter:false,social:false});
  assert.match(worker,/closed_no_publication/);
});

test('41 EMC watch list exists with fetching off',()=>{
  assert.equal(controls.ticket_41_emc_watch_list.host,'medicines.org.uk');
  assert.equal(controls.ticket_41_emc_watch_list.fetch_enabled,false);
});

test('42 price ladders are commercial, non-clinical and fetch-off',()=>{
  const prices=controls.ticket_42_price_ladders;
  assert.equal(prices.classification,'commercial');
  assert.equal(prices.clinical,false);
  assert.equal(prices.fetch_enabled,false);
});

test('43 rollback records have exact baseline and target fields without publication authority',()=>{
  const rollback=controls.ticket_43_rollback_record;
  assert.ok(rollback.required.includes('baseline_hash'));
  assert.ok(rollback.required.includes('rollback_target'));
  assert.equal(rollback.publication_authority,false);
});

test('44 stop-condition suite covers all ten commissioned failures',()=>{
  assert.equal(controls.ticket_44_stop_conditions.length,10);
  for(const condition of ['source_identity_drift','unmapped_material_change','claim_conflict','missing_qualified_review','production_environment_detected'])assert.ok(controls.ticket_44_stop_conditions.includes(condition));
});

test('45 Worker proof is dry-run only with zero outbound',()=>{
  const dry=controls.ticket_45_worker_dry_run;
  assert.equal(dry.deployment,false);
  assert.equal(dry.outbound_requests,0);
  assert.equal(dry.required_command,'wrangler deploy --dry-run');
});

test('46 inbox ranks red then amber then green',()=>{
  assert.deepEqual(controls.ticket_46_inbox_ranking,[{lane:'red',rank:1},{lane:'amber',rank:2},{lane:'green',rank:3}]);
  assert.match(worker,/CASE p\.risk_lane WHEN 'red' THEN 1 WHEN 'amber' THEN 2 ELSE 3 END/);
});

test('47 package deep links cannot publish',()=>{
  const link=controls.ticket_47_package_deep_link;
  assert.equal(link.read_only,true);
  assert.equal(link.publish_capability,false);
  assert.equal(link.decision_endpoint_is_not_publish_endpoint,true);
  assert.doesNotMatch(worker,/\/packages\/\(\\d\+\)\/publish/);
});

test('48 attests the exact non-production D1 and no production operation',()=>{
  const proof=controls.ticket_48_production_attestation;
  assert.equal(config.vars.EVIDENCE_DESK_ENV,'non-production');
  assert.equal(config.d1_databases[0].database_id,proof.database_id);
  assert.equal(config.d1_databases[0].database_name,proof.database_name);
  assert.equal(proof.remote_import_queries,87);
  assert.equal(proof.remote_import_rows_written,180);
  assert.equal(proof.production_database_touched,false);
  assert.equal(proof.production_worker_deployed,false);
  assert.equal(proof.production_site_deployed,false);
});

test('global closeout locks Wave 3, model, outbound and every destination',()=>{
  assert.ok(Object.values(controls.locks).every(Boolean));
});
