// Additive deployment: no replacement of the retained HQ, API or public workers.
import {hqClinicalRoute} from './hq-clinical-api.mjs';
import {shell,assets} from './portal-release-assets.mjs';
import {partnerRoute} from './partner-operations/api.mjs';
import {commissioningRoute} from './partner-operations/commissioning.mjs';
import {pages as partnerPages,assets as partnerAssets} from './partner-operations/assets.mjs';
const origin='https://hq.shiftsometimber.co.uk';
const headers={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
export async function existingHqIdentity(request,env,fetchImpl=env.HQ_AUTH?.fetch.bind(env.HQ_AUTH)){
 // Always use the existing HQ authentication endpoint; never member sessions or caller-supplied identity.
 if(!fetchImpl)throw Error('HQ authentication binding unavailable');
 const forwarded=new Headers();for(const name of ['cookie','authorization'])if(request.headers.has(name))forwarded.set(name,request.headers.get(name));
 forwarded.set('Origin',origin);
 const response=await fetchImpl(new Request('https://api.shiftsometimber.co.uk/v1/hq/me',{headers:forwarded,redirect:'manual'}));
 if(!response.ok)return {response:new Response(JSON.stringify({error:response.status===401?'hq_sign_in_required':'hq_authentication_unavailable'}),{status:response.status===401?401:503,headers:{...headers,'Content-Type':'application/json','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Vary':'Origin'}})};
 return response.json();
}
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.hostname==='api.shiftsometimber.co.uk'&&(url.pathname==='/v1/hq/clinical'||url.pathname.startsWith('/v1/hq/clinical/'))){
  const internal=await commissioningRoute(request,env,existingHqIdentity);if(internal)return internal;
  const partner=await partnerRoute(request,{...env,PARTNER_OPERATIONS_ENABLED:'true',PARTNER_INTERNAL_SETUP_ONLY:'true',PARTNER_LOGIN_ENABLED:'false',PARTNER_FULFILMENT_ENABLED:'false'},existingHqIdentity);
  if(partner)return partner;
  // This release is infrastructure only. Activation requires a separately reviewed release,
  // including the existing HQ/CRM access boundaries and genuine session acceptance.
  const closed={...env,CLINICAL_CASEWORK_ENABLED:'false',CLINICAL_REVIEW_READY:'false',CLINICAL_CONTEXT_ENABLED:'false'};
  return hqClinicalRoute(request,closed,existingHqIdentity);
 }
 if(url.hostname!==new URL(origin).hostname)return new Response('Not found',{status:404,headers});
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers});
 const isDemo=url.pathname==='/clinical-portal/demo';
 const demoShell=shell.replace('Clinical casework is awaiting commissioning.','Interactive clinician demo · fictional information only.').replace('/clinical-assets/client.mjs','/clinical-assets/demo-client.mjs').replace('The portal is deployed. Real-patient review, prescribing, AI identity verification and automatic notifications remain switched off.','This is a fictional demonstration. No real orders, messages or prescriptions are created.').replace('Use your existing HQ sign-in. Clinical access will require a verified clinician account and assigned cases after commissioning.','The fictional clinician workspace opens automatically. Use Reset demo to start again.');
 const partnerPage=partnerPages[url.pathname];
 const body=partnerPage||partnerAssets[url.pathname]||(isDemo?{type:'text/html; charset=utf-8',body:demoShell}:url.pathname==='/clinical-portal'||url.pathname==='/clinical-portal/'?{type:'text/html; charset=utf-8',body:shell}:assets[url.pathname]);
 if(!body)return new Response('Not found',{status:404,headers});
 return new Response(request.method==='HEAD'?null:body.body,{headers:{...headers,'Content-Type':body.type,'Content-Security-Policy':(isDemo||partnerPage?.demo?"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'self' blob: data:; frame-src blob:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'":"default-src 'none'; script-src 'self'; style-src 'self'; connect-src https://api.shiftsometimber.co.uk; img-src 'self' blob:; frame-src blob:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"),'Permissions-Policy':'camera=(), microphone=(), geolocation=()','X-Frame-Options':'DENY'}});
}};
