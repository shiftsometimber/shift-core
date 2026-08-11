import hq from './hq-ai.js';
import {runScheduledIntelligence} from './scheduled-intelligence.js';
import {memberCommissioningRoute} from './member-commissioning-v1.js';
import {personalRoutes} from './personal-platform-v1.js';
import {knowledgeRoutes} from './knowledge-graph-v1.js';
import {radarPublicRoutes} from './radar-public-v1.js';
import {radarRoutes,runRadarFreshness} from './radar-integration-v1.js';

export default {
  async fetch(request,env,ctx){
    const commissioning=await memberCommissioningRoute(request,env,ctx); if(commissioning)return commissioning;
    const personal=await personalRoutes(request,env,ctx); if(personal)return personal;
    const knowledge=await knowledgeRoutes(request,env,ctx); if(knowledge)return knowledge;
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