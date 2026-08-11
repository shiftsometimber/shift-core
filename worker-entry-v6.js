import hq from './hq-ai.js';
import {runScheduledIntelligence} from './scheduled-intelligence.js';
import {memberCommissioningRoute} from './member-commissioning-v1.js';
import {shiftVisualiseRoutes} from './shift-visualise-v1.js';
import {memberProductV5Routes} from './member-product-v5.js';
import {memberDailyV2Routes} from './member-daily-v2.js';
import {personalRoutes} from './personal-platform-v1.js';
import {knowledgeRoutes} from './knowledge-graph-v1.js';
import {radarPublicRoutes} from './radar-public-v1.js';
import {radarRoutes,runRadarFreshness} from './radar-integration-v1.js';
import {handleAuthRecovery} from './auth-recovery-v1.js';

const MEMBER_ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);
function isMemberProductPath(path){return path.startsWith('/v1/shift/')||path.startsWith('/v1/grub/')||path.startsWith('/v1/fit/')||path.startsWith('/v1/hydration/')||path.startsWith('/v1/plan/')||path.startsWith('/v1/progress/')||path.startsWith('/v1/auth/');}
function memberCorsHeaders(request){const origin=request.headers.get('Origin')||'';const h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, PATCH, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(MEMBER_ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withMemberCors(response,request){const headers=new Headers(response.headers);for(const [k,v] of Object.entries(memberCorsHeaders(request)))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}

export default {
  async fetch(request,env,ctx){
    const path=new URL(request.url).pathname;
    if(request.method==='OPTIONS'&&isMemberProductPath(path))return new Response(null,{status:204,headers:memberCorsHeaders(request)});

    const authRecovery=await handleAuthRecovery(request,env,ctx,(req,e,c)=>hq.fetch(req,e,c));
    if(authRecovery)return withMemberCors(authRecovery,request);

    const commissioning=await memberCommissioningRoute(request,env,ctx); if(commissioning)return isMemberProductPath(path)?withMemberCors(commissioning,request):commissioning;
    const visualise=await shiftVisualiseRoutes(request,env,ctx); if(visualise)return withMemberCors(visualise,request);
    const knowledge=await knowledgeRoutes(request,env,ctx); if(knowledge)return isMemberProductPath(path)?withMemberCors(knowledge,request):knowledge;
    const daily=await memberDailyV2Routes(request,env,ctx); if(daily)return withMemberCors(daily,request);
    const memberV5=await memberProductV5Routes(request,env,ctx); if(memberV5)return withMemberCors(memberV5,request);
    const personal=await personalRoutes(request,env,ctx); if(personal)return withMemberCors(personal,request);
    const radarPublic=await radarPublicRoutes(request,env); if(radarPublic)return radarPublic;
    const radar=await radarRoutes(request,env,ctx); if(radar)return radar;
    return hq.fetch(request,env,ctx);
  },
  async scheduled(controller,env,ctx){
    const job=Promise.all([runScheduledIntelligence(env),runRadarFreshness(env)])
      .then(r=>console.log('shift_scheduled_intelligence',JSON.stringify(r)))
      .catch(e=>console.error('shift_scheduled_intelligence_failed',e?.message));
    if(ctx?.waitUntil)ctx.waitUntil(job); else await job;
  }
};