const MEMORY_MODEL='@cf/meta/llama-3.1-8b-instruct-fast';
const ALLOWED=new Set(['goal','preference','routine','motivator','blocker','social_context','food_preference','communication_preference','recurring_pattern','win']);

export async function ensureIntelligentMemorySchema(DB){
  await DB.batch([
    DB.prepare(`CREATE TABLE IF NOT EXISTS shift_ai_memory_v2 (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,memory_key TEXT NOT NULL,category TEXT NOT NULL,memory_value TEXT NOT NULL,confidence REAL NOT NULL DEFAULT 0.75,source TEXT NOT NULL DEFAULT 'conversation',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,memory_key))`),
    DB.prepare(`CREATE INDEX IF NOT EXISTS idx_shift_ai_memory_v2_user ON shift_ai_memory_v2(user_id,updated_at)`)
  ]);
}

export async function listIntelligentMemories(DB,userId,limit=40){
  await ensureIntelligentMemorySchema(DB);
  try{
    const {results}=await DB.prepare(`SELECT memory_key,category,memory_value,confidence,source,updated_at FROM shift_ai_memory_v2 WHERE user_id=? ORDER BY updated_at DESC LIMIT ?`).bind(userId,limit).all();
    return results||[];
  }catch{return[];}
}

export async function clearIntelligentMemories(DB,userId){
  await ensureIntelligentMemorySchema(DB);
  await DB.prepare('DELETE FROM shift_ai_memory_v2 WHERE user_id=?').bind(userId).run();
}

export async function learnFromMessage(env,userId,message,{explicit=false}={}){
  const text=String(message||'').trim();
  if(!text||text.length<12||!env.AI)return {stored:0};
  if(/password|passcode|pin\b|cvv|card number|bank account|sort code|api key|secret key|private key/i.test(text))return {stored:0};
  if(/suicide|kill myself|end my life|want to die|self harm/i.test(text))return {stored:0};
  if(!explicit&&!looksMemoryWorthy(text))return {stored:0};
  await ensureIntelligentMemorySchema(env.DB);
  const existing=await listIntelligentMemories(env.DB,userId,30);
  const system=`You extract durable relationship memories for Shift, a UK men's health and weight-management assistant. Return ONLY valid JSON in the form {"memories":[{"key":"...","category":"...","value":"...","confidence":0.0}]}.\n\nStore only facts likely to be useful in future conversations for weeks or months: goals, stable preferences, routines, motivators, blockers, recurring patterns, food preferences, communication preferences, important ordinary-life context, or meaningful wins.\n\nAllowed categories: goal, preference, routine, motivator, blocker, social_context, food_preference, communication_preference, recurring_pattern, win.\n\nDo NOT store transient states (hungry today, upset today, bad tummy today), guesses, one-off plans, exact medical symptoms, diagnoses, medication details, blood pressure, weight measurements, sexual details, financial information, passwords/secrets, addresses, or anything that belongs in structured medical/programme records. Do not infer sensitive attributes.\n\nUse a stable snake_case key such as goal_target_weight, food_pref_chicken, routine_sunday_takeaway, motivator_play_with_kids, communication_pref_direct. If an existing memory covers the same fact, use the SAME key with a better current value. If nothing durable is present return {"memories":[]}.\n\nExisting memories: ${JSON.stringify(existing.map(x=>({key:x.memory_key,category:x.category,value:x.memory_value})))}.`;
  try{
    const model=env.SHIFT_MEMORY_MODEL||MEMORY_MODEL;
    const r=await env.AI.run(model,{messages:[{role:'system',content:system},{role:'user',content:text}],max_tokens:450,temperature:0.05});
    const raw=String(r?.response||r?.result?.response||'').trim();
    const parsed=parseJson(raw);const items=Array.isArray(parsed?.memories)?parsed.memories.slice(0,5):[];
    let stored=0;
    for(const item of items){
      const key=normaliseKey(item?.key),category=String(item?.category||''),value=String(item?.value||'').trim().slice(0,500),confidence=Math.max(0,Math.min(1,Number(item?.confidence)||0));
      if(!key||!ALLOWED.has(category)||!value||confidence<0.68)continue;
      await env.DB.prepare(`INSERT INTO shift_ai_memory_v2(user_id,memory_key,category,memory_value,confidence,source,created_at,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(user_id,memory_key) DO UPDATE SET category=excluded.category,memory_value=excluded.memory_value,confidence=MAX(shift_ai_memory_v2.confidence,excluded.confidence),source=excluded.source,updated_at=CURRENT_TIMESTAMP`).bind(userId,key,category,value,confidence,explicit?'explicit':'conversation').run();
      stored++;
    }
    return {stored};
  }catch(e){console.warn('shift_memory_learn_failed',e?.message);return {stored:0};}
}

function looksMemoryWorthy(s){return /\b(always|usually|normally|every |each |prefer|like|love|hate|can't stand|cant stand|goal|aim|target|trying to|want to|need to|motivates|keeps me|struggle with|tend to|weekends?|fridays?|sundays?|family|wife|partner|kids?|children|work shifts?|routine|habit|works for me|doesn't work for me|dont like being told|prefer you)\b/i.test(s);}
function normaliseKey(v){const k=String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80);return k.length>=3?k:'';}
function parseJson(raw){try{return JSON.parse(raw)}catch{}const a=raw.indexOf('{'),b=raw.lastIndexOf('}');if(a>=0&&b>a){try{return JSON.parse(raw.slice(a,b+1))}catch{}}return null;}
