import fs from 'node:fs';
const module=fs.readFileSync(new URL('./treatment-operations-v1.js',import.meta.url),'utf8');
const migration=fs.readFileSync(new URL('./migrations/011_treatment_operations.sql',import.meta.url),'utf8');
const schema=migration.replace(/^--.*$/gm,'');
const worker=fs.readFileSync(new URL('./worker-entry-v6.js',import.meta.url),'utf8');
const checks={
  neutralEvents:!/\b(?:medicine|dosage|dose|bmi|condition|side_effect|assessment_answer)\b/i.test(schema),
  idempotency:/UNIQUE\(journey_id,idempotency_key\)/.test(module)&&/replayed:true/.test(module),
  optimisticLock:/expectedRevision/.test(module)&&/revision_conflict/.test(module),
  guardedUpdate:/WHERE id=\? AND revision=\? AND status=\?/.test(module),
  paymentFailure:/payment_pending:\['payment_authorised','payment_failed'/.test(module),
  clinicalDecline:/under_clinical_review:\['prescribed','not_prescribed'/.test(module),
  refund:/not_prescribed:\['refund_pending'/.test(module)&&/refund_pending:\['refunded'/.test(module),
  fulfilmentFailure:/pharmacy_unable_to_fulfil/.test(module)&&/delivery_exception/.test(module),
  terminalStates:/refunded:\[\],cancelled:\[\],expired:\[\]/.test(module),
  hqOrigin:/HQ_ORIGINS/.test(module)&&/origin_not_allowed/.test(module),
  hqSecret:/X-Shift-Admin-Key|x-shift-admin-key/.test(module),
  workerRoute:/treatmentOperationsRoutes/.test(worker),
  migrationTables:/CREATE TABLE IF NOT EXISTS treatment_journeys/.test(migration)&&/treatment_journey_events/.test(migration)
};
const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
if(failed.length){console.error(JSON.stringify({proof:'TREATMENT_OPERATIONS_SOURCE',status:'FAIL',failed},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'TREATMENT_OPERATIONS_SOURCE',status:'PASS',checks:Object.keys(checks).length,boundary:'Neutral operational state only; no clinical payload or medicine sale activation.'},null,2));
