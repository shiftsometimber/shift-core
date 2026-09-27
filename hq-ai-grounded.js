import existing from './hq-ai.js';

const MODEL='@cf/meta/llama-3.1-8b-instruct-fast';

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    const path=url.pathname.replace(/\/+$/,'')||'/';
    if(request.method==='POST'&&path==='/v1/hq/copilot'){
      return groundedCopilot(request,env,ctx);
    }
    return existing.fetch(request,env,ctx);
  }
};

async function groundedCopilot(request,env,ctx){
  const authProbe=new Request(new URL('/v1/hq/me',request.url),{method:'GET',headers:request.headers});
  const auth=await existing.fetch(authProbe,env,ctx);
  if(!auth.ok)return auth;
  const me=(await auth.json()).user;
  const body=await readJson(request);
  const question=String(body.question||'').trim().slice(0,6000);
  if(!question)return withCors(json({ok:false,error:'question_required'},400),request,env);
  if(!env.AI)return withCors(json({ok:false,error:'workers_ai_not_bound',message:'Shift AI is not available just now.'},503),request,env);

  const facts={
    confirmedArchitecture:[
      'Shift Core on Cloudflare Workers',
      'Cloudflare Workers AI as the current inference engine',
      'Shift Brain knowledge layer',
      'member memory architecture',
      'Shift Shoulder behavioural layer',
      'Shift Academy and synthetic testing architecture',
      'Shift HQ internal interface',
      'member-facing Shift AI gateway'
    ],
    rule:'These are the only architecture components you may name unless they appear in the user message. Never invent module names, services, files, databases, queues, tests, APIs or infrastructure.'
  };

  const system=`You are Shift inside Shift HQ. Your job is to be useful, human and grounded in what is actually known.\n\nABSOLUTE GROUNDING RULE: Never invent facts in order to sound proactive. Never claim to have "taken a closer look" unless the supplied context contains that evidence. Never fabricate component names, modules, services, files, bugs, metrics, people, decisions or work already completed. If you do not know the detail, say that plainly and help at the level you can support. Unsupported specificity is worse than admitting a gap.\n\nCONFIRMED SHIFT ARCHITECTURE: ${JSON.stringify(facts.confirmedArchitecture)}\n\nPERSONALITY: Natural UK English. Warm, sharp, grounded, quick on the uptake. Show empathy without therapy-speak. Have a view when the known facts support one. Humour is occasional, not compulsory. Never imitate a celebrity or perform Britishness.\n\nPROACTIVENESS: The user should not need a magic prompt. If they sound fed up, tired, doubtful or overwhelmed, recognise it briefly and then do one genuinely useful thing. But useful does NOT mean inventing technical detail. When the detail is missing, give a grounded judgement and a concrete next step based only on confirmed facts.\n\nFOR THIS KIND OF QUESTION: If the user is questioning whether Shift is special or overcomplicated, you may say the differentiator is not the base model; it is the Shift-owned layers around it: Brain, memory, Shoulder behaviour, Academy/testing and the member relationship. You may recommend proving those in one end-to-end member conversation before adding more architecture. Do not name imaginary modules to remove.\n\nANTI-BOT: Avoid "It sounds like", "Have you considered", "How can I assist", generic coaching filler and service-desk endings. Do not finish with a question unless one is genuinely needed.\n\nHQ USER: ${JSON.stringify({name:me?.name,role:me?.role})}\n\nBefore sending, silently check every concrete factual claim. If it is not in the user message or confirmed context above, remove it or qualify it.`;

  try{
    const model=env.SHIFT_AI_MODEL||MODEL;
    const draft=await env.AI.run(model,{messages:[{role:'system',content:system},{role:'user',content:question}],max_tokens:900,temperature:0.42});
    let answer=String(draft?.response||draft?.result?.response||'').trim();
    if(!answer)return withCors(json({ok:false,error:'empty_ai_response'},502),request,env);

    const verifier=`You are Shift's factual verifier. Review the reply against ONLY the confirmed facts below and the user's own message. Remove or rewrite any invented specificity, including made-up module names, services, prior actions, technical findings or claims that Shift inspected something it was not given. Keep the warmth, opinion and proactive next step. Return only the corrected reply.\n\nCONFIRMED FACTS:${JSON.stringify(facts.confirmedArchitecture)}\nUSER:${question}\nDRAFT:${answer}`;
    const checked=await env.AI.run(model,{messages:[{role:'system',content:verifier},{role:'user',content:'Return the grounded final reply only.'}],max_tokens:900,temperature:0.2});
    const finalAnswer=String(checked?.response||checked?.result?.response||'').trim();
    if(finalAnswer)answer=finalAnswer;
    return withCors(json({ok:true,answer,model:'Live',mode:'grounded'}),request,env);
  }catch(e){
    console.error('hq_grounded_copilot_failed',e?.message);
    return withCors(json({ok:false,error:'workers_ai_failed',message:'Shift AI could not generate a response just now.'},502),request,env);
  }
}

function withCors(response,request,env){
  const headers=new Headers(response.headers);
  const origin=request.headers.get('Origin');
  const allowed=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com','https://hq.shiftsometimber.co.uk',...String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean)]);
  if(origin&&allowed.has(origin))headers.set('Access-Control-Allow-Origin',origin);
  headers.set('Access-Control-Allow-Credentials','true');
  headers.set('Access-Control-Allow-Methods','GET,POST,PATCH,PUT,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers','Content-Type,X-Shift-Admin-Key,X-Shift-Webhook-Secret');
  headers.set('Vary','Origin');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

async function readJson(request){try{return await request.json()}catch{return{}}}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
