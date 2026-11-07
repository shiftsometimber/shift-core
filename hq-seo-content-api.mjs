export const SEO_CONTENT_PATH = '/v1/hq/management/seo-content';

const kinds = new Set(['opportunity', 'inventory', 'release']);
const openStatuses = new Set(['draft', 'recommended', 'blocked', 'unverified']);
const workflowStatuses = new Set(['previewed', 'approved', 'deployed', 'live']);
const transitions = {preview:'previewed', approve:'approved', record_deployment:'deployed', verify:'live'};
const proposalKeys = new Set(['before','after','placement','destination','desktopImage','mobileImage','ctaLabel','previewTitle','previewLink','checks','baselineLabel','rollback']);
const workflowKeys = ['preview', 'approval', 'deployment', 'verification'];
const editableKeys = new Set(['title','url','area','status','priority','next','proposal','notes','evidence','checks','qa']);
const reviewChecks = ['draft', 'review', 'preview', 'mobile', 'desktop'];
const releaseChecks = [...reviewChecks, 'canonical', 'sitemap', 'indexability', 'duplicates', 'claims', 'rollback'];
const checksAllowingNA = new Set(['canonical', 'sitemap', 'indexability', 'duplicates']);
const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;
const maxImportRecords = 15;
const maxBodyBytes = 1024 * 1024;
const maxRecordBytes = 384 * 1024;
const encoder = new TextEncoder();
const summaryColumns = 'id, kind, title, url, area, status, revision, priority, next_action AS "next"';
const insertRecord = `
  INSERT INTO hq_seo_content_records
    (id,kind,title,url,area,status,revision,priority,next_action,has_proposal,record_json,import_hash)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING
`;
const updateRecord = `
  UPDATE hq_seo_content_records
  SET kind=?,title=?,url=?,area=?,status=?,revision=?,priority=?,next_action=?,has_proposal=?,record_json=?
  WHERE id=? AND revision=?
`;
const auditWrite = `
  INSERT INTO hq_audit (hq_user_id,action,entity_type,entity_id,metadata,created_at)
  SELECT ?,?,'hq_seo_content',?,?,? WHERE changes() = 1
`;
const historyWrite = `
  INSERT INTO hq_seo_content_history (record_id, revision, event_json)
  SELECT ?,?,? WHERE changes() = 1
`;

class RequestError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function invalid(message) {
  throw new RequestError(400, 'invalid_request', message);
}

function conflict(message) {
  throw new RequestError(409, 'workflow_conflict', message);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},
  });
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value, name, max, required = false) {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    invalid(`Enter a valid ${name} (up to ${max} characters).`);
  }
  return value;
}

function urlValue(value, name, {required = false, relative = false, image = false} = {}) {
  const raw = stringValue(value, name, image ? 250000 : 2000, required).trim();
  if (!raw) return '';
  if (image && /^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/]+=*$/.test(raw)) return raw;
  if (relative && /^\/(?![/\\])/.test(raw) && !/[\\\s]/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return raw;
  } catch {}
  invalid(`Enter a valid ${name} URL.`);
}

function validPriority(value) {
  if (value == null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    invalid('Priority must be a number from 0 to 100.');
  }
  return value;
}

function normaliseProposal(input, {preserve = false} = {}) {
  if (input == null) return {};
  if (!isObject(input)) invalid('Proposal must be an object.');
  const proposal = preserve ? {...input} : {};
  for (const [key, value] of Object.entries(input)) {
    if (!proposalKeys.has(key)) {
      if (!preserve) invalid(`Unsupported proposal field: ${key}.`);
      continue;
    }
    if (key === 'desktopImage' || key === 'mobileImage') {
      proposal[key] = urlValue(value, key, {image:true, relative:preserve});
    } else if (key === 'destination' || key === 'previewLink') {
      proposal[key] = urlValue(value, key, {relative:true});
    } else {
      proposal[key] = stringValue(value, key, 20000);
    }
  }
  return proposal;
}

function normaliseEvidence(input) {
  if (input == null) return [];
  if (!Array.isArray(input) || input.length > 30) invalid('Provide up to 30 evidence entries.');
  return input.map((item) => {
    if (!isObject(item)) invalid('Evidence entries must be objects.');
    const label = stringValue(item.label, 'evidence label', 250);
    const note = stringValue(item.note, 'evidence note', 4000);
    const url = urlValue(item.url, 'evidence');
    const date = stringValue(item.date, 'evidence date', 40);
    if (date && !Number.isFinite(Date.parse(date))) invalid('Enter a valid evidence date.');
    if (!label && !note && !url) invalid('Evidence needs a label, URL or note.');
    return {label, note, url, date};
  });
}

function normaliseChecks(input, qa) {
  if (!isObject(input)) invalid('Provide a release checklist object.');
  const checks = {};
  for (const [key, value] of Object.entries(input)) {
    if (!releaseChecks.includes(key)) invalid(`Unknown release check: ${key}.`);
    if (value === '' || value == null) continue;
    if (value !== 'pass' && !(value === 'na' && checksAllowingNA.has(key) && qa.trim())) {
      invalid('Mark a check as passed or add a QA note where not applicable is allowed.');
    }
    checks[key] = value;
  }
  return checks;
}

function checksComplete(record, keys) {
  return keys.every(key => record.checks?.[key] === 'pass' || (
    record.checks?.[key] === 'na' && checksAllowingNA.has(key) && record.qa?.trim()
  ));
}

function statusIsKnown(status) {
  return openStatuses.has(status) || workflowStatuses.has(status);
}

function normaliseRecord(input, importing) {
  if (!isObject(input) || !kinds.has(input.kind)) invalid('Choose an opportunity, inventory item or release.');
  const status = input.status ?? (input.kind === 'inventory' ? 'unverified' : 'draft');
  if (!(importing ? statusIsKnown(status) : openStatuses.has(status))) invalid('Choose a valid starting status.');
  if (importing && (!idPattern.test(input.id ?? '') || typeof input.id !== 'string')) invalid('Imported records need a stable ID.');
  if (importing && input.history != null && !Array.isArray(input.history)) invalid('Imported history must be an array.');
  const revision = importing ? (input.revision ?? 1) : 1;
  if (!Number.isSafeInteger(revision) || revision < 1 || revision >= Number.MAX_SAFE_INTEGER) {
    invalid('Enter a valid record revision.');
  }
  const record = {
    ...(importing ? input : {}),
    id: importing ? input.id : crypto.randomUUID(),
    kind: input.kind,
    title: stringValue(input.title, 'title', 300, true).trim(),
    url: urlValue(input.url, 'page'),
    area: stringValue(input.area, 'area', 180),
    status,
    revision,
    priority: validPriority(input.priority),
    next: stringValue(input.next, 'next action', 4000),
    proposal: normaliseProposal(input.proposal, {preserve:importing}),
    history: importing ? (input.history ?? []) : [],
  };
  if (!importing) {
    record.notes = stringValue(input.notes, 'notes', 20000);
    record.evidence = normaliseEvidence(input.evidence);
    record.qa = stringValue(input.qa, 'QA notes', 4000);
    record.checks = input.checks == null ? {} : normaliseChecks(input.checks, record.qa);
  } else {
    delete record.nativeWorkflow;
  }
  return record;
}

function exactSnapshot(record) {
  const {rollback, ...proposal} = record.proposal ?? {};
  return {title:record.title, area:record.area, url:record.url, proposal};
}

function sortedJson(value) {
  if (Array.isArray(value)) return '[' + value.map(sortedJson).join(',') + ']';
  if (!isObject(value)) return JSON.stringify(value);
  return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + sortedJson(value[key])).join(',') + '}';
}

async function digest(value) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(sortedJson(value))));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function recordJson(record) {
  const value = JSON.stringify(record);
  if (encoder.encode(value).byteLength > maxRecordBytes) {
    throw new RequestError(413, 'record_too_large', 'A record must be no larger than 384 KB.');
  }
  return value;
}

function recordColumns(record) {
  return [
    record.kind, record.title, record.url, record.area, record.status, record.revision,
    record.priority, record.next, Number(Boolean(record.proposal?.after?.trim())), recordJson(record),
  ];
}

function actorEvent(record, actor, action, at, metadata = {}) {
  return {action, at, actorId:actor.id, actorRole:actor.role, revision:record.revision, ...metadata};
}

function archiveWorkflow(record) {
  const previous = {};
  for (const key of workflowKeys) {
    if (record[key] != null) previous[key] = record[key];
    delete record[key];
  }
  delete record.nativeWorkflow;
  return previous;
}

function applyChanges(record, input, actor, now) {
  if (!isObject(input) || !Object.keys(input).length) invalid('Provide at least one edit.');
  for (const key of Object.keys(input)) if (!editableKeys.has(key)) invalid(`Unsupported change field: ${key}.`);
  const updated = {...record};
  if ('title' in input) updated.title = stringValue(input.title, 'title', 300, true).trim();
  if ('url' in input) updated.url = urlValue(input.url, 'page');
  if ('area' in input) updated.area = stringValue(input.area, 'area', 180);
  if ('priority' in input) updated.priority = validPriority(input.priority);
  if ('next' in input) updated.next = stringValue(input.next, 'next action', 4000);
  if ('notes' in input) updated.notes = stringValue(input.notes, 'notes', 20000);
  if ('evidence' in input) updated.evidence = normaliseEvidence(input.evidence);
  if ('qa' in input) updated.qa = stringValue(input.qa, 'QA notes', 4000);
  if ('checks' in input || 'qa' in input) {
    updated.checks = normaliseChecks(input.checks ?? updated.checks ?? {}, updated.qa ?? '');
  }
  if ('proposal' in input) {
    if (!isObject(input.proposal)) invalid('Provide a proposal object.');
    updated.proposal = {...record.proposal, ...normaliseProposal(input.proposal)};
  }
  if ('status' in input) {
    if (input.status !== record.status && !openStatuses.has(input.status)) {
      invalid('Use the review actions to change workflow status.');
    }
    updated.status = input.status;
  }
  const exactChanged = sortedJson(exactSnapshot(record)) !== sortedJson(exactSnapshot(updated));
  if (updated.kind === 'release' && exactChanged) {
    updated.checks = {};
    updated.qa = '';
  } else if (!('checks' in input) && updated.proposal?.rollback !== record.proposal?.rollback) {
    updated.checks = {...updated.checks};
    delete updated.checks.rollback;
  }
  if (updated.kind === 'release' && !exactChanged && ('checks' in input || 'qa' in input || updated.checks !== record.checks)) {
    const stage = record.nativeWorkflow?.stage;
    if (['approved', 'deployed', 'live'].includes(stage) && !checksComplete(updated, reviewChecks)) {
      conflict('Start a new exact revision before reopening reviewed checks.');
    }
    if (['deployed', 'live'].includes(stage) && !checksComplete(updated, releaseChecks)) {
      conflict('Record an evidence issue or start a new revision before reopening release checks.');
    }
  }
  const reset = workflowStatuses.has(record.status) && (exactChanged || updated.status !== record.status);
  let previousWorkflow;
  if (reset) {
    previousWorkflow = archiveWorkflow(updated);
    if (!openStatuses.has(updated.status)) updated.status = 'recommended';
  }
  updated.revision += 1;
  const event = actorEvent(updated, actor, 'edited', now, {
    fields:Object.keys(input), previousStatus:record.status, status:updated.status,
    ...(exactChanged ? {previousProposal:exactSnapshot(record), previousChecks:record.checks, previousQa:record.qa} : {}),
    ...(reset ? {previousWorkflow} : {}),
  });
  return {updated, event};
}

function eventDate(value, fallback) {
  if (value == null || value === '') return fallback;
  if (typeof value !== 'string' || value.length > 40 || !Number.isFinite(Date.parse(value))) {
    invalid('Enter a valid evidence date or timestamp.');
  }
  return new Date(value).toISOString();
}

function publicVerificationUrl(value, expectedPage, release) {
  const url = new URL(urlValue(value, 'live verification', {required:true}));
  const expected = new URL(expectedPage);
  const publicHosts = new Set(['shiftsometimber.co.uk', 'www.shiftsometimber.co.uk']);
  const sameHost = url.hostname === expected.hostname || [url, expected].every(page => publicHosts.has(page.hostname));
  const path = page => page.pathname.replace(/\/+$/, '') || '/';
  if (url.protocol !== 'https:' || url.port || !sameHost || path(url) !== path(expected) || (release && !publicHosts.has(url.hostname))) {
    invalid('Verify the exact public page for this record.');
  }
  return url.href;
}

async function applyAction(record, action, input, actor, now) {
  if (!Object.hasOwn(transitions, action) || !isObject(input)) invalid('Choose a valid review action.');
  if (record.kind === 'inventory') conflict('Create an opportunity before putting a sitemap item through review.');
  if (record.status === 'blocked') conflict('Resolve the external blocker before recording review progress.');
  if (action === 'approve' && actor.role !== 'owner') {
    throw new RequestError(403, 'owner_approval_required', 'Only a signed-in HQ owner can approve exact changes.');
  }
  const updated = {...record, status:transitions[action], revision:record.revision + 1};
  const fingerprint = await digest(exactSnapshot(record));
  const nativeStage = record.nativeWorkflow?.fingerprint === fingerprint ? record.nativeWorkflow.stage : null;
  const receipt = {actorId:actor.id, at:now, fingerprint, revision:record.revision};
  let previousWorkflow;
  switch (action) {
    case 'preview': {
      if (nativeStage && nativeStage !== 'previewed') {
        conflict('Edit the proposal to start a new review.');
      }
      if (!record.proposal?.after?.trim() || !record.proposal?.placement?.trim() || !record.url) {
        invalid('Add the exact proposed change, page URL and placement before recording a preview.');
      }
      const previewUrl = urlValue(input.url, 'preview', {relative:true});
      if (record.kind === 'release') {
        const {previewLink, desktopImage, mobileImage} = record.proposal;
        if (!previewUrl && !previewLink && !(desktopImage && mobileImage)) {
          invalid('Add desktop and mobile mockups or a preview evidence URL.');
        }
        if (!checksComplete(record, ['draft', 'preview'])) conflict('Complete the draft and preview checks first.');
      }
      if (workflowStatuses.has(record.status) && record.status !== 'previewed') {
        previousWorkflow = archiveWorkflow(updated);
      }
      updated.preview = {
        ...receipt, url:previewUrl, note:stringValue(input.note, 'preview note', 4000),
      };
      break;
    }
    case 'approve': {
      if (record.status !== 'previewed' || nativeStage !== 'previewed') {
        conflict('Record a preview of this exact proposal before approving it.');
      }
      if (record.kind === 'release' && !checksComplete(record, reviewChecks)) {
        conflict('Complete the draft, review, preview, mobile and desktop checks before approval.');
      }
      updated.approval = {...receipt, reference:stringValue(input.reference, 'approval reference', 1000, true).trim()};
      break;
    }
    case 'record_deployment': {
      if (record.status !== 'approved' || nativeStage !== 'approved') {
        conflict('The exact proposal needs a current owner approval before deployment can be recorded.');
      }
      if (record.kind === 'release' && (!checksComplete(record, releaseChecks) || !record.proposal.rollback?.trim())) {
        conflict('Complete the release checklist and rollback plan before recording deployment.');
      }
      updated.deployment = {
        ...receipt, url:urlValue(input.url, 'deployment', {required:true}),
        reference:stringValue(input.reference, 'deployment reference', 1000, true).trim(),
        at:eventDate(input.at, now),
      };
      break;
    }
    case 'verify': {
      if (record.status !== 'deployed' || nativeStage !== 'deployed') {
        conflict('Record deployment evidence for this exact proposal before confirming it live.');
      }
      const at = eventDate(input.at, now);
      if (Date.parse(at) < Date.parse(record.deployment.at)) invalid('Verification must be dated on or after deployment.');
      updated.verification = {
        ...receipt, at, url:publicVerificationUrl(input.url, record.url, record.kind === 'release'),
        note:stringValue(input.note, 'verification evidence', 4000, true).trim(),
      };
      break;
    }
  }
  updated.nativeWorkflow = {fingerprint, stage:updated.status};
  const receiptKey = {preview:'preview', approve:'approval', record_deployment:'deployment', verify:'verification'}[action];
  const event = actorEvent(updated, actor, action, now, {
    status:updated.status, receipt:updated[receiptKey], ...(previousWorkflow ? {previousWorkflow} : {}),
  });
  return {updated, event};
}

async function readJson(request) {
  const contentType = request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new RequestError(415, 'unsupported_media_type', 'Send application/json.');
  if (Number(request.headers.get('Content-Length')) > maxBodyBytes) {
    throw new RequestError(413, 'payload_too_large', 'A request must be no larger than 1 MB.');
  }
  const reader = request.body?.getReader();
  if (!reader) invalid('Send a JSON request body.');
  const decoder = new TextDecoder('utf-8', {fatal:true});
  let raw = '';
  let bytes = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBodyBytes) {
        await reader.cancel().catch(() => {});
        throw new RequestError(413, 'payload_too_large', 'A request must be no larger than 1 MB.');
      }
      raw += decoder.decode(value, {stream:true});
    }
    const result = JSON.parse(raw + decoder.decode());
    if (!isObject(result)) invalid('Send a JSON object.');
    return result;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    invalid('Send valid UTF-8 JSON.');
  } finally {
    reader.releaseLock();
  }
}

function pageNumber(value, fallback, min, max) {
  if (value == null || value === '') return fallback;
  if (!/^\d+$/.test(value)) invalid('Use a valid page limit or offset.');
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) invalid('Use a valid page limit or offset.');
  return number;
}

async function listRecords(db, params) {
  const conditions = [];
  const bindings = [];
  const kind = params.get('kind');
  const status = params.get('status');
  const view = params.get('view');
  const query = stringValue(params.get('q'), 'search query', 250).trim();
  if (kind) {
    if (!kinds.has(kind)) invalid('Unknown record kind.');
    conditions.push('kind = ?');
    bindings.push(kind);
  }
  if (status) {
    if (!statusIsKnown(status)) invalid('Unknown record status.');
    conditions.push('status = ?');
    bindings.push(status);
  }
  if (view === 'review') {
    conditions.push("(kind != 'inventory' AND (has_proposal = 1 OR status IN ('previewed','approved','deployed','live')))");
  } else if (view === 'release') {
    conditions.push("(kind = 'release' OR (kind = 'opportunity' AND status IN ('approved','deployed','live')))");
  } else if (view) invalid('Unknown board view.');
  if (query) {
    conditions.push("instr(lower(title || ' ' || url || ' ' || area || ' ' || next_action), lower(?)) > 0");
    bindings.push(query);
  }
  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  const limit = pageNumber(params.get('limit'), 30, 1, 100);
  const offset = pageNumber(params.get('offset'), 0, 0, 1000000);
  const [total, list] = await db.batch([
    db.prepare('SELECT COUNT(*) AS total FROM hq_seo_content_records' + where).bind(...bindings),
    db.prepare(`SELECT ${summaryColumns} FROM hq_seo_content_records${where} ORDER BY priority DESC, title COLLATE NOCASE, id LIMIT ? OFFSET ?`).bind(...bindings, limit, offset),
  ]);
  return {records:list.results, total:total.results[0].total};
}

function auditStatement(db, actor, action, record, now) {
  return db.prepare(auditWrite).bind(actor.id, `hq.seo_content_${action}`, record.id, JSON.stringify({
    kind:record.kind, status:record.status, revision:record.revision,
  }), now);
}

function historyStatement(db, record, event) {
  return db.prepare(historyWrite).bind(record.id, record.revision, JSON.stringify(event));
}

function responseRecord(record, nativeHistory) {
  return {...record, history:[...record.history, ...nativeHistory]};
}

async function readRecord(db, id) {
  const [current, history] = await db.batch([
    db.prepare('SELECT record_json FROM hq_seo_content_records WHERE id=?').bind(id),
    db.prepare('SELECT event_json FROM hq_seo_content_history WHERE record_id=? ORDER BY revision').bind(id),
  ]);
  const row = current.results[0];
  if (!row) throw new RequestError(404, 'record_not_found', 'Record not found.');
  return {record:JSON.parse(row.record_json), nativeHistory:history.results.map(({event_json}) => JSON.parse(event_json))};
}

function insertStatement(db, record, importHash = null) {
  return db.prepare(insertRecord).bind(record.id, ...recordColumns(record), importHash);
}

async function importRecords(db, input, actor, now) {
  if (!Array.isArray(input.records) || input.records.length < 1 || input.records.length > maxImportRecords) {
    invalid(`Send between 1 and ${maxImportRecords} records per import.`);
  }
  const records = input.records.map((record) => normaliseRecord(record, true));
  if (new Set(records.map((record) => record.id)).size !== records.length) invalid('Import IDs must be unique within each batch.');
  const entries = await Promise.all(records.map(async (record) => ({record, hash:await digest(record)})));
  const statements = entries.flatMap(({record, hash}) => [
    insertStatement(db, record, hash),
    auditStatement(db, actor, 'imported', record, now),
    db.prepare('SELECT import_hash FROM hq_seo_content_records WHERE id=?').bind(record.id),
  ]);
  const results = await db.batch(statements);
  let inserted = 0;
  let unchanged = 0;
  const conflictIds = [];
  entries.forEach(({record, hash}, index) => {
    const first = index * 3;
    if (results[first].meta.changes === 1) inserted += 1;
    else if (results[first + 2].results[0]?.import_hash === hash) unchanged += 1;
    else conflictIds.push(record.id);
  });
  return {inserted, unchanged, conflicts:conflictIds.length, conflictIds};
}

function originAllowed(request, env, url) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  const configured = (env.ALLOWED_ORIGINS || 'https://hq.shiftsometimber.co.uk').split(',').map(value => value.trim());
  return origin === url.origin || configured.includes(origin);
}

function withCors(response, request) {
  const origin = request.headers.get('Origin');
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.append('Vary', 'Origin');
  }
  return new Response(response.body, {status:response.status, headers});
}

function authorised(permissions, value) {
  return permissions.includes('*') || permissions.includes(value);
}

export async function seoContentRoute(request, env, ctx, authenticate) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  if (path !== SEO_CONTENT_PATH && !path.startsWith(SEO_CONTENT_PATH + '/')) return null;
  if (!originAllowed(request, env, url) || request.headers.get('Sec-Fetch-Site') === 'cross-site' && !request.headers.has('Origin')) {
    return json({error:'origin_not_allowed'}, 403);
  }
  if (request.method === 'OPTIONS') {
    return withCors(new Response(null, {status:204, headers:{
      'Access-Control-Allow-Methods':'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':'Authorization, Content-Type',
      'Cache-Control':'no-store',
    }}), request);
  }
  try {
    const auth = await authenticate(new Request(new URL('/v1/hq/me', url), {headers:request.headers}), env, ctx);
    if (!auth.ok) return withCors(auth, request);
    const identity = await auth.json();
    const actor = identity.user;
    const hqPermissions = Array.isArray(identity.permissions) ? identity.permissions : [];
    if (!actor?.id || actor.role !== 'owner' || !authorised(hqPermissions, 'content_read')) {
      throw new RequestError(403, 'hq_forbidden', 'SEO & Content is restricted to HQ owners.');
    }
    const edit = authorised(hqPermissions, 'content_write');
    const permissions = {edit, approve:edit, import:edit};
    const db = env.DB;
    const method = request.method;
    let response;
    if (path === SEO_CONTENT_PATH && method === 'GET') {
      response = json({...await listRecords(db, url.searchParams), permissions});
    } else if (path === SEO_CONTENT_PATH && method === 'POST') {
      if (!edit) throw new RequestError(403, 'hq_forbidden', 'This HQ role cannot edit SEO & Content.');
      const input = await readJson(request);
      const now = new Date().toISOString();
      const record = normaliseRecord(input, false);
      const event = actorEvent(record, actor, 'created', now, {status:record.status});
      const [created] = await db.batch([
        insertStatement(db, record),
        historyStatement(db, record, event),
        auditStatement(db, actor, 'created', record, now),
      ]);
      if (created.meta.changes !== 1) conflict('The record ID already exists. Try creating it again.');
      response = json({record:responseRecord(record, [event]), permissions}, 201);
    } else if (path === SEO_CONTENT_PATH + '/import') {
      if (method !== 'POST') throw new RequestError(405, 'method_not_allowed', 'Use POST for imports.');
      if (!permissions.import) throw new RequestError(403, 'hq_forbidden', 'This account cannot import records.');
      response = json(await importRecords(db, await readJson(request), actor, new Date().toISOString()));
    } else if (path === SEO_CONTENT_PATH) {
      throw new RequestError(405, 'method_not_allowed', 'Use GET or POST for this endpoint.');
    } else {
      const id = path.slice(SEO_CONTENT_PATH.length + 1);
      if (!idPattern.test(id)) throw new RequestError(404, 'record_not_found', 'Record not found.');
      if (method !== 'GET' && method !== 'PATCH') throw new RequestError(405, 'method_not_allowed', 'Use GET or PATCH for a record.');
      if (method === 'PATCH' && !edit) throw new RequestError(403, 'hq_forbidden', 'This HQ role cannot edit SEO & Content.');
      const {record, nativeHistory} = await readRecord(db, id);
      if (method === 'GET') {
        response = json({record:responseRecord(record, nativeHistory), permissions});
      } else {
        const input = await readJson(request);
        if (!Number.isSafeInteger(input.revision) || input.revision < 1) invalid('Use the current record revision.');
        if (input.revision !== record.revision) {
          throw new RequestError(409, 'revision_conflict', 'The record changed. Reload the latest revision before saving.');
        }
        if (record.revision >= Number.MAX_SAFE_INTEGER - 1) conflict('The record has reached its revision limit.');
        if (Boolean(input.action) === Boolean(input.changes)) invalid('Send either an edit or a review action.');
        const now = new Date().toISOString();
        const {updated, event} = input.action
          ? await applyAction(record, input.action, input.data ?? {}, actor, now)
          : applyChanges(record, input.changes, actor, now);
        const [saved] = await db.batch([
          db.prepare(updateRecord).bind(...recordColumns(updated), id, record.revision),
          historyStatement(db, updated, event),
          auditStatement(db, actor, input.action || 'edited', updated, now),
        ]);
        if (saved.meta.changes !== 1) {
          throw new RequestError(409, 'revision_conflict', 'The record changed. Reload the latest revision before saving.');
        }
        response = json({record:responseRecord(updated, [...nativeHistory, event]), permissions});
      }
    }
    return withCors(response, request);
  } catch (error) {
    const response = error instanceof RequestError
      ? json({error:error.code, message:error.message}, error.status)
      : json({error:'seo_content_unavailable', message:'SEO & Content storage is unavailable.'}, 503);
    return withCors(response, request);
  }
}
