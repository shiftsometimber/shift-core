import {directoryVersion,searchDirectory} from './search.mjs';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const json=(data,status=200)=>Response.json(data,{status,headers});
export async function gpDirectoryHqRoute(request,env,ctx,authenticate){
 const u=new URL(request.url);if(u.pathname!=='/v1/hq/management/gp-directory')return null;
 if(request.method==='OPTIONS')return null;
 if(request.method!=='GET')return json({error:'method_not_allowed'},405);
 if(request.headers.get('Sec-Fetch-Site')==='cross-site'||request.headers.get('Origin')&&!['https://hq.shiftsometimber.co.uk',u.origin].includes(request.headers.get('Origin')))return json({error:'origin_not_allowed'},403);
 const response=await authenticate(new Request(new URL('/v1/hq/me',u),{headers:request.headers}),env,ctx);if(!response.ok)return response;
 const auth=await response.json();if(!(auth.permissions||[]).some(p=>p==='*'||p==='crm_read'))return json({error:'hq_forbidden'},403);
 if(env.MEMBER_GP_DIRECTORY_V2_ENABLED!=='true')return json({error:'gp_directory_not_enabled'},503);
 try{
  if(u.searchParams.has('q'))return json(await searchDirectory(env.DB,{query:u.searchParams.get('q'),near:u.searchParams.get('near')||'',nation:u.searchParams.get('nation')||'',limit:50}));
  const v=await directoryVersion(env.DB);return json({ok:true,version:v.version,importedAt:v.imported_at,counts:v.counts,sources:v.sources,coverage:'All four UK nations',mode:'read_only',registrationVerified:false,niDistanceRanking:'unavailable pending permitted coordinate source',attribution:['NHS Organisation Data Service','Public Health Scotland','Contains OS data © Crown copyright and database right 2026','Contains Royal Mail data © Royal Mail copyright and database right 2026','Source: Office for National Statistics licensed under the Open Government Licence v.3.0']});
 }catch(e){return json({error:e.message,message:'Directory could not be read. Existing member details are unchanged.'},e.message.startsWith('invalid_')?400:503);}
}
