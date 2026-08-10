import hq from './hq-ai.js';
import {runScheduledIntelligence} from './scheduled-intelligence.js';

export default {
  async fetch(request,env,ctx){ return hq.fetch(request,env,ctx); },
  async scheduled(controller,env,ctx){
    const job=runScheduledIntelligence(env).then(r=>console.log('shift_scheduled_intelligence',JSON.stringify(r))).catch(e=>console.error('shift_scheduled_intelligence_failed',e?.message));
    if(ctx?.waitUntil)ctx.waitUntil(job); else await job;
  }
};
