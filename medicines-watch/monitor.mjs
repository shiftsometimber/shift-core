import { sources as catalogueSources, medicines as catalogueMedicines } from './data.mjs';

export const CHECK_INTERVAL_MS = 60 * 60 * 1000;
export const REVIEW_INTERVAL_MS = 7 * 24 * CHECK_INTERVAL_MS;
const DEADLINE_MS = 8000;
const MAX_BYTES = 1024 * 1024;
const CONCURRENCY = 3;
const CRON_GRACE_MS = 15 * 60 * 1000;

// Keep aligned with migration.sql. Only the scheduled writer may initialise it.
const SCHEMA = `CREATE TABLE IF NOT EXISTS medicines_watch_checks (
  source_id TEXT PRIMARY KEY, source_url TEXT NOT NULL, check_url TEXT NOT NULL,
  last_attempt_at TEXT, last_success_at TEXT, last_failure_at TEXT,
  attempt_status TEXT NOT NULL DEFAULT 'never', next_check_at TEXT,
  last_http_status INTEGER, last_error TEXT, last_fingerprint TEXT,
  last_withdrawn INTEGER NOT NULL DEFAULT 0 CHECK (last_withdrawn IN (0, 1))
);`;

const iso = value => new Date(value).toISOString();
const milliseconds = value => value == null ? NaN : new Date(value).getTime();
function nowValue(now) {
  const value = typeof now === 'function' ? now() : now ?? Date.now();
  const result = milliseconds(value);
  if (!Number.isFinite(result)) throw new Error('invalid_clock');
  return result;
}

function plainText(value) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
    hellip: '…', bull: '•', reg: '®', trade: '™', copy: '©', micro: 'µ' };
  return String(value ?? '').replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
      if (entity[0] !== '#') return entities[entity.toLowerCase()] ?? match;
      const number = entity[1].toLowerCase() === 'x'
        ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff)
        ? String.fromCodePoint(number) : ' ';
    }).normalize('NFKC').replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim();
}

// Read a balanced element: a nested div must not truncate the approved document.
function elementContent(html, predicate) {
  const tokens = /<\/?([a-z][\w:-]*)\b[^>]*>/gi;
  let match;
  while ((match = tokens.exec(html))) {
    if (match[0].startsWith('</') || !predicate(match[1].toLowerCase(), match[0])) continue;
    const tag = match[1].toLowerCase(), start = tokens.lastIndex;
    let depth = 1, next;
    while ((next = tokens.exec(html))) {
      if (next[1].toLowerCase() !== tag) continue;
      if (next[0].startsWith('</')) depth--;
      else if (!next[0].endsWith('/>')) depth++;
      if (!depth) return html.slice(start, next.index);
    }
    throw new Error('incomplete_html_document');
  }
  return null;
}

function htmlBody(html, selector) {
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  let selected = null;
  if (selector) {
    if (!/^(?:main|article|#[\w-]+|\.[\w-]+)$/.test(selector)) throw new Error('unsupported_content_selector');
    selected = elementContent(cleaned, (tag, token) => {
      if (!/^[#.]/.test(selector)) return tag === selector;
      const attribute = selector[0] === '#' ? 'id' : 'class';
      const value = token.match(new RegExp(`\\b${attribute}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
      return selector[0] === '#' ? value === selector.slice(1) : value?.split(/\s+/).includes(selector.slice(1));
    });
    if (selected == null) throw new Error('missing_content_selector');
  } else {
    // emc exposes the product document separately from navigation and notices.
    selected = elementContent(cleaned, (_, token) => /\bid\s*=\s*["'](?:smpc|pil|emc-document|doc-content)["']/i.test(token))
      ?? elementContent(cleaned, tag => tag === 'main')
      ?? elementContent(cleaned, tag => tag === 'article');
  }
  if (selected == null) throw new Error('missing_html_document');
  return plainText(selected.replace(/<(nav|header|footer|aside|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' '));
}

function canonicalNotice(value) {
  if (value == null || value === false) return null;
  if (typeof value === 'string') return plainText(value) || null;
  if (Array.isArray(value)) return value.map(canonicalNotice);
  if (typeof value === 'object') return Object.fromEntries(Object.keys(value).sort()
    .map(key => [key, canonicalNotice(value[key])]));
  return value;
}

/** Fingerprints retrieved source claims, not request time, navigation or cookies. */
export async function fingerprintSource(source, body, contentType = '') {
  if (typeof body !== 'string' || !body.trim()) throw new Error('empty_response');
  let normalized, claimText, withdrawn = false;
  if (source.format === 'govuk-json') {
    if (contentType && !/\bjson\b/i.test(contentType)) throw new Error('unexpected_content_type');
    let data;
    try { data = JSON.parse(body); } catch { throw new Error('invalid_json'); }
    if (!data || Array.isArray(data) || typeof data.title !== 'string' ||
        typeof data.details?.body !== 'string' || !plainText(data.details.body)) throw new Error('invalid_govuk_document');
    if (data.public_updated_at != null && !Number.isFinite(milliseconds(data.public_updated_at))) throw new Error('invalid_source_date');
    const notice = canonicalNotice(data.withdrawn_notice);
    withdrawn = Boolean(notice && (typeof notice !== 'object' || Object.keys(notice).length));
    normalized = {
      title: plainText(data.title), description: plainText(data.description),
      body: plainText(data.details.body),
      public_updated_at: data.public_updated_at ? iso(data.public_updated_at) : null,
      withdrawn_notice: notice
    };
    claimText = `${normalized.title} ${normalized.description} ${normalized.body}`;
  } else if (source.format === 'html') {
    if (contentType && !/\b(?:html|xhtml)\b/i.test(contentType)) throw new Error('unexpected_content_type');
    if (!/<(?:html|main|article|div)\b/i.test(body)) throw new Error('invalid_html');
    const text = htmlBody(body, source.contentSelector);
    if (text.length < 80) throw new Error('incomplete_html_document');
    const title = plainText(body.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1]);
    withdrawn = /\bthis (?:page|guidance|publication|medicine|product) (?:has been|is) (?:withdrawn|discontinued)\b/i.test(text)
      || /\bclass\s*=\s*["'][^"']*\b(?:withdrawn-notice|withdrawal-notice)\b/i.test(body);
    normalized = { title, body: text, withdrawn_notice: withdrawn };
    claimText = `${title} ${text}`;
  } else throw new Error('unsupported_source_format');
  if (!Array.isArray(source.requiredTerms) || !source.requiredTerms.length ||
      !source.requiredTerms.every(term => typeof term === 'string' && term.trim() && plainText(claimText).toLowerCase().includes(plainText(term).toLowerCase()))) {
    throw new Error('source_identity_not_verified');
  }
  const encoded = new TextEncoder().encode(JSON.stringify(normalized));
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  const fingerprint = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  return { fingerprint, withdrawn };
}

function validSource(source) {
  if (!source?.id || typeof source.id !== 'string') throw new Error('missing_source_id');
  for (const value of [source.url, source.checkUrl || source.url]) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('invalid_source_url');
  }
}

async function boundedBody(response, signal, maxBytes) {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error('response_too_large');
  if (!response.body) throw new Error('empty_response');
  const reader = response.body.getReader(), chunks = [];
  let length = 0;
  try {
    while (true) {
      if (signal.aborted) throw new Error('check_timeout');
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) throw new Error('response_too_large');
      chunks.push(value);
    }
  } catch (error) {
    try { await reader.cancel(); } catch { /* preserve retrieval failure */ }
    throw error;
  } finally { reader.releaseLock(); }
  const buffer = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
}

async function retrieve(source, fetchImpl, timeoutMs, maxBytes) {
  const controller = new AbortController();
  let timer, httpStatus = null;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetchImpl(source.checkUrl || source.url, {
          signal: controller.signal, redirect: 'error',
          headers: { Accept: source.format === 'govuk-json' ? 'application/json' : 'text/html',
            'User-Agent': 'ShiftMedicinesWatch/1.0 (source availability and change checks)' }
        });
        httpStatus = response.status;
        if (!response.ok || response.status === 202 || response.status === 204) throw new Error(`http_${response.status}`);
        const body = await boundedBody(response, controller.signal, maxBytes);
        const result = await fingerprintSource(source, body, response.headers.get('content-type') || '');
        return { ...result, httpStatus };
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => {
        controller.abort(); reject(new Error('check_timeout'));
      }, timeoutMs); })
    ]);
  } catch (error) {
    return { error: controller.signal.aborted ? 'check_timeout' : safeError(error), httpStatus };
  } finally { clearTimeout(timer); controller.abort(); }
}

function safeError(error) {
  // Never expose fetched bodies, credentials, stack traces or upstream messages.
  const message = String(error?.message || '');
  return /^(?:http_\d{3}|check_timeout|response_too_large|empty_response|unexpected_content_type|invalid_json|invalid_govuk_document|invalid_source_date|invalid_html|incomplete_html_document|missing_html_document|unsupported_content_selector|missing_content_selector|unsupported_source_format|source_identity_not_verified)$/.test(message)
    ? message : 'retrieval_failed';
}

function matchingRow(source, row) {
  return row && row.source_url === source.url && row.check_url === (source.checkUrl || source.url) ? row : null;
}

/** Pure projection. Source review dates belong to the approved catalogue only. */
export function projectSourceHealth(source, storedRow, now = Date.now()) {
  const time = nowValue(now), row = matchingRow(source, storedRow);
  const success = milliseconds(row?.last_success_at), attempt = milliseconds(row?.last_attempt_at);
  const reviewed = milliseconds(source.reviewedAt);
  const validBaseline = /^[a-f0-9]{64}$/i.test(source.reviewedFingerprint || '');
  const reasons = [];
  let reviewStatus = 'verification_pending';
  if (!validBaseline) reasons.push('reviewed_fingerprint_missing');
  else if (!row?.last_fingerprint) reasons.push('source_not_verified');
  else if (row.last_withdrawn) { reviewStatus = 'awaiting_review'; reasons.push('source_withdrawn'); }
  else if (row.last_fingerprint !== source.reviewedFingerprint.toLowerCase()) { reviewStatus = 'awaiting_review'; reasons.push('source_changed'); }
  else reviewStatus = 'reviewed';
  // Withdrawal is a review flag even when the source has no approved baseline.
  if (row?.last_withdrawn && !reasons.includes('source_withdrawn')) {
    reviewStatus = 'awaiting_review'; reasons.push('source_withdrawn');
  }
  if (!Number.isFinite(reviewed) || reviewed > time || time - reviewed > REVIEW_INTERVAL_MS) {
    reviewStatus = 'awaiting_review'; reasons.push('review_due');
  }
  let checkStatus = 'never_checked';
  if (row?.attempt_status === 'failed') { checkStatus = 'check_delayed'; reasons.push('last_check_failed'); }
  else if (row?.attempt_status === 'checking') {
    checkStatus = Number.isFinite(attempt) && time - attempt <= DEADLINE_MS ? 'checking' : 'check_delayed';
    if (checkStatus === 'check_delayed') reasons.push('check_incomplete');
  } else if (Number.isFinite(success)) {
    checkStatus = time >= success && time - success <= CHECK_INTERVAL_MS + CRON_GRACE_MS ? 'current' : 'check_delayed';
    if (checkStatus === 'check_delayed') reasons.push('check_overdue');
  } else reasons.push('never_checked');
  const status = reviewStatus === 'awaiting_review' ? 'awaiting_review'
    : checkStatus === 'check_delayed' ? 'check_delayed'
      : reviewStatus !== 'reviewed' || checkStatus !== 'current' ? 'verification_pending' : 'current';
  return { id: source.id, status, checkStatus, reviewStatus, reasons,
    reviewedAt: source.reviewedAt || null,
    lastAttemptAt: row?.last_attempt_at || null, lastSuccessAt: row?.last_success_at || null,
    lastFailureAt: row?.last_failure_at || null, error: row?.last_error || null,
    httpStatus: row?.last_http_status ?? null, nextCheckAt: row?.next_check_at || null };
}

function mostSevere(statuses) {
  return ['awaiting_review', 'check_delayed', 'verification_pending', 'current'].find(status => statuses.includes(status)) || 'verification_pending';
}

/** Public GET callers use this SELECT-only path; no scans, migrations or Radar. */
export async function readWatchHealth(env, options = {}) {
  const sourceList = options.sources ?? catalogueSources;
  const medicineList = options.medicines ?? catalogueMedicines;
  const now = nowValue(options.now);
  let rows = [], available = true;
  try {
    if (!env?.DB) throw new Error('missing_database');
    const result = await env.DB.prepare('SELECT * FROM medicines_watch_checks').all();
    rows = result.results || [];
  } catch { available = false; }
  const byId = new Map(rows.map(row => [row.source_id, row]));
  const sources = sourceList.map(source => projectSourceHealth(source, byId.get(source.id), now));
  const healthById = new Map(sources.map(source => [source.id, source]));
  const medicines = medicineList.map(medicine => ({ id: medicine.id,
    sourceIds: medicine.sourceIds || [],
    status: mostSevere((medicine.sourceIds || []).map(id => healthById.get(id)?.status || 'verification_pending')) }));
  const attempts = sources.map(source => source.lastAttemptAt).filter(Boolean).sort();
  const successes = sources.map(source => source.lastSuccessAt).filter(Boolean).sort();
  return { available, status: mostSevere(sources.map(source => source.status)),
    // This is the oldest successful required-source check, never the GET time.
    checkedAt: sources.length && successes.length === sources.length ? successes[0] : null,
    lastAttemptAt: attempts.at(-1) || null, sources, medicines };
}

/** Scheduled writer: at most three requests, eight seconds and 1 MB each. */
export async function checkSources(env, options = {}) {
  if (!env?.DB) throw new Error('medicines_watch_database_missing');
  const sourceList = options.sources ?? catalogueSources;
  const now = nowValue(options.now), attemptedAt = iso(now), nextCheckAt = iso(now + CHECK_INTERVAL_MS);
  const timeoutMs = Math.max(1, Math.min(DEADLINE_MS, options.timeoutMs ?? DEADLINE_MS));
  const maxBytes = Math.max(1, Math.min(MAX_BYTES, options.maxBytes ?? MAX_BYTES));
  const fetchImpl = options.fetchImpl ?? fetch;
  for (const source of sourceList) validSource(source);
  if (new Set(sourceList.map(source => source.id)).size !== sourceList.length) throw new Error('duplicate_source_id');
  await env.DB.exec(SCHEMA);
  const outcomes = new Array(sourceList.length);
  let cursor = 0;
  async function worker() {
    while (cursor < sourceList.length) {
      const index = cursor++, source = sourceList[index], checkUrl = source.checkUrl || source.url;
      // A URL change invalidates earlier observations. No previous source can
      // lend its successful timestamp or fingerprint to a replacement.
      await env.DB.prepare(`INSERT INTO medicines_watch_checks(source_id,source_url,check_url)
        VALUES (?,?,?) ON CONFLICT(source_id) DO UPDATE SET
        source_url=excluded.source_url,check_url=excluded.check_url,last_attempt_at=NULL,
        last_success_at=NULL,last_failure_at=NULL,attempt_status='never',next_check_at=NULL,
        last_http_status=NULL,last_error=NULL,last_fingerprint=NULL,last_withdrawn=0
        WHERE source_url<>excluded.source_url OR check_url<>excluded.check_url`)
        .bind(source.id, source.url, checkUrl).run();
      // Atomic hourly reservation prevents overlapping cron invocations from
      // both checking and then overwriting the same source result.
      const claim = await env.DB.prepare(`UPDATE medicines_watch_checks SET
        last_attempt_at=?,next_check_at=?,attempt_status='checking'
        WHERE source_id=? AND source_url=? AND check_url=?
        AND (next_check_at IS NULL OR next_check_at<=?)`)
        .bind(attemptedAt, nextCheckAt, source.id, source.url, checkUrl, attemptedAt).run();
      if (!claim.meta?.changes) { outcomes[index] = { id: source.id, status: 'not_due' }; continue; }
      const result = await retrieve(source, fetchImpl, timeoutMs, maxBytes);
      if (result.error) {
        await env.DB.prepare(`UPDATE medicines_watch_checks SET last_failure_at=?,
          attempt_status='failed',last_http_status=?,last_error=?
          WHERE source_id=? AND source_url=? AND check_url=? AND last_attempt_at=?`)
          .bind(attemptedAt, result.httpStatus, result.error, source.id, source.url, checkUrl, attemptedAt).run();
        outcomes[index] = { id: source.id, status: 'failed', error: result.error };
      } else {
        await env.DB.prepare(`UPDATE medicines_watch_checks SET last_success_at=?,
          attempt_status='succeeded',last_http_status=?,last_error=NULL,last_fingerprint=?,last_withdrawn=?
          WHERE source_id=? AND source_url=? AND check_url=? AND last_attempt_at=?`)
          .bind(attemptedAt, result.httpStatus, result.fingerprint, result.withdrawn ? 1 : 0,
            source.id, source.url, checkUrl, attemptedAt).run();
        outcomes[index] = { id: source.id, status: 'checked', withdrawn: result.withdrawn };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, sourceList.length) }, worker));
  return { attemptedAt, checked: outcomes.filter(item => item.status === 'checked').length,
    failed: outcomes.filter(item => item.status === 'failed').length,
    skipped: outcomes.filter(item => item.status === 'not_due').length, outcomes };
}
