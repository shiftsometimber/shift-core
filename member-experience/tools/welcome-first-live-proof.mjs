// Verify the real live first-visit state using an owned synthetic account only.
// No clinical answers, food, action logs, orders, payments or messages are created.
import fs from 'node:fs';import crypto from 'node:crypto';
import {chromium,webkit} from '/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright/index.mjs';
import {cloudflareRequest as cf} from '/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/journey-shop-release-20261031/performance-precompiled-cloudflare-client-20261103.mjs';
const A='9e5386dcf455be34c582d93f8bfc79e6',D='88f40aed-cb23-4372-8c94-8a73f48bc847',origin='https://shiftsometimber.co.uk';
const dir='member-experience/welcome-release-evidence/welcome-first-live-20261104';fs.mkdirSync(dir,{recursive:true});
const query=async(sql,params=[])=>{const r=await cf('/accounts/'+A+'/d1/database/'+D+'/query','POST',{sql,params});if(!r.every(x=>x.success))throw Error('Synthetic fixture query failed');return r[0].results;};
const id=900711104,email='welcome-first-live-20261104@example.invalid',file='/private/tmp/my-timber-welcome-first-live-access.json';
const old=(await query('SELECT email FROM users WHERE id=?',[id]))[0];if(old&&old.email!==email)throw Error('Synthetic account boundary');
const a=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{id,email,token:crypto.randomBytes(32).toString('hex')};if(a.id!==id||a.email!==email)throw Error('Credential boundary');
await query('INSERT INTO users(id,email,first_name,last_name) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING',[id,email,'Synthetic','Welcome first']);
await query('INSERT INTO member_state(user_id,preferences) VALUES(?,?) ON CONFLICT(user_id) DO NOTHING',[id,'{}']);
await query('INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(?,?,?) ON CONFLICT(token_hash) DO UPDATE SET expires_at=excluded.expires_at,revoked_at=NULL',[id,crypto.createHash('sha256').update(a.token).digest('hex'),new Date(Date.now()+7200000).toISOString()]);
fs.writeFileSync(file,JSON.stringify(a),{mode:0o600});
const deployments=await cf('/accounts/'+A+'/workers/scripts/shift-programme-member-20261023/deployments');const latest=deployments.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];
const report={at:new Date().toISOString(),origin,liveVersion:latest.versions,syntheticAccount:{id,email},physical:false,engines:[]};
for(const[name,type]of[['chromium',chromium],['webkit',webkit]]){
 const b=await type.launch(),e={name,checks:[],errors:[],shots:[],measurements:[]};report.engines.push(e);
 for(const[width,height]of[[320,568],[375,667],[390,844]]){
  const c=await b.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true}),p=await c.newPage();p.on('pageerror',x=>e.errors.push(x.message));
  await c.addCookies([{name:'sst_session',value:a.token,domain:'.shiftsometimber.co.uk',path:'/',httpOnly:true,secure:true,sameSite:'Lax'}]);
  const label=width+'x'+height,check=(id,pass)=>{e.checks.push({id:label+': '+id,pass});if(!pass)throw Error(id)};
  try{
   await p.goto(origin+'/member/dashboard/welcome?mt-rollback=1',{waitUntil:'domcontentloaded'});await p.locator('[data-welcome-primary]').waitFor();await p.evaluate(()=>document.fonts.ready);
   const boot=await(await p.request.get(origin+'/v1/my-timber/boot')).json();check('actual first-visit account',boot.setupComplete===false);
   await p.locator('.mt-welcome img').evaluateAll(ns=>Promise.all(ns.map(n=>n.decode())));
   check('Make it mine visible on first welcome',await p.getByRole('link',{name:'Make it mine',exact:true}).isVisible());
   check('first-visit artwork with Make it mine',await p.locator('.mt-welcome img').evaluate(n=>n.src.includes('v7-welcome-note.webp')&&n.alt.includes('MAKE IT MINE')));
   const m=await p.locator('[data-welcome-primary]').evaluate(a=>{const r=a.getBoundingClientRect(),n=a.previousElementSibling.getBoundingClientRect(),bar=document.querySelector('.mt-shop-bottom').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,noteBottom:n.bottom,bottomBarTop:bar.top,scrollY,underNote:a.previousElementSibling.matches('.mt-welcome-note')&&n.bottom<=r.y,uncovered:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('a')===a};});
   e.measurements.push({width,height,...m});check('Explore directly below note',m.underNote);check('Explore visible without scrolling',m.scrollY===0&&m.bottom<=m.bottomBarTop&&m.uncovered);
   check('green box with cream shimmer',await p.locator('[data-welcome-primary]').evaluate(n=>getComputedStyle(n).backgroundColor==='rgb(112, 119, 98)'&&getComputedStyle(n,'::before').animationName==='mtWelcomeShimmer'));
   check('large headline absent',await p.locator('.mt-welcome img').count()===1&&await p.locator('.mt-welcome-headline').count()===0);
   const shot=name+'-first-'+label+'.jpg';await p.screenshot({path:dir+'/'+shot,quality:85});e.shots.push(shot);
   await p.evaluate(()=>window.__welcomeFrame=document.querySelector('#mtShopChrome'));await p.getByRole('link',{name:'Make it mine',exact:true}).click();await p.waitForURL('**/member/dashboard/personalise');await p.locator('#joinSetup:not([hidden])').waitFor();
   check('Make it mine opens setup in shared frame',await p.locator('#mtNativeMain').isVisible()&&await p.evaluate(()=>window.__welcomeFrame===document.querySelector('#mtShopChrome')));
   check('setup controls loaded',await p.locator('#joinSetup').getByRole('button').count()>0);
  }catch(x){e.errors.push(label+': '+(x.stack||x.message));}finally{await c.close();}
 }
 await b.close();console.log(JSON.stringify({name,pass:e.checks.filter(x=>x.pass).length,fail:e.checks.filter(x=>!x.pass).length,errors:e.errors}));fs.writeFileSync(dir+'/results.json',JSON.stringify(report,null,2));
}
if(report.engines.some(x=>x.errors.length||x.checks.some(c=>!c.pass)))process.exitCode=1;
