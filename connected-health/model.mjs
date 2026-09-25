// Optional wellness observations. Never evidence of clinical verification.
export const CONSENT_VERSION = 'connected-health/2026-09-24-v1';
export const METRICS = Object.freeze(['weight', 'height', 'steps', 'sleep']);
export const PROVIDERS = Object.freeze(['apple_health', 'health_connect']);
export const MAX_BATCH = 32;
export const HISTORY_MS = 30 * 86400000;
export const fail = (code, status = 400) => Object.assign(new Error(code), {code, status});
export const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
export function only(v, keys) {
  if (!object(v) || Object.keys(v).some(k => !keys.includes(k))) throw fail('unsupported_fields');
}
export function identifier(v) {
  if (typeof v !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_.:/+-]{0,179}$/.test(v)) throw fail('invalid_identifier');
  return v;
}
export function integer(v, min = 0) {
  if (!Number.isSafeInteger(v) || v < min) throw fail('invalid_integer');
  return v;
}
export function provider(v) {
  if (!PROVIDERS.includes(v)) throw fail('invalid_provider');
  return v;
}
export function scopes(v) {
  if (!Array.isArray(v) || !v.length || v.length > 4 || new Set(v).size !== v.length || v.some(x => !METRICS.includes(x))) throw fail('invalid_scopes');
  return METRICS.filter(x => v.includes(x));
}
export function timestamp(v, now = Date.now()) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(v)) throw fail('invalid_timestamp');
  const n = Date.parse(v);
  if (!Number.isFinite(n) || n > now + 60000 || n < now - HISTORY_MS - 86400000 || new Date(n).toISOString().slice(0,10) !== v.slice(0,10)) throw fail('invalid_timestamp');
  return new Date(n).toISOString();
}
export function normaliseObservation(v, allowed, sourceProvider, now = Date.now()) {
  only(v, ['metric','externalId','value','unit','startAt','endAt','sources','basis','timeZone']);
  if (!allowed.includes(v.metric)) throw fail('scope_not_consented', 403);
  const units = {weight:'kg',height:'cm',steps:'count',sleep:'seconds'};
  const limits = {weight:[0.01,650],height:[1,300],steps:[0,200000],sleep:[0,90000]};
  if (typeof v.value !== 'number' || !Number.isFinite(v.value) || v.value < limits[v.metric][0] || v.value > limits[v.metric][1] || v.unit !== units[v.metric]) throw fail('invalid_measurement');
  if (v.metric === 'steps' && !Number.isSafeInteger(v.value)) throw fail('invalid_measurement');
  const startAt = timestamp(v.startAt, now), endAt = timestamp(v.endAt, now);
  if (endAt < startAt) throw fail('invalid_interval');
  if (!Array.isArray(v.sources) || !v.sources.length || v.sources.length > 16) throw fail('invalid_sources');
  const sources = [...new Set(v.sources.map(identifier))].sort();
  if (['weight','height'].includes(v.metric)) {
    if (v.basis !== 'sample' || startAt !== endAt || v.timeZone != null) throw fail('invalid_basis');
  } else {
    const duration = Date.parse(endAt) - Date.parse(startAt);
    if (duration <= 0 || duration > 26 * 3600000) throw fail('invalid_interval');
    if (typeof v.timeZone !== 'string' || v.timeZone.length > 80) throw fail('invalid_timezone');
    try { new Intl.DateTimeFormat('en-GB', {timeZone:v.timeZone}).format(0); } catch { throw fail('invalid_timezone'); }
    const basis = v.metric === 'steps' ? 'platform_aggregate' : sourceProvider === 'apple_health' ? 'asleep_union' : 'session_duration';
    if (v.basis !== basis || (v.metric === 'sleep' && v.value * 1000 > duration + 1000)) throw fail('invalid_basis');
    const date = new Intl.DateTimeFormat('en-CA', {timeZone:v.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(startAt));
    if (v.externalId !== `${v.metric}:${date}:${v.timeZone}`) throw fail('invalid_daily_key');
  }
  return {metric:v.metric,externalId:identifier(v.externalId),value:v.value,unit:v.unit,startAt,endAt,sources,basis:v.basis,timeZone:v.timeZone ?? null};
}
export function normaliseBatch(body, connection, now = Date.now()) {
  only(body, ['expectedAccountId','provider','connectionId','revision','syncRevision','batchId','records','deleted']);
  identifier(body.batchId); integer(body.revision,1); integer(body.syncRevision);
  if (!Array.isArray(body.records) || !Array.isArray(body.deleted) || !body.records.length && !body.deleted.length || body.records.length + body.deleted.length > MAX_BATCH) throw fail('invalid_batch_size');
  const allowed = scopes(JSON.parse(connection.scopes_json));
  const records = body.records.map(r => normaliseObservation(r,allowed,connection.provider,now));
  const deleted = body.deleted.map(r => {
    only(r,['metric','externalId']);
    if (!allowed.includes(r.metric)) throw fail('scope_not_consented',403);
    return {metric:r.metric,externalId:identifier(r.externalId)};
  });
  const all = [...records,...deleted].map(r=>`${r.metric}\u0000${r.externalId}`);
  if (new Set(all).size !== all.length) throw fail('duplicate_batch_key');
  const order = (a,b)=>a.metric.localeCompare(b.metric)||a.externalId.localeCompare(b.externalId);
  return {records:records.sort(order),deleted:deleted.sort(order)};
}
export async function digest(v) {
  const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function publicObservation(row, now = Date.now()) {
  return {provider:row.provider,metric:row.metric,externalId:row.external_id,value:row.value,unit:row.unit,startAt:row.start_at,endAt:row.end_at,sources:JSON.parse(row.sources_json),basis:row.basis,timeZone:row.time_zone,importedAt:row.imported_at,confirmedAt:row.confirmed_at ?? null,stale:now-Date.parse(row.end_at)>7*86400000,clinicallyVerified:false};
}
export function summarise(rows, now = Date.now()) {
  // Separate providers and sleep definitions; never add phone/watch or platform totals.
  const result = {};
  for (const p of PROVIDERS) {
    const own = rows.filter(r=>r.provider===p).sort((a,b)=>b.end_at.localeCompare(a.end_at)||a.external_id.localeCompare(b.external_id));
    result[p] = Object.fromEntries(METRICS.map(m=>[m, own.some(r=>r.metric===m) ? publicObservation(own.find(r=>r.metric===m),now) : null]));
  }
  return result;
}
