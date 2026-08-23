import hqAi from './hq-ai.js';

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    const path=url.pathname.replace(/\/+$/,'')||'/';
    // HQ Copilot now owns its complete conversation behaviour in one pass.
    // Do not run post-generation personality/proactivity rewrites: they were
    // sanding off context and making Shift sound generic.
    return hqAi.fetch(request,env,ctx);
  }
};
