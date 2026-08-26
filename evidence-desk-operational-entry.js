import {evidenceDeskRoutes} from './evidence-desk-v1.js';
import {decideEvidencePackage} from './evidence-desk-v1.js';
import {approveDistribution,capturePageBaselineFromPublisher,deliverDistributionJobs,draftEvidencePackage,ensureOperationalSchema,evidencePublicationPreflight,grantPublicationAuthority,prepareDistributionJobs,publishEvidencePackage,rollbackEvidencePublication,runOperationalSchedule,specialistReview,stopOperationalDesk} from './evidence-desk-operational-v1.js';

const response=(data,status=data?.status||200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const bearer=request=>(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
const secure=(request,token)=>!!token&&bearer(request)===token;
const body=async request=>request.json().catch(()=>({}));

async function routes(request,env){
  const url=new URL(request.url),match=url.pathname.match(/^\/v1\/evidence-desk\/operational\/([^/]+)(?:\/(\d+))?$/);if(!match)return null;
  const [,action,id]=match;
  const authorityAction=action==='authority';
  if(!secure(request,authorityAction?env.EVIDENCE_PUBLICATION_AUTHORITY_TOKEN:env.EVIDENCE_DESK_OPERATOR_TOKEN))return response({ok:false,error:'unauthorized'},401);
  await ensureOperationalSchema(env.DB);
  if(action==='status'&&request.method==='GET'){const control=await env.DB.prepare(`SELECT * FROM evidence_desk_operational_control WHERE id=1`).first(),base=await env.DB.prepare(`SELECT * FROM evidence_desk_control WHERE id=1`).first();return response({ok:true,environment:env.EVIDENCE_DESK_ENV||'unknown',production:false,control,base,capabilities:{monitor:true,draft:!!env.AI,website:!!env.WEBSITE_PUBLISHER,rollback:!!env.WEBSITE_PUBLISHER,newsletter:!!env.NEWSLETTER_PUBLISHER,social:!!env.SOCIAL_PUBLISHER}})}
  if(action==='draft'&&id&&request.method==='POST')return response(await draftEvidencePackage(env,id));
  if(action==='run'&&request.method==='POST')return response(await runOperationalSchedule(env));
  if(action==='baseline'&&id&&request.method==='POST')return response(await capturePageBaselineFromPublisher(env,id));
  if(action==='editorial'&&id&&request.method==='POST')return response(await decideEvidencePackage(env.DB,id,{decision:'approve_web_only',...(await body(request))},{name:env.EVIDENCE_DESK_OPERATOR_NAME||'Operator',role:'owner'}));
  if(action==='authority'&&id&&request.method==='POST')return response(await grantPublicationAuthority(env.DB,id,await body(request),{name:env.EVIDENCE_PUBLICATION_AUTHORITY_NAME||'Publication authority',role:'owner'}));
  if(action==='preflight'&&id&&request.method==='GET')return response(await evidencePublicationPreflight(env.DB,id));
  if(action==='publish'&&id&&request.method==='POST')return response(await publishEvidencePackage(env,id));
  if(action==='rollback'&&id&&request.method==='POST')return response(await rollbackEvidencePublication(env,id));
  if(action==='distribution-prepare'&&id&&request.method==='POST'){const input=await body(request);return response(await prepareDistributionJobs(env,id,{destinations:input.destinations,model:input.model}))}
  if(action==='distribution'&&id&&request.method==='POST')return response(await approveDistribution(env.DB,id,await body(request),{name:env.EVIDENCE_DESK_OPERATOR_NAME||'Operator',role:'owner'}));
  if(action==='distribution-deliver'&&request.method==='POST'){const input=await body(request);return response(await deliverDistributionJobs(env,{packageId:input.packageId,limit:input.limit}))}
  if(action==='stop'&&request.method==='POST')return response(await stopOperationalDesk(env.DB,(await body(request)).reason));
  return response({ok:false,error:'not_found'},404);
}

async function reviewRoute(request,env){
  const match=new URL(request.url).pathname.match(/^\/v1\/evidence-desk\/review\/(clinical|communications)\/(\d+)$/);if(!match||request.method!=='POST')return null;
  const [,type,id]=match,token=type==='clinical'?env.EVIDENCE_CLINICAL_APPROVAL_TOKEN:env.EVIDENCE_COMMS_APPROVAL_TOKEN;
  if(!secure(request,token))return response({ok:false,error:'unauthorized'},401);
  const reviewer={name:type==='clinical'?env.EVIDENCE_CLINICAL_REVIEWER_NAME:env.EVIDENCE_COMMS_REVIEWER_NAME};
  if(!reviewer.name)return response({ok:false,error:'named_reviewer_required'},409);
  return response(await specialistReview(env.DB,id,type,await body(request),reviewer));
}

export default{
  async fetch(request,env,ctx){
    try{return await reviewRoute(request,env)||await routes(request,env)||await evidenceDeskRoutes(request,env,ctx)||response({ok:false,error:'not_found'},404)}catch(error){
      const message=String(error?.message||error);
      console.error(JSON.stringify({event:'evidence_desk_operational_error',error:message}));
      const diagnostic=env.EVIDENCE_DESK_ENV==='non-production-operational'?message.slice(0,500):undefined;
      return response({ok:false,error:'failed_closed',...(diagnostic?{diagnostic}:{})},500)
    }
  },
  async scheduled(controller,env,ctx){ctx.waitUntil(runOperationalSchedule(env).then(result=>console.log(JSON.stringify({event:'evidence_desk_operational_schedule',...result}))).catch(error=>console.error(JSON.stringify({event:'evidence_desk_operational_schedule_failed',error:String(error?.message||error)}))))}
};
