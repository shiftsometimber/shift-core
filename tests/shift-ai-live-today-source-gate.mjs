import assert from 'node:assert/strict';
import fs from 'node:fs';

const live=fs.readFileSync(new URL('../shift-ai-live-today-v1.js',import.meta.url),'utf8');
const worker=fs.readFileSync(new URL('../worker-entry-v6.js',import.meta.url),'utf8');
const member=fs.readFileSync(new URL('../frontend/member/member-my-timber-problem-v1.js',import.meta.url),'utf8');
const today=fs.readFileSync(new URL('../member-product-v8.js',import.meta.url),'utf8');

for(const required of [
  "env.SHIFT_TODAY_MODEL_ENABLED!=='true'",
  "env.SHIFT_AI_R4_PILOT_ENABLED!=='true'",
  "env.SHIFT_TODAY_MODEL_ENABLED==='true'",
  'shift_ai_pilot_control',
  'shift_ai_pilot_access',
  'shift-ai-r4-pilot-consent-v1',
  'pilotAccessGate',
  'pilot_model_lock',
  'pilot_cohort_limit',
  'pilot_gate_failed_closed',
  "classification.classification!=='practical'",
  "status='published'",
  "final_v1_acceptance?.accepted===true",
  "review?.status==='approved'",
  "body?.confirmed!==true",
  'catalogue_revalidation_failed',
  'shift_ai_today_audit',
  "date,'ai_rebuild'",
  'learning_persistence:false',
  'multi_day:false',
  'catalogue_writes:false',
  'requiredAll',
  'contextCompleteness',
  'memberFoodRules',
  'memberMovementRules',
  'recipeCompatibility',
  'movementCompatibility',
  'catalogueCompleteness',
  'no_member_compatible_grub',
  'no_member_compatible_fit',
  'lifeBackForRoute',
  'member_priorities',
  'observed_evidence',
  'intended_protection',
  'causal_claim:false',
  'supporting_context_only',
  'missing_movement_location_metadata',
  'missing_movement_equipment_metadata',
  'recoveryForMissing',
  'recognitionSignals',
  'generic_fallback_used:false',
  'canonical_today:true',
  'live_context_unavailable'
])assert.ok(live.includes(required),`missing live control: ${required}`);

assert.ok(worker.includes('shiftAiLiveTodayRoutes'));
assert.ok(member.includes('Confirm this exact change'));
assert.ok(member.includes('Leave My Timber unchanged'));
assert.ok(member.includes('CONFIRMED · TODAY UPDATED'));
for(const internalCopy of ['No-Guilt gate passed','Approved, compatible retained catalogue records only','CONFIRMED · CANONICAL TODAY','Retained plan is sparse'])assert.ok(!member.includes(internalCopy),`internal copy leaked to member UI: ${internalCopy}`);
assert.ok(today.includes('applyConfirmedRebuildToDailyOutput'));
assert.ok(today.includes('dailyOutput=applyConfirmedRebuildToDailyOutput'));
assert.ok(today.includes('canonical_today:true'));
assert.ok(!live.includes("all.filter(x=>!retained.has(x.id))"));
assert.ok(!live.includes('UPDATE structured_content'));
assert.ok(!live.includes('INSERT INTO structured_content'));
assert.ok(!live.includes('shift_ai_memory'));
assert.ok(!live.includes('/v1/hq/'));
console.log('shift-ai-live-today source gate passed');
