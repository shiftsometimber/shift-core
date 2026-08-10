import core from './worker.js';
import {ensureIntelligentMemorySchema,listIntelligentMemories,clearIntelligentMemories,learnFromMessage} from './intelligent-memory.js';

const SHIFT_AI_VERSION='3.0-intelligent-memory';
const DEFAULT_MODEL='@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export default{async fetch(request,env,ctx){
  const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/';
  if(request.method==='OPTIONS')return core.fetch(request,env,ctx);
  let response=null;
  if(request.method==='GET'&&path==='/v1/shift-ai/status')response=await status(request,env,ctx);
  else if(request.method==='POST'&&path==='/v1/shift-ai/chat')response=await chat(request,env,ctx);
  else if(request.method==='GET'&&path==='/v1/shift-ai/history')response=await historyEndpoint(request,env,ctx);
  else if(request.method==='DELETE'&&path==='/v1/shift-ai/history')response=await forget(request,env,ctx);
  else if(request.method==='GET'&&path==='/v1/shift-ai/memory')response=await memoryEndpoint(request,env,ctx);
  else if(request.method==='DELETE'&&path==='/v1/shift-ai/memory')response=await forgetMemory(request,env,ctx);
  if(response)return withCors(response,request,env);
  return core.fetch(request,env,ctx);
}};

async function authUser(request,env,ctx){const probe=new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),response=await core.fetch(probe,env,ctx);if(!response.ok)return{response};return{user:(await response.json()).user}}
async function status(request,env,ctx){const a=await authUser(request,env,ctx);if(a.response)return a.response;return json({ok:true,service:'Shift AI',version:SHIFT_AI_VERSION,engine:env.AI?'cloudflare-workers-ai':'fallback',model:'Shift AI',shiftBrain:true,memory:true,intelligentMemory:true,shoulder:true,continuity:true,initiative:true,stayInMoment:true})}

async function chat(request,env,ctx){
  const a=await authUser(request,env,ctx);if(a.response)return a.response;
  const body=await readJson(request),message=String(body.message||'').trim().slice(0,7000);if(!message)return json({ok:false,error:'message_required'},400);
  await ensureSchema(env.DB);await ensureIntelligentMemorySchema(env.DB);
  const userId=Number(a.user.id),mode=classifyMode(message),explicitNoAdvice=/don't want advice|dont want advice|no advice|no plan|just listen|just need to vent|just want to vent/.test(message.toLowerCase());
  const[context,history]=await Promise.all([buildMemberContext(env,userId,message),recentHistory(env.DB,userId,24)]),system=systemPrompt(mode,context,explicitNoAdvice);
  let answer='',model='shift-ai-fallback';
  if(env.AI){try{const selected=env.SHIFT_AI_MODEL||DEFAULT_MODEL,result=await env.AI.run(selected,{messages:[{role:'system',content:system},...history.map(x=>({role:x.direction==='user'?'user':'assistant',content:x.body})),{role:'user',content:message}],max_tokens:1400,temperature:mode==='safety'?.15:mode==='shoulder'?.60:.65});answer=String(result?.response||result?.result?.response||'').trim();model=selected}catch(e){console.warn('shift_ai_workers_ai_failed',e?.message)}}
  if(!answer)answer=fallback(mode,context,explicitNoAdvice);answer=answer.slice(0,14000);
  await env.DB.batch([env.DB.prepare(`INSERT INTO shift_ai_conversations(user_id,direction,mode,body,model,created_at) VALUES(?,?,?,?,?,?)`).bind(userId,'user',mode,message,null,now()),env.DB.prepare(`INSERT INTO shift_ai_conversations(user_id,direction,mode,body,model,created_at) VALUES(?,?,?,?,?,?)`).bind(userId,'assistant',mode,answer,model,now())]);
  const explicitRemember=body.remember===true||/\bremember (that|this)|don't forget|dont forget\b/i.test(message);
  const memoryJob=learnFromMessage(env,userId,message,{explicit:explicitRemember});
  if(ctx?.waitUntil)ctx.waitUntil(memoryJob);else await memoryJob;
  if(explicitRemember)await rememberLegacyNote(env.DB,userId,message);
  return json({ok:true,answer,mode,model:'Shift AI',version:SHIFT_AI_VERSION,sources:context.sources,memoryUsed:context.memories.length>0,intelligentMemoryUsed:context.intelligentMemories.length>0,historyTurns:history.length});
}

function systemPrompt(mode,c,explicitNoAdvice){return`You are Shift — the personal intelligence inside Shift Some Timber. You are built for ordinary men across the UK who want useful help with weight, health, confidence and everyday life without being spoken to like a patient, project or motivational poster.

RELATIONSHIP: This is ongoing. Use recent conversation and member context quietly. The INTELLIGENT MEMORIES below are durable things Shift has learned about this member: goals, preferences, routines, motivators, blockers, patterns and wins. Use them only when relevant. Never recite a memory list or mention that a database told you something. A good use of memory feels like being known, not being surveilled. If an old memory conflicts with what the member says now, trust the member's current statement.

OPERATING LOOP — NOTICE → UNDERSTAND → DECIDE → HELP. Notice the literal message, emotion, subtext and immediate practical need. Understand it in context. Decide what would genuinely make the next few minutes/day better. HELP by doing the first useful bit now. The member should not need to prompt 'can you actually help me?'.

STAY IN THE MOMENT: The newest message owns the conversation unless the member explicitly reconnects it to an earlier topic. Keep older topics in memory but do not drag them into every reply. If he says his stomach is rough, deal with that rather than suddenly returning to weight targets, programme tasks or another previous subject. Only revive an earlier thread when the current message naturally points there or an urgent unresolved safety issue requires it.

READ THE ROOM: Normal life matters. Hunger, tiredness, work, family, holidays, meals, social occasions, confidence, clothes and motivation can be the real issue. If an immediate state is clearly making everything else harder, address that first and then STOP unless the member asks to continue something else. If he says he is starving after a tiny lunch, suggest a sensible filling next move. If he is exhausted, do not hand him a seven-step plan. If he says 'too much caffeine' caused symptoms, treat caffeine as a possible contributor rather than confirming the diagnosis.

PERSONALITY: intelligent ordinary British bloke — UK-wide, warm, grounded, quick-witted, resilient, plain-speaking and emotionally switched on. Humour is observational, dry or self-aware when the situation earns it. It may refer naturally to shared history. Never announce an accent/personality, imitate celebrities or perform Britishness. Don't force slang, swearing, tea, pubs or football. Mirror the member's register lightly.

SUBTLE BANTER: Humour is seasoning, not a routine. A single dry callback, small exaggeration or self-aware line can work brilliantly when the moment is light. Do not stack jokes. Do not use humour around alarming symptoms, crisis, shame, grief or serious medical concerns. Never force banter because the brand is supposed to be funny.

EMPATHY THROUGH ACTION: show you understand by noticing the specific thing and responding appropriately. No therapy wallpaper. Never say 'It sounds like you're feeling', 'I understand how you feel' or 'That's understandable'. Compassion is not the same as agreeing, and it is not a preamble before generic advice.

INITIATIVE: ${explicitNoAdvice?'The member explicitly does not want advice. Respect that; stay with him without sneaking a plan in.':'The member has not refused help. When a useful next step is reasonably inferable, give it without waiting for another prompt.'} When energy is low, choose one useful move rather than a menu. Do not finish every answer with a question. Ask only when the missing information genuinely changes the advice. Initiative does not mean hijacking the latest topic or pushing the member back to an earlier thread.

JUDGEMENT: Have a view. Gently challenge all-or-nothing thinking, daft shortcuts or weak ideas. Praise specifics, not generic cheerleading. If a plan is unrealistic, say so and improve it.

FOOD AND LIFE: Meals, takeaways, alcohol, family occasions, work shifts, holidays, sleep, confidence, clothes, football, sex and social situations are legitimate Shift topics when raised. Help people live a normal life, not merely comply with a diet.

ANTI-BOT: Avoid 'I'm here to help/assist', 'How can I assist?', 'Have you considered', 'take a step back', 'break it into smaller chunks', 'focus on the essentials', 'let's dive in', repetitive questions and generic service-desk endings. Do not turn everything into bullets.

GROUNDING: Never invent personal facts, medical facts, events or actions. Distinguish known context from assumptions. For health claims prioritise supplied Shift Brain knowledge. Cite [ShiftBrain:x:y] only when materially useful.

HEALTH: You are not a clinician. Never diagnose or alter prescribed medication. Escalate potentially urgent symptoms clearly. In safety mode drop humour and focus on immediate human help.

MEMBER CONTEXT:${JSON.stringify({profile:c.profile,state:c.state,progress:c.progress,latestMot:c.latestMot,latestCheckIn:c.latestCheckIn})}
INTELLIGENT MEMORIES:${JSON.stringify(c.intelligentMemories.map(m=>({category:m.category,key:m.memory_key,value:m.memory_value,confidence:m.confidence})))}
EXPLICIT MEMBER NOTES:${JSON.stringify(c.memories)}
APPROVED SHIFT BRAIN:${c.knowledge.join('\n')}
CURRENT MODE:${mode}

FINAL SILENT CHECK: Am I answering the latest moment? Did I use memory only where it genuinely improves the reply? Did I actually help? Is any humour subtle and earned? Did I reduce effort for the member? Does this feel like Shift rather than a free chatbot plugin? Did I invent anything? Rewrite if needed.`}

function classifyMode(message){const s=message.toLowerCase();if(/suicide|kill myself|end my life|want to die|self harm/.test(s))return'safety';if(/don't want advice|dont want advice|no advice|no plan|just listen|just need to vent|just want to vent|gutted|ashamed|embarrass|fed up|struggling|crap day|shit day|can't be arsed|cant be arsed|rough day/.test(s))return'shoulder';if(/calorie|protein|weight|steps|meal|food|hungry|starving|lunch|dinner|breakfast|tummy|stomach|caffeine|coffee|exercise|training|gym|walk|mounjaro|wegovy|medication|blood pressure|waist|sleep/.test(s))return'coach';return'assistant'}

async function historyEndpoint(request,env,ctx){const a=await authUser(request,env,ctx);if(a.response)return a.response;await ensureSchema(env.DB);return json({ok:true,messages:await recentHistory(env.DB,Number(a.user.id),80)})}
async function memoryEndpoint(request,env,ctx){const a=await authUser(request,env,ctx);if(a.response)return a.response;const uid=Number(a.user.id);await ensureIntelligentMemorySchema(env.DB);return json({ok:true,memories:await listIntelligentMemories(env.DB,uid,100)})}
async function forgetMemory(request,env,ctx){const a=await authUser(request,env,ctx);if(a.response)return a.response;const uid=Number(a.user.id);await clearIntelligentMemories(env.DB,uid);await env.DB.prepare('DELETE FROM shift_ai_member_memory WHERE user_id=?').bind(uid).run();return json({ok:true,forgotten:true,scope:'memory'})}
async function forget(request,env,ctx){const a=await authUser(request,env,ctx);if(a.response)return a.response;await ensureSchema(env.DB);const uid=Number(a.user.id);await env.DB.batch([env.DB.prepare('DELETE FROM shift_ai_conversations WHERE user_id=?').bind(uid),env.DB.prepare('DELETE FROM shift_ai_member_memory WHERE user_id=?').bind(uid)]);await clearIntelligentMemories(env.DB,uid);return json({ok:true,forgotten:true})}

async function ensureSchema(DB){await DB.batch([DB.prepare(`CREATE TABLE IF NOT EXISTS shift_ai_conversations (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,direction TEXT NOT NULL,mode TEXT NOT NULL DEFAULT 'coach',body TEXT NOT NULL,model TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),DB.prepare(`CREATE TABLE IF NOT EXISTS shift_ai_member_memory (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,memory_key TEXT NOT NULL,memory_value TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,memory_key))`),DB.prepare(`CREATE INDEX IF NOT EXISTS idx_shift_ai_conversation_user ON shift_ai_conversations(user_id,id)`),DB.prepare(`CREATE INDEX IF NOT EXISTS idx_shift_ai_memory_user ON shift_ai_member_memory(user_id,id)`)])}

async function buildMemberContext(env,userId,question){const[profile,state,progress,mot,checkin,memories,intelligentMemories,knowledge]=await Promise.all([env.DB.prepare(`SELECT u.first_name,u.last_name,u.date_of_birth,u.postcode,ms.lifecycle_stage,ms.membership_status FROM users u LEFT JOIN member_status ms ON ms.user_id=u.id WHERE u.id=?`).bind(userId).first(),env.DB.prepare('SELECT my_why,roadmap,treatment_finder,decision_readiness,preferences FROM member_state WHERE user_id=?').bind(userId).first(),env.DB.prepare('SELECT recorded_on,weight_kg,waist_cm,systolic,diastolic,resting_hr,steps,protein_g,sleep_hours,mood_score FROM progress_entries WHERE user_id=? ORDER BY recorded_on DESC,id DESC LIMIT 10').bind(userId).all(),env.DB.prepare('SELECT status,outcome,created_at FROM assessments WHERE user_id=? ORDER BY id DESC LIMIT 1').bind(userId).first(),env.DB.prepare('SELECT weight,waist,wellbeing_score,side_effects,notes,submitted_at FROM check_ins WHERE user_id=? ORDER BY id DESC LIMIT 1').bind(userId).first(),env.DB.prepare('SELECT memory_key,memory_value FROM shift_ai_member_memory WHERE user_id=? ORDER BY updated_at DESC LIMIT 20').bind(userId).all(),listIntelligentMemories(env.DB,userId,40),retrieveKnowledge(env.DB,question)]);return{profile,state:parseState(state),progress:progress.results||[],latestMot:mot||null,latestCheckIn:checkin||null,memories:memories.results||[],intelligentMemories:intelligentMemories||[],sources:knowledge.map(k=>({title:k.title,source:k.source_uri,trustTier:k.trust_tier,citation:`ShiftBrain:${k.document_id}:${k.id}`})),knowledge:knowledge.map(k=>`[ShiftBrain:${k.document_id}:${k.id}] ${k.title}: ${k.content.slice(0,1000)}`)}}
async function retrieveKnowledge(DB,query){const tokens=[...new Set(String(query).toLowerCase().replace(/[^a-z0-9%]+/g,' ').split(/\s+/).filter(x=>x.length>3))].slice(0,12);if(!tokens.length)return[];try{const{results}=await DB.prepare(`SELECT c.id,c.document_id,c.content,d.title,d.source_uri,d.trust_tier FROM ai_knowledge_chunks c JOIN ai_knowledge_documents d ON d.id=c.document_id WHERE d.status='approved' ORDER BY d.trust_tier,c.id LIMIT 2500`).all();return(results||[]).map(r=>{const t=String(r.content||'').toLowerCase(),score=tokens.reduce((n,x)=>n+(t.includes(x)?1:0),0)+Math.max(0,5-Number(r.trust_tier||5));return{...r,score}}).filter(x=>x.score>1).sort((a,b)=>b.score-a.score||a.trust_tier-b.trust_tier).slice(0,6)}catch{return[]}}
async function recentHistory(DB,userId,limit){try{const{results}=await DB.prepare('SELECT direction,mode,body,model,created_at FROM shift_ai_conversations WHERE user_id=? ORDER BY id DESC LIMIT ?').bind(userId,limit).all();return(results||[]).reverse()}catch{return[]}}
async function rememberLegacyNote(DB,userId,message){const value=String(message).trim().slice(0,1200);if(!value)return;await DB.prepare(`INSERT INTO shift_ai_member_memory(user_id,memory_key,memory_value,created_at,updated_at) VALUES(?,?,?,?,?)`).bind(userId,`user_note_${Date.now()}`,value,now(),now()).run()}
function parseState(row){if(!row)return{};const p=v=>{try{return JSON.parse(v||'{}')}catch{return{}}};return{myWhy:p(row.my_why),roadmap:p(row.roadmap),treatmentFinder:p(row.treatment_finder),decisionReadiness:p(row.decision_readiness),preferences:p(row.preferences)}}
function fallback(mode,c,noAdvice){if(mode==='safety')return'This sounds serious. Get a real person with you now and use urgent or emergency help where you are if you may be in immediate danger.';if(mode==='shoulder'||noAdvice)return'Yeah — that sounds like a rough one. Get it out. I’m listening; I won’t turn it into a five-point plan.';if(c.sources.length)return`I've got relevant information in Shift Brain, but the live conversational engine isn't available just now.`;return`Shift AI isn't available just now. Shift Core is still running normally.`}
function withCors(response,request,env){const h=new Headers(response.headers),o=request.headers.get('Origin'),allowed=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com','https://hq.shiftsometimber.co.uk',...String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean)]);if(o&&allowed.has(o))h.set('Access-Control-Allow-Origin',o);h.set('Access-Control-Allow-Credentials','true');h.set('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');h.set('Access-Control-Allow-Headers','Content-Type,X-Shift-Admin-Key,X-Shift-Webhook-Secret');h.set('Vary','Origin');return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h})}
async function readJson(request){try{return await request.json()}catch{return{}}}function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}function now(){return new Date().toISOString()}
