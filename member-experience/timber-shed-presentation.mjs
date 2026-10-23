import {routinePublicationEnabled} from './timber-shed-governance.mjs';
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
   const baseMarkup=env.TIMBER_SHED_AI_MODERATION_ENABLED==='true'&&env.TIMBER_SHED_AI_PROVIDER_APPROVED==='true'?timberShedForumPilotMarkup.replace('Automated rule-based safety screening','AI-model and rule-based safety screening'):timberShedForumPilotMarkup;
   const markup=routinePublicationEnabled(env)?baseMarkup
    .replace('Nothing is published immediately. Every new discussion and reply waits for a trained moderator.','Recognised everyday posts can appear immediately after Bouncer checks. Unrecognised, grey or sensitive posts stay private until a human reviews them.')
    .replace('Submit for moderation','Post to the Shed')
    .replace('Every post requires human approval.','Recognised routine posts may publish automatically. Uncertain posts require human review.')
    :baseMarkup;
   const source=forum?timberShedPage
    .replace('There is no public profile, member feed or posting. Your weight, treatment, mood and health records are never copied into The Timber Shed.',routinePublicationEnabled(env)?'Your My Timber health records stay private. Only posts you deliberately submit can enter the community. Bouncer publishes recognised routine messages; uncertain posts wait for human review. There are no public member profiles.':'Your My Timber health records stay private. Only posts you deliberately submit can enter the member community, after human review. There are no public member profiles.')
    .replace('No health records are read, shared or published.','Your private My Timber health records are not read or shared here.')
    .replace('We only save a programme activity ID, whether you completed it and optional simple feedback if you opt in. No names, measurements, medical notes or community posts.','For these optional private progress ticks, we save the activity ID, completion and simple feedback. Community posts are separate and require deliberate submission and screening.')
    :timberShedPage;
   const html=forum?source.replace(timberShedForumPreview(),'').replace('<section class="section"><div class="eyebrow">YOUR CHOICE</div>',markup+'<section class="section"><div class="eyebrow">YOUR CHOICE</div>').replace('</head>','<style>'+timberShedForumPilotCSS+'</style></head>').replace('</body>','<script src="/assets/member-experience/timber-shed-forum.mjs" defer></script></body>'):source;
   return new Response(request.method==='HEAD'?null:html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
  }
  const body=path.endsWith('timber-shed-forum.mjs')?timberShedForumPilotClient:timberShedClient;
  return new Response(request.method==='HEAD'?null:body,{headers:{...headers,'Content-Type':'text/javascript; charset=utf-8'}});
 };
}
export const timberShedPresentationRoutes=createTimberShedPresentationRoutes();
