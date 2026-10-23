import {authenticateMember} from '../member-state-fast-v1.js';
import {timberShedPage,timberShedClient} from './timber-shed-page.mjs';
import {timberShedForumPreview} from './timber-shed-forums.mjs';
import {timberShedForumPilotMarkup,timberShedForumPilotCSS,timberShedForumPilotClient} from './timber-shed-forum-ui.mjs';
const headers={'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Vary':'Cookie'};
// Separate additive route; the approved My Timber presentation source stays intact.
export function createTimberShedPresentationRoutes(authenticate=authenticateMember){
 return async(request,env)=>{
  const path=new URL(request.url).pathname.replace(/\/+$/,'');
  const page=['/member/timber-shed','/member/timber-shed.html'].includes(path);
  const asset=['/assets/member-experience/timber-shed.mjs','/assets/member-experience/timber-shed-forum.mjs'].includes(path);
  if(!page&&!asset)return null;
  if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||env.TIMBER_SHED_PRIVATE_ENABLED!=='true')return new Response('Not found',{status:404,headers});
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{...headers,Allow:'GET, HEAD'}});
  const forum=env.TIMBER_SHED_FORUM_ENABLED==='true'&&env.TIMBER_SHED_FORUM_PILOT_APPROVED==='true';
  if(path.endsWith('timber-shed-forum.mjs')&&!forum)return new Response('Not found',{status:404,headers});
  if(page){
   const auth=await authenticate(request,env);
   if(auth.response||!Number.isSafeInteger(auth.userId)||auth.userId<=0)return new Response('Sign in to My Timber to continue.',{status:401,headers:{...headers,'Content-Type':'text/plain; charset=utf-8'}});
   const markup=env.TIMBER_SHED_AI_MODERATION_ENABLED==='true'&&env.TIMBER_SHED_AI_PROVIDER_APPROVED==='true'?timberShedForumPilotMarkup.replace('Automated rule-based safety screening','AI-model and rule-based safety screening'):timberShedForumPilotMarkup;
   const html=forum?timberShedPage.replace(timberShedForumPreview(),markup).replace('</head>','<style>'+timberShedForumPilotCSS+'</style></head>').replace('</body>','<script src="/assets/member-experience/timber-shed-forum.mjs" defer></script></body>'):timberShedPage;
   return new Response(request.method==='HEAD'?null:html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
  }
  const body=path.endsWith('timber-shed-forum.mjs')?timberShedForumPilotClient:timberShedClient;
  return new Response(request.method==='HEAD'?null:body,{headers:{...headers,'Content-Type':'text/javascript; charset=utf-8'}});
 };
}
export const timberShedPresentationRoutes=createTimberShedPresentationRoutes();
