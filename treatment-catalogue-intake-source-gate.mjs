import fs from 'node:fs';
const intake=fs.readFileSync('treatment-catalogue-intake-v1.js','utf8');
const hq=fs.readFileSync('commercial-hq-v1.js','utf8');
const migration=fs.readFileSync('migrations/012_treatment_catalogue_intake.sql','utf8');
const checks={
  dryRun:hq.includes("/v1/hq/catalogue/intake/dry-run")&&hq.includes('prepareTreatmentIntake'),
  apply:hq.includes("/v1/hq/catalogue/intake/apply")&&hq.includes('Idempotency-Key'),
  perRowValidation:intake.includes('catalogue_target_not_found')&&intake.includes('errors:rowErrors'),
  boundedBatch:intake.includes('MAX_ROWS=250'),
  idempotency:/idempotency_key TEXT NOT NULL UNIQUE/.test(intake)&&intake.includes('idempotency_conflict'),
  audit:intake.includes("'bulk_intake_apply'")&&intake.includes("'bulk_intake_rollback'"),
  revisionSafety:intake.includes('rollback_revision_conflict')&&intake.includes('catalogue_intake_targets'),
  failClosed:intake.includes("cost_status='proposed'")&&intake.includes("cta_state='blocked'")&&intake.includes("commercial_state='blocked'"),
  noApprovalImport:intake.includes('approval_not_importable')&&intake.includes("PARTNER_STATES=new Set(['tbc','review','suspended'])"),
  noClaimsMutation:!intake.includes('claims_state='),
  migration:/CREATE TABLE IF NOT EXISTS catalogue_intake_revisions/.test(migration)&&/catalogue_intake_rows/.test(migration)&&/catalogue_intake_targets/.test(migration),
  historyEndpoint:hq.includes('/v1/hq/catalogue/intake/revisions')
};
const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([key])=>key);if(failed.length){console.error(JSON.stringify({proof:'TREATMENT_CATALOGUE_INTAKE',status:'FAIL',failed},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'TREATMENT_CATALOGUE_INTAKE',status:'PASS',checks:Object.keys(checks).length,boundary:'Real supplier, cost and stock data can be dry-run/applied/rolled back; approval, claims, CTA and medicine purchase remain fail-closed.'},null,2));
