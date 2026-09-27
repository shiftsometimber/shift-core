const fs=require('fs'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.SEO_TOOLS+'/node_modules/playwright');
const base='https://shift-seo-repair-preview.matobrien.workers.dev';
(async()=>{
 const rows=[];
 for(const [engine,width] of [[chromium,390],[chromium,1440],[webkit,390]]){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900}});let pending=[];
  await context.route('**/*',route=>{
   const r=route.request(),u=new URL(r.url());
   if(!['GET','HEAD'].includes(r.method())||/google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com/.test(u.hostname))return route.abort();
   if(u.pathname==='/articles/mounjaro-cost-uk/image'){pending.push(route);return;}
   return route.continue();
  });
  const page=await context.newPage();const row={engine:engine===webkit?'webkit':'chromium',width};
  try{
   await page.goto(base+'/articles/mounjaro-cost-uk',{waitUntil:'domcontentloaded'});await page.waitForTimeout(700);
   const image=page.locator('main img[fetchpriority="high"]').first();
   row.before=await image.evaluate(x=>({width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height,complete:x.complete,naturalWidth:x.naturalWidth,naturalHeight:x.naturalHeight,aspectRatio:getComputedStyle(x).aspectRatio}));
   assert(pending.length>0,'The image request must actually be held');assert.equal(row.before.naturalWidth,0,'Before measurement was taken after image delivery');assert(row.before.width>100&&Math.abs(row.before.width/row.before.height-1.5)<0.01,'Image space was not reserved');
   const held=pending;pending=[];await Promise.all(held.map(r=>r.continue()));
   await image.evaluate(x=>x.complete&&x.naturalWidth>0?Promise.resolve():new Promise((resolve,reject)=>{x.addEventListener('load',resolve,{once:true});x.addEventListener('error',()=>reject(Error('Image load failed')),{once:true});}));
   row.after=await image.evaluate(x=>({width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height,naturalWidth:x.naturalWidth,naturalHeight:x.naturalHeight,src:x.currentSrc}));
   assert(Math.abs(row.after.naturalWidth/row.after.naturalHeight-1.5)<0.01,'Actual image ratio differs from the reserved ratio');assert(Math.abs(row.after.height-row.before.height)<1,'Loading the image changed its reserved height');row.pass=true;
  }catch(e){row.pass=false;row.error=String(e);for(const r of pending)await r.abort().catch(()=>{});}
  rows.push(row);await context.close();await browser.close();
 }
 fs.writeFileSync('seo-repair-proof/image-reservation.json',JSON.stringify({scope:'The actual title-card request is held, measured and then released. Public GET only. No substitute image or guessed natural dimensions.',rows},null,2));console.log(JSON.stringify(rows,null,2));if(rows.some(x=>!x.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
