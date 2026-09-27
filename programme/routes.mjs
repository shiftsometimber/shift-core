import {exportAccount} from './export.mjs';
import {ProgrammeStore} from './store.mjs';
import {execute,publicState,ProgrammeError,currentState} from './service.mjs';
import {previewChange} from './engine.mjs';
import {existingTools} from './existing-tools.mjs';
export const PRIVATE_HEADERS={'Cache-Control':'no-store, private, max-age=0','Pragma':'no-cache','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'same-origin'};
export const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...PRIVATE_HEADERS,'Content-Type':'application/json; charset=utf-8'}});
// authenticate is the unchanged authenticateMember from the pinned core source.
// The feature is dark by default. FixtureMode is never derived from a request.
export async function programmeRoutes(request,env,{authenticate,html,fixtureMode=false}={}){
 const url=new URL(request.url),path=url.pathname;
 if(!['/v1/programme','/v1/programme/preview','/v1/programme/export','/v1/programme/existing-tools','/member/programme'].includes(path))return null;
 if(env.PROGRAMME_V1_ENABLED!=='true')return json({error:'Programme is unavailable.'},404);
 const auth=await authenticate(request,env);
 if(auth.response){
  if(path==='/member/programme')return new Response(null,{status:303,headers:{...PRIVATE_HEADERS,Location:'/member/dashboard?returnTo=%2Fmember%2Fprogramme'}});
  return json({error:'Your session has ended. Sign in again.'},401);
 }
 if(!env.PROGRAMME_DB)return json({error:'Programme storage is unavailable. Your existing tools are unaffected.'},503);
 const store=new ProgrammeStore(env.PROGRAMME_DB);
 if(path==='/member/programme'){
  if(request.method!=='GET')return json({error:'Method not allowed'},405);
  return new Response(html,{headers:{...PRIVATE_HEADERS,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"}});
 }
 try{
  if(path==='/v1/programme/existing-tools'){
   if(request.method!=='GET')return json({error:'Method not allowed'},405);
   try{return json(await existingTools(env.DB,auth.userId))}catch{return json({error:'Existing tool records are temporarily unavailable. Your saved records are unchanged.'},503)}
  }
  const stored=await store.get(auth.userId);if(!stored)return json({error:'Programme access has not been provisioned.'},403);const state=currentState(stored,{fixtureMode});
  if(path==='/v1/programme/export'){
   if(request.method!=='GET')return json({error:'Method not allowed'},405);
   return new Response(JSON.stringify(exportAccount(stored),null,2),{headers:{...PRIVATE_HEADERS,'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="SHIFT-Programme-records.json"'}});
  }
  if(request.method==='GET'&&path==='/v1/programme')return json(publicState(state,{fixtureMode}));
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(request.headers.get('Origin')!==url.origin)return json({error:'This change must come from your Programme page.'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'JSON required'},415);
  const bodyText=await request.text();if(bodyText.length>20000)return json({error:'Request too large'},413);
  let body;try{body=JSON.parse(bodyText)}catch{return json({error:'Invalid request'},400)}
  if(path==='/v1/programme/preview'){
   if(!state.entitlement.active)return json({error:'New Programme reviews are paused. Your saved plans remain available.'},403);
   if(!state.review||state.review.baseRevision!==state.revision||body.revision!==state.revision)return json({error:'Your plan changed. Prepare a fresh review.'},409);
   return json(previewChange(state,state.review,body.proposalId,body.recipeId,{fixtureMode}));
  }
  return json(await execute(store,auth.userId,body,{fixtureMode}));
 }catch(e){return json({error:e instanceof ProgrammeError?e.message:'We could not complete that change. Your last saved plan is kept.'},e instanceof ProgrammeError?e.status:400)}
}
