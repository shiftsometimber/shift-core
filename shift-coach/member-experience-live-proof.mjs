// Run the unchanged member-tool tasks against the actual Worker fixture.
// Only localhost and explicitly labelled synthetic accounts are allowed.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {verifyLiveTools} from '../release/app-member-live.mjs';
import {chooseNecessaryCookies} from '../rendered-member-acceptance-support.mjs';
const origin=process.env.MEMBER_EXPERIENCE_PREVIEW_ORIGIN||'http://127.0.0.1:57359';
assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(origin),'Local synthetic fixture required');
const out=process.env.EXPERIENCE_LIVE_PROOF_OUT||'/tmp/my-timber-experience-live-proof-20261015';mkdirSync(out,{recursive:true});
const report={at:new Date().toISOString(),synthetic:true,physicalDevice:false,productionRequests:0,checks:[],pageErrors:[],failedAPIs:[]};
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'}),page=await context.newPage();
page.on('pageerror',e=>report.pageErrors.push(e.message));page.on('response',r=>{if(new URL(r.url()).pathname.startsWith('/v1/')&&r.status()>=400)report.failedAPIs.push({path:new URL(r.url()).pathname,status:r.status()})});
await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
async function api(path,body){const r=await context.request.fetch(origin+path,{method:body?'POST':'GET',headers:{Origin:origin},...(body?{data:body}:{})});assert(r.ok(),path+' '+r.status()+' '+await r.text());return r.json()}
try{
 await page.goto(origin+'/__synthetic-preview');await page.getByText('Synthetic member preview · changes affect test accounts only.',{exact:true}).waitFor();
 const me=await api('/v1/me');assert.match(me.email||me.user?.email||'',/@example\.invalid$/,'Fictional account required');
 await api('/v1/consents',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true});
 let {progress}=await api('/v1/life-back');
 if(progress.goalId==='personal-start')({progress}=await api('/v1/life-back',{action:'goal',revision:progress.revision,goal:'Fictional release check: family walk',operationId:crypto.randomUUID()}));
 if(!progress.entries.length)await api('/v1/life-back',{action:'checkin',goalId:progress.goalId,ratings:{energy:40,sleep:60,confidence:60,movement:60,clothes:60,personal:60},win:'',supportNeed:'food',operationId:crypto.randomUUID()});
 await chooseNecessaryCookies(page);await verifyLiveTools(page,origin,out,report);
 const tools=report.checks.filter(c=>c.inlineTools);assert.equal(tools.length,4);assert(tools.every(c=>c.topNavigations===0&&c.draftsRetained&&c.history));
 assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.failedAPIs,[]);report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;throw error}
finally{writeFileSync(out+'/receipt.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
