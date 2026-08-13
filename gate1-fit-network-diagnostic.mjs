import {chromium} from 'playwright';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';

const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.STATE_EVIDENCE_DIR||'state-system-evidence';
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC required');
fs.mkdirSync(OUT,{recursive:true});
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const report={proof:'G1_008_FIT_NETWORK_DIAGNOSTIC_V3_CLIENT_SOURCE',events:[],console:[],pageErrors:[],requestFailures:[],auth:null,ui:null,result:null,directReplay:null,liveClient:null};
const write=()=>fs.writeFileSync(`${OUT}/fit-network-diagnostic.json`,JSON.stringify(report,null,2));
const email=`shiftsometimber+structured-g1fitdiag-${Date.now()}@gmail.com`;
const password=`Sst-${randomUUID()}-Aa1!`;
let fitPostData=null;

const registration=await fetch(`${API}/v1/auth/register`,{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email,firstName:'Dave',password,source:'commissioning-g1-fit-diagnostic'})});
if(registration.status!==201)throw new Error(`diagnostic registration failed HTTP ${registration.status}`);

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  const startedAt=Date.now();
  page.on('request',req=>{if(req.url().startsWith(API)){const row={type:'request',method:req.method(),url:req.url(),at:Date.now(),elapsedMs:Date.now()-startedAt};if(req.method()==='POST'&&req.url().includes('/v1/fit/plan')){fitPostData=req.postData();row.postData=clean(fitPostData).slice(0,4000)}report.events.push(row)}});
  page.on('response',res=>{if(res.url().startsWith(API))report.events.push({type:'response',method:res.request().method(),url:res.url(),status:res.status(),at:Date.now(),elapsedMs:Date.now()-startedAt})});
  page.on('requestfailed',req=>{if(req.url().startsWith(API))report.requestFailures.push({method:req.method(),url:req.url(),failure:req.failure(),at:Date.now(),elapsedMs:Date.now()-startedAt})});
  page.on('console',msg=>{if(['error','warning'].includes(msg.type()))report.console.push({type:msg.type(),text:clean(msg.text()).slice(0,800)})});
  page.on('pageerror',err=>report.pageErrors.push(clean(err?.message||err).slice(0,1200)));

  await page.goto(`${SITE}/member-login`,{waitUntil:'networkidle',timeout:45000});
  const auth=await page.evaluate(async({api,email,password})=>{const login=await fetch(`${api}/v1/auth/login`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});const state=await fetch(`${api}/v1/member-state`,{credentials:'include',headers:{Accept:'application/json'}});return{loginStatus:login.status,loginOk:login.ok,stateStatus:state.status,stateOk:state.ok}}, {api:API,email,password});
  const jar=await context.cookies(`${API}/`);
  report.auth={...auth,sessionCookie:jar.some(x=>x.name==='sst_session')};
  if(!auth.loginOk||!auth.stateOk||!report.auth.sessionCookie)throw new Error(`diagnostic auth failed ${JSON.stringify(report.auth)}`);

  await page.goto(`${SITE}/member/dashboard`,{waitUntil:'domcontentloaded',timeout:45000});
  const liveClient=await page.evaluate(async()=>{
    const scripts=[...document.scripts].map(s=>s.src).filter(Boolean);
    const target=scripts.find(src=>/member-product-v33d\.js/i.test(src))||scripts.find(src=>/member-product/i.test(src))||null;
    if(!target)return{target:null,error:'member product script not found',scripts};
    try{const r=await fetch(target,{cache:'no-store'});return{target,status:r.status,ok:r.ok,text:await r.text(),scripts}}catch(e){return{target,error:String(e?.message||e),scripts}}
  });
  if(liveClient?.text){
    fs.writeFileSync(`${OUT}/member-product-live.js`,liveClient.text);
    const lines=liveClient.text.split(/\r?\n/),hits=[];
    for(let i=0;i<lines.length;i++)if(/AbortController|abort\(|15000|15_000|setTimeout|fit\/plan|fitGenerate/i.test(lines[i]))hits.push({line:i+1,text:lines[i].slice(0,1200)});
    report.liveClient={target:liveClient.target,status:liveClient.status,ok:liveClient.ok,bytes:Buffer.byteLength(liveClient.text),hits:hits.slice(0,120)};
  }else report.liveClient={target:liveClient?.target||null,error:liveClient?.error||'source capture failed',scripts:liveClient?.scripts||[]};

  const fitNav=page.getByRole('button',{name:/^fit$/i}).first();
  const fitLink=page.getByRole('link',{name:/^fit$/i}).first();
  const fitText=page.getByText(/^fit$/i).first();
  const nav=await fitNav.count()&&await fitNav.isVisible().catch(()=>false)?fitNav:await fitLink.count()&&await fitLink.isVisible().catch(()=>false)?fitLink:fitText;
  if(!await nav.count())throw new Error('Fit navigation control missing');
  await nav.click({timeout:8000});
  const build=page.getByRole('button',{name:/build my session/i}).first();
  await build.waitFor({state:'visible',timeout:15000});
  const before=clean(await page.locator('body').innerText());
  const start=Date.now();
  const responsePromise=page.waitForResponse(r=>{let u;try{u=new URL(r.url())}catch{return false}return r.request().method()==='POST'&&u.pathname==='/v1/fit/plan'},{timeout:65000}).catch(()=>null);
  await build.click({timeout:8000});
  await page.waitForTimeout(350);
  report.ui={disabledDuring:await build.isDisabled().catch(()=>false),bodyChangedDuring:clean(await page.locator('body').innerText())!==before,bodyDuring:clean(await page.locator('body').innerText()).slice(0,1800)};
  const response=await responsePromise;
  if(response){
    let payload=null;try{payload=await response.json()}catch{}
    await page.waitForTimeout(1000);
    const after=clean(await page.locator('body').innerText());
    report.result={ok:response.ok(),status:response.status(),elapsedMs:Date.now()-start,error:payload?.error||null,qualityIssues:payload?.quality?.issues||payload?.qualityCommissioning?.issues||null,sessionCount:payload?.plan?.sessions?.length||0,bodyAfter:after.slice(0,2200)};
  }else{
    report.result={ok:false,reason:'no browser /v1/fit/plan response inside 65s',elapsedMs:Date.now()-start};
  }

  if(fitPostData){
    const cookie=(await context.cookies(`${API}/`)).map(x=>`${x.name}=${x.value}`).join('; ');
    const directStart=Date.now();
    try{
      const replay=await fetch(`${API}/v1/fit/plan`,{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json',Cookie:cookie},body:fitPostData,signal:AbortSignal.timeout(120000)});
      let payload=null;try{payload=await replay.json()}catch{}
      report.directReplay={ok:replay.ok,status:replay.status,elapsedMs:Date.now()-directStart,error:payload?.error||null,qualityIssues:payload?.quality?.issues||payload?.qualityCommissioning?.issues||null,sessionCount:payload?.plan?.sessions?.length||0,planDays:payload?.plan?.days?.length||null};
    }catch(e){report.directReplay={ok:false,elapsedMs:Date.now()-directStart,error:clean(e?.message||e),name:e?.name||null,cause:clean(e?.cause?.message||'').slice(0,500)||null}}
  }else report.directReplay={ok:false,error:'browser emitted no captured Fit POST body'};

  await page.screenshot({path:`${OUT}/fit-network-diagnostic.png`,fullPage:true}).catch(()=>{});
  write();
  if(!report.result?.ok)throw new Error(`Fit browser diagnostic did not receive a successful response; replay=${JSON.stringify(report.directReplay)}`);
  console.log(JSON.stringify(report,null,2));
}finally{write();await browser.close()}
