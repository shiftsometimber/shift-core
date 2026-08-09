const APP_NAME = 'Shift Core';
const API_VERSION = '3.2D-pbkdf2-hotfix';
const DEFAULT_ALLOWED_ORIGINS = [
  'https://shiftsometimber.co.uk',
  'https://www.shiftsometimber.co.uk',
  'https://shiftsometimber.com',
  'https://www.shiftsometimber.com'
];

let schemaReady = false;

export default {
  async fetch(request, env, ctx) {
    const requestId = crypto.randomUUID();
    try {
      await ensureSchema(env.DB);
      const url = new URL(request.url);
      const cors = corsHeaders(request, env);

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: cors });
      }

      const response = await routeRequest(request, env, url, requestId);
      const headers = new Headers(response.headers);
      for (const [k, v] of Object.entries(cors)) headers.set(k, v);
      headers.set('X-Shift-Request-Id', requestId);
      headers.set('Cache-Control', 'no-store');
      headers.set('X-Content-Type-Options', 'nosniff');
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch (error) {
      console.error('shift_core_unhandled', { requestId, message: error?.message, stack: error?.stack });
      return json({ ok: false, error: 'internal_error', requestId }, 500, corsHeaders(request, env));
    }
  }
};

async function routeRequest(request, env, url, requestId) {
  const path = normalizePath(url.pathname);
  const method = request.method.toUpperCase();

  if (method === 'GET' && (path === '/health' || path === '/v1/health')) {
    const row = await env.DB.prepare('SELECT COUNT(*) AS count FROM users').first();
    return json({ ok: true, service: APP_NAME, version: API_VERSION, database: 'connected', users: Number(row?.count || 0) });
  }

  if (method === 'POST' && path === '/v1/auth/register') return register(request, env);
  if (method === 'POST' && path === '/v1/auth/login') return login(request, env);
  if (method === 'POST' && path === '/v1/auth/logout') return logout(request, env);
  if (method === 'POST' && path === '/v1/auth/request-password-reset') return requestPasswordReset(request, env);

  if (method === 'GET' && path === '/v1/me') return getMe(request, env);
  if (method === 'GET' && path === '/v1/profile') return getProfile(request, env);
  if (method === 'PATCH' && path === '/v1/profile') return patchProfile(request, env);

  if (method === 'GET' && path === '/v1/member-state') return getMemberState(request, env);
  if (method === 'PATCH' && path === '/v1/member-state') return patchMemberState(request, env);

  if (method === 'GET' && path === '/v1/progress') return getProgress(request, env);
  if (method === 'POST' && path === '/v1/progress') return saveProgress(request, env);

  if (method === 'GET' && path === '/v1/health-mot') return getHealthMot(request, env);
  if (method === 'POST' && path === '/v1/health-mot') return saveHealthMot(request, env);

  if (method === 'GET' && path === '/v1/check-ins') return getCheckIns(request, env);
  if (method === 'POST' && path === '/v1/check-ins') return saveCheckIn(request, env);

  if (method === 'GET' && path === '/v1/consents') return getConsents(request, env);
  if (method === 'POST' && path === '/v1/consents') return saveConsent(request, env);

  if (method === 'GET' && path === '/v1/cases') return getCases(request, env);
  if (method === 'POST' && path === '/v1/cases') return createCase(request, env);
  const caseMatch = path.match(/^\/v1\/cases\/(\d+)$/);
  if (method === 'GET' && caseMatch) return getCase(request, env, Number(caseMatch[1]));

  if (method === 'GET' && path === '/v1/pharmacy/orders') return getPharmacyOrders(request, env);
  if (method === 'POST' && path === '/v1/pharmacy/orders') return createPharmacyOrder(request, env);
  const webhookMatch = path.match(/^\/v1\/pharmacy\/webhooks\/([a-zA-Z0-9_-]+)$/);
  if (method === 'POST' && webhookMatch) return pharmacyWebhook(request, env, webhookMatch[1]);

  if (method === 'POST' && path === '/v1/privacy/export') return privacyExport(request, env);
  if (method === 'DELETE' && path === '/v1/privacy/account') return privacyDeleteRequest(request, env);

  if (path.startsWith('/v1/crm/') || path.startsWith('/v1/admin/')) {
    return adminRoutes(request, env, path, method);
  }

  return json({ ok: false, error: 'not_found', requestId }, 404);
}

async function register(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!isEmail(email) || password.length < 10) {
    return json({ ok: false, error: 'invalid_registration', message: 'Use a valid email and a password of at least 10 characters.' }, 400);
  }

  try {
    // Recover cleanly from an earlier interrupted registration. A previous V3.2B
    // request could create the users row before a later step failed, leaving an
    // account that could neither register again nor log in.
    let existing = await env.DB.prepare(`
      SELECT u.*, a.user_id AS auth_user_id
      FROM users u
      LEFT JOIN user_auth a ON a.user_id = u.id
      WHERE lower(u.email)=?
    `).bind(email).first();

    if (existing?.auth_user_id) {
      return json({ ok: false, error: 'email_in_use', message: 'An account already exists for that email. Please sign in.' }, 409);
    }

    const passwordHash = await hashPassword(password);
    const autoVerify = String(env.AUTO_VERIFY_EMAIL || 'true').toLowerCase() === 'true';
    let user = existing;

    if (!user) {
      await env.DB.prepare(`INSERT INTO users(email,first_name,last_name,phone,date_of_birth,postcode) VALUES(?,?,?,?,?,?)`)
        .bind(email, clean(body.firstName, 100), clean(body.lastName, 100), clean(body.phone, 50), clean(body.dateOfBirth, 20), clean(body.postcode, 20))
        .run();
      user = await env.DB.prepare('SELECT * FROM users WHERE lower(email)=?').bind(email).first();
    } else {
      // Complete the orphaned account and keep any new profile details supplied.
      await env.DB.prepare(`UPDATE users SET first_name=COALESCE(?,first_name),last_name=COALESCE(?,last_name),phone=COALESCE(?,phone),date_of_birth=COALESCE(?,date_of_birth),postcode=COALESCE(?,postcode),updated_at=? WHERE id=?`)
        .bind(clean(body.firstName, 100), clean(body.lastName, 100), clean(body.phone, 50), clean(body.dateOfBirth, 20), clean(body.postcode, 20), isoNow(), user.id)
        .run();
      user = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(user.id).first();
    }

    if (!user?.id) throw new Error('user_row_missing_after_insert');

    // The auth record is the critical registration step. Do this separately so
    // optional CRM/member-state setup cannot invalidate a usable account.
    await env.DB.prepare(`INSERT INTO user_auth(user_id,password_hash,email_verified,email_verified_at) VALUES(?,?,?,?)`)
      .bind(user.id, passwordHash, autoVerify ? 1 : 0, autoVerify ? isoNow() : null)
      .run();

    // Non-critical account scaffolding. Each statement is idempotent.
    try {
      await env.DB.prepare(`INSERT OR IGNORE INTO member_status(user_id,lifecycle_stage,membership_status,source,last_activity_at) VALUES(?,?,?,?,?)`)
        .bind(user.id, 'registered', 'none', clean(body.source, 100) || 'website', isoNow())
        .run();
    } catch (e) { console.error('register_member_status_warning', e?.message); }

    try {
      await env.DB.prepare(`INSERT OR IGNORE INTO member_state(user_id) VALUES(?)`).bind(user.id).run();
    } catch (e) { console.error('register_member_state_warning', e?.message); }

    if (Array.isArray(body.consents)) {
      for (const c of body.consents.slice(0, 20)) {
        try {
          await env.DB.prepare(`INSERT INTO consents(user_id,consent_type,consent_version,granted,granted_at) VALUES(?,?,?,?,?)`)
            .bind(user.id, clean(c.type, 80) || 'unspecified', clean(c.version, 50), c.granted ? 1 : 0, c.granted ? isoNow() : null)
            .run();
        } catch (e) { console.error('register_consent_warning', e?.message); }
      }
    }

    await audit(env, user.id, 'auth.register', 'user', String(user.id), request);
    const session = await createSession(env, user.id, request);
    return json({ ok: true, user: publicUser(user), emailVerified: autoVerify }, 201, { 'Set-Cookie': session.cookie });
  } catch (e) {
    console.error('register_error', e?.message, e?.stack);
    return json({ ok: false, error: 'registration_failed', message: 'We could not create your account. Please try again.' }, 500);
  }
}

async function login(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const row = await env.DB.prepare(`
    SELECT u.*, a.password_hash, a.email_verified, a.failed_login_attempts, a.locked_until
    FROM users u JOIN user_auth a ON a.user_id=u.id
    WHERE lower(u.email)=?
  `).bind(email).first();

  if (!row) return json({ ok: false, error: 'invalid_credentials' }, 401);
  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) return json({ ok: false, error: 'temporarily_locked' }, 423);

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) {
    const attempts = Number(row.failed_login_attempts || 0) + 1;
    const lockedUntil = attempts >= 8 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
    await env.DB.prepare('UPDATE user_auth SET failed_login_attempts=?, locked_until=?, updated_at=? WHERE user_id=?')
      .bind(lockedUntil ? 0 : attempts, lockedUntil, isoNow(), row.id).run();
    return json({ ok: false, error: 'invalid_credentials' }, 401);
  }

  await env.DB.batch([
    env.DB.prepare('UPDATE user_auth SET failed_login_attempts=0, locked_until=NULL, last_login_at=?, updated_at=? WHERE user_id=?').bind(isoNow(), isoNow(), row.id),
    env.DB.prepare('UPDATE member_status SET last_activity_at=?, updated_at=? WHERE user_id=?').bind(isoNow(), isoNow(), row.id)
  ]);
  await audit(env, row.id, 'auth.login', 'user', String(row.id), request);
  const session = await createSession(env, row.id, request);
  return json({ ok: true, user: publicUser(row), emailVerified: !!row.email_verified }, 200, { 'Set-Cookie': session.cookie });
}

async function logout(request, env) {
  const token = sessionTokenFromRequest(request);
  if (token) {
    const hash = await sha256Hex(token);
    await env.DB.prepare('UPDATE user_sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL').bind(isoNow(), hash).run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}

async function requestPasswordReset(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const user = await env.DB.prepare('SELECT id FROM users WHERE lower(email)=?').bind(email).first();
  if (user) {
    const token = randomToken(32);
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare(`INSERT INTO auth_tokens(user_id,token_hash,token_type,expires_at) VALUES(?,?,?,?)`)
      .bind(user.id, tokenHash, 'password_reset', new Date(Date.now() + 30 * 60 * 1000).toISOString()).run();
    await audit(env, user.id, 'auth.password_reset_requested', 'user', String(user.id), request);
    // Deliberately do not return the reset token. Connect an email provider before launch.
  }
  return json({ ok: true, message: 'If that account exists, reset instructions will be sent when email delivery is connected.' });
}

async function getMe(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const row = await userWithStatus(env, auth.user.id);
  return json({ user: row });
}

async function getProfile(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const row = await userWithStatus(env, auth.user.id);
  return json({ profile: row });
}

async function patchProfile(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const b = await readJson(request);
  await env.DB.prepare(`UPDATE users SET first_name=COALESCE(?,first_name),last_name=COALESCE(?,last_name),phone=COALESCE(?,phone),date_of_birth=COALESCE(?,date_of_birth),postcode=COALESCE(?,postcode),updated_at=? WHERE id=?`)
    .bind(optionalClean(b.firstName,100), optionalClean(b.lastName,100), optionalClean(b.phone,50), optionalClean(b.dateOfBirth,20), optionalClean(b.postcode,20), isoNow(), auth.user.id).run();
  await touchMember(env, auth.user.id);
  await audit(env, auth.user.id, 'profile.update', 'user', String(auth.user.id), request);
  return json({ ok: true, profile: await userWithStatus(env, auth.user.id) });
}

async function getMemberState(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const row = await env.DB.prepare('SELECT * FROM member_state WHERE user_id=?').bind(auth.user.id).first();
  return json({ state: parseMemberState(row) });
}

async function patchMemberState(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const b = await readJson(request);
  const current = await env.DB.prepare('SELECT * FROM member_state WHERE user_id=?').bind(auth.user.id).first();
  const state = {
    myWhy: b.myWhy ?? safeJson(current?.my_why, {}),
    roadmap: b.roadmap ?? safeJson(current?.roadmap, {}),
    treatmentFinder: b.treatmentFinder ?? safeJson(current?.treatment_finder, {}),
    decisionReadiness: b.decisionReadiness ?? safeJson(current?.decision_readiness, {}),
    preferences: b.preferences ?? safeJson(current?.preferences, {})
  };
  await env.DB.prepare(`INSERT INTO member_state(user_id,my_why,roadmap,treatment_finder,decision_readiness,preferences,updated_at)
    VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET my_why=excluded.my_why,roadmap=excluded.roadmap,treatment_finder=excluded.treatment_finder,decision_readiness=excluded.decision_readiness,preferences=excluded.preferences,updated_at=excluded.updated_at`)
    .bind(auth.user.id, JSON.stringify(state.myWhy), JSON.stringify(state.roadmap), JSON.stringify(state.treatmentFinder), JSON.stringify(state.decisionReadiness), JSON.stringify(state.preferences), isoNow()).run();
  await touchMember(env, auth.user.id);
  return json({ ok: true, state });
}

async function getProgress(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const { results } = await env.DB.prepare('SELECT * FROM progress_entries WHERE user_id=? ORDER BY recorded_on DESC, id DESC LIMIT 365').bind(auth.user.id).all();
  return json({ progress: results || [] });
}

async function saveProgress(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const b = await readJson(request);
  const recordedOn = clean(b.recordedOn, 20) || new Date().toISOString().slice(0,10);
  await env.DB.prepare(`INSERT INTO progress_entries(user_id,recorded_on,weight_kg,waist_cm,systolic,diastolic,resting_hr,steps,protein_g,sleep_hours,mood_score,notes,source,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(auth.user.id, recordedOn, numberOrNull(b.weightKg), numberOrNull(b.waistCm), intOrNull(b.systolic), intOrNull(b.diastolic), intOrNull(b.restingHr), intOrNull(b.steps), numberOrNull(b.proteinG), numberOrNull(b.sleepHours), boundedIntOrNull(b.moodScore,1,10), clean(b.notes,4000), clean(b.source,50)||'member', isoNow(), isoNow()).run();
  await touchMember(env, auth.user.id);
  return json({ ok: true }, 201);
}

async function getHealthMot(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const { results } = await env.DB.prepare(`SELECT id,status,answers,outcome,created_at,updated_at FROM assessments WHERE user_id=? ORDER BY id DESC LIMIT 100`).bind(auth.user.id).all();
  return json({ healthMots: (results || []).map(r => ({ ...r, answers: safeJson(r.answers, {}), outcome: safeJson(r.outcome, r.outcome) })) });
}

async function saveHealthMot(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const b = await readJson(request);
  const answers = b.answers && typeof b.answers === 'object' ? b.answers : {};
  const outcome = b.resultSummary ?? b.outcome ?? null;
  await env.DB.prepare(`INSERT INTO assessments(user_id,status,answers,outcome,created_at,updated_at) VALUES(?,?,?,?,?,?)`)
    .bind(auth.user.id, clean(b.status,40)||'completed', JSON.stringify(answers), outcome == null ? null : JSON.stringify(outcome), isoNow(), isoNow()).run();
  const assessment = await env.DB.prepare('SELECT * FROM assessments WHERE user_id=? ORDER BY id DESC LIMIT 1').bind(auth.user.id).first();

  for (const [questionKey, answer] of Object.entries(answers).slice(0, 200)) {
    const q = await env.DB.prepare('SELECT id FROM questions WHERE question_key=?').bind(String(questionKey)).first();
    if (q) {
      await env.DB.prepare(`INSERT OR REPLACE INTO assessment_answers(assessment_id,question_id,answer_value,answer_text,created_at) VALUES(?,?,?,?,?)`)
        .bind(assessment.id, q.id, typeof answer === 'string' ? answer : JSON.stringify(answer), typeof answer === 'string' ? answer : null, isoNow()).run();
    }
  }
  await touchMember(env, auth.user.id);
  await audit(env, auth.user.id, 'assessment.complete', 'assessment', String(assessment.id), request);
  return json({ ok: true, healthMot: { ...assessment, answers: safeJson(assessment.answers, {}), outcome: safeJson(assessment.outcome, assessment.outcome) } }, 201);
}

async function getCheckIns(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const { results } = await env.DB.prepare('SELECT * FROM check_ins WHERE user_id=? ORDER BY id DESC LIMIT 100').bind(auth.user.id).all();
  return json({ checkIns: results || [] });
}

async function saveCheckIn(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const b = await readJson(request);
  await env.DB.prepare(`INSERT INTO check_ins(user_id,case_id,weight,waist,wellbeing_score,side_effects,notes,submitted_at) VALUES(?,?,?,?,?,?,?,?)`)
    .bind(auth.user.id, intOrNull(b.caseId), numberOrNull(b.weight ?? b.weightKg), numberOrNull(b.waist ?? b.waistCm), boundedIntOrNull(b.wellbeingScore ?? b.moodScore,1,10), jsonOrText(b.sideEffects), clean(b.notes ?? b.note,4000), isoNow()).run();
  await touchMember(env, auth.user.id);
  return json({ ok: true }, 201);
}

async function getConsents(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const { results } = await env.DB.prepare('SELECT * FROM consents WHERE user_id=? ORDER BY id DESC').bind(auth.user.id).all();
  return json({ consents: results || [] });
}

async function saveConsent(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const b = await readJson(request);
  const type = clean(b.type ?? b.consentType, 80);
  if (!type) return json({ ok:false, error:'consent_type_required' }, 400);
  const granted = !!b.granted;
  await env.DB.prepare(`INSERT INTO consents(user_id,consent_type,consent_version,granted,granted_at,withdrawn_at,created_at) VALUES(?,?,?,?,?,?,?)`)
    .bind(auth.user.id, type, clean(b.version ?? b.consentVersion,50), granted ? 1 : 0, granted ? isoNow() : null, granted ? null : isoNow(), isoNow()).run();
  await audit(env, auth.user.id, granted ? 'consent.granted' : 'consent.withdrawn', 'consent', type, request);
  return json({ ok:true }, 201);
}

async function getCases(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const { results } = await env.DB.prepare('SELECT * FROM cases WHERE user_id=? ORDER BY id DESC').bind(auth.user.id).all();
  return json({ cases: results || [] });
}

async function createCase(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const b = await readJson(request);
  const reference = `SST-${Date.now().toString(36).toUpperCase()}-${randomDigits(4)}`;
  await env.DB.prepare(`INSERT INTO cases(user_id,assessment_id,reference,status,service_type,pharmacy_status,payment_status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)`)
    .bind(auth.user.id, intOrNull(b.assessmentId), reference, clean(b.status,40)||'submitted', clean(b.serviceType,100), 'not_sent', clean(b.paymentStatus,40)||'not_required', isoNow(), isoNow()).run();
  const row = await env.DB.prepare('SELECT * FROM cases WHERE reference=?').bind(reference).first();
  await audit(env, auth.user.id, 'case.create', 'case', String(row.id), request);
  return json({ ok:true, case: row }, 201);
}

async function getCase(request, env, caseId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const row = await env.DB.prepare('SELECT * FROM cases WHERE id=? AND user_id=?').bind(caseId, auth.user.id).first();
  if (!row) return json({ ok:false, error:'case_not_found' }, 404);
  return json({ case: row });
}

async function getPharmacyOrders(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const { results } = await env.DB.prepare('SELECT * FROM pharmacy_orders WHERE user_id=? ORDER BY id DESC').bind(auth.user.id).all();
  return json({ orders: results || [] });
}

async function createPharmacyOrder(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const b = await readJson(request);
  const caseId = Number(b.caseId || 0);
  const ownedCase = await env.DB.prepare('SELECT id FROM cases WHERE id=? AND user_id=?').bind(caseId, auth.user.id).first();
  if (!ownedCase) return json({ ok:false, error:'case_not_found' }, 404);
  await env.DB.prepare(`INSERT INTO pharmacy_orders(case_id,user_id,provider,external_order_id,external_patient_id,medication_name,medication_strength,quantity,prescription_status,pharmacy_status,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(caseId, auth.user.id, clean(b.provider,100), null, null, clean(b.medicationName,200), clean(b.medicationStrength,100), clean(b.quantity,100), 'pending', 'not_sent', isoNow(), isoNow()).run();
  const row = await env.DB.prepare('SELECT * FROM pharmacy_orders WHERE case_id=? AND user_id=? ORDER BY id DESC LIMIT 1').bind(caseId, auth.user.id).first();
  await env.DB.prepare('UPDATE cases SET pharmacy_status=?, updated_at=? WHERE id=?').bind('prepared', isoNow(), caseId).run();
  await audit(env, auth.user.id, 'pharmacy_order.create', 'pharmacy_order', String(row.id), request);
  return json({ ok:true, order: row, integrationStatus:'not_connected_to_live_pharmacy' }, 201);
}

async function pharmacyWebhook(request, env, providerKey) {
  const expected = String(env.PHARMACY_WEBHOOK_SECRET || '');
  if (!expected) return json({ ok:false, error:'webhook_not_configured' }, 503);
  const supplied = request.headers.get('x-shift-webhook-secret') || '';
  if (!constantTimeStringEqual(supplied, expected)) return json({ ok:false, error:'invalid_webhook_signature' }, 401);

  const provider = await env.DB.prepare('SELECT * FROM pharmacy_providers WHERE provider_key=?').bind(providerKey).first();
  if (!provider) return json({ ok:false, error:'unknown_provider' }, 404);
  const payload = await readJson(request);
  const externalOrderId = clean(payload.external_order_id ?? payload.externalOrderId, 200);
  const order = externalOrderId ? await env.DB.prepare('SELECT * FROM pharmacy_orders WHERE external_order_id=?').bind(externalOrderId).first() : null;
  await env.DB.prepare(`INSERT INTO integration_webhooks(provider_id,pharmacy_order_id,event_type,external_event_id,payload,signature_valid,processed,received_at) VALUES(?,?,?,?,?,?,?,?)`)
    .bind(provider.id, order?.id || null, clean(payload.event_type ?? payload.type,100), clean(payload.event_id ?? payload.id,200), JSON.stringify(payload), 1, 0, isoNow()).run();
  if (order) {
    const status = clean(payload.status,80);
    await env.DB.prepare(`INSERT INTO pharmacy_events(pharmacy_order_id,event_type,event_status,event_message,raw_payload,occurred_at,created_at) VALUES(?,?,?,?,?,?,?)`)
      .bind(order.id, clean(payload.event_type ?? payload.type,100)||'update', status, clean(payload.message,1000), JSON.stringify(payload), isoNow(), isoNow()).run();
    if (status) await env.DB.prepare('UPDATE pharmacy_orders SET pharmacy_status=?, provider_response=?, updated_at=? WHERE id=?').bind(status, JSON.stringify(payload), isoNow(), order.id).run();
  }
  return json({ ok:true });
}

async function privacyExport(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const id = auth.user.id;
  const [user, status, assessments, cases, checkIns, consents, progress, state, orders] = await Promise.all([
    env.DB.prepare('SELECT id,email,first_name,last_name,phone,date_of_birth,postcode,created_at,updated_at FROM users WHERE id=?').bind(id).first(),
    env.DB.prepare('SELECT * FROM member_status WHERE user_id=?').bind(id).first(),
    env.DB.prepare('SELECT * FROM assessments WHERE user_id=? ORDER BY id').bind(id).all(),
    env.DB.prepare('SELECT * FROM cases WHERE user_id=? ORDER BY id').bind(id).all(),
    env.DB.prepare('SELECT * FROM check_ins WHERE user_id=? ORDER BY id').bind(id).all(),
    env.DB.prepare('SELECT * FROM consents WHERE user_id=? ORDER BY id').bind(id).all(),
    env.DB.prepare('SELECT * FROM progress_entries WHERE user_id=? ORDER BY id').bind(id).all(),
    env.DB.prepare('SELECT * FROM member_state WHERE user_id=?').bind(id).first(),
    env.DB.prepare('SELECT * FROM pharmacy_orders WHERE user_id=? ORDER BY id').bind(id).all()
  ]);
  await audit(env, id, 'privacy.export', 'user', String(id), request);
  return json({ exportedAt: isoNow(), user, memberStatus: status, assessments: assessments.results||[], cases: cases.results||[], checkIns: checkIns.results||[], consents: consents.results||[], progress: progress.results||[], memberState: parseMemberState(state), pharmacyOrders: orders.results||[] });
}

async function privacyDeleteRequest(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  await env.DB.prepare(`INSERT INTO data_requests(user_id,request_type,status,received_at) VALUES(?,?,?,?)`).bind(auth.user.id,'deletion','received',isoNow()).run();
  await env.DB.prepare('UPDATE user_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL').bind(isoNow(), auth.user.id).run();
  await audit(env, auth.user.id, 'privacy.deletion_requested', 'user', String(auth.user.id), request);
  return json({ ok:true, status:'received' }, 202, { 'Set-Cookie': clearSessionCookie() });
}

async function adminRoutes(request, env, path, method) {
  if (!isAdmin(request, env)) return json({ ok:false, error:'admin_unauthorized' }, 401);

  if (method === 'GET' && path === '/v1/crm/stats') {
    const totals = await env.DB.prepare(`SELECT COUNT(*) total FROM users`).first();
    const registered = await env.DB.prepare(`SELECT COUNT(*) count FROM member_status WHERE lifecycle_stage='registered'`).first();
    const cases = await env.DB.prepare(`SELECT COUNT(*) count FROM cases`).first();
    const pharmacy = await env.DB.prepare(`SELECT COUNT(*) count FROM pharmacy_orders`).first();
    return json({ stats:{ total:Number(totals?.total||0), registered:Number(registered?.count||0), cases:Number(cases?.count||0), pharmacyOrders:Number(pharmacy?.count||0) } });
  }

  if (method === 'GET' && path === '/v1/crm/people') {
    const { results } = await env.DB.prepare(`SELECT u.id,u.email,u.first_name,u.last_name,u.phone,u.postcode,u.created_at,m.lifecycle_stage,m.membership_status,m.source,m.last_activity_at,(SELECT COUNT(*) FROM cases c WHERE c.user_id=u.id) case_count FROM users u LEFT JOIN member_status m ON m.user_id=u.id ORDER BY u.id DESC LIMIT 500`).all();
    return json({ people: results || [] });
  }

  const personMatch = path.match(/^\/v1\/crm\/people\/(\d+)$/);
  if (method === 'GET' && personMatch) {
    const id = Number(personMatch[1]);
    const user = await userWithStatus(env,id);
    if (!user) return json({ok:false,error:'not_found'},404);
    const [cases, assessments, checkIns, orders, consents] = await Promise.all([
      env.DB.prepare('SELECT * FROM cases WHERE user_id=? ORDER BY id DESC').bind(id).all(),
      env.DB.prepare('SELECT * FROM assessments WHERE user_id=? ORDER BY id DESC').bind(id).all(),
      env.DB.prepare('SELECT * FROM check_ins WHERE user_id=? ORDER BY id DESC').bind(id).all(),
      env.DB.prepare('SELECT * FROM pharmacy_orders WHERE user_id=? ORDER BY id DESC').bind(id).all(),
      env.DB.prepare('SELECT * FROM consents WHERE user_id=? ORDER BY id DESC').bind(id).all()
    ]);
    return json({ person:user,cases:cases.results||[],assessments:assessments.results||[],checkIns:checkIns.results||[],pharmacyOrders:orders.results||[],consents:consents.results||[] });
  }

  if (method === 'POST' && path === '/v1/crm/notes') {
    const b = await readJson(request);
    const caseId = Number(b.caseId || 0);
    if (!caseId || !clean(b.note,10000)) return json({ok:false,error:'invalid_request'},400);
    await env.DB.prepare('INSERT INTO case_notes(case_id,note_type,note,created_by,created_at) VALUES(?,?,?,?,?)').bind(caseId,clean(b.noteType,50)||'general',clean(b.note,10000),clean(b.createdBy,100)||'admin',isoNow()).run();
    return json({ok:true},201);
  }

  if (method === 'POST' && path === '/v1/crm/tasks') {
    const b = await readJson(request);
    const caseId = Number(b.caseId || 0);
    if (!caseId || !clean(b.title,300)) return json({ok:false,error:'invalid_request'},400);
    await env.DB.prepare(`INSERT INTO case_tasks(case_id,title,description,status,due_at,assigned_to,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)`).bind(caseId,clean(b.title,300),clean(b.description,5000),'open',clean(b.dueAt,40),clean(b.assignedTo,100),isoNow(),isoNow()).run();
    return json({ok:true},201);
  }

  if (method === 'GET' && path === '/v1/admin/pharmacy/providers') {
    const { results } = await env.DB.prepare('SELECT * FROM pharmacy_providers ORDER BY id').all();
    return json({ providers: results || [] });
  }

  if (method === 'POST' && path === '/v1/admin/pharmacy/providers') {
    const b = await readJson(request);
    if (!clean(b.providerKey,80) || !clean(b.providerName,200)) return json({ok:false,error:'invalid_request'},400);
    await env.DB.prepare(`INSERT INTO pharmacy_providers(provider_key,provider_name,api_base_url,webhook_url,active,sandbox_mode,supports_prescribing,supports_dispensing,supports_tracking,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(clean(b.providerKey,80),clean(b.providerName,200),clean(b.apiBaseUrl,500),clean(b.webhookUrl,500),b.active?1:0,b.sandboxMode===false?0:1,b.supportsPrescribing?1:0,b.supportsDispensing===false?0:1,b.supportsTracking===false?0:1,isoNow(),isoNow()).run();
    return json({ok:true},201);
  }

  return json({ok:false,error:'admin_route_not_found'},404);
}

async function requireUser(request, env) {
  const token = sessionTokenFromRequest(request);
  if (!token) return { response: json({ ok:false, error:'authentication_required' }, 401) };
  const hash = await sha256Hex(token);
  const row = await env.DB.prepare(`SELECT u.*,s.id session_id,s.expires_at,s.revoked_at FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?`).bind(hash).first();
  if (!row || row.revoked_at || new Date(row.expires_at).getTime() <= Date.now()) return { response: json({ok:false,error:'session_expired'},401,{ 'Set-Cookie':clearSessionCookie() }) };
  await env.DB.prepare('UPDATE user_sessions SET last_used_at=? WHERE id=?').bind(isoNow(),row.session_id).run();
  return { user: row };
}

async function createSession(env, userId, request) {
  const token = randomToken(32);
  const hash = await sha256Hex(token);
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare('INSERT INTO user_sessions(user_id,token_hash,expires_at,last_used_at,created_at) VALUES(?,?,?,?,?)').bind(userId,hash,expires,isoNow(),isoNow()).run();
  return { token, cookie: sessionCookie(token, expires) };
}

async function userWithStatus(env, userId) {
  return env.DB.prepare(`SELECT u.id,u.email,u.first_name,u.last_name,u.phone,u.date_of_birth,u.postcode,u.created_at,u.updated_at,m.lifecycle_stage,m.membership_status,m.source,m.last_activity_at,a.email_verified,a.last_login_at FROM users u LEFT JOIN member_status m ON m.user_id=u.id LEFT JOIN user_auth a ON a.user_id=u.id WHERE u.id=?`).bind(userId).first();
}

async function touchMember(env, userId) {
  await env.DB.prepare('UPDATE member_status SET last_activity_at=?,updated_at=? WHERE user_id=?').bind(isoNow(),isoNow(),userId).run();
}

async function audit(env, userId, action, entityType, entityId, request) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const ipHash = ip ? `sha256:${await sha256Hex(ip)}` : null;
    await env.DB.prepare('INSERT INTO audit_log(user_id,action,entity_type,entity_id,metadata,ip_address,created_at) VALUES(?,?,?,?,?,?,?)')
      .bind(userId || null,action,entityType,entityId||null,'{}',ipHash,isoNow()).run();
  } catch (e) { console.warn('audit_write_failed', e?.message); }
}

async function ensureSchema(DB) {
  if (schemaReady) return;
  const statements = [
    `CREATE TABLE IF NOT EXISTS assessment_answers (id INTEGER PRIMARY KEY AUTOINCREMENT,assessment_id INTEGER NOT NULL,question_id INTEGER NOT NULL,answer_value TEXT,answer_text TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (assessment_id) REFERENCES assessments(id),FOREIGN KEY (question_id) REFERENCES questions(id))`,
    `CREATE TABLE IF NOT EXISTS consents (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,consent_type TEXT NOT NULL,consent_version TEXT,granted INTEGER NOT NULL DEFAULT 0,granted_at TEXT,withdrawn_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (user_id) REFERENCES users(id))`,
    `CREATE TABLE IF NOT EXISTS case_notes (id INTEGER PRIMARY KEY AUTOINCREMENT,case_id INTEGER NOT NULL,note_type TEXT NOT NULL DEFAULT 'general',note TEXT NOT NULL,created_by TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (case_id) REFERENCES cases(id))`,
    `CREATE TABLE IF NOT EXISTS case_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT,case_id INTEGER NOT NULL,title TEXT NOT NULL,description TEXT,status TEXT NOT NULL DEFAULT 'open',due_at TEXT,completed_at TEXT,assigned_to TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (case_id) REFERENCES cases(id))`,
    `CREATE TABLE IF NOT EXISTS check_ins (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,case_id INTEGER,weight REAL,waist REAL,wellbeing_score INTEGER,side_effects TEXT,notes TEXT,submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (user_id) REFERENCES users(id),FOREIGN KEY (case_id) REFERENCES cases(id))`,
    `CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,action TEXT NOT NULL,entity_type TEXT,entity_id TEXT,metadata TEXT,ip_address TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (user_id) REFERENCES users(id))`,
    `CREATE TABLE IF NOT EXISTS member_state (user_id INTEGER PRIMARY KEY,my_why TEXT NOT NULL DEFAULT '{}',roadmap TEXT NOT NULL DEFAULT '{}',treatment_finder TEXT NOT NULL DEFAULT '{}',decision_readiness TEXT NOT NULL DEFAULT '{}',preferences TEXT NOT NULL DEFAULT '{}',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (user_id) REFERENCES users(id))`,
    `CREATE TABLE IF NOT EXISTS progress_entries (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,recorded_on TEXT NOT NULL,weight_kg REAL,waist_cm REAL,systolic INTEGER,diastolic INTEGER,resting_hr INTEGER,steps INTEGER,protein_g REAL,sleep_hours REAL,mood_score INTEGER,notes TEXT,source TEXT NOT NULL DEFAULT 'member',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (user_id) REFERENCES users(id))`,
    `CREATE TABLE IF NOT EXISTS data_requests (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,request_type TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'received',received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,completed_at TEXT,FOREIGN KEY (user_id) REFERENCES users(id))`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_answers_unique ON assessment_answers(assessment_id,question_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash)`,
    `CREATE INDEX IF NOT EXISTS idx_progress_user ON progress_entries(user_id,recorded_on)`,
    `CREATE INDEX IF NOT EXISTS idx_cases_user ON cases(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_user ON pharmacy_orders(user_id)`
  ];
  for (const sql of statements) await DB.prepare(sql).run();
  schemaReady = true;
}

function parseMemberState(row) {
  if (!row) return { myWhy:{},roadmap:{},treatmentFinder:{},decisionReadiness:{},preferences:{} };
  return { myWhy:safeJson(row.my_why,{}), roadmap:safeJson(row.roadmap,{}), treatmentFinder:safeJson(row.treatment_finder,{}), decisionReadiness:safeJson(row.decision_readiness,{}), preferences:safeJson(row.preferences,{}) };
}

function publicUser(u) {
  return { id:u.id,email:u.email,firstName:u.first_name,lastName:u.last_name,phone:u.phone,dateOfBirth:u.date_of_birth,postcode:u.postcode,createdAt:u.created_at };
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const extra = String(env.ALLOWED_ORIGINS || '').split(',').map(x=>x.trim()).filter(Boolean);
  const allowed = new Set([...DEFAULT_ALLOWED_ORIGINS, ...extra]);
  const h = {
    'Access-Control-Allow-Methods':'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type,X-Shift-Admin-Key,X-Shift-Webhook-Secret',
    'Access-Control-Allow-Credentials':'true',
    'Vary':'Origin'
  };
  if (origin && allowed.has(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function isAdmin(request, env) {
  const expected = String(env.ADMIN_API_KEY || '');
  const supplied = request.headers.get('x-shift-admin-key') || '';
  return !!expected && constantTimeStringEqual(supplied, expected);
}

function sessionTokenFromRequest(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)sst_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function sessionCookie(token, expires) {
  return `sst_session=${encodeURIComponent(token)}; Path=/; Expires=${new Date(expires).toUTCString()}; HttpOnly; Secure; SameSite=Lax`;
}
function clearSessionCookie() { return 'sst_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'; }

async function hashPassword(password) {
  const iterations = 100000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations}, key, 256);
  return `pbkdf2$${iterations}$${base64url(salt)}$${base64url(new Uint8Array(bits))}`;
}
async function verifyPassword(password, stored) {
  try {
    const [scheme, iter, saltB64, hashB64] = String(stored).split('$');
    if (scheme !== 'pbkdf2') return false;
    const salt = fromBase64url(saltB64);
    const expected = fromBase64url(hashB64);
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:Number(iter)}, key, 256);
    return constantTimeBytesEqual(new Uint8Array(bits), expected);
  } catch { return false; }
}

async function sha256Hex(value) {
  const data = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  return [...digest].map(b=>b.toString(16).padStart(2,'0')).join('');
}

function randomToken(bytes=32) { return base64url(crypto.getRandomValues(new Uint8Array(bytes))); }
function randomDigits(n) { let s=''; const a=crypto.getRandomValues(new Uint8Array(n)); for(const b of a)s+=(b%10); return s; }
function base64url(bytes) { let binary=''; for(const b of bytes) binary+=String.fromCharCode(b); return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function fromBase64url(s) { s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='='; const bin=atob(s); return Uint8Array.from(bin,c=>c.charCodeAt(0)); }
function constantTimeBytesEqual(a,b){ if(a.length!==b.length)return false; let d=0; for(let i=0;i<a.length;i++)d|=a[i]^b[i]; return d===0; }
function constantTimeStringEqual(a,b){ const aa=new TextEncoder().encode(String(a)),bb=new TextEncoder().encode(String(b)); return constantTimeBytesEqual(aa,bb); }

async function readJson(request) {
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return {};
  try { return await request.json(); } catch { return {}; }
}
function json(data,status=200,extraHeaders={}) { return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8',...extraHeaders}}); }
function normalizePath(p){ const s=p.replace(/\/+$/,''); return s||'/'; }
function normalizeEmail(v){ return String(v||'').trim().toLowerCase(); }
function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function clean(v,max=1000){ if(v===undefined||v===null)return null; const s=String(v).trim(); return s ? s.slice(0,max) : null; }
function optionalClean(v,max){ return v===undefined ? null : clean(v,max); }
function intOrNull(v){ const n=Number(v); return Number.isInteger(n)?n:null; }
function numberOrNull(v){ const n=Number(v); return Number.isFinite(n)?n:null; }
function boundedIntOrNull(v,min,max){ const n=intOrNull(v); return n!==null&&n>=min&&n<=max?n:null; }
function jsonOrText(v){ if(v===undefined||v===null)return null; return typeof v==='string'?v:JSON.stringify(v); }
function safeJson(v,fallback){ if(v===undefined||v===null||v==='')return fallback; if(typeof v==='object')return v; try{return JSON.parse(v);}catch{return fallback;} }
function isoNow(){ return new Date().toISOString(); }
