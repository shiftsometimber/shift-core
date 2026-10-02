import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {commissioningLogin,memberReady,requireMemberPanel,chooseNecessaryCookies} from '../rendered-member-acceptance-support.mjs';

const site='https://shiftsometimber.co.uk',api='https://api.shiftsometimber.co.uk';
const identity={site,api,oidc:'synthetic-oidc-test-value',email:'shiftsometimber+structured-acceptance-test@gmail.com',password:'test-only'};
function harness({sessionEmail=identity.email,sessionStatus=200,loginStatus=200,shown=true,capability=true,controlVisible=true}={}){
  const requests=[],clicks=[],navigations=[];
  const response=(status,body)=>({ok:()=>status>=200&&status<300,status:()=>status,json:async()=>body});
  const context={request:{post:async(url,options)=>{requests.push({method:'POST',url,options});return response(loginStatus,{})},get:async(url,options)=>{requests.push({method:'GET',url,options});return response(sessionStatus,{user:{email:sessionEmail}})}}};
  const host={count:async()=>Number(capability),waitFor:async()=>{assert.ok(clicks.length,'panel visibility is checked after its real navigation is clicked')}};
  const page={context:()=>context,goto:async url=>navigations.push(url),url:()=>site+'/member/dashboard',
    waitForFunction:async(fn,arg)=>{
      // Execute the readiness predicate against both an authenticated and a
      // signed-out DOM: a stale body class must never turn either into a pass.
      const previous=globalThis.document;
      globalThis.document={querySelector:selector=>selector==='#previewMember'?{classList:{contains:()=>shown},hidden:!shown,getBoundingClientRect:()=>({height:shown?300:0})}:selector==='#previewAuth'?{hidden:shown}:selector.startsWith('#panel-')?{classList:{contains:()=>clicks.length>0}}:null};
      try{if(!fn(arg))throw Error('readiness timeout')}finally{globalThis.document=previous}
    },evaluate:async()=>({path:'/member/dashboard',memberReady:shown,memberHidden:!shown,authHidden:shown,panels:[]}),
    locator:selector=>selector==='.cookie-banner-v3a'||selector.startsWith('script[')?{count:async()=>0}:selector==='#appMore'?{count:async()=>0}:selector.startsWith('#panel-')?host:{count:async()=>1,nth:()=>({isVisible:async()=>controlVisible,click:async()=>clicks.push(selector),locator:()=>({count:async()=>0})})}};
  return{page,requests,clicks,navigations};
}

test('normal OIDC login verifies the synthetic identity on both serving origins without copying cookies',async()=>{
  const h=harness();const proof=await commissioningLogin(h.page,identity);
  assert.deepEqual(proof,{authenticated:true,origins:[api,site]});
  assert.equal(h.requests[0].options.headers['X-Shift-Commissioning-OIDC'],identity.oidc);
  assert.deepEqual(h.requests.slice(1).map(r=>r.url),[api+'/v1/me',site+'/v1/me']);
  await memberReady(h.page,{site,panel:'visualise'});
  assert.deepEqual(h.navigations,[site+'/member/dashboard']);assert.equal(h.clicks.length,1);
});

test('an unrelated or missing member session cannot satisfy commissioning login',async()=>{
  for(const options of [{sessionEmail:'different@example.test'},{sessionStatus:401},{loginStatus:403}]){
    const h=harness(options);await assert.rejects(commissioningLogin(h.page,identity),/Commissioning/);
    await assert.rejects(memberReady(h.page,{site}),/verified commissioning session/);
  }
});

test('personal accounts and missing commissioning authority are rejected before any request',async()=>{
  const h=harness();
  await assert.rejects(commissioningLogin(h.page,{...identity,email:'member@example.test'}),/synthetic/);
  await assert.rejects(commissioningLogin(h.page,{...identity,oidc:''}),/OIDC required/);
  assert.equal(h.requests.length,0);
});

test('a successful API login does not pass an unready signed-out interface',async()=>{
  const h=harness({shown:false});await commissioningLogin(h.page,identity);
  await assert.rejects(memberReady(h.page,{site}),/Authenticated member UI did not become ready/);
});

test('missing panels and hidden navigation remain actionable failures',async()=>{
  await assert.rejects(requireMemberPanel(harness({capability:false}).page,'visualise'),/Missing member capability: #panel-visualise is absent/);
  await assert.rejects(requireMemberPanel(harness({controlVisible:false}).page,'plans'),/no visible navigation/);
  await assert.rejects(requireMemberPanel(harness().page,'plans"]'),/Invalid member panel/);
});

test('a utility under More opens through its visible disclosure without forcing DOM state',async()=>{
  let open=false,clicked=false;
  const summary={isVisible:async()=>true,click:async()=>{open=true}};
  const candidate={isVisible:async()=>open,click:async()=>{clicked=true},locator:()=>({count:async()=>1,locator:()=>({first:()=>summary})})};
  const page={locator:selector=>selector==='.cookie-banner-v3a'||selector.startsWith('script[')?{count:async()=>0}:selector==='#appMore'?{count:async()=>0}:selector.startsWith('#panel-')?{count:async()=>1,waitFor:async()=>assert.ok(clicked)}:{count:async()=>1,nth:()=>candidate},waitForFunction:async()=>assert.ok(clicked)};
  await requireMemberPanel(page,'plans');assert.ok(open);assert.ok(clicked);
});

function sharedMoreHarness({panel='visualise',moreVisible=true,destinationVisible=true,nested=false}={}){
  let menuOpen=false,disclosureOpen=!nested,destinationClicked=false;
  const clicks=[];
  const more={count:async()=>1,isVisible:async()=>moreVisible,getAttribute:async()=>String(menuOpen),click:async()=>{menuOpen=true;clicks.push('More')}};
  const summary={isVisible:async()=>menuOpen,click:async()=>{disclosureOpen=true;clicks.push('Plans and records')}};
  const candidate={isVisible:async()=>menuOpen&&disclosureOpen&&destinationVisible,click:async()=>{destinationClicked=true;clicks.push(panel)},locator:()=>({count:async()=>Number(nested&&!disclosureOpen),locator:()=>({first:()=>summary})})};
  const host={count:async()=>1,waitFor:async()=>assert.ok(destinationClicked)};
  const page={locator:selector=>selector==='.cookie-banner-v3a'||selector.startsWith('script[')?{count:async()=>0}:selector==='#appMore'?more:selector.startsWith('#panel-')?host:{count:async()=>1,nth:()=>candidate},waitForFunction:async()=>assert.ok(destinationClicked),evaluate:async()=>({path:'/member/dashboard',appMore:{expanded:String(menuOpen)}})};
  return{page,clicks};
}

test('shared More opens Progress and nested Plans through visible member controls',async()=>{
  const progress=sharedMoreHarness();await requireMemberPanel(progress.page,'visualise');assert.deepEqual(progress.clicks,['More','visualise']);
  const plans=sharedMoreHarness({panel:'plans',nested:true});await requireMemberPanel(plans.page,'plans');assert.deepEqual(plans.clicks,['More','Plans and records','plans']);
});

test('opening shared More cannot make hidden or missing navigation pass',async()=>{
  const hiddenButton=sharedMoreHarness({moreVisible:false});await assert.rejects(requireMemberPanel(hiddenButton.page,'visualise'),/no visible navigation/);assert.deepEqual(hiddenButton.clicks,[]);
  const hiddenDestination=sharedMoreHarness({destinationVisible:false});await assert.rejects(requireMemberPanel(hiddenDestination.page,'visualise'),/no visible navigation/);assert.deepEqual(hiddenDestination.clicks,['More']);
});

test('production acceptance executes the committed harness without runtime source rewrites or blanket 400 filtering',async()=>{
  const workflow=await readFile(new URL('../.github/workflows/rendered-member-production-acceptance.yml',import.meta.url),'utf8');
  assert.doesNotMatch(workflow,/path\.write_text|text\.replace|\(400\|401\|404\)/);
  assert.ok(workflow.indexOf('Install Chromium once')<workflow.indexOf('Acquire G2-011 commissioning identity'));
  for(const name of ['g2-011-progress-story-production.mjs','g2-013-progress-picture-rendered-production.mjs','g2-014-progress-picture-premium-production.mjs','g2-015-plan-manager-production.mjs']){
    const source=await readFile(new URL('../'+name,import.meta.url),'utf8');
    assert.match(source,/commissioningLogin\(p,/);assert.match(source,/memberReady\(p,/);assert.match(source,/requireMemberPanel\(p,/);
    assert.doesNotMatch(source,/classList\.contains\('member-ready'\)|addCookies|clearCookies/);
  }
});

test('normal Necessary only choice resolves the blocking dialog before member navigation',async()=>{
  const h=sharedMoreHarness();let shown=true;const locate=h.page.locator;
  h.page.locator=selector=>selector.startsWith('script[')?{count:async()=>0}:selector==='.cookie-banner-v3a'?{count:async()=>1,isVisible:async()=>shown,locator:()=>({count:async()=>1,isVisible:async()=>true,click:async()=>{shown=false;h.clicks.push('Necessary only')}}),waitFor:async()=>assert.equal(shown,false)}:locate(selector);
  await requireMemberPanel(h.page,'visualise');assert.deepEqual(h.clicks,['Necessary only','More','visualise']);
});
test('missing Necessary only control remains a failure rather than hiding or bypassing consent',async()=>{
  const page={locator:selector=>selector.startsWith('script[')?{count:async()=>0}:{count:async()=>1,isVisible:async()=>true,locator:()=>({count:async()=>0})}};
  await assert.rejects(chooseNecessaryCookies(page),/visible Necessary only control/);
});
