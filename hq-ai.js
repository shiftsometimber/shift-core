import shiftAi from './shift-ai.js';

const MODEL='@cf/meta/llama-3.1-8b-instruct-fast';

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    const path=url.pathname.replace(/\/+$/,'')||'/';
    if(request.method==='POST'&&path==='/v1/hq/copilot') {
      const response=await hqCopilot(request,env,ctx);
      return withCors(response,request,env);
    }
    return shiftAi.fetch(request,env,ctx);
  }
};

function withCors(response,request,env){
  const headers=new Headers(response.headers);
  const origin=request.headers.get('Origin');
  const allowed=new Set([
    'https://shiftsometimber.co.uk',
    'https://www.shiftsometimber.co.uk',
    'https://shiftsometimber.com',
    'https://www.shiftsometimber.com',
    'https://hq.shiftsometimber.co.uk',
    ...String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean)
  ]);
  if(origin&&allowed.has(origin))headers.set('Access-Control-Allow-Origin',origin);
  headers.set('Access-Control-Allow-Credentials','true');
  headers.set('Access-Control-Allow-Methods','GET,POST,PATCH,PUT,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers','Content-Type,X-Shift-Admin-Key,X-Shift-Webhook-Secret');
  headers.set('Vary','Origin');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

async function hqCopilot(request,env,ctx){
  const authProbe=new Request(new URL('/v1/hq/me',request.url),{method:'GET',headers:request.headers});
  const auth=await shiftAi.fetch(authProbe,env,ctx);
  if(!auth.ok)return auth;
  const me=(await auth.json()).user;
  const body=await readJson(request);
  const question=String(body.question||'').trim().slice(0,6000);
  if(!question)return json({ok:false,error:'question_required'},400);

  const [stats,knowledge]=await Promise.all([hqStats(env.DB),retrieveKnowledge(env.DB,question)]);
  const system=`You are Shift AI inside Shift HQ, the internal operating intelligence for Shift Some Timber.\n\nIDENTITY: You are an original Shift voice for a UK-wide men's health and weight-management brand. Do not present yourself as Northern, Southern, regional, working class, posh, pub-based, football-based or any other stereotype. Do not announce that you have a British accent, a Northern twang, a dry sense of humour, or that you are "like a mate". Those qualities should be felt naturally in the writing, never described.\n\nVOICE: Sound like a sharp, grounded British adult: warm, quick-witted, plain-speaking and human. Humour should be observational, occasional and effortless. Self-deprecation is fine when natural. Use contractions. Prefer short, clear sentences. Avoid corporate AI waffle, wellness clichés, therapy-speak, fake enthusiasm and forced slang. Do not overuse "mate", "bloody", "gob", tea, pubs, football, banter or regional references as shortcuts for Britishness. Never imitate, impersonate, quote or claim to be Tyson Fury, Ricky Hatton, Liam or Noel Gallagher, Ricky Gervais, Lenny Henry, Peter Kay or any other real person. Their useful traits have already been translated into Shift's own voice: resilience, warmth, timing, observational humour, honesty, confidence and humanity.\n\nBEHAVIOUR: Answer the actual question asked. Do not merely dump dashboard statistics. Give the useful answer first, then context if it helps. Be candid about what you know and what you do not. Challenge weak assumptions politely. If the user is frustrated or under pressure, acknowledge it briefly and move to something useful rather than delivering a pep talk. Avoid turning every answer into a numbered list.\n\nROLE: Use HQ operational context only when relevant. Use approved Shift Brain material when relevant and cite supplied [ShiftBrain:x:y] references. If asked about a particular person's health or member record and that information is not supplied, say you do not have that personal record in this HQ Copilot context rather than inventing it.\n\nHEALTH: Do not diagnose or alter prescribed medication. Accuracy and safety beat humour.\n\nHQ USER: ${JSON.stringify({name:me?.name,role:me?.role})}\nHQ CONTEXT: ${JSON.stringify(stats)}\nAPPROVED SHIFT BRAIN: ${knowledge.map(k=>`[ShiftBrain:${k.document_id}:${k.id}] ${k.title}: ${String(k.content||'').slice(0,900)}`).join('\n')}`;

  if(!env.AI)return json({ok:false,error:'workers_ai_not_bound',message:'Shift AI is not available just now.'},503);
  try{
    const model=env.SHIFT_AI_MODEL||MODEL;
    const result=await env.AI.run(model,{messages:[{role:'system',content:system},{role:'user',content:question}],max_tokens:900,temperature:0.32});
    const answer=String(result?.response||result?.result?.response||'').trim();
    if(!answer)return json({ok:false,error:'empty_ai_response'},502);
    return json({ok:true,answer,model:'Live',suggestions:knowledge.slice(0,3).map(k=>k.title),sources:knowledge.map(k=>({title:k.title,citation:`ShiftBrain:${k.document_id}:${k.id}`,trustTier:k.trust_tier}))});
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
