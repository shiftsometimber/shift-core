import core from './worker.js';

const SHIFT_AI_VERSION='2.0-relationship';
const DEFAULT_MODEL='@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/';
    if(request.method==='OPTIONS')return core.fetch(request,env,ctx);
    let response=null;
    if(request.method==='GET'&&path==='/v1/shift-ai/status')response=await status(request,env,ctx);
    else if(request.method==='POST'&&path==='/v1/shift-ai/chat')response=await chat(request,env,ctx);
    else if(request.method==='GET'&&path==='/v1/shift-ai/history')response=await historyEndpoint(request,env,ctx);
    else if(request.method==='DELETE'&&path==='/v1/shift-ai/history')response=await forget(request,env,ctx);
    if(response)return withCors(response,request,env);
    return core.fetch(request,env,ctx);
  }
};

async function authUser(request,env,ctx){const probe=new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers});const response=await core.fetch(probe,env,ctx);if(!response.ok)return{response};const data=await response.json();return{user:data.user};}
async function status(request,env,ctx){const a=await authUser(request,env,ctx);if(a.response)return a.response;return json({ok:true,service:'Shift AI',version:SHIFT_AI_VERSION,engine:env.AI?'cloudflare-workers-ai':'fallback',model:'Shift AI',shiftBrain:true,memory:true,shoulder:true,continuity:true});}

async function chat(request,env,ctx){
  const a=await authUser(request,env,ctx);if(a.response)return a.response;
  const body=await readJson(request),message=String(body.message||'').trim().slice(0,7000);if(!message)return json({ok:false,error:'message_required'},400);
  await ensureSchema(env.DB);
  const userId=Number(a.user.id),mode=classifyMode(message),explicitNoAdvice=/don't want advice|dont want advice|no advice|no plan|just listen|just need to vent|just want to vent/.test(message.toLowerCase());
  const [context,history]=await Promise.all([buildMemberContext(env,userId,message),recentHistory(env.DB,userId,20)]);
  const system=systemPrompt(mode,context,explicitNoAdvice);
  let answer='',model='shift-ai-fallback';
  if(env.AI){
    try{
      const selected=env.SHIFT_AI_MODEL||DEFAULT_MODEL;
      const result=await env.AI.run(selected,{messages:[{role:'system',content:system},...history.map(x=>({role:x.direction==='user'?'user':'assistant',content:x.body})),{role:'user',content:message}],max_tokens:1400,temperature:mode==='safety'?0.15:mode==='shoulder'?0.58:0.64});
      answer=String(result?.response||result?.result?.response||'').trim();model=selected;
    }catch(e){console.warn('shift_ai_workers_ai_failed',e?.message);}
  }
  if(!answer)answer=fallback(mode,context,explicitNoAdvice);
  answer=answer.slice(0,14000);
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO shift_ai_conversations(user_id,direction,mode,body,model,created_at) VALUES(?,?,?,?,?,?)`).bind(userId,'user',mode,message,null,now()),
    env.DB.prepare(`INSERT INTO shift_ai_conversations(user_id,direction,mode,body,model,created_at) VALUES(?,?,?,?,?,?)`).bind(userId,'assistant',mode,answer,model,now())
  ]);
  await rememberUsefulFacts(env.DB,userId,message,body.remember===true);
  return json({ok:true,answer,mode,model:'Shift AI',version:SHIFT_AI_VERSION,sources:context.sources,memoryUsed:context.memories.length>0,historyTurns:history.length});
}

function systemPrompt(mode,c,explicitNoAdvice){
  return `You are Shift — the personal intelligence inside Shift Some Timber. You are built for ordinary men across the UK who want help with weight, health, confidence and everyday life, without being spoken to like a patient, a project or a motivational poster.

RELATIONSHIP: This is an ongoing relationship. Use the recent conversation and member context quietly. Remember what has already been said. Do not make the member repeat himself to unlock useful help. Never recite his data back simply to prove you know it.

CORE BEHAVIOUR — NOTICE → UNDERSTAND → DECIDE → ACT.
NOTICE the emotional temperature and what the bloke is really saying. UNDERSTAND the context. DECIDE what would genuinely help. ACT by doing the first useful bit now. If he sounds flat, fed up, embarrassed, worried, confused or overwhelmed, reduce the effort required from him. He should not need the perfect prompt.

PERSONALITY: Sound like an intelligent ordinary British bloke: warm, grounded, quick-witted, resilient, plain-speaking and emotionally switched on. UK-wide, not regional. Humour is observational, dry or self-aware when the moment earns it, never a routine. Straight-talking without aggression. Compassion without therapy-speak. Encouragement without "you've got this" wallpaper. Never announce your accent, humour, personality or famous influences. Never imitate a real person. Never force Britishness with constant mate/bloody/pub/tea/football references.

HOW SHIFT SHOULD FEEL: sometimes a knowledgeable guide, sometimes a sharp sounding-board, sometimes the bloke who gives you a nudge, sometimes the one who simply stays with you when the day is crap. Do not use the same tone for every situation.

PROACTIVENESS: Unless the member explicitly refuses advice, do not stop one sentence before the useful bit. Give a sensible recommendation, calculation, next move, reframing or decision when one is available. When energy seems low, one useful next move beats five options. Do not finish every reply with a question.

NO-ADVICE OVERRIDE: ${explicitNoAdvice?'The member has explicitly said he does not want advice. Respect that completely. Listen and respond humanly without sneaking a plan in.':'The member has not refused help. Be proactively useful when the message calls for it.'}

ANTI-BOT LANGUAGE: Avoid "It sounds like you're feeling", "I understand how you feel", "How can I assist?", "I'm here to help", "Have you considered", "take a step back", "break it into smaller chunks", "focus on the essentials", "let's dive in", and generic service-desk endings. Do not turn every reply into bullet points.

FOOD AND LIFE: Meals, takeaways, alcohol, family occasions, work, holidays, sleep, confidence, clothes, football, sex, social situations and the messy reality of normal life are legitimate Shift topics when the member brings them up. Do not narrow yourself to diet coaching.

GROUNDING: Never invent personal facts, medical facts, events or actions. If context is missing, say what you know and what you are assuming. For health claims, prioritise supplied Shift Brain knowledge and lower trust-tier numbers. Cite [ShiftBrain:x:y] references only when materially useful.

HEALTH: You are not a clinician. Never diagnose or alter prescribed medication. If symptoms may be urgent, be clear and safety-first. If CURRENT MODE is safety, drop humour and focus on immediate human help.

MEMBER CONTEXT: ${JSON.stringify({profile:c.profile,state:c.state,progress:c.progress,latestMot:c.latestMot,latestCheckIn:c.latestCheckIn,memories:c.memories})}
APPROVED SHIFT BRAIN: ${c.knowledge.join('\n')}
CURRENT MODE: ${mode}

QUALITY BAR: Before sending, silently ask: did I read the room; did I remember the context; did I actually help; does this sound like a human relationship rather than a free chatbot plugin; did I invent anything? Rewrite if needed.`;
}

function classifyMode(message){const s=message.toLowerCase();if(/suicide|kill myself|end my life|want to die|self harm/.test(s))return'safety';if(/don't want advice|dont want advice|no advice|no plan|just listen|just need to vent|just want to vent|gutted|ashamed|embarrass|fed up|struggling|crap day|shit day|can't be arsed|cant be arsed|low|rough day/.test(s))return'shoulder';if(/calorie|protein|weight|steps|meal|food|exercise|training|gym|walk|mounjaro|wegovy|medication|blood pressure|waist|sleep/.test(s))return'coach';return'assistant';}

async function historyEndpoint(request,env,ctx){const a=await authUser(request,env,ctx);if(a.response)return a.response;await ensureSchema(env.DB);const rows=await recentHistory(env.DB,Number(a.user.id),80);return json({ok:true,messages:rows});}
async function forget(request,env,ctx){const a=await authUser(request,env,ctx);if(a.response)return a.response;await ensureSchema(env.DB);const uid=Number(a.user.id);await env.DB.batch([env.DB.prepare('DELETE FROM shift_ai_conversations WHERE user_id=?').bind(uid),env.DB.prepare('DELETE FROM shift_ai_member_memory WHERE user_id=?').bind(uid)]);return json({ok:true,forgotten:true});}

async function ensureSchema(DB){await DB.batch([
 DB.prepare(`CREATE TABLE IF NOT EXISTS shift_ai_conversations (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,direction TEXT NOT NULL,mode TEXT NOT NULL DEFAULT 'coach',body TEXT NOT NULL,model TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
 DB.prepare(`CREATE TABLE IF NOT EXISTS shift_ai_member_memory (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,memory_key TEXT NOT NULL,memory_value TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,memory_key))`),
 DB.prepare(`CREATE INDEX IF NOT EXISTS idx_shift_ai_conversation_user ON shift_ai_conversations(user_id,id)`),
 DB.prepare(`CREATE INDEX IF NOT EXISTS idx_shift_ai_memory_user ON shift_ai_member_memory(user_id,id)`)
]);}

async function buildMemberContext(env,userId,question){const[profile,state,progress,mot,checkin,memories,knowledge]=await Promise.all([
 env.DB.prepare(`SELECT u.first_name,u.last_name,u.date_of_birth,u.postcode,ms.lifecycle_stage,ms.membership_status FROM users u LEFT JOIN member_status ms ON ms.user_id=u.id WHERE u.id=?`).bind(userId).first(),
 env.DB.prepare('SELECT my_why,roadmap,treatment_finder,decision_readiness,preferences FROM member_state WHERE user_id=?').bind(userId).first(),
 env.DB.prepare('SELECT recorded_on,weight_kg,waist_cm,systolic,diastolic,resting_hr,steps,protein_g,sleep_hours,mood_score FROM progress_entries WHERE user_id=? ORDER BY recorded_on DESC,id DESC LIMIT 10').bind(userId).all(),
 env.DB.prepare('SELECT status,outcome,created_at FROM assessments WHERE user_id=? ORDER BY id DESC LIMIT 1').bind(userId).first(),
 env.DB.prepare('SELECT weight,waist,wellbeing_score,side_effects,notes,submitted_at FROM check_ins WHERE user_id=? ORDER BY id DESC LIMIT 1').bind(userId).first(),
 env.DB.prepare('SELECT memory_key,memory_value FROM shift_ai_member_memory WHERE user_id=? ORDER BY updated_at DESC LIMIT 30').bind(userId).all(),retrieveKnowledge(env.DB,question)]);
 return{profile,state:parseState(state),progress:progress.results||[],latestMot:mot||null,latestCheckIn:checkin||null,memories:memories.results||[],sources:knowledge.map(k=>({title:k.title,source:k.source_uri,trustTier:k.trust_tier,citation:`ShiftBrain:${k.document_id}:${k.id}`})),knowledge:knowledge.map(k=>`[ShiftBrain:${k.document_id}:${k.id}] ${k.title}: ${k.content.slice(0,1000)}`)};}
async function retrieveKnowledge(DB,query){const tokens=[...new Set(String(query).toLowerCase().replace(/[^a-z0-9%]+/g,' ').split(/\s+/).filter(x=>x.length>3))].slice(0,12);if(!tokens.length)return[];try{const{results}=await DB.prepare(`SELECT c.id,c.document_id,c.content,d.title,d.source_uri,d.trust_tier FROM ai_knowledge_chunks c JOIN ai_knowledge_documents d ON d.id=c.document_id WHERE d.status='approved' ORDER BY d.trust_tier,c.id LIMIT 2500`).all();return(results||[]).map(r=>{const t=String(r.content||'').toLowerCase(),score=tokens.reduce((n,x)=>n+(t.includes(x)?1:0),0)+Math.max(0,5-Number(r.trust_tier||5));return{...r,score}}).filter(x=>x.score>1).sort((a,b)=>b.score-a.score||a.trust_tier-b.trust_tier).slice(0,6)}catch{return[]}}
async function recentHistory(DB,userId,limit){try{const{results}=await DB.prepare('SELECT direction,mode,body,model,created_at FROM shift_ai_conversations WHERE user_id=? ORDER BY id DESC LIMIT ?').bind(userId,limit).all();return(results||[]).reverse()}catch{return[]}}
async function rememberUsefulFacts(DB,userId,message,explicit){if(!explicit)return;const value=String(message).trim().slice(0,1200);if(!value)return;const key=`user_note_${Date.now()}`;await DB.prepare(`INSERT INTO shift_ai_member_memory(user_id,memory_key,memory_value,created_at,updated_at) VALUES(?,?,?,?,?)`).bind(userId,key,value,now(),now()).run();}
function parseState(row){if(!row)return{};const p=v=>{try{return JSON.parse(v||'{}')}catch{return{}}};return{myWhy:p(row.my_why),roadmap:p(row.roadmap),treatmentFinder:p(row.treatment_finder),decisionReadiness:p(row.decision_readiness),preferences:p(row.preferences)}}
function fallback(mode,c,noAdvice){if(mode==='safety')return'This sounds serious. Get a real person with you now and use urgent or emergency help where you are if you may be in immediate danger.';if(mode==='shoulder'||noAdvice)return'Yeah — that sounds like a rough one. Get it out. I’m listening; I won’t turn it into a five-point plan.';if(c.sources.length)return`I've got relevant information in Shift Brain, but the live conversational engine isn't available just now.`;return`Shift AI isn't available just now. Shift Core is still running normally.`;}
function withCors(response,request,env){const h=new Headers(response.headers),o=request.headers.get('Origin'),allowed=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com','https://hq.shiftsometimber.co.uk',...String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean)]);if(o&&allowed.has(o))h.set('Access-Control-Allow-Origin',o);h.set('Access-Control-Allow-Credentials','true');h.set('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');h.set('Access-Control-Allow-Headers','Content-Type,X-Shift-Admin-Key,X-Shift-Webhook-Secret');h.set('Vary','Origin');return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
async function readJson(request){try{return await request.json()}catch{return{}}}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
function now(){return new Date().toISOString();}
