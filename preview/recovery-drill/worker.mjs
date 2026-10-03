// Isolated recovery exercise only: no production route, credential or data.
import core from '../../shift-coach/worker.mjs';
export {SiteContentState} from '../../site-content-state-v1.js';
export default {async fetch(request,env,ctx){
 const u=new URL(request.url);
 if(env.RECOVERY_DRILL!=='20261003'||Date.now()>Date.parse(env.DRILL_EXPIRES)||request.headers.get('x-recovery-drill')!==env.DRILL_KEY)return new Response('Not found',{status:404});
 if(!/^shift-recovery-drill-20261003\.[a-z0-9-]+\.workers\.dev$/.test(u.hostname))return new Response('Invalid drill host',{status:403});
 if(u.pathname==='/__drill/content'){
  const body=await request.json(),stub=env.SITE_CONTENT_STATE.get(env.SITE_CONTENT_STATE.idFromName('global'));
  if(!['read-all','publish','pause'].includes(body.action))return new Response('Invalid action',{status:400});
  return stub.fetch(new Request('https://content/'+body.action,{method:'POST',body:JSON.stringify(body)}));
 }
 if(u.pathname==='/__drill/evidence')return Response.json(await env.EVIDENCE_DESK_READ_DB.prepare('SELECT 1 AS ready').first());
 if(u.pathname==='/__drill/credential')return Response.json({restored:env.RECOVERY_CANARY==='fictional-restore-canary'});
 if(!['GET','HEAD'].includes(request.method)&&!/^\/v1\/(?:auth\/(?:register|login|logout)|consents|privacy\/(?:export|account)|life-back|check-ins|acquisition-attribution|my-timber-pwa\/status|events)(?:\/|$)/.test(u.pathname))return new Response('Side effects disabled in drill',{status:403});
 const response=await core.fetch(request,env,ctx);
 if(response.status===404&&['GET','HEAD'].includes(request.method)&&!/^\/(?:v1|api|hq)\//.test(u.pathname)){return fetch('https://5fbd7669.projectshift.pages.dev'+u.pathname+u.search,{method:request.method})}
 return response;
}};
