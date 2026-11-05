import fs from'node:fs';import{chromium}from'/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright/index.mjs';
const mode=process.argv.includes('--after')?'after':'before',origin='https://shiftsometimber.co.uk',a=JSON.parse(fs.readFileSync('/private/tmp/my-timber-v7-live-proof-account.json')),dir='member-experience/meal-windows-evidence/speed';fs.mkdirSync(dir,{recursive:true});
const report={at:new Date().toISOString(),mode,physical:false,profile:{viewport:[390,844],latencyMs:150,downloadBytesPerSecond:200000,uploadBytesPerSecond:96000,cpuSlowdown:4},samples:[],errors:[]},b=await chromium.launch();
const stats=v=>{v.sort((a,b)=>a-b);return{n:v.length,medianMs:Math.round(v[Math.floor(v.length/2)]),p95Ms:Math.round(v[Math.ceil(v.length*.95)-1])}};
for(let n=0;n<20;n++){
 const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});await c.addCookies([{name:'sst_session',value:a.token,url:origin,secure:true,httpOnly:true}]);const p=await c.newPage();
 try{
  const s=await c.newCDPSession(p);await s.send('Network.enable');await s.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:96000,connectionType:'cellular4g'});await s.send('Emulation.setCPUThrottlingRate',{rate:4});
  await p.goto(origin+'/member/dashboard?mt-rollback=1#today',{waitUntil:'domcontentloaded'});await p.locator('[data-v7-action-card]').waitFor({timeout:20000});const freshToday=await p.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return performance.now()});
  await p.getByRole('link',{name:'Grub',exact:true}).click();await p.locator('.mt-grub').waitFor();await p.getByRole('link',{name:'Today',exact:true}).click();await p.locator('[data-v7-action-card]').waitFor();
  const warmSwitch=await p.evaluate(async()=>{const start=performance.now();document.querySelector('#mtShopChrome a[href="/member/grub"]').click();await new Promise(resolve=>{if(document.querySelector('.mt-grub'))return requestAnimationFrame(()=>requestAnimationFrame(resolve));document.addEventListener('mt:screen-activated',()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)),{once:true})});return performance.now()-start});
  report.samples.push({n,freshToday,warmSwitch});
 }catch(e){report.errors.push({n,message:e.message});}finally{await c.close()}
}
await b.close();report.summary=Object.fromEntries(['freshToday','warmSwitch'].map(k=>[k,stats(report.samples.map(s=>s[k]))]));fs.writeFileSync(dir+'/'+mode+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({mode,summary:report.summary,errors:report.errors}));if(report.errors.length)process.exitCode=1;
