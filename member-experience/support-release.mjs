// Scoped release composition. Existing programme, public, clinical and commerce
// handlers remain the fallback; member data stays behind the existing auth routes.
import {lifeBackRoutes} from './life-back-routes.mjs';
import {memberSupportContactRoutes} from './member-support-contact.mjs';
import {memberHealthRoutes} from './health-routes.mjs';
import {supportTeamRoutes} from '../shift-coach/support-team.mjs';
import {supportPlanRoutes} from './support-plan-pages.mjs';
import {withSupportMarkup} from './support-markup.mjs';
import {withSupportLayout} from './support-layout.mjs';
const trusted=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk']);
const apiPaths=new Set(['/v1/life-back','/v1/member-support','/v1/check-ins','/v1/hq/support/coaching']);
export function wrapSupportService(original){return {
 ...original,
 async fetch(request,env,ctx){
  const u=new URL(request.url),path=u.pathname,origin=request.headers.get('Origin');
  const cross=trusted.has(origin)&&origin!==u.origin;
  if(apiPaths.has(path)&&request.method==='OPTIONS')return new Response(null,{status:cross||origin===u.origin?204:403,headers:cross?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}:{}});
  let response;
  if(path==='/v1/life-back')response=await lifeBackRoutes(request,env);
  else if(path==='/v1/member-support')response=await memberSupportContactRoutes(request,env);
  else if(path==='/v1/check-ins')response=await memberHealthRoutes(request,env);
  else if(['/hq/coaching-support','/v1/hq/support/coaching','/assets/shift-coach-support.mjs'].includes(path))response=await supportTeamRoutes(request,env);
  else response=supportPlanRoutes(request,env);
  if(response){
   if(cross&&apiPaths.has(path)){const h=new Headers(response.headers);h.set('Access-Control-Allow-Origin',origin);h.set('Access-Control-Allow-Credentials','true');h.append('Vary','Origin');return new Response(response.body,{status:response.status,headers:h});}
   return response;
  }
  return withSupportLayout(request,await withSupportMarkup(request,await original.fetch(request,env,ctx)));
 }
};}
