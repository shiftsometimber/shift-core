import shiftAi from './shift-ai.js';

const MODEL='@cf/meta/llama-3.1-8b-instruct-fast';

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    const path=url.pathname.replace(/\/+$/,'')||'/';
    if(request.method==='POST'&&path==='/v1/hq/copilot') return hqCopilot(request,env,ctx);
    return shiftAi.fetch(request,env,ctx);
  }
};

async function hqCopilot(request,env,ctx){
  const authProbe=new Request(new URL('/v1/hq/me',request.url),{method:'GET',headers:request.headers});
  const auth=await shiftAi.fetch(authProbe,env,ctx);
  if(!auth.ok)return auth;
  const me=(await auth.json()).user;
  const body=await readJson(request);
  const question=String(body.question||'').trim().slice(0,6000);
  if(!question)return json({ok:false,error:'question_required'},400);

  const [stats,knowledge]=await Promise.all([hqStats(env.DB),retrieveKnowledge(env.DB,question)]);
  const system=`You are Shift AI inside Shift HQ, the internal operating intelligence for Shift Some Timber.\n\nVOICE: Original Shift voice. Sound like a normal UK bloke: warm, grounded, concise, dry observational humour when appropriate, straight-talking and human. The creative ingredients are ordinary British humour, Northern/Manc warmth, self-deprecation, resilience, confident brevity and compassion. Never imitate, impersonate, quote or claim to be Tyson Fury, Ricky Hatton, Liam or Noel Gallagher, Ricky Gervais, Lenny Henry, Peter Kay or any other real person. Avoid corporate AI waffle and American wellness language.\n\nROLE: Answer the actual question asked. Do not merely dump dashboard statistics. Use HQ operational context only when relevant. Use approved Shift Brain material when relevant and cite supplied [ShiftBrain:x:y] references. Be candid about what you do and do not know. If asked about a particular person's health or member record and that information is not supplied, say you do not have that personal record in this HQ Copilot context rather than inventing it.\n\nHEALTH: Do not diagnose or alter prescribed medication. Accuracy and safety beat humour.\n\nHQ USER: ${JSON.stringify({name:me?.name,role:me?.role})}\nHQ CONTEXT: ${JSON.stringify(stats)}\nAPPROVED SHIFT BRAIN: ${knowledge.map(k=>`[ShiftBrain:${k.document_id}:${k.id}] ${k.title}: ${String(k.content||'').slice(0,900)}`).join('\n')}`;

  if(!env.AI)return json({ok:false,error:'workers_ai_not_bound',message:'Cloudflare Workers AI binding is not available.'},503);
  try{
    const model=env.SHIFT_AI_MODEL||MODEL;
    const result=await env.AI.run(model,{messages:[{role:'system',content:system},{role:'user',content:question}],max_tokens:900,temperature:0.35});
    const answer=String(result?.response||result?.result?.response||'').trim();
    if(!answer)return json({ok:false,error:'empty_ai_response'},502);
    return json({ok:true,answer,model:`Shift AI · ${model}`,suggestions:knowledge.slice(0,3).map(k=>k.title),sources:knowledge.map(k=>({title:k.title,citation:`ShiftBrain:${k.document_id}:${k.id}`,trustTier:k.trust_tier}))});
  }catch(e){
    console.error('hq_copilot_workers_ai_failed',e?.message);
    return json({ok:false,error:'workers_ai_failed',message:'Shift AI could not generate a response just now.'},502);
  }
}

async function hqStats(DB){
  const safe=async(sql)=>{try{return await DB.prepare(sql).first()}catch{return null}};
  const [people,mot,orders,tickets,tasks]=await Promise.all([
    safe('SELECT COUNT(*) c FROM users'),
    safe("SELECT COUNT(*) c FROM users u WHERE NOT EXISTS (SELECT 1 FROM assessments a WHERE a.user_id=u.id)"),
    safe("SELECT COUNT(*) c FROM pharmacy_orders WHERE status NOT IN ('completed','cancelled')"),
    safe("SELECT COUNT(*) c FROM support_tickets WHERE status NOT IN ('closed','resolved')"),
    safe("SELECT COUNT(*) c FROM crm_tasks WHERE status!='done' AND due_at IS NOT NULL AND due_at < datetime('now')")
  ]);
  return {registeredPeople:Number(people?.c||0),withoutCompletedMot:Number(mot?.c||0),openOrders:Number(orders?.c||0),openSupportTickets:Number(tickets?.c||0),overdueTasks:Number(tasks?.c||0)};
}

async function retrieveKnowledge(DB,query){
  const tokens=[...new Set(String(query).toLowerCase().replace(/[^a-z0-9%]+/g,' ').split(/\s+/).filter(x=>x.length>3))].slice(0,10);
  if(!tokens.length)return[];
  try{
    const {results}=await DB.prepare(`SELECT c.id,c.document_id,c.content,d.title,d.source_uri,d.trust_tier FROM ai_knowledge_chunks c JOIN ai_knowledge_documents d ON d.id=c.document_id WHERE d.status='approved' ORDER BY d.trust_tier,c.id LIMIT 2500`).all();
    return(results||[]).map(r=>{const t=String(r.content||'').toLowerCase();const score=tokens.reduce((n,x)=>n+(t.includes(x)?1:0),0)+Math.max(0,5-Number(r.trust_tier||5));return{...r,score}}).filter(x=>x.score>1).sort((a,b)=>b.score-a.score||a.trust_tier-b.trust_tier).slice(0,5);
  }catch{return[]}
}

async function readJson(request){try{return await request.json()}catch{return{}}}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
