// Actual isolated-host acceptance of the experimental routine publication lane.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
assert(process.argv.includes('--synthetic-only'));
const base=process.env.TIMBER_SHED_ACCEPTANCE_URL,auth=JSON.parse(readFileSync(process.env.TIMBER_SHED_ACCEPTANCE_AUTH_FILE,'utf8'));
assert(/^https:\/\/shift-timber-shed-acceptance-20261023\.[a-z0-9-]+\.workers\.dev$/.test(base));
const passed=[],cookies={};const check=(name,value)=>{assert(value,name);passed.push(name)};
async function req(path,{role,body,form,privateAuth=true}={}){
 const headers={...(privateAuth?{Authorization:auth.authorization}:{}),...(role?{Cookie:cookies[role]}:{})};
 const init={headers,redirect:'manual',signal:AbortSignal.timeout(30000)};
 if(body!==undefined||form!==undefined){init.method='POST';headers.Origin=base;headers['Content-Type']=form===undefined?'application/json':'application/x-www-form-urlencoded';init.body=form===undefined?JSON.stringify(body):form;}
 const r=await fetch(base+path,init);const text=await r.text();let data;try{data=JSON.parse(text)}catch{}
 return {status:r.status,headers:r.headers,data,text};
}
const api=(role,path,body)=>req('/v1/timber-shed/forum/'+path,{role,body});
check('unauthorisedDenied',(await req('/',{privateAuth:false})).status===401);
check('maintenance',(await req('/__synthetic/maintenance',{body:{}})).data.enabled);
for(const role of ['member-one','member-two','moderator-one','moderator-two']){
 const r=await req('/__synthetic/session',{form:'role='+role});check('session-'+role,r.status===303);cookies[role]=r.headers.get('Set-Cookie').split(';')[0];
}
const p=(await api('member-one','participation')).data;
check('newModelDisclosed',p.routineAutoPublish&&p.policy.version==='shed-pilot-governance-2026-10-23-v2'&&p.policy.rules.some(s=>s.includes('automatically')));
check('oldAgreementNotAccepted',(await api('member-one','participation/consent',{version:'shed-pilot-governance-2026-10-23-v1',rulesAccepted:true,privacyAcknowledged:true,healthConsent:true})).status===400);
for(const role of Object.keys(cookies))check('currentConsent-'+role,(await api(role,'participation/consent',{version:p.policy.version,rulesAccepted:true,privacyAcknowledged:true,healthConsent:true})).status===200);
for(const [role,displayName] of [['member-one','Weekend Walker'],['member-two','Shed Regular']])check('alias-'+role,(await api(role,'profile/save',{displayName})).status===201);
const post=await api('member-one','submit',{roomId:'main-shed',title:'Weekend plans',body:'I went for a walk today. It felt good to get outside.'});
check('routineAutomaticallyPublished',post.status===201&&post.data.publication==='automated-routine');
check('otherMemberSeesPublishedPost',(await api('member-two','latest')).data.posts.some(p=>p.id===post.data.id));
const grey=await api('member-one','submit',{roomId:'main-shed',title:'An unfamiliar question',body:'I would like to discuss an unusual situation and hear your thoughts.'});
check('unrecognisedHeld',grey.status===202&&grey.data.status==='pending');
const high=await api('member-one','submit',{roomId:'main-shed',title:'Fictional prohibited offer',body:'I have spare Mounjaro pens to sell. Message me to buy them.'});
check('highRiskHeld',high.status===202);
check('highRiskNotOrdinarilyApprovable',(await api('moderator-one','moderate',{postId:high.data.id,action:'approve'})).status===409);
const queue=(await api('moderator-one','moderation')).data.pending;
check('onlyHeldPostsNeedReview',queue.some(p=>p.id===grey.data.id)&&queue.some(p=>p.id===high.data.id)&&!queue.some(p=>p.id===post.data.id));
const reply=await api('member-two','submit',{roomId:'main-shed',parentId:post.data.id,body:'Sounds like a good plan. Hope you have a lovely weekend.'});
check('routineReplyPublished',reply.status===201);
check('replyNoticeAfterPublication',(await api('member-one','notifications')).data.notifications.some(n=>n.kind==='reply'));
const exported=(await api('member-one','export')).data.forum;
check('systemDecisionExported',exported.publications.some(p=>p.post_id===post.data.id&&p.governance_version==='shed-pilot-governance-2026-10-23-v2'));
check('noOtherMemberDecisionInExport',!exported.publications.some(p=>p.post_id===reply.data.id));
check('memberCannotRemoveOthersPost',(await api('member-two','moderate',{postId:post.data.id,action:'remove'})).status===403);
check('humanCanRemoveAutoPost',(await api('moderator-one','moderate',{postId:post.data.id,action:'remove'})).status===200);
const appeal=await api('member-one','appeal',{postId:post.data.id,reason:'missed-context'});
check('removalCanBeAppealed',appeal.status===202);
check('sameReviewerCannotHandleAppeal',(await api('moderator-one','appeal/review',{appealId:appeal.data.id,outcome:'reconsider'})).status===403);
check('independentReviewerReturnsToPending',(await api('moderator-two','appeal/review',{appealId:appeal.data.id,outcome:'reconsider'})).status===200);
check('appealDoesNotAutopublish',(await api('member-two','latest')).data.posts.every(p=>p.id!==post.data.id));
const require=createRequire(import.meta.url),puppeteer=require(process.env.TIMBER_SHED_PUPPETEER_PATH);
const browser=await puppeteer.launch({headless:true,executablePath:process.env.TIMBER_SHED_CHROME_PATH,args:['--no-sandbox']});
try{for(const [name,width,height,body] of [['desktop',1440,900,'Made time for a lunchtime walk this week.'],['mobile',390,844,'I enjoyed the fresh air. One small step at a time.']]){
 const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000);await page.setViewport({width,height});await page.authenticate({username:auth.username,password:auth.password});
 await page.setCookie({name:'sst_session',value:'fictional-member-two',url:base,httpOnly:true,secure:true,sameSite:'Strict'});
 await page.goto(base+'/member/timber-shed',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!document.getElementById('shedCompose').hidden);
 check(name+'CorrectCopy',await page.$eval('#shedForumPilot',el=>el.textContent.includes('Recognised everyday posts can appear immediately')));
 await page.type('#shedTitle','Weekend plans');await page.type('#shedBody',body);
 const response=page.waitForResponse(r=>r.url().endsWith('/forum/submit')&&r.request().method()==='POST');
 await page.click('#shedCompose button[type=submit]');const submitted=await response;check(name+'ActualAutoPublish',submitted.status()===201);
 await page.waitForFunction(body=>document.getElementById('shedLatestItems').textContent.includes(body),{},body);
 check(name+'VisibleWithoutHumanClick',true);check(name+'NoOverflow',!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));check(name+'NoPageErrors',errors.length===0);
 await (await page.$('#shedForumPilot')).screenshot({path:'/tmp/timber-shed-routine-'+name+'-20261023.png'});await context.close();
}}finally{await browser.close()}
const receipt={host:base,checkedAt:new Date().toISOString(),syntheticOnly:true,publicationModel:'narrow-positive-recognition',checks:passed.length,passed};
if(process.env.TIMBER_SHED_ACCEPTANCE_RECEIPT)writeFileSync(process.env.TIMBER_SHED_ACCEPTANCE_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
