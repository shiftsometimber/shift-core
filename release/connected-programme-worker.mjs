// Narrow release adapter. The existing live Worker remains the authority for
// all other pages, bindings, scheduled work and clinical/commerce behaviour.
import {programmeAssets} from '../member-experience/programme-assets.mjs';
import {programmeJoiningHTML} from '../member-experience/programme-joining-page.mjs';
import {withSessionState} from '../member-experience/session-state.mjs';
import {lifeBackRoutes} from '../member-experience/life-back-routes.mjs';
import {memberHealthRoutes} from '../member-experience/health-routes.mjs';
import {checkinFollowupRuntime} from '../member-experience/checkin-followup-client.mjs';
import lifeBackAssets from '../member-experience/life-back-assets.mjs';
export const APPROVED_SOURCE='0bbf4acfd71d86a51ffffc211dc55961d5a47b36';
const prefix='/assets/member-experience/';
const pages=new Set(['/member/dashboard','/member/grub','/member/fit','/member/life-back']);
const privateHeaders={'Cache-Control':'no-store, must-revalidate','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','X-Shift-Programme-Source':APPROVED_SOURCE};
export async function enhanceProgrammePage(request,response){
 const path=new URL(request.url).pathname.replace(/\.html$/,'').replace(/\/+$/,'');
 if(request.method!=='GET'||!pages.has(path)||!response.ok||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 let html=await response.text();
 if(!html.includes('/assets/member-experience/programme-client.js'))html=html.replace('</head>','<link rel="stylesheet" href="'+prefix+'programme-style.css"></head>').replace('</body>','<script defer src="'+prefix+'programme-client.js"></script></body>');
 const headers=new Headers(response.headers);for(const [k,v]of Object.entries(privateHeaders))headers.set(k,v);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(k);
 return new Response(html,{status:response.status,headers});
}
export default {
 async fetch(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'');
  if(path==='/v1/life-back'){if(request.method==='OPTIONS')return env.CORE.fetch(request);const u=new URL(request.url);u.pathname=path;return apiResponse(request,await lifeBackRoutes(new Request(u,request),env))}
  if(path==='/v1/check-ins/follow-up'){
   if(request.method==='OPTIONS')return env.CORE.fetch(request);
   const u=new URL(request.url);u.pathname=path;return apiResponse(request,await memberHealthRoutes(new Request(u,request),env));
  }
  if(['GET','HEAD'].includes(request.method)){
   if(['/member/get-started','/member/get-started.html'].includes(path))return new Response(request.method==='HEAD'?null:withSessionState(programmeJoiningHTML),{headers:{...privateHeaders,'Content-Type':'text/html; charset=utf-8'}});
   const name=path.slice(prefix.length),asset=path.startsWith(prefix)&&Object.hasOwn(programmeAssets,name)?programmeAssets[name]:path===prefix+'checkin-followup.mjs'?checkinFollowupRuntime:path===prefix+'life-back/client.mjs'?lifeBackAssets['client.mjs'].body:null;
   if(asset!==null)return new Response(request.method==='HEAD'?null:asset,{headers:{...privateHeaders,'Content-Type':path.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8'}});
  }
  return enhanceProgrammePage(request,await env.CORE.fetch(request));
 }
};

function apiResponse(request,response){const headers=new Headers(response.headers);for(const [k,v]of Object.entries(privateHeaders))headers.set(k,v);const origin=request.headers.get('Origin');if(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk'].includes(origin)){headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Credentials','true');headers.set('Vary','Cookie, Origin')}return new Response(response.body,{status:response.status,headers})}
