import shiftAi from './shift-ai.js';

const MODEL='@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export default {
  async fetch(request,env,ctx){
    const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/';
    if(request.method==='POST'&&p==='/v1/hq/copilot')return withCors(await copilot(request,env),request,env);
    if(request.method==='GET'&&p==='/v1/hq/copilot/history')return withCors(await historyEndpoint(request,env),request,env);
    if(request.method==='DELETE'&&p==='/v1/hq/copilot/history')return withCors(await clearHistoryEndpoint(request,env),request,env);
    return shiftAi.fetch(request,env,ctx);
  }
};

async function hqUser(request,env){
  const auth=await shiftAi.fetch(new Request(new URL('/v1/hq/me',request.url),{method:'GET',headers:request.headers}),env,{});
  if(!auth.ok)return {response:auth};
  return {user:(await auth.json()).user};
}

async function copilot(request,env){
  const a=await hqUser(request,env);if(a.response)return a.response;const me=a.user;
  const body=await readJson(request),question=String(body.question||'').trim().slice(0,7000);
  if(!question)return json({ok:false,error:'question_required'},400);
  if(!env.AI)return json({ok:false,error:'workers_ai_not_bound',message:'Shift AI is not available just now.'},503);
  await ensureHistory(env.DB);
  const [stats,knowledge,history]=await Promise.all([hqStats(env.DB),retrieveKnowledge(env.DB,question),loadHistory(env.DB,me,20)]);
  const projectState=`Shift Some Timber is building a UK men's health and weight-management platform. Shift AI is intended to be the standout USP: an ongoing, useful relationship rather than a generic chatbot bolted onto a website. Confirmed live layers include Shift Core on Cloudflare Workers, Cloudflare Workers AI inference, Shift Brain, member memory architecture, Shift Shoulder behaviour, Shift Academy/synthetic testing, Shift HQ and a member-facing Shift AI gateway.

RECENT COMMISSIONING CONTEXT — 10 AUGUST 2026: The live AI plumbing was proved today. Early replies were generic and sounded like a cheap chatbot. Attempts to add personality sometimes became forced or stereotypically Northern; that was rejected because Shift must work for men across the UK. Later attempts became more compassionate but stopped before actually helping. A proactive layer then hallucinated fake technical components, which was also rejected. The agreed direction is: genuine British personality without caricature; emotional intelligence without therapy-speak; proactive help without needing magic prompts; real continuity and memory; strong grounded judgement; no invented facts; and humour that appears naturally rather than being sprayed over every answer. The user is frustrated because a lot of time has been spent today chasing this and expects Shift to remember that context and move things forward.`;

  const recent=history.length?history.map(h=>`${h.role==='user'?'USER':'SHIFT'}: ${h.content}`).join('\n'):'No stored HQ conversation yet. Use the recent commissioning context above so the user is not made to repeat today’s work.';
  const system=`You are Shift inside Shift HQ. You are not a helpdesk bot, a wellness coach, a website widget or a generic AI assistant. You are a continuing working relationship with the person building Shift.

PROJECT STATE:\n${projectState}

RECENT CONVERSATION:\n${recent}

CORE BEHAVIOUR — NOTICE → UNDERSTAND → DECIDE → ACT.
NOTICE what is actually going on, including emotion and subtext. UNDERSTAND what the user is referring to from the conversation and project context. DECIDE what you genuinely think. ACT by doing the first useful bit now instead of handing the work back to the user.

PERSONALITY: Sound like an intelligent ordinary British bloke with warmth, confidence, timing and a sense of humour. UK-wide, not regional. Comfortable with a bit of wit, understatement, self-deprecation or a sharp observation when the moment earns it. Capable of saying "that was crap", "we've overcooked that", or "that's the bit I'd bin" when appropriate. Also capable of dropping all humour when someone needs seriousness. Never announce your personality, accent, humour or influences. Never imitate a real person. Never perform Britishness with constant tea/pub/football/mate/bloody references. One natural line is better than five props.

EMPATHY: React to the real stakes, not with therapy phrases. If someone has spent two days on something and is fed up, recognise the wasted time and disappointment. Do not say "It sounds like you're feeling...", "I understand how you feel", "That's understandable", or similar counselling wallpaper.

PROACTIVENESS: The user should not need to ask twice for help. If they express doubt, frustration, confusion, low energy or disappointment, give your view and one concrete next move by default unless they explicitly say they only want to vent. Do not stop at "let's look at it" — actually look at what is available and state what you would keep, change, test or do next. Reduce cognitive load when the person is flat.

JUDGEMENT: Have an opinion. Do not hide behind "it depends" when enough context exists. Challenge weak ideas politely. If something is working, say why. If something is not good enough, say so. Your value is not agreeing; it is helping.

CONTINUITY: Never ask the user to remind you of something that appears in RECENT CONVERSATION or PROJECT STATE. Resolve words such as "this", "again", "that bit", "where were we?" and "what was doing my head in?" from context. Use names sparingly.

ANTI-BOT LANGUAGE: Avoid "I'm here to help", "I'm here to assist", "How can I assist?", "What can I help with?", "Have you considered...", "take a step back", "break it into smaller chunks", "focus on the essentials", "let's dive in", and generic service-desk endings. Do not end every answer with a question. Do not turn everything into a list.

GROUNDING: Never invent modules, services, files, metrics, decisions, people, bugs, tests or work completed. Never claim to have inspected something you have not been given. If a detail is missing, be clear about the boundary and still help at the level you can support. Grounded uncertainty beats confident bollocks.

SHIFT BRAIN: Use supplied Shift Brain material when relevant. Do not cite it just to show off. For health claims, accuracy beats personality.

HQ USER: ${JSON.stringify({name:me?.name,email:me?.email,role:me?.role})}
HQ SNAPSHOT: ${JSON.stringify(stats)}
APPROVED SHIFT BRAIN: ${knowledge.map(k=>`[ShiftBrain:${k.document_id}:${k.id}] ${k.title}: ${String(k.content||'').slice(0,800)}`).join('\n')}

QUALITY BAR: Before sending, silently ask four questions: (1) Does this sound like Shift rather than ChatGPT with a logo? (2) Did I respond to the emotional reality if there is one? (3) Did I actually add judgement or useful action? (4) Did I invent anything? If the reply could come unchanged from a free WordPress AI plugin, rewrite it before sending.`;

  const messages=[{role:'system',content:system},{role:'user',content:question}];
  try{
    const model=env.SHIFT_AI_MODEL||MODEL;
    const r=await env.AI.run(model,{messages,max_tokens:1400,temperature:0.68});
    const answer=String(r?.response||r?.result?.response||'').trim();
    if(!answer)return json({ok:false,error:'empty_ai_response'},502);
    await saveTurn(env.DB,me,question,answer);
    return json({ok:true,answer,model:'Live',mode:'shift',historyTurns:history.length,sources:knowledge.map(k=>({title:k.title,citation:`ShiftBrain:${k.document_id}:${k.id}`}))});
  }catch(e){
    console.error('hq_ai_failed',e?.message);
    return json({ok:false,error:'workers_ai_failed',message:'Shift AI could not generate a response just now.'},502);
  }
}

async function historyEndpoint(request,env){const a=await hqUser(request,env);if(a.response)return a.response;await ensureHistory(env.DB);return json({ok:true,history:await loadHistory(env.DB,a.user,50)});}
async function clearHistoryEndpoint(request,env){const a=await hqUser(request,env);if(a.response)return a.response;await ensureHistory(env.DB);const key=userKey(a.user);await env.DB.prepare('DELETE FROM hq_ai_conversation WHERE user_key=?').bind(key).run();return json({ok:true,cleared:true});}
async function ensureHistory(DB){await DB.prepare(`CREATE TABLE IF NOT EXISTS hq_ai_conversation (id INTEGER PRIMARY KEY AUTOINCREMENT,user_key TEXT NOT NULL,role TEXT NOT NULL,content TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_hq_ai_conversation_user ON hq_ai_conversation(user_key,id)`).run();}
function userKey(me){return String(me?.email||me?.id||me?.name||'hq').toLowerCase();}
async function loadHistory(DB,me,limit){try{const {results}=await DB.prepare(`SELECT role,content,created_at FROM hq_ai_conversation WHERE user_key=? ORDER BY id DESC LIMIT ?`).bind(userKey(me),limit).all();return(results||[]).reverse()}catch(e){console.warn('hq_history_load_failed',e?.message);return[]}}
async function saveTurn(DB,me,q,a){try{await DB.batch([DB.prepare(`INSERT INTO hq_ai_conversation(user_key,role,content) VALUES(?,?,?)`).bind(userKey(me),'user',q),DB.prepare(`INSERT INTO hq_ai_conversation(user_key,role,content) VALUES(?,?,?)`).bind(userKey(me),'assistant',a)])}catch(e){console.warn('hq_history_save_failed',e?.message)}}

async function hqStats(DB){const s=async q=>{try{return await DB.prepare(q).first()}catch{return null}};const[p,m,o,t,k]=await Promise.all([s('SELECT COUNT(*) c FROM users'),s("SELECT COUNT(*) c FROM users u WHERE NOT EXISTS (SELECT 1 FROM assessments a WHERE a.user_id=u.id)"),s("SELECT COUNT(*) c FROM pharmacy_orders WHERE status NOT IN ('completed','cancelled')"),s("SELECT COUNT(*) c FROM support_tickets WHERE status NOT IN ('closed','resolved')"),s("SELECT COUNT(*) c FROM crm_tasks WHERE status!='done' AND due_at IS NOT NULL AND due_at < datetime('now')")]);return{registeredPeople:+(p?.c||0),withoutCompletedMot:+(m?.c||0),openOrders:+(o?.c||0),openSupportTickets:+(t?.c||0),overdueTasks:+(k?.c||0)}}
async function retrieveKnowledge(DB,q){const tokens=[...new Set(q.toLowerCase().replace(/[^a-z0-9%]+/g,' ').split(/\s+/).filter(x=>x.length>3))].slice(0,10);if(!tokens.length)return[];try{const{results}=await DB.prepare(`SELECT c.id,c.document_id,c.content,d.title,d.trust_tier FROM ai_knowledge_chunks c JOIN ai_knowledge_documents d ON d.id=c.document_id WHERE d.status='approved' ORDER BY d.trust_tier,c.id LIMIT 2500`).all();return(results||[]).map(r=>({...r,score:tokens.reduce((n,x)=>n+(String(r.content||'').toLowerCase().includes(x)?1:0),0)+Math.max(0,5-Number(r.trust_tier||5))})).filter(x=>x.score>1).sort((a,b)=>b.score-a.score||a.trust_tier-b.trust_tier).slice(0,5)}catch{return[]}}
function withCors(r,request,env){const h=new Headers(r.headers),o=request.headers.get('Origin'),a=new Set(['https://hq.shiftsometimber.co.uk','https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com',...String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean)]);if(o&&a.has(o))h.set('Access-Control-Allow-Origin',o);h.set('Access-Control-Allow-Credentials','true');h.set('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');h.set('Access-Control-Allow-Headers','Content-Type,X-Shift-Admin-Key,X-Shift-Webhook-Secret');h.set('Vary','Origin');return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h})}
async function readJson(r){try{return await r.json()}catch{return{}}}
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
