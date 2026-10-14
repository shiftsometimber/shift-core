// Acceptance-only; existing G2 fictional identities, never real member data.
// Append only after every original two-record/fresh-login assertion.
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const SYNTHETIC=/^shiftsometimber\+(?:finish|longitudinal|b03|structured|structured-authrender|sport|safety)-[a-z0-9-]+@gmail\.com$/i;
const WINDOWS={desktop:['2026-10-01','2026-10-02'],mobile390:['2026-10-03','2026-10-04']};
export const csvWindow=id=>{assert(Object.hasOwn(WINDOWS,id),'Declared G2 case required');return WINDOWS[id];};
async function identity(ctx,{site,api,email}){
 assert(SYNTHETIC.test(email),'Existing commissioned fictional holder required');
 for(const origin of new Set([new URL(site).origin,new URL(api).origin])){const r=await ctx.request.get(origin+'/v1/me',{headers:{Origin:site,'Cache-Control':'no-cache'}}),b=await r.json().catch(()=>null);assert(r.ok()&&String(b?.user?.email||'').toLowerCase()===email.toLowerCase(),'Fictional identity mismatch');}
}
async function summary(ctx,{site,api}){
 const r=await ctx.request.get(api+'/v1/progress/summary',{headers:{Origin:site,'Cache-Control':'no-cache'}});assert(r.ok(),'Owned saved summary unavailable');const b=await r.json();assert(b?.progress);return b.progress;
}
const weights=s=>s.metrics?.find(m=>m.key==='weight')?.series||[];
async function mapped(page,rows){
 const section=page.locator('#shiftProgressStory > details').filter({has:page.getByText('Bring your weight history (optional)',{exact:true})});assert.equal(await section.count(),1);if(!await section.evaluate(e=>e.open))await section.locator(':scope > summary').click();
 const upload=section.locator('input[type=file]'),status=section.locator('[data-import-status]');await upload.setInputFiles({name:'fictional-owned-weight-import.csv',mimeType:'text/csv',buffer:Buffer.from('day,mass\n'+rows.map(r=>r.on.slice(8)+'/'+r.on.slice(5,7)+'/'+r.on.slice(0,4)+','+r.weightKg).join('\n')+'\n')});
 await status.getByText('Columns loaded locally. Choose date and weight columns, date order and units. Nothing has been saved.',{exact:true}).waitFor();
 for(const[k,v]of[['dateColumn','0'],['weightColumn','1'],['dateFormat','dmy'],['unit','kg']])await section.locator('[data-map="'+k+'"]').selectOption(v);
 await section.getByRole('button',{name:'Preview mapped readings',exact:true}).click();const confirm=section.locator('[data-import-confirm]');await confirm.waitFor({state:'visible'});
 assert.deepEqual(await section.locator('[data-import-preview] tbody tr').evaluateAll(xs=>xs.map(x=>[...x.querySelectorAll('td')].map(c=>c.textContent))),rows.map(r=>[r.on,String(r.weightKg)]));
 return{section,status,confirm};
}
async function confirmImport(page,rows,expected){
 const {status,confirm}=await mapped(page,rows),pending=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/progress/import'&&r.request().method()==='POST',{timeout:30000});
 await confirm.click();const r=await pending;assert(r.ok(),'Owned fictional import failed: HTTP '+r.status());const b=await r.json();assert.equal(b.imported,expected.imported);assert.equal(b.skipped,expected.skipped);
 await status.getByText(expected.imported+' readings imported; '+expected.skipped+' existing dates kept. Reopen Progress to refresh the chart.',{exact:true}).waitFor();
 return{status:r.status(),imported:b.imported,skipped:b.skipped};
}
export async function verifyOwnedCSVImport(page,{site,api,email,evidenceDir,id,openProgress,logout,login}){
 const ctx=page.context(),dates=csvWindow(id),rows=dates.map(on=>({on,weightKg:93.2})),other=csvWindow(id==='desktop'?'mobile390':'desktop');
 assert(dates.every(on=>on<=new Date().toISOString().slice(0,10)),'Synthetic dates must not be future dates');await identity(ctx,{site,api,email});const before=await summary(ctx,{site,api});assert.equal(before.entries,2,'Append must begin after original two-record acceptance');assert(dates.every(on=>!weights(before).some(r=>r.on===on)));
 const imported=await confirmImport(page,rows,{imported:2,skipped:0});await openProgress();let after=await summary(ctx,{site,api});
 const saved=()=>{assert.equal(after.entries,4);assert.deepEqual(weights(after).filter(r=>dates.includes(r.on)),rows.map(r=>({on:r.on,value:93.2})));assert.deepEqual(after.metrics.filter(m=>m.key!=='weight'),before.metrics.filter(m=>m.key!=='weight'));assert(!weights(after).some(r=>other.includes(r.on)));};
 saved();assert.match(await page.locator('#shiftProgressStory').innerText(),/4 saved records/);assert(await page.locator('#shiftProgressStory .shift-progress-chart').count()>0);
 const duplicate=await confirmImport(page,rows,{imported:0,skipped:2});await openProgress();after=await summary(ctx,{site,api});saved();
 await logout();const denied=await ctx.request.get(api+'/v1/progress/summary',{headers:{Origin:site,'Cache-Control':'no-cache'}});assert.equal(denied.status(),401,'Signed-out owned history must be denied');assert.match(denied.headers()['cache-control']||'',/no-store/);
 await login();await openProgress();await identity(ctx,{site,api,email});after=await summary(ctx,{site,api});saved();assert.match(await page.locator('#shiftProgressStory').innerText(),/4 saved records/);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 fs.mkdirSync(evidenceDir,{recursive:true});await page.screenshot({path:path.join(evidenceDir,id+'-owned-csv-fresh-login.png'),fullPage:true});
 return{status:'PASS',holder:'existing verified fictional commissioning identity',dates,weightKg:93.2,visibleConfirmation:true,firstImport:imported,duplicateImport:duplicate,progressReopen:true,freshLoginRetained:true,signedOutDenial:401,otherSignalsUnchanged:true,scope:'Production fictional CSV import and browser persistence only; ordinary/device/genuine-member acceptance remains separate'};
}
export async function verifyCSVTwoWayIsolation(browser,{holders,site,api,login,evidenceDir}){
 assert.deepEqual(holders.map(h=>h.id).sort(),['desktop','mobile390']);const checks=[];
 for(const holder of holders){const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await ctx.newPage();try{
  await login(page,holder.email);await identity(ctx,{site,api,email:holder.email});const s=await summary(ctx,{site,api}),own=csvWindow(holder.id),other=csvWindow(holder.id==='desktop'?'mobile390':'desktop');assert.equal(s.entries,4);assert.deepEqual(weights(s).filter(r=>own.includes(r.on)),own.map(on=>({on,value:93.2})));assert(!weights(s).some(r=>other.includes(r.on)));checks.push({case:holder.id,status:'PASS',ownDateWindow:own,foreignDateWindowAbsent:other});
 }finally{await ctx.close();}}
 fs.writeFileSync(path.join(evidenceDir,'csv-two-way-isolation.json'),JSON.stringify({checkedAt:new Date().toISOString(),checks,scope:'Read-only authenticated isolation of the two existing G2 fictional accounts; no new registration or real member data'},null,2));return{status:'PASS',checks};
}
