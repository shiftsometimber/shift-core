import {authenticateMember} from '../member-state-fast-v1.js';
import {readTreatment} from './treatment-routes.mjs';
export async function appendTreatmentExport(request,env,response){
 if(env.MY_TREATMENT_ENABLED!=='true'||new URL(request.url).pathname!=='/v1/privacy/export'||request.method!=='POST'||!response.ok)return response;
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 try{const treatment=await readTreatment(env.DB,auth.userId),body=await response.json();return Response.json({...body,myTreatment:{treatments:treatment.treatments,events:treatment.events,medical:treatment.medical}},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Cookie'}});}
 catch{return Response.json({error:'treatment_export_unavailable',message:'Your complete export could not be prepared. Please retry.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
