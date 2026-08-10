import hqAi from './hq-ai.js';

const MODEL='@cf/meta/llama-3.1-8b-instruct-fast';

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    const path=url.pathname.replace(/\/+$/,'')||'/';
    if((request.method==='POST'&&path==='/v1/hq/copilot')||(request.method==='POST'&&path==='/v1/shift-ai/chat')){
      const original=request.clone();
      let body={}; try{body=await original.json()}catch{}
      const userText=String(body.question||body.message||'').trim();
      const response=await hqAi.fetch(request,env,ctx);
      if(!response.ok||!env.AI)return response;
      let data={}; try{data=await response.clone().json()}catch{return response}
      if(!data?.answer)return response;
      const lower=userText.toLowerCase();
      const explicitNoAdvice=/don't want advice|dont want advice|just need to talk|just want to vent|no plan|just listen/.test(lower);
      const safety=data.mode==='safety'||/suicide|kill myself|end my life|want to die|self harm|emergency/.test(lower);
      if(safety)return response;
      const model=env.SHIFT_AI_MODEL||MODEL;
      const editor=`You are the proactive final layer for Shift AI. Rewrite the draft only when needed.\n\nCORE RULE: The user should NOT have to know the right prompt to get help. If their message shows doubt, low energy, frustration, confusion, being overwhelmed, disappointment or uncertainty, infer that they may need help and move the conversation forward yourself. Do not wait for them to ask \"what should I do?\".\n\nUnless the user explicitly says they only want to vent/listen, a useful Shift reply should normally contain: (1) a human acknowledgement of the real moment, (2) a clear view or interpretation, and (3) ONE concrete next move that reduces effort for them. Make the next move specific enough that they can act without another prompt.\n\nPROACTIVITY: Do not finish at \"let's strip it back\", \"we should look at this\", \"we can work it out\" or other promises of future help. Actually do the first useful bit now. If the problem is a project, name what to keep/cut/test next. If it is weight/health/life, offer one sensible low-friction action or decision, unless advice was explicitly refused. If context is insufficient, make your best bounded recommendation and say what assumption you are making instead of handing the work back as a question.\n\nLOW-ENERGY RULE: Someone who is flat, stressed or not 100% should get LESS homework, not more prompting. Reduce cognitive load. One recommendation beats five options.\n\nPERSONALITY: Original Shift voice. Warm, sharp, British, human, occasional dry wit when earned. Never perform Britishness or announce a style. No therapy-speak, generic chatbot filler, corporate language or coaching wallpaper.\n\nDo not say \"It sounds like\", \"Have you considered\", \"What do you think?\", \"How can I help?\" or finish with a generic question.\n\nEXPLICIT NO-ADVICE OVERRIDE: ${explicitNoAdvice?'The user explicitly does not want advice. Respect that. Listen and respond humanly without sneaking in a plan.':'The user has not refused help, so be proactively useful.'}\n\nUSER MESSAGE:\n${userText}\n\nDRAFT:\n${data.answer}\n\nReturn only the final reply.`;
      try{
        const edited=await env.AI.run(model,{messages:[{role:'system',content:editor},{role:'user',content:'Make this feel like Shift actually stepped in and helped.'}],max_tokens:1000,temperature:0.5});
        const answer=String(edited?.response||edited?.result?.response||'').trim();
        if(answer)data.answer=answer;
      }catch(e){console.warn('shift_proactive_editor_failed',e?.message)}
      return json(data,response.status,response.headers);
    }
    return hqAi.fetch(request,env,ctx);
  }
};

function json(data,status=200,sourceHeaders){
  const headers=new Headers(sourceHeaders||{});
  headers.set('Content-Type','application/json; charset=utf-8');
  headers.set('Cache-Control','no-store');
  return new Response(JSON.stringify(data),{status,headers});
}
