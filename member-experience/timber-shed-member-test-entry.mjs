// Direct-domain release for the owner's existing Test member only.
// Live session authentication; all Shed content remains in the isolated fictional DB.
import {authenticateMember} from '../member-state-fast-v1.js';
import {createTimberShedPresentationRoutes} from './timber-shed-presentation.mjs';
import {createTimberShedForumRoutes} from './timber-shed-forum-routes.mjs';
import {createTimberShedPrivateRoutes} from './timber-shed-private.mjs';
const headers={'Cache-Control':'private, no-store, max-age=0','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const assets=new Set(['/assets/member-experience/timber-shed.mjs','/assets/member-experience/timber-shed-forum.mjs']);
const pages=new Set(['/member/timber-shed','/member/timber-shed/','/member/timber-shed.html']);
const closed=(status=404)=>new Response(status===401?'Sign in to My Timber with the Test account to continue.':'Not available.',{status,headers});
const notice='<aside role="note" style="background:#e7e3da;color:#050505;padding:16px;text-align:center;font:16px/1.5 sans-serif"><strong>PRIVATE TEST · TEST ACCOUNT ONLY</strong><br>Posts here are fictional test data, separate from My Timber. The community is not open to members.</aside>';
export function createMemberTestWorker(authenticate=authenticateMember){
 return {
  async fetch(request,env){
   const url=new URL(request.url);let path=url.pathname;
   // Owner-requested direct address: same authenticated forum, no public preview.
   if(['/timber-shed','/timber-shed/'].includes(path)){url.pathname='/member/timber-shed';request=new Request(url,request);path=url.pathname;}
   if(url.protocol!=='https:'||!['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(url.hostname))return closed();
   if(!pages.has(path)&&!assets.has(path)&&!path.startsWith('/v1/timber-shed/'))return closed();
   if(env.TIMBER_SHED_MEMBER_TEST_RELEASE!=='true'||!env.MEMBER_AUTH_DB||!env.SYNTHETIC_DB||env.MEMBER_AUTH_DB===env.SYNTHETIC_DB||env.TIMBER_SHED_TEST_MEMBER_ID!=='11245')return closed();
   // Authenticate against the actual member database before serving even assets.
   let auth;
   try{auth=await authenticate(request,{DB:env.MEMBER_AUTH_DB})}catch{return closed(503)}
   if(auth.response)return closed(401);
   if(auth.userId!==11245||String(auth.user?.email||'').toLowerCase()!=='shiftsometimber@gmail.com')return closed();
   // Mapping is fixed and only follows live-account authorisation. No role/session selector.
   const fictionalAuth=async()=>({userId:1});
   const testEnv={...env,DB:env.SYNTHETIC_DB,
    TIMBER_SHED_PRIVATE_ENABLED:'true',MEMBER_EXPERIENCE_V1_ENABLED:'true',
    TIMBER_SHED_FORUM_ENABLED:'true',TIMBER_SHED_FORUM_PILOT_APPROVED:'true',
    TIMBER_SHED_RETENTION_ENABLED:'true',TIMBER_SHED_ROUTINE_AUTOPUBLISH_ENABLED:'true',
    TIMBER_SHED_GOVERNANCE_APPROVED_VERSION:'shed-pilot-governance-2026-10-23-v2',
    TIMBER_SHED_AI_MODERATION_ENABLED:'false',TIMBER_SHED_AI_PROVIDER_APPROVED:'false',
    TIMBER_SHED_EMAIL_DELIVERY_ENABLED:'false'};
   try{
    let response=await createTimberShedPresentationRoutes(fictionalAuth)(request,testEnv)
     ||await createTimberShedForumRoutes(fictionalAuth)(request,testEnv)
     ||await createTimberShedPrivateRoutes(fictionalAuth)(request,testEnv)||closed();
    if(pages.has(path)&&response.ok&&request.method!=='HEAD'){
     const body=(await response.text()).replace(/<body([^>]*)>/i,'<body$1>'+notice);
     const nextHeaders=new Headers(response.headers);nextHeaders.delete('Content-Length');
     response=new Response(body,{status:response.status,headers:nextHeaders});
    }
    const finalHeaders=new Headers(response.headers);for(const[k,v]of Object.entries(headers))finalHeaders.set(k,v);
    return new Response(response.body,{status:response.status,headers:finalHeaders});
   }catch{return closed(503)}
  }
 };
}
export default createMemberTestWorker();
