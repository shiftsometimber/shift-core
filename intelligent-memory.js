import {analyseRelationshipPatterns} from './relationship-intelligence.js';

const MEMORY_MODEL='@cf/meta/llama-3.1-8b-instruct-fast';
const ALLOWED=new Set(['goal','preference','routine','motivator','blocker','social_context','food_preference','communication_preference','recurring_pattern','win','trigger','effective_strategy','avoid_strategy']);
const EXPLICIT_SENSITIVE=/\b(?:diagnos(?:is|ed)|symptom|pain|bleed(?:ing)?|vomit(?:ing)?|nausea|diarrh(?:ea|oea)|constipat(?:ion|ed)|blood pressure|heart rate|pulse|glucose|hba1c|cholesterol|bmi|body fat|weight\s*(?:is|of|=|:)?\s*\d|waist\s*(?:is|of|=|:)?\s*\d|kg\b|stone\b|st\b|lb\b|lbs\b|mmhg\b|mounjaro|wegovy|tirzepatide|semaglutide|medicine|medication|prescription|dose|dosage|tablet|injection|sex(?:ual)?|erection|libido|bank|card|account number|sort code|salary|income|debt|mortgage|postcode|address|street|road\b|avenue\b|api key|secret key|private key|password|passcode|pin\b|cvv)\b/i;

export async function ensureIntelligentMemorySchema(DB){
  await DB.batch([
    DB.prepare(`CREATE TABLE IF NOT EXISTS shift_ai_memory_v2 (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,memory_key TEXT NOT NULL,category TEXT NOT NULL,memory_value TEXT NOT NULL,confidence REAL NOT NULL DEFAULT 0.75,source TEXT NOT NULL DEFAULT 'conversation',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,memory_key))`),
    DB.prepare(`CREATE INDEX IF NOT EXISTS idx_shift_ai_memory_v2_user ON shift_ai_memory_v2(user_id,updated_at)`)
  ]);
}

export async function listIntelligentMemories(DB,userId,limit=40){
  await ensureIntelligentMemorySchema(DB);
  try{const {results}=await DB.prepare(`SELECT memory_key,category,memory_value,confidence,source,updated_at FROM shift_ai_memory_v2 WHERE user_id=? ORDER BY updated_at DESC LIMIT ?`).bind(userId,limit).all();return results||[];}catch{return[];}
}

export async function clearIntelligentMemories(DB,userId){await ensureIntelligentMemorySchema(DB);await DB.prepare('DELETE FROM shift_ai_memory_v2 WHERE user_id=?').bind(userId).run();}

export async function learnFromMessage(env,userId,message,{explicit=false}={}){
  const text=String(message||'').trim();
  if(!text||text.length<12||!env.AI)return {stored:0,patterns:0};
  if(/password|passcode|pin\b|cvv|card number|bank account|sort code|api key|secret key|private key/i.test(text))return {stored:0,patterns:0};
  if(/suicide|kill myself|end my life|want to die|self harm/i.test(text))return {stored:0,patterns:0};
  await ensureIntelligentMemorySchema(env.DB);
  let stored=0;
  if(explicit||looksMemoryWorthy(text)){
    const existing=await listIntelligentMemories(env.DB,userId,40);
    const system=`You extract durable relationship memories for Shift, a UK men's health and weight-management assistant. Return ONLY valid JSON: {"memories":[{"key":"...","category":"...","value":"...","confidence":0.0}]}.

Store only facts likely to be useful for weeks or months: goals, stable preferences, routines, motivators, blockers, recurring patterns explicitly stated by the member, food preferences, communication preferences, ordinary-life context, meaningful wins, known triggers, strategies the member says work, and approaches the member says do not work.

Allowed categories: goal, preference, routine, motivator, blocker, social_context, food_preference, communication_preference, recurring_pattern, win, trigger, effective_strategy, avoid_strategy.

Do NOT store transient states, guesses, one-off plans, exact symptoms, diagnoses, medication details, blood pressure, weight measurements, sexual details, financial information, passwords/secrets, addresses, or anything better kept in structured medical/programme records. Never infer sensitive attributes.

For effective_strategy/avoid_strategy/trigger, only store it from this single message when the member explicitly describes the repeated relationship (for example 'walking always clears my head' or 'calorie lectures never work for me'). Cross-message patterns are handled separately and require repeated evidence.

Use stable snake_case keys. If an existing memory covers the same fact, use the SAME key with a better current value. If nothing durable is present return {"memories":[]}.

Existing memories: ${JSON.stringify(existing.map(x=>({key:x.memory_key,category:x.category,value:x.memory_value})))}.`;
    try{
      const model=env.SHIFT_MEMORY_MODEL||MEMORY_MODEL,r=await env.AI.run(model,{messages:[{role:'system',content:system},{role:'user',content:text}],max_tokens:520,temperature:0.05}),parsed=parseJson(String(r?.response||r?.result?.response||'')),items=Array.isArray(parsed?.memories)?parsed.memories.slice(0,6):[];
      for(const item of items){
        const key=normaliseKey(item?.key),category=String(item?.category||''),value=String(item?.value||'').trim().slice(0,500),confidence=Math.max(0,Math.min(1,Number(item?.confidence)||0));
        if(!key||!ALLOWED.has(category)||!value||confidence<0.68)continue;
        await upsertMemory(env.DB,userId,{key,category,value,confidence,source:explicit?'explicit':'conversation'});
        stored++;
      }
    }catch(e){console.warn('shift_memory_learn_failed',e?.message);}
    if(explicit&&stored===0){
      const fallback=explicitSafeStrategy(text);
      if(fallback){await upsertMemory(env.DB,userId,fallback);stored=1;}
    }
  }
  const patternResult=await analyseRelationshipPatterns(env,userId);
  return {stored,patterns:Number(patternResult?.stored||0)};
}

async function upsertMemory(DB,userId,{key,category,value,confidence,source}){
  await DB.prepare(`INSERT INTO shift_ai_memory_v2(user_id,memory_key,category,memory_value,confidence,source,created_at,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(user_id,memory_key) DO UPDATE SET category=excluded.category,memory_value=excluded.memory_value,confidence=MAX(shift_ai_memory_v2.confidence,excluded.confidence),source=excluded.source,updated_at=CURRENT_TIMESTAMP`).bind(userId,key,category,value,confidence,source).run();
}

function explicitSafeStrategy(text){
  let value=String(text||'').trim().replace(/^\s*(?:remember(?:\s+(?:this|that))?\s*:?|don't forget\s*:?|dont forget\s*:?)\s*/i,'').trim();
  value=value.replace(/\s+/g,' ').slice(0,280);
  if(value.length<12||EXPLICIT_SENSITIVE.test(value))return null;
  const repeated=/\b(?:always|usually|normally|reliably|every time)\b/i.test(value);
  const helped=/\b(?:works? for me|helps? me|clears? my head|keeps? me on track|gets? me back on track|makes? (?:things|it|the day) easier)\b/i.test(value);
  if(!repeated||!helped)return null;
  const key=`explicit_strategy_${normaliseKey(value).slice(0,56)}`.slice(0,80);
  return{key,category:'effective_strategy',value,confidence:0.92,source:'explicit_fallback'};
}

function looksMemoryWorthy(s){return /\b(always|usually|normally|every |each |prefer|like|love|hate|can't stand|cant stand|goal|aim|target|trying to|want to|need to|motivates|keeps me|struggle with|tend to|weekends?|fridays?|sundays?|family|wife|partner|kids?|children|work shifts?|routine|habit|works for me|worked for me|helps me|doesn't work for me|doesnt work for me|never works|sets me off|triggers|dont like being told|prefer you)\b/i.test(s);}
function normaliseKey(v){const k=String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80);return k.length>=3?k:'';}
function parseJson(raw){try{return JSON.parse(raw)}catch{}const a=raw.indexOf('{'),b=raw.lastIndexOf('}');if(a>=0&&b>a){try{return JSON.parse(raw.slice(a,b+1))}catch{}}return null;}
