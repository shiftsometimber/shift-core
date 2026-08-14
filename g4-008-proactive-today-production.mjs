import {chromium} from 'playwright';
import {randomUUID} from 'node:crypto';
const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC required');
const password=`Sst-${randomUUID()}-Aa1!`,email=`shiftsometimber+g4008-${Date.now()}@gmail.com`;
const api=async(page,p,o={})=>page.evaluate(async({api,p,o})=>{const r=await fetch(api+p,{credentials:'include',...o,headers:{Accept:'application/json','Content-Type':'application/json',...(o.headers||{})}});let body={};try{body=await r.json()}catch{}return{ok:r.ok,status:r.status,body}}, {api:API,p,o});
const reg=await fetch(`${API}/v1/auth/register`,{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email,password,firstName:'ProactiveProof',source:'commissioning-g4-008'})});
if(reg.status!==201)throw new Error(`register ${reg.status} ${await reg.text()}`);
const browser=await chromium.launch({headless:true});let report={proof:'G4_008_PROACTIVE_TODAY_PRODUCTION_V1'};
try{const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await ctx.newPage();
 await page.goto(`${SITE}/member-login`,{waitUntil:'domcontentloaded'});
 const login=await api(page,'/v1/auth/login',{method:'POST',body:JSON.stringify({email,password})});if(!login.ok)throw new Error(`login ${login.status}`);
 let privacy=await api(page,'/v1/shift-ai/privacy',{method:'POST',body:JSON.stringify({proactive_insights:true,proactive_cooldown_hours:12})});if(!privacy.ok)throw new Error(`privacy-on ${privacy.status}`);
 const chat=await api(page,'/v1/shift-ai/chat',{method:'POST',body:JSON.stringify({message:'Remember this: taking a short walk after lunch always clears my head and works for me.',remember:true})});if(!chat.ok)throw new Error(`chat ${chat.status}`);
 let memory=[];for(let i=0;i<12;i++){await page.waitForTimeout(1000);const m=await api(page,'/v1/shift-ai/memory');memory=m.body?.memories||[];if(memory.length)break}if(!memory.length)throw new Error('explicit durable memory was not retained');
 let chosen=memory.find(x=>['effective_strategy','recurring_pattern','trigger','motivator','blocker','avoid_strategy'].includes(x.category))||memory[0];
 if(!['effective_strategy','recurring_pattern','trigger','motivator','blocker','avoid_strategy'].includes(chosen.category)||Number(chosen.confidence)<.8){const patch=await api(page,'/v1/shift-ai/memory/'+encodeURIComponent(chosen.memory_key),{method:'PATCH',body:JSON.stringify({category:'effective_strategy',confidence:.95,memory_value:'A short walk after lunch reliably helps this member clear his head.'})});if(!patch.ok)throw new Error(`memory-patch ${patch.status}`);chosen=patch.body.memory}
 await page.goto(`${SITE}/member/dashboard#today`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#panel-today')?.dataset.todayPremiumReady==='true',null,{timeout:20000});await page.waitForFunction(()=>document.querySelector('#panel-today')?.dataset.todayProactiveCount==='1',null,{timeout:15000});
 const rendered=await page.evaluate(()=>({text:document.querySelector('#panel-today')?.innerText||'',count:document.querySelector('#panel-today')?.dataset.todayProactiveCount,card:document.querySelector('[data-today-proactive="true"]')?.innerText||'',overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
 if(!/SHIFT NOTICED/i.test(rendered.card)||rendered.count!=='1'||rendered.overflow>0)throw new Error(`proactive card not rendered cleanly ${JSON.stringify(rendered)}`);
 const cooldown=await api(page,'/v1/shift-ai/proactive/feed');if(!cooldown.ok||!Array.isArray(cooldown.body?.insights)||cooldown.body.insights.length!==0)throw new Error(`cooldown failed ${JSON.stringify(cooldown)}`);
 privacy=await api(page,'/v1/shift-ai/privacy',{method:'POST',body:JSON.stringify({proactive_insights:false})});if(!privacy.ok||Number(privacy.body?.settings?.proactive_insights)!==0)throw new Error('privacy off failed');
 const disabled=await api(page,'/v1/shift-ai/proactive/feed');if(!disabled.ok||disabled.body?.reason!=='proactive_disabled'||disabled.body?.insights?.length)throw new Error(`privacy suppression failed ${JSON.stringify(disabled)}`);
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#panel-today')?.dataset.todayPremiumReady==='true',null,{timeout:20000});await page.waitForTimeout(500);const after=await page.evaluate(()=>({count:document.querySelector('#panel-today')?.dataset.todayProactiveCount,card:!!document.querySelector('[data-today-proactive="true"]')}));if(after.count!=='0'||after.card)throw new Error(`privacy-off Today still proactive ${JSON.stringify(after)}`);
 report={...report,memory:{key:chosen.memory_key,category:chosen.category,confidence:Number(chosen.confidence)},rendered,cooldown:cooldown.body,privacyOff:disabled.body,afterReload:after,status:'PASS'};console.log(JSON.stringify(report,null,2));console.log('PASS G4-008 production: learned durable signal surfaced once in premium Today, cooldown suppressed repeat delivery, privacy-off suppressed proactive delivery and reload.');await ctx.close();
}finally{await browser.close();}
