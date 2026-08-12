import core from './worker.js';
import v5 from './shift-ai-v5.js';
import {buildShiftBrainContext} from './shift-brain-v1.js';
import {learnFromMessage} from './intelligent-memory.js';
import {getMemoryPrivacy} from './memory-privacy.js';
import {selectShoulderGear,shoulderInstruction} from './shoulder-v2.js';

const MODEL='@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const VERSION='4.0-one-shift-brain';

export default{async fetch(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(request.method==='POST'&&path==='/v1/shift-ai/chat')return chat(request,env,ctx);
  if(request.method==='GET'&&path==='/v1/shift-ai/status'){
    const r=await v5.fetch(request,env,ctx);if(!r.ok)return r;const d=await r.json().catch(()=>({}));return json({...d,version:VERSION,oneShiftBrain:true,canonicalContext:'one-shift-brain/v1'},r.status);
  }
  return v5.fetch(request,env,ctx);
}};

async function chat(request,env,ctx){
  const a=await auth(request,env,ctx);if(a.response)return a.response;
  const body=await read(request),message=String(body.message||'').trim().slice(0,7000);if(!message)return json({ok:false,error:'message_required'},400);
  const uid=Number(a.user.id),gear=selectShoulderGear(message),brain=await buildShiftBrainContext(env,uid,message,{knowledgeLimit:8}),history=await recentHistory(env.DB,uid,20);
  const noAdvice=/don't want advice|dont want advice|no advice|no plan|just listen|just need to vent|just want to vent/i.test(message);
  let answer='',model='shift-ai-fallback';
  if(env.AI){
    try{
      const selected=env.SHIFT_AI_MODEL||MODEL;
      const result=await env.AI.run(selected,{messages:[{role:'system',content:systemPrompt(brain,gear,noAdvice)},...history.map(x=>({role:x.direction==='user'?'user':'assistant',content:x.body})),{role:'user',content:message}],max_tokens:1400,temperature:gear.gear==='safety'?.12:gear.gear==='listen'?.5:.62});
      answer=String(result?.response||result?.result?.response||'').trim();model=selected;
    }catch(e){console.warn('shift_ai_v6_failed',e?.message);}
  }
  if(!answer)answer=brain.knowledge.items.length?'I have the relevant Shift-reviewed context, but the conversational engine is temporarily unavailable.':'Shift AI is temporarily unavailable. Your Shift data remains saved.';
  await saveConversation(env.DB,uid,gear.gear,message,answer,model);
  const privacy=await getMemoryPrivacy(env.DB,uid).catch(()=>({auto_memory:1})),explicit=body.remember===true||/\bremember (that|this)|don't forget|dont forget\b/i.test(message);
  if(Number(privacy.auto_memory)||explicit){const job=learnFromMessage(env,uid,message,{explicit});if(ctx?.waitUntil)ctx.waitUntil(job);else await job;}
  return cors(json({ok:true,answer,mode:gear.gear,model:'Shift AI',version:VERSION,oneShiftBrain:true,contextContract:brain.contract,memoryUsed:brain.memory.intelligent.length>0,feedbackUsed:(brain.behaviour.feedback.yay.length+brain.behaviour.feedback.nay.length)>0,activePlansUsed:Object.keys(brain.plans.active).length>0,sources:brain.knowledge.items.map(k=>({title:k.title,citation:k.citation,reviewState:k.reviewState,provenance:k.provenance}))}),request,env);
}

function systemPrompt(brain,gear,noAdvice){return `You are Shift, the personal intelligence inside Shift Some Timber. You are for ordinary UK men who want useful help without being turned into a health hobbyist.

ONE SHIFT BRAIN is authoritative. Use it quietly and only when relevant. Current member statements override older memories. Never invent personal or clinical facts. Health knowledge must come from reviewed/provenanced Shift knowledge supplied below. You are not the prescriber or clinician.

SHOULDER GEAR: ${gear.gear}. ${shoulderInstruction(gear)} Initiative: ${gear.initiative}. Humour: ${String(gear.humour)}.
${noAdvice?'The member explicitly does not want advice. Do not sneak a plan in.':'When a useful next move is obvious, give it without forcing another question.'}

STYLE: natural UK-wide bloke-to-bloke tone; calm, intelligent, plain-speaking, occasionally dry when earned. No therapy wallpaper, no service-desk filler, no generic motivational slogans. Answer the latest moment first.

MEMBER PROFILE/STATE: ${JSON.stringify(brain.member)}
LATEST/RECENT PROGRESS: ${JSON.stringify(brain.progress)}
ACTIVE PLANS: ${JSON.stringify(brain.plans.active)}
YAY/NAY BEHAVIOUR: ${JSON.stringify(brain.behaviour.feedback)}
INTELLIGENT MEMORY: ${JSON.stringify(brain.memory.intelligent)}
EXPLICIT NOTES: ${JSON.stringify(brain.memory.explicitNotes)}
REVIEWED KNOWLEDGE: ${brain.knowledge.items.map(k=>`[${k.citation}] ${k.title}: ${k.content}`).join('\n')}

FINAL CHECK: did I use the same trusted context Shift Today/Grub/Fit can use, respect current preferences and Nays, avoid inventing facts, keep clinical boundaries clear, and actually make the member's next few minutes easier?`}

async function recentHistory(DB,uid,limit){try{const {results=[]}=await DB.prepare(`SELECT direction,body,created_at FROM shift_ai_conversations WHERE user_id=? ORDER BY id DESC LIMIT ?`).bind(uid,limit).all();return results.reverse()}catch{return[]}}
async function saveConversation(DB,uid,mode,user,assistant,model){try{await DB.exec(`CREATE TABLE IF NOT EXISTS shift_ai_conversations (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,direction TEXT NOT NULL,mode TEXT NOT NULL DEFAULT 'coach',body TEXT NOT NULL,model TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);await DB.batch([DB.prepare(`INSERT INTO shift_ai_conversations(user_id,direction,mode,body,model,created_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(uid,'user',mode,user,null),DB.prepare(`INSERT INTO shift_ai_conversations(user_id,direction,mode,body,model,created_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(uid,'assistant',mode,assistant,model)])}catch(e){console.warn('shift_ai_history_save_failed',e?.message)}}
async function auth(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user}}
async function read(r){try{return await r.json()}catch{return{}}}
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
function cors(r,request,env){const h=new Headers(r.headers),o=request.headers.get('Origin'),allowed=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com','https://hq.shiftsometimber.co.uk',...String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean)]);if(o&&allowed.has(o))h.set('Access-Control-Allow-Origin',o);h.set('Access-Control-Allow-Credentials','true');h.set('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');h.set('Access-Control-Allow-Headers','Content-Type');h.set('Vary','Origin');return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h})}
