import {evidenceDeskRoutes,runEvidenceDeskScheduled} from './evidence-desk-v1.js';

export default {
  async fetch(request,env,ctx){
    try{
      const response=await evidenceDeskRoutes(request,env,ctx);
      return response||Response.json({ok:false,error:'not_found'},{status:404,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }catch(error){
      console.error(JSON.stringify({event:'evidence_desk_r12_request_failed',error:String(error?.message||error)}));
      return Response.json({ok:false,error:'commission_request_failed',detail:String(error?.message||error).slice(0,500)},{status:500,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
  },
  async scheduled(controller,env,ctx){
    const task=runEvidenceDeskScheduled(env).then(result=>console.log(JSON.stringify({event:'evidence_desk_r12_scheduled',...result}))).catch(error=>console.error(JSON.stringify({event:'evidence_desk_r12_scheduled_failed',error:String(error?.message||error)})));
    if(ctx?.waitUntil)ctx.waitUntil(task);else await task;
  }
};
