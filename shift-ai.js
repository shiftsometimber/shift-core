import core from './worker.js';

const SHIFT_AI_VERSION = '1.0-live';
const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') return core.fetch(request, env, ctx);

    if (request.method === 'GET' && path === '/v1/shift-ai/status') {
      return shiftAiStatus(request, env, ctx);
    }
    if (request.method === 'POST' && path === '/v1/shift-ai/chat') {
      return shiftAiChat(request, env, ctx);
    }
    if (request.method === 'GET' && path === '/v1/shift-ai/history') {
      return shiftAiHistory(request, env, ctx);
    }
    if (request.method === 'DELETE' && path === '/v1/shift-ai/history') {
      return shiftAiForget(request, env, ctx);
    }

    return core.fetch(request, env, ctx);
  }
};

async function authenticatedUser(request, env, ctx) {
  const probe = new Request(new URL('/v1/me', request.url), {
    method: 'GET',
    headers: request.headers
  });
  const response = await core.fetch(probe, env, ctx);
  if (!response.ok) return { response };
  const data = await response.json();
  return { user: data.user };
}

async function shiftAiStatus(request, env, ctx) {
  const auth = await authenticatedUser(request, env, ctx);
  if (auth.response) return auth.response;
  return json({
    ok: true,
    service: 'Shift AI',
    version: SHIFT_AI_VERSION,
    engine: env.AI ? 'cloudflare-workers-ai' : 'fallback',
    model: env.SHIFT_AI_MODEL || DEFAULT_MODEL,
    shiftBrain: true,
    memory: true,
    shoulder: true
  });
}

async function shiftAiChat(request, env, ctx) {
  const auth = await authenticatedUser(request, env, ctx);
  if (auth.response) return auth.response;
  const body = await readJson(request);
  const message = String(body.message || '').trim().slice(0, 6000);
  if (!message) return json({ ok:false, error:'message_required' }, 400);

  await ensureShiftAiSchema(env.DB);
  const userId = Number(auth.user.id);
  const mode = classifyMode(message);
  const context = await buildMemberContext(env, userId, message);
  const history = await recentHistory(env.DB, userId, 8);
  const system = shiftSystemPrompt(mode, context);

  let answer = '';
  let model = 'shift-ai-fallback';
  if (env.AI) {
    try {
      const selected = env.SHIFT_AI_MODEL || DEFAULT_MODEL;
      const result = await env.AI.run(selected, {
        messages: [
          { role:'system', content:system },
          ...history.map(x => ({ role:x.direction === 'user' ? 'user' : 'assistant', content:x.body })),
          { role:'user', content:message }
        ],
        max_tokens: 900,
        temperature: mode === 'shoulder' ? 0.55 : 0.35
      });
      answer = String(result?.response || result?.result?.response || '').trim();
      model = selected;
    } catch (e) {
      console.warn('shift_ai_workers_ai_failed', e?.message);
    }
  }

  if (!answer) answer = fallbackAnswer(mode, context);
  answer = answer.slice(0, 12000);

  await env.DB.batch([
    env.DB.prepare(`INSERT INTO shift_ai_conversations(user_id,direction,mode,body,model,created_at) VALUES(?,?,?,?,?,?)`).bind(userId,'user',mode,message,null,now()),
    env.DB.prepare(`INSERT INTO shift_ai_conversations(user_id,direction,mode,body,model,created_at) VALUES(?,?,?,?,?,?)`).bind(userId,'assistant',mode,answer,model,now())
  ]);
  await rememberUsefulFacts(env.DB, userId, message, body.remember === true);

  return json({
    ok:true,
    answer,
    mode,
    model,
    version:SHIFT_AI_VERSION,
    sources:context.sources,
    memoryUsed:context.memories.length > 0
  });
}

async function shiftAiHistory(request, env, ctx) {
  const auth = await authenticatedUser(request, env, ctx);
  if (auth.response) return auth.response;
  await ensureShiftAiSchema(env.DB);
  const rows = await recentHistory(env.DB, Number(auth.user.id), 50);
  return json({ ok:true, messages:rows.reverse() });
}

async function shiftAiForget(request, env, ctx) {
  const auth = await authenticatedUser(request, env, ctx);
  if (auth.response) return auth.response;
  await ensureShiftAiSchema(env.DB);
  const uid = Number(auth.user.id);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM shift_ai_conversations WHERE user_id=?').bind(uid),
    env.DB.prepare('DELETE FROM shift_ai_member_memory WHERE user_id=?').bind(uid)
  ]);
  return json({ ok:true, forgotten:true });
}

async function ensureShiftAiSchema(DB) {
  await DB.batch([
    DB.prepare(`CREATE TABLE IF NOT EXISTS shift_ai_conversations (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,direction TEXT NOT NULL,mode TEXT NOT NULL DEFAULT 'coach',body TEXT NOT NULL,model TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
    DB.prepare(`CREATE TABLE IF NOT EXISTS shift_ai_member_memory (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,memory_key TEXT NOT NULL,memory_value TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,memory_key))`),
    DB.prepare(`CREATE INDEX IF NOT EXISTS idx_shift_ai_conversation_user ON shift_ai_conversations(user_id,id)`),
    DB.prepare(`CREATE INDEX IF NOT EXISTS idx_shift_ai_memory_user ON shift_ai_member_memory(user_id,id)`)
  ]);
}

async function buildMemberContext(env, userId, question) {
  const [profile, state, progress, mot, checkin, memories, knowledge] = await Promise.all([
    env.DB.prepare(`SELECT u.first_name,u.last_name,u.date_of_birth,u.postcode,ms.lifecycle_stage,ms.membership_status FROM users u LEFT JOIN member_status ms ON ms.user_id=u.id WHERE u.id=?`).bind(userId).first(),
    env.DB.prepare('SELECT my_why,roadmap,treatment_finder,decision_readiness,preferences FROM member_state WHERE user_id=?').bind(userId).first(),
    env.DB.prepare('SELECT recorded_on,weight_kg,waist_cm,systolic,diastolic,resting_hr,steps,protein_g,sleep_hours,mood_score FROM progress_entries WHERE user_id=? ORDER BY recorded_on DESC,id DESC LIMIT 8').bind(userId).all(),
    env.DB.prepare('SELECT status,outcome,created_at FROM assessments WHERE user_id=? ORDER BY id DESC LIMIT 1').bind(userId).first(),
    env.DB.prepare('SELECT weight,waist,wellbeing_score,side_effects,notes,submitted_at FROM check_ins WHERE user_id=? ORDER BY id DESC LIMIT 1').bind(userId).first(),
    env.DB.prepare('SELECT memory_key,memory_value FROM shift_ai_member_memory WHERE user_id=? ORDER BY updated_at DESC LIMIT 20').bind(userId).all(),
    retrieveKnowledge(env.DB, question)
  ]);
  return {
    profile,
    state: parseState(state),
    progress: progress.results || [],
    latestMot: mot || null,
    latestCheckIn: checkin || null,
    memories: memories.results || [],
    sources: knowledge.map(k => ({ title:k.title, source:k.source_uri, trustTier:k.trust_tier, citation:`ShiftBrain:${k.document_id}:${k.id}` })),
    knowledge: knowledge.map(k => `[ShiftBrain:${k.document_id}:${k.id}] ${k.title}: ${k.content.slice(0,900)}`)
  };
}

async function retrieveKnowledge(DB, query) {
  const tokens = [...new Set(String(query).toLowerCase().replace(/[^a-z0-9%]+/g,' ').split(/\s+/).filter(x => x.length > 3))].slice(0,10);
  if (!tokens.length) return [];
  try {
    const { results } = await DB.prepare(`SELECT c.id,c.document_id,c.content,d.title,d.source_uri,d.trust_tier FROM ai_knowledge_chunks c JOIN ai_knowledge_documents d ON d.id=c.document_id WHERE d.status='approved' ORDER BY d.trust_tier,c.id LIMIT 2500`).all();
    return (results || []).map(r => {
      const t = String(r.content || '').toLowerCase();
      const score = tokens.reduce((n,x) => n + (t.includes(x) ? 1 : 0), 0) + Math.max(0,5-Number(r.trust_tier||5));
      return {...r,score};
    }).filter(x => x.score > 1).sort((a,b) => b.score-a.score || a.trust_tier-b.trust_tier).slice(0,5);
  } catch { return []; }
}

function classifyMode(message) {
  const s = message.toLowerCase();
  if (/suicide|kill myself|end my life|want to die|self harm/.test(s)) return 'safety';
  if (/don't want advice|dont want advice|just need to talk|just want to talk|gutted|ashamed|embarrass|fed up|struggling|crap day|shit day/.test(s)) return 'shoulder';
  if (/calorie|protein|weight|steps|meal|food|exercise|training|gym|walk/.test(s)) return 'coach';
  return 'assistant';
}

function shiftSystemPrompt(mode, c) {
  return `You are Shift AI, the personal intelligence layer for Shift Some Timber, built for ordinary UK blokes who want practical help with weight, health, confidence and life.\n\nVOICE: Original Shift voice only. British/Northern warmth, dry observational humour, quick wit, directness, resilience and compassion. Think the energy of a good mate at the pub, dressing room or kitchen table: funny when the moment allows, serious when it matters. Never imitate, impersonate, quote or claim to be Tyson Fury, Ricky Hatton, Liam/Noel Gallagher, Ricky Gervais, Lenny Henry, Peter Kay or any other real person. The desired ingredients are grounded British humour, straight talking, warmth and humanity — not celebrity mimicry. Avoid American wellness language, corporate jargon, fake enthusiasm and patronising praise.\n\nBEHAVIOUR: Read the room. If the user wants to vent, listen before fixing. Keep answers conversational rather than turning everything into five tips. Challenge all-or-nothing thinking without lecturing. Use the member context when useful but don't creepily recite it back. Ask at most one useful follow-up at a time.\n\nHEALTH: You are not a clinician. For health claims, prioritise supplied Shift Brain material with lower trust-tier numbers. Cite supplied [ShiftBrain:x:y] references naturally when they materially support an answer. Admit uncertainty. Never diagnose or alter prescribed medication. Escalate urgent symptoms appropriately.\n\nSAFETY: If mode=safety, drop humour completely and focus on immediate human help and safety.\n\nMEMBER CONTEXT: ${JSON.stringify({profile:c.profile,state:c.state,progress:c.progress,latestMot:c.latestMot,latestCheckIn:c.latestCheckIn,memories:c.memories})}\n\nAPPROVED KNOWLEDGE: ${c.knowledge.join('\n')}\n\nCURRENT MODE: ${mode}`;
}

function fallbackAnswer(mode, c) {
  if (mode === 'safety') return "This sounds serious, mate. I don't want to make light of it or leave you carrying it on your own. Please get a real person with you now and contact the appropriate emergency or crisis service where you are if you're in immediate danger.";
  if (mode === 'shoulder') return "Go on, mate. Get it out. I'm listening — no lecture and no bloody ten-point wellness plan.";
  if (c.sources.length) return `I've found relevant information in Shift Brain, but the live language model isn't available at the moment. The useful bit is there; the conversational engine needs reconnecting.`;
  return `I'm here, but the live Shift AI language model isn't available at the moment. Shift Core is still running normally.`;
}

async function recentHistory(DB, userId, limit) {
  try {
    const { results } = await DB.prepare('SELECT direction,mode,body,model,created_at FROM shift_ai_conversations WHERE user_id=? ORDER BY id DESC LIMIT ?').bind(userId,limit).all();
    return (results || []).reverse();
  } catch { return []; }
}

async function rememberUsefulFacts(DB, userId, message, explicit) {
  if (!explicit) return;
  const value = String(message).trim().slice(0,1000);
  if (!value) return;
  const key = `user_note_${Date.now()}`;
  await DB.prepare(`INSERT INTO shift_ai_member_memory(user_id,memory_key,memory_value,created_at,updated_at) VALUES(?,?,?,?,?)`).bind(userId,key,value,now(),now()).run();
}

function parseState(row) {
  if (!row) return {};
  const p = v => { try { return JSON.parse(v || '{}'); } catch { return {}; } };
  return { myWhy:p(row.my_why), roadmap:p(row.roadmap), treatmentFinder:p(row.treatment_finder), decisionReadiness:p(row.decision_readiness), preferences:p(row.preferences) };
}

async function readJson(request) { try { return await request.json(); } catch { return {}; } }
function json(data,status=200) { return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}); }
function now() { return new Date().toISOString(); }
