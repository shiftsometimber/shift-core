// Protected hosted acceptance. Refuses any host except the dedicated fictional Worker.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
if(!process.argv.includes('--synthetic-only'))throw Error('Explicit --synthetic-only is required');
const base=(process.env.TIMBER_SHED_ACCEPTANCE_URL||'').replace(/\/$/,'');
assert(/^https:\/\/shift-timber-shed-acceptance-20261023\.[a-z0-9-]+\.workers\.dev$/.test(base),'Dedicated synthetic host only');
const credential=JSON.parse(readFileSync(process.env.TIMBER_SHED_ACCEPTANCE_AUTH_FILE,'utf8'));
const checks=[],cookies={},run=Date.now().toString(36);
const check=(name,ok)=>{assert(ok,name);checks.push(name)};
async function request(path,{role,body,form,origin=base,auth=true,method}={}){
 const headers={'User-Agent':'Mozilla/5.0',...(auth?{Authorization:credential.authorization}:{}),...(role?{Cookie:cookies[role]}:{})};
 const init={method:method||(body!==undefined||form!==undefined?'POST':'GET'),redirect:'manual',headers,signal:AbortSignal.timeout(30000)};
 if(body!==undefined){headers.Origin=origin;headers['Content-Type']='application/json';init.body=JSON.stringify(body)}
 if(form!==undefined){headers.Origin=origin;headers['Content-Type']='application/x-www-form-urlencoded';init.body=form}
 const response=await fetch(base+path,init),text=await response.text();let data;try{data=JSON.parse(text)}catch{data=null}
 return{status:response.status,headers:response.headers,data,text};
}
const api=(role,path,body,extra={})=>request('/v1/timber-shed/forum/'+path,{role,body,...extra});
check('unauthorisedHostDenied',(await request('/',{auth:false})).status===401);
check('unauthorisedAPIDenied',(await request('/v1/timber-shed/forum/latest',{auth:false})).status===401);
check('unrelatedRegistrationUnavailable',(await request('/v1/auth/register',{body:{}})).status===404);
check('forgedMemberHeaderNotSession',(await api(null,'rooms')).status===401);
check('maintenanceRunsInActualCloudflareD1',(await request('/__synthetic/maintenance',{body:{}})).data?.enabled===true);
for(const role of ['member-one','member-two','moderator-one','moderator-two']){
 const session=await request('/__synthetic/session',{form:'role='+role});
 check('actualSessionCookie-'+role,session.status===303&&/HttpOnly; Secure; SameSite=Strict/.test(session.headers.get('Set-Cookie')||''));
 cookies[role]=session.headers.get('Set-Cookie').split(';')[0];
}
const rendered=await request('/member/timber-shed',{role:'member-one'});
check('hostedPrivacyCopyMatchesForum',rendered.status===200&&!rendered.text.includes('There is no public profile, member feed or posting.'));
check('hostedHealthRecordSeparationExplained',rendered.text.includes('Only posts you deliberately submit can enter the member community, after human review.'));
check('hostedForumImmediatelyAfterWelcome',rendered.text.indexOf('class="hero"')<rendered.text.indexOf('id="shedForumPilot"')&&rendered.text.indexOf('id="shedForumPilot"')<rendered.text.indexOf('YOUR CHOICE'));
check('hostedProgrammeBelowForum',rendered.text.indexOf('id="shedForumPilot"')<rendered.text.indexOf('FOUNDING PROGRAMME')&&(rendered.text.match(/id="shedForumPilot"/g)||[]).length===1);
const initial=(await api('member-one','participation')).data;
check('newMemberHasNoInventedConsent',initial.adultAccess&&!initial.joined&&!initial.healthConsent);
const agreement={version:initial.policy.version,rulesAccepted:true,privacyAcknowledged:true,healthConsent:false};
check('readOnlyAgreementAccepted',(await api('member-one','participation/consent',agreement)).status===200);
check('readOnlyCanRead',(await api('member-one','latest')).status===200);
check('readOnlyCannotPost',(await api('member-one','submit',{roomId:'main-shed',title:'Fictional topic',body:'A fictional discussion for acceptance testing.'})).data?.error==='explicit_health_consent_required');
for(const role of Object.keys(cookies))check('explicitAgreement-'+role,(await api(role,'participation/consent',{...agreement,healthConsent:true})).status===200);
check('crossOriginWriteDenied',(await api('member-one','profile/save',{displayName:'Hosted Walker One'},{origin:'https://other.test'})).status===403);
for(const [role,displayName] of [['member-one','Hosted Walker One'],['member-two','Hosted Walker Two']])
 check('separateAlias-'+role,(await api(role,'profile/save',{displayName})).status===201);
const post=await api('member-one','submit',{roomId:'main-shed',title:'Hosted fictional '+run,body:'This fictional everyday discussion tests the private hosted service.'});
check('submissionHeld',post.status===202&&post.data.status==='pending');
check('pendingInvisibleToOtherMember',!(await api('member-two','latest')).data.posts.some(p=>p.id===post.data.id));
check('humanApproval',(await api('moderator-one','moderate',{postId:post.data.id,action:'approve'})).status===200);
check('approvedVisible',(await api('member-two','latest')).data.posts.some(p=>p.id===post.data.id));
const risky=await api('member-one','submit',{roomId:'main-shed',title:'Fictional prohibited offer',body:'I have spare Mounjaro pens to sell. Message me to buy them.'});
check('unsafeSubmissionStillHeld',risky.status===202);
check('highRiskOrdinaryApprovalBlocked',(await api('moderator-one','moderate',{postId:risky.data.id,action:'approve'})).status===409);
const appealPost=await api('member-one','submit',{roomId:'main-shed',title:'Fictional appeal '+run,body:'This is another fictional everyday discussion for an independent review.'});
await api('moderator-one','moderate',{postId:appealPost.data.id,action:'reject'});
const appeal=await api('member-one','appeal',{postId:appealPost.data.id,reason:'missed-context'});
check('postAppealAccepted',appeal.status===202);
check('sameReviewerCannotDecideAppeal',(await api('moderator-one','appeal/review',{appealId:appeal.data.id,outcome:'reconsider'})).status===403);
check('differentReviewerCanReturnToQueue',(await api('moderator-two','appeal/review',{appealId:appeal.data.id,outcome:'reconsider'})).status===200);
check('appealNeverPublishes',!(await api('member-two','latest')).data.posts.some(p=>p.id===appealPost.data.id));
await api('member-two','block',{postId:post.data.id});
check('blockedDirectLinkHidden',(await api('member-two','threads?room=main-shed&threadId='+post.data.id)).data.posts.length===0);
const block=(await api('member-two','blocks')).data.blocks[0];
check('ownerCanUnblock',(await api('member-two','unblock',{blockId:block.id})).status===200);
const restriction=await api('moderator-one','restrict',{postId:post.data.id,kind:'suspended',days:1,reason:'other'});
check('humanRestriction',restriction.status===201);
check('restrictedBrowsingDenied',(await api('member-one','latest')).status===403);
check('restrictedOwnExportAvailable',(await api('member-one','export')).status===200);
const accessAppeal=await api('member-one','restriction/appeal',{restrictionId:restriction.data.id,reason:'other'});
check('accessAppealAccepted',accessAppeal.status===202);
check('independentAccessAppeal',(await api('moderator-two','restriction/review',{appealId:accessAppeal.data.id,outcome:'reinstated'})).status===200);
const otherBody='A separate fictional post owned by the other account.';
const other=await api('member-two','submit',{roomId:'main-shed',title:'Other fictional '+run,body:otherBody});
await api('moderator-one','moderate',{postId:other.data.id,action:'approve'});
const own=(await api('member-one','export')).data;
check('ownExportNoOtherPostBody',!JSON.stringify(own).includes(otherBody));
check('ownExportNoEvidenceReferenceOrStaffID',!JSON.stringify(own).includes('fictional-acceptance')&&!JSON.stringify(own).includes('verified_by'));
check('departureClearsParticipation',(await api('member-one','leave',{confirm:'leave-community'})).status===200);
check('departedPostsHidden',!(await api('member-two','latest')).data.posts.some(p=>p.id===post.data.id));
const require=createRequire(import.meta.url),puppeteer=require(process.env.TIMBER_SHED_PUPPETEER_PATH);
const browser=await puppeteer.launch({headless:true,executablePath:process.env.TIMBER_SHED_CHROME_PATH,args:['--no-sandbox']});
try{
 for(const [viewport,width,height] of [['desktop',1440,900],['mobile',390,844]]){
  await api('member-two','leave',{confirm:'leave-community'});
  const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);await page.setViewport({width,height});
  await page.authenticate({username:credential.username,password:credential.password});
  await page.goto(base+'/',{waitUntil:'networkidle0'});
  await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('form:has(input[value="member-two"]) button')]);
  await page.waitForSelector('#shedJoin');
  check(viewport+'UntickedConsent',!await page.$eval('#shedHealthConsent',el=>el.checked));
  for(const id of ['shedRulesAccepted','shedPrivacyAcknowledged','shedHealthConsent']){await page.focus('#'+id);await page.keyboard.press('Space')}
  await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('#shedJoin')]);
  await page.waitForSelector('#shedAliasForm:not([hidden])');
  await page.type('#shedAlias','Hosted Walker Two');await page.click('#shedAliasForm button');
  await page.waitForFunction(()=>!document.getElementById('shedCompose').hidden);
  const title='Browser fictional '+viewport+' '+run;
  await page.type('#shedTitle',title);await page.type('#shedBody','A fictional ordinary discussion for hosted acceptance.');
  await page.click('#shedCompose button[type=submit]');
  await page.waitForFunction(()=>document.getElementById('shedMyPostItems').textContent.includes('Awaiting moderator review'));
  check(viewport+'BrowserSubmissionPending',!(await api('moderator-two','latest')).data.posts.some(p=>p.title===title));
  const modContext=await browser.createBrowserContext(),mod=await modContext.newPage();
  await mod.authenticate({username:credential.username,password:credential.password});
  await mod.setViewport({width,height});mod.setDefaultTimeout(20000);
  await mod.goto(base+'/',{waitUntil:'networkidle0'});
  await Promise.all([mod.waitForNavigation({waitUntil:'networkidle0'}),mod.click('form:has(input[value="moderator-one"]) button')]);
  await mod.waitForSelector('#shedModNav:not([hidden])');await mod.click('#shedModNav');
  await mod.waitForSelector('#shedQueue .shed-mod-item');
  const buttons=await mod.$$('#shedQueue button');let approve;
  for(const b of buttons)if(await b.evaluate(el=>el.textContent.trim()==='approve')){approve=b;break}
  assert(approve,'Moderator approval control missing');await approve.click();
  await mod.waitForFunction(()=>!document.getElementById('shedQueue').textContent.includes('Browser fictional'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(title=>document.getElementById('shedLatestItems').textContent.includes(title),{},title);
  check(viewport+'BrowserHumanApprovalVisible',true);
  check(viewport+'NoOverflow',!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  check(viewport+'NoPageErrors',errors.length===0);
  await page.screenshot({path:'/tmp/timber-shed-hosted-'+viewport+'-20261023.png',fullPage:true});
  await modContext.close();await context.close();
 }
}finally{await browser.close()}
const receipt={host:base,checkedAt:new Date().toISOString(),syntheticOnly:true,noExternalAI:true,noEmails:true,checks:checks.length,passed:checks};
if(process.env.TIMBER_SHED_ACCEPTANCE_RECEIPT)writeFileSync(process.env.TIMBER_SHED_ACCEPTANCE_RECEIPT,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
