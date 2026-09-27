import {WorkError,requireWork as must,keys,config,clean,active,canJoin,week,member,memberView,adminView,closingReport,WorkStore,hash,NOTICE,nowISO} from './model.mjs';
import {workHTML,workCSS,workJS} from './screen.mjs';
export const headers={'Cache-Control':'no-store, private, max-age=0','Pragma':'no-cache','Vary':'Cookie','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const json=(b,status=200)=>new Response(JSON.stringify(b),{status,headers:{...headers,'Content-Type':'application/json'}});
const html=(mode)=>new Response(workHTML(mode),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"}});
const event=(s,actor,action,at)=>{s.audit.push({actor,action,at});s.audit=s.audit.slice(-100)};
export async function workRoutes(request,env,{authenticate,authenticateHQ,now=nowISO()}={}){
 const u=new URL(request.url),p=u.pathname;
 if(!['/member/work','/employer/work','/hq/work','/assets/work/work.css','/assets/work/work.mjs','/v1/work','/v1/work/join','/v1/work/review','/v1/work/withdraw','/v1/work/export','/v1/work/testing','/v1/employer/work','/v1/hq/work'].includes(p))return null;
 if(env.WORK_V1_ENABLED!=='true')return json({error:'Workplace programme unavailable.'},404);
 if(p.startsWith('/assets/work/'))return request.method==='GET'?new Response(p.endsWith('.css')?workCSS:workJS,{headers:{...headers,'Content-Type':p.endsWith('.css')?'text/css':'text/javascript'}}):json({error:'Method not allowed.'},405);
 try{
 const isHQ=p==='/hq/work'||p==='/v1/hq/work',auth=await (isHQ?authenticateHQ:authenticate)(request,env);
 if(auth.response){
  if(request.method==='GET'&&['/member/work','/employer/work'].includes(p))return new Response(null,{status:303,headers:{...headers,Location:'/member/dashboard?returnTo='+encodeURIComponent(p)}});
  return json({error:'Sign in to continue.'},401);
 }
 if(isHQ)must(['owner','admin','operations'].includes(auth.user?.role),'HQ operator access required.',403);
 must(env.WORK_DB,'Workplace storage is not commissioned.',503);
 const store=new WorkStore(env.WORK_DB),uid=auth.userId??auth.user.id;
 if(['/member/work','/employer/work','/hq/work'].includes(p)){must(request.method==='GET','Method not allowed.',405);return html(isHQ?'hq':p==='/employer/work'?'employer':'member')}
 if(request.method==='GET'){
  if(p==='/v1/hq/work')return json({employers:(await store.all()).map(adminView)});
  if(p==='/v1/employer/work')return json({reports:(await store.all()).filter(s=>s.config.reporterIds.includes(uid)).map(s=>({employerId:s.id,name:s.config.name,start:s.config.start,end:s.config.end,report:s.report??{status:'not-released',reason:'No report has been released.'}}))});
  if(p==='/v1/work'||p==='/v1/work/export'){
   const workplaces=(await store.forUser(uid)).map(s=>({...memberView(s,uid,now),active:env.WORK_PILOT_COMMISSIONED==='true'&&active(s,now)}));const response=json({noticeVersion:NOTICE,workplaces});if(p.endsWith('/export'))response.headers.set('Content-Disposition','attachment; filename="my-workplace-data.json"');return response;
  }
  return json({error:'Method not allowed.'},405);
 }
 must(request.method==='POST','Method not allowed.',405);
 must(request.headers.get('Origin')===u.origin,'Use this site to submit the change.',403);
 must(request.headers.get('Content-Type')?.split(';')[0]==='application/json','JSON required.',415);
 const raw=await request.text();must(raw.length<=6000,'Request too large.',413);let b;try{b=JSON.parse(raw)}catch{throw new WorkError('Invalid JSON.')}
 if(p==='/v1/work/testing')return json({error:'Testing is not commissioned. No order or reservation was created.'},409);
 if(p==='/v1/work/join'){
  must(env.WORK_PILOT_COMMISSIONED==='true','Employee onboarding is not commissioned.',409);
  keys(b,['code','consent','noticeVersion']);must(b.consent===true&&b.noticeVersion===NOTICE,'Read and accept the workplace notice before joining.');
  await store.rate(uid,now);must(typeof b.code==='string'&&/^[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(b.code),'Invitation is invalid or unavailable.',404);
  const [id]=b.code.split('.'),s=await store.get(id);must(s,'Invitation is invalid or unavailable.',404);
  must(canJoin(s,now)&&!(s.blockedUserIds??[]).includes(uid),'Invitation is invalid or unavailable.',404);must(!s.config.reporterIds.includes(uid),'Employer reporting accounts cannot enrol in their own cohort.',403);
  const tokenHash=await hash(b.code),invite=s.invites.find(i=>i.hash===tokenHash&&!i.revokedAt&&i.expiresAt>now);must(invite,'Invitation is invalid or unavailable.',404);
  if(member(s,uid))return json({workplace:memberView(s,uid,now)});
  must(s.members.filter(m=>!m.withdrawnAt).length<s.config.seats,'Invitation is invalid or unavailable.',409);
  s.members=s.members.filter(m=>m.userId!==uid);s.members.push({userId:uid,joinedAt:now,noticeVersion:NOTICE,completedWeeks:[]});
  await store.save(s,s.revision);return json({workplace:memberView(s,uid,now)});
 }
 if(p==='/v1/work/review'||p==='/v1/work/withdraw'){
  keys(b,p.endsWith('review')?['employerId','week','completed']:['employerId','confirm']);const s=await store.get(b.employerId);must(s&&member(s,uid),'Workplace access not found.',404);const m=member(s,uid);
  if(p.endsWith('withdraw')){must(b.confirm===true,'Confirm withdrawal.');s.members=s.members.filter(x=>x.userId!==uid);await store.save(s,s.revision);return json({withdrawn:true,message:'Your free My Timber account is unchanged.'})}
  must(env.WORK_PILOT_COMMISSIONED==='true'&&active(s,now),'The funded programme is paused or has ended.',403);must(Number.isInteger(b.week)&&b.week>=1&&b.week<=week(s,now),'This review is not available yet.');must(typeof b.completed==='boolean','Choose completion state.');
  m.completedWeeks=m.completedWeeks.filter(w=>w!==b.week);if(b.completed)m.completedWeeks.push(b.week);m.completedWeeks.sort((a,b)=>a-b);await store.save(s,s.revision);return json({workplace:memberView(s,uid,now)});
 }
 if(p==='/v1/hq/work'){
  keys(b,['action','id','revision','config','privacyReference','expiresAt','inviteId','reviewReference','safeToRelease','reporterIds','userId']);
  if(b.action==='create'){
   const c=config(b.config);await reporters(c,env);
   const s={id:crypto.randomUUID(),revision:0,config:c,status:'draft',members:[],invites:[],audit:[{actor:uid,action:'create',at:now}]};await store.create(s);return json({employer:adminView(s)},201);
  }
  const s=await store.get(b.id);must(s,'Employer not found.',404);must(b.revision===s.revision,'This record changed. Reload before editing.',409);
  if(b.action==='members'){
   const ids=[...new Set([...s.members.map(m=>m.userId),...(s.blockedUserIds??[])])],members=[];
   for(const id of ids){const account=await env.DB.prepare('SELECT id,first_name FROM users WHERE id=?').bind(id).first();members.push({userId:id,firstName:account?.first_name??'Account unavailable',status:(s.blockedUserIds??[]).includes(id)?'revoked':'joined'})}
   event(s,uid,'view-members',now);await store.save(s,s.revision);return json({employer:adminView(s),members});
  }else if(b.action==='reporters'){
   const c=config({...s.config,reporterIds:b.reporterIds});must(!c.reporterIds.some(id=>member(s,id)),'An enrolled employee cannot be given reporting access for this cohort.',409);await reporters(c,env);s.config.reporterIds=c.reporterIds;
  }else if(b.action==='revoke-member'||b.action==='restore-member'){
   must(Number.isSafeInteger(b.userId)&&b.userId>0,'Choose an existing workplace account.');
   if(b.action==='revoke-member'){must(member(s,b.userId),'Workplace account not found.',404);s.members=s.members.filter(m=>m.userId!==b.userId);s.blockedUserIds=[...new Set([...(s.blockedUserIds??[]),b.userId])]}
   else {must((s.blockedUserIds??[]).includes(b.userId),'Revoked workplace account not found.',404);s.blockedUserIds=s.blockedUserIds.filter(id=>id!==b.userId)}
  }else if(b.action==='configure'){
   must(s.status==='draft'&&s.members.length===0,'Contract scope is locked once the pilot opens.',409);s.config=config(b.config);await reporters(s.config,env);
  }else if(b.action==='activate'){
   must(env.WORK_PILOT_COMMISSIONED==='true','Employee onboarding is not commissioned.',409);
   must(['draft','paused'].includes(s.status)&&now<s.config.end+'T00:00:00.000Z','This pilot cannot be activated.',409);
   const ref=clean(b.privacyReference,200);must(ref&&s.config.feePence!==null,'Record the reviewed readiness reference and agreed programme fee (including an explicit waiver).');s.privacyReference=ref;s.status='active';
  }else if(b.action==='pause'){must(s.status==='active','Only an active pilot can be paused.',409);s.status='paused';
  }else if(b.action==='invite'){
   must(s.status==='active'&&now<s.config.end+'T00:00:00.000Z','Activate the pilot before issuing invitations.',409);must(s.invites.length<30,'Invitation limit reached.');
   must(typeof b.expiresAt==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(b.expiresAt)&&Number.isFinite(Date.parse(b.expiresAt))&&b.expiresAt>now&&b.expiresAt<=s.config.end+'T00:00:00.000Z','Use a future expiry within the contract.');
   const secret=[...crypto.getRandomValues(new Uint8Array(32))].map(v=>v.toString(16).padStart(2,'0')).join(''),code=s.id+'.'+secret;
   s.invites.push({id:crypto.randomUUID(),hash:await hash(code),expiresAt:b.expiresAt,createdAt:now});event(s,uid,'invite',now);await store.save(s,s.revision);return json({employer:adminView(s),code});
  }else if(b.action==='revoke'){
   const i=s.invites.find(i=>i.id===b.inviteId);must(i,'Invitation not found.',404);i.revokedAt=now;
  }else if(b.action==='report'){
   must(!s.report,'The fixed closing report is already released.',409);must(b.safeToRelease===true,'Contextual privacy review is required.');const ref=clean(b.reviewReference,200);must(ref,'Record the contextual reporting review reference.');s.report=closingReport(s,now);s.reportReviewReference=ref;
  }else throw new WorkError('Unknown action.');
  event(s,uid,b.action,now);await store.save(s,s.revision);return json({employer:adminView(s)});
 }
 return json({error:'Method not allowed.'},405);
 }catch(e){return json({error:e instanceof WorkError?e.message:'Workplace service is temporarily unavailable. No success is confirmed.'},e instanceof WorkError?e.status:503)}
}
async function reporters(c,env){for(const uid of c.reporterIds){must(await env.DB.prepare('SELECT id FROM users WHERE id=?').bind(uid).first(),'Employer contact must have an existing verified account.')}}
