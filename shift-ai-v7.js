import v6 from './shift-ai-v6.js';

const RX_BOUNDARY=/\b(?:what|which|tell me|give me|recommend|choose|set|change|increase|decrease|double|halve|skip|take)\b[\s\S]{0,100}\b(?:dose|dosage|prescription|mounjaro|wegovy|tirzepatide|semaglutide|medicine|medication)\b|\b(?:override|ignore|go against)\b[\s\S]{0,80}\b(?:clinician|prescriber|doctor|pharmacist)\b/i;

export default {
  async fetch(request,env,ctx){
    const u=new URL(request.url),path=u.pathname.replace(/\/+$/,'')||'/';
    if(request.method==='POST'&&path==='/v1/shift-ai/chat'){
      const probe=request.clone();let body={};try{body=await probe.json()}catch{}
      const message=String(body?.message||'').trim();
      if(RX_BOUNDARY.test(message)){
        const auth=await v6.fetch(new Request(new URL('/v1/shift-ai/status',request.url),{method:'GET',headers:request.headers}),env,ctx);
        if(auth.status===401||auth.status===403)return auth;
        return cors(json({ok:true,answer:"I can explain general treatment information, side effects and what questions to take to the clinical team, but I can't choose or change a prescription dose for you. Follow the dose set by your prescribing clinician. If you're unsure what to take next, contact the clinical team before taking it.",mode:'safety',model:'Shift AI',version:'4.1-clinical-boundary',oneShiftBrain:true,clinicalBoundary:true,sources:[]}),request,env);
      }
    }
    return v6.fetch(request,env,ctx);
  }
};
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
function cors(r,request,env){const h=new Headers(r.headers),o=request.headers.get('Origin'),allowed=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com','https://hq.shiftsometimber.co.uk',...String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean)]);if(o&&allowed.has(o))h.set('Access-Control-Allow-Origin',o);h.set('Access-Control-Allow-Credentials','true');h.set('Vary','Origin');return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h})}
