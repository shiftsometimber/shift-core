// Scoped release composition. Existing programme, public, clinical and commerce
// handlers remain the fallback; member data stays behind the existing auth routes.
import {lifeBackRoutes} from './life-back-routes.mjs';
import {memberSupportContactRoutes} from './member-support-contact.mjs';
import {memberHealthRoutes} from './health-routes.mjs';
import {supportTeamRoutes} from '../shift-coach/support-team.mjs';
import {supportPlanRoutes} from './support-plan-pages.mjs';
import {withSupportMarkup} from './support-markup.mjs';
import {withSupportLayout} from './support-layout.mjs';
import {shedSupportRoutes} from './shed-support-loop.mjs';
import {shedPageRoutes} from './shed-support-ui.mjs';
import {isReservedV6AcceptanceRequest} from './support-release-gate.mjs';
import {journeyDataRoutes} from './journey-data.mjs';
import {journeyPageRoutes} from './journey-page.mjs';
const trusted=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk']);
const aliases={'/v1/life-back/member-support':'/v1/member-support','/v1/life-back/check-in':'/v1/check-ins','/member/life-back/support-inbox':'/hq/coaching-support','/v1/life-back/support-inbox':'/v1/hq/support/coaching','/assets/member-experience/programme-support-inbox.mjs':'/assets/shift-coach-support.mjs'};
const apiPaths=new Set(['/v1/life-back','/v1/life-back/journey','/v1/member-support','/v1/check-ins','/v1/hq/support/coaching',...Object.keys(aliases).filter(p=>p.startsWith('/v1/'))]);
async function supportInboxLinks(response){if(!response)return response;const type=response.headers.get('Content-Type')||'';if(!/(?:html|javascript)/.test(type))return response;const text=(await response.text()).replaceAll('/assets/shift-coach-support.mjs','/assets/member-experience/programme-support-inbox.mjs').replaceAll('/v1/hq/support/coaching','/v1/life-back/support-inbox');const h=new Headers(response.headers);h.delete('Content-Length');h.delete('Content-Encoding');h.delete('ETag');return new Response(text,{status:response.status,headers:h});}
export function wrapSupportService(original){return {
 ...original,
 async fetch(request,env,ctx){
  const u=new URL(request.url),path=u.pathname,origin=request.headers.get('Origin');
  // Finite browser qualification of the approved away state. This header has no
  // effect for a real member, even after the release is globally enabled.
  if(request.headers.get('X-My-Timber-Acceptance-Scenario')==='away'&&await isReservedV6AcceptanceRequest(request,env))env={...env,MEMBER_SUPPORT_AWAY:'true',MEMBER_SUPPORT_AWAY_RETURN_ON:'2030-01-02',MEMBER_SUPPORT_COVER_ACTIVE:'true'};
  const cross=trusted.has(origin)&&origin!==u.origin;
  if(apiPaths.has(path)&&request.method==='OPTIONS')return new Response(null,{status:cross||origin===u.origin?204:403,headers:cross?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}:{}});
  let routed=request;const route=aliases[path]||path;if(route!==path){const url=new URL(request.url);url.pathname=route;routed=new Request(url,request);}
  let response;
  if(path.startsWith('/v1/life-back/shed'))response=await shedSupportRoutes(request,env);
  else if(path==='/member/life-back/shed'||path.startsWith('/member/life-back/shed/')||path.startsWith('/assets/member-experience/programme-shed'))response=shedPageRoutes(request);
  else if(route==='/v1/life-back/journey')response=await journeyDataRoutes(request,env);
  else if(route==='/v1/life-back')response=await lifeBackRoutes(request,env);
  else if(route==='/v1/member-support')response=await memberSupportContactRoutes(routed,env);
  else if(route==='/v1/check-ins')response=await memberHealthRoutes(routed,env);
  else if(['/hq/coaching-support','/v1/hq/support/coaching','/assets/shift-coach-support.mjs'].includes(route))response=await supportInboxLinks(await supportTeamRoutes(routed,env));
  else response=journeyPageRoutes(request,env)||supportPlanRoutes(request,env);
  if(response){
   if(cross&&apiPaths.has(path)){const h=new Headers(response.headers);h.set('Access-Control-Allow-Origin',origin);h.set('Access-Control-Allow-Credentials','true');h.append('Vary','Origin');return new Response(response.body,{status:response.status,headers:h});}
   return withSupportMarkup(request,response);
  }
  return withSupportLayout(request,await withSupportMarkup(request,await original.fetch(request,env,ctx)));
 }
};}
