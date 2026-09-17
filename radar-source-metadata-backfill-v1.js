import {LEGACY_METADATA_OBSERVATIONS} from './radar-source-metadata-manifest-v1.js';
import {pendingSourceChangeMap, pendingSourceChangeSql, sourceReviewEvent, sourceReviewGenerationSql, sourceReviewGuardBindings, retainedReviewGuardSql, retainedReviewGuardBindings, sourceFingerprint} from './radar-source-review-v1.js';
const digest = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');

// This is a bounded data migration, never an editorial approval or a general
// "dismiss change" operation. Older evidence did not capture these two fields.
export function metadataAdditions(row, change) {
 const before = change.reviewed_snapshot;
 const observed = change.observation;
 if (!before || !observed || before.headline !== row.headline || row.headline !== observed.headline) return null;
 if (before.source_evidence_json !== row.source_evidence_json) return null;
 for (const field of ['content_package_json','medicine_patch_json','verification_json','reviewed_at','reviewed_by']) {
  if ((before[field]??null) !== (row[field]??null)) return null;
 }
 const prior = JSON.parse(row.source_evidence_json || '[]');
 if (prior.length !== 1 || observed.evidence?.length !== 1) return null;
 const old = prior[0], next = observed.evidence[0];
 for (const field of ['url','title','source_date','authority','source_tier']) {
  if ((old[field]??null) !== (next[field]??null)) return null;
 }
 const merged = {...old}, fields = [];
 for (const field of ['summary','source_updated_at']) {
  if ((old[field]??null) === (next[field]??null)) continue;
  if (old[field] != null || next[field] == null || next[field] === '') return null;
  if (field === 'source_updated_at' && !(Date.parse(next[field]) <= Date.parse(change.observed_at))) return null;
  merged[field] = next[field]; fields.push(field);
 }
 return fields.length ? {evidence:[merged],fields} : null;
}

export async function backfillLegacySourceMetadata(DB, manifest = LEGACY_METADATA_OBSERVATIONS) {
 let repaired = 0, skipped = 0;
 const pending = await pendingSourceChangeMap(DB);
 for (const pinned of manifest) {
  const change = pending.get(pinned.event);
  if (!change) continue;
  if (change.id !== pinned.observation) { skipped++; continue; }
  const row = await sourceReviewEvent(DB,pinned.event);
  if (!row) { skipped++; continue; }
  const addition = metadataAdditions(row,change);
  const priorFingerprint = sourceFingerprint(row.headline,JSON.parse(row.source_evidence_json));
  const observedFingerprint = sourceFingerprint(change.observation?.headline,change.observation?.evidence);
  if (!addition || change.fingerprint !== observedFingerprint ||
      await digest(priorFingerprint) !== pinned.prior || await digest(observedFingerprint) !== pinned.observed) { skipped++; continue; }
  const evidence = JSON.stringify(addition.evidence);
  const detail = JSON.stringify({observation_id:change.id,fields: addition.fields,prior_sha256:pinned.prior,observed_sha256:pinned.observed,
   reason:'Previously absent scanner metadata captured by the September 16 upgrade. Recorded source identity and dates unchanged. No article text, review decision, review date, status, knowledge approval or publication job renewed.'});
  const [updated] = await DB.batch([
   DB.prepare(`UPDATE radar_events SET source_evidence_json=? WHERE id=? AND source_evidence_json=? AND ${sourceReviewGenerationSql('radar_events.id')}=? AND ${retainedReviewGuardSql()} AND reviewed_at IS ? AND reviewed_by IS ? AND EXISTS (${pendingSourceChangeSql('radar_events.id')} AND a.id=?) AND NOT EXISTS (${pendingSourceChangeSql('radar_events.id')} AND a.id>?)`)
    .bind(evidence,row.id,...sourceReviewGuardBindings(row),...retainedReviewGuardBindings(row),row.reviewed_at??null,row.reviewed_by??null,change.id,change.id),
   DB.prepare(`INSERT INTO radar_audit(event_id,action,actor,detail_json) SELECT ?,'source_metadata_backfilled','radar_metadata_migration',? WHERE changes()>0`).bind(row.id,detail)
  ]);
  if (updated.meta?.changes) repaired++; else skipped++;
 }
 return {repaired,skipped};
}
