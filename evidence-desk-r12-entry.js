import {evidenceDeskRoutes,runEvidenceDeskScheduled} from './evidence-desk-v1.js';

export default {
  async fetch(request,env,ctx){
    const response=await evidenceDeskRoutes(request,env,ctx);
    return response||Response.json({ok:false,error:'not_found'},{status:404,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  },
  async scheduled(controller,env,ctx){
    const task=runEvidenceDeskScheduled(env).then(result=>console.log(JSON.stringify({event:'evidence_desk_r12_scheduled',...result}))).catch(error=>console.error(JSON.stringify({event:'evidence_desk_r12_scheduled_failed',error:String(error?.message||error)})));
    if(ctx?.waitUntil)ctx.waitUntil(task);else await task;
  }
};
