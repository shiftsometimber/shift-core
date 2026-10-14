// Proposed acceptance-only addition; reuse existing commissioned session.
// No registration, login, import save, email or consent change.
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import{createHash}from'node:crypto';
const SYNTHETIC=/^shiftsometimber\+(?:finish|longitudinal|b03|structured|structured-authrender|sport|safety)-[a-z0-9-]+@gmail\.com$/i;
async function identity(context,{site,api,email}){
 assert(SYNTHETIC.test(email),'Existing authorised fictional holder required');
 for(const origin of new Set([new URL(site).origin,new URL(api).origin])){
  const r=await context.request.get(origin+'/v1/me',{headers:{Origin:site,'Cache-Control':'no-cache'}}),b=await r.json().catch(()=>null);
  assert(r.ok()&&String(b?.user?.email||'').toLowerCase()===email.toLowerCase(),'Existing fictional identity mismatch at '+origin);
 }
}
async function progress(context,{site,api}){
 const r=await context.request.get(api+'/v1/progress/summary',{headers:{Origin:site,'Cache-Control':'no-cache'}});assert(r.ok());
 const b=await r.json();assert(b?.progress);return createHash('sha256').update(JSON.stringify(b.progress)).digest('hex');
}
export async function verifyExplicitCSVPreview(page,{site,api,email,evidenceDir,id}){
 const context=page.context();await identity(context,{site,api,email});const before=await progress(context,{site,api});
 const section=page.locator('#shiftProgressStory > details').filter({has:page.getByText('Bring your weight history (optional)',{exact:true})});assert.equal(await section.count(),1);
 if(!await section.evaluate(e=>e.open))await section.locator(':scope > summary').click();
 const upload=section.locator('input[type=file]'),status=section.locator('[data-import-status]'),confirm=section.locator('[data-import-confirm]');
 let imports=0;const intercept=async route=>{if(route.request().method()==='POST'){imports++;await route.abort('blockedbyclient');}else await route.continue();};await page.route('**/v1/progress/import',intercept);
 const blank=async()=>{for(const key of['dateColumn','weightColumn','dateFormat','unit'])assert.equal(await section.locator('[data-map="'+key+'"]').inputValue(),'');assert.equal(await confirm.count(),0);assert.equal(await section.locator('form').evaluate(e=>e.checkValidity()),false);};
 const choose=async()=>{for(const[k,v]of[['dateColumn','0'],['weightColumn','1'],['dateFormat','dmy'],['unit','kg']])await section.locator('[data-map="'+k+'"]').selectOption(v);};
 const rows=()=>section.locator('[data-import-preview] tbody tr').evaluateAll(xs=>xs.map(x=>[...x.querySelectorAll('td')].map(c=>c.textContent)));
 const loaded=()=>status.getByText('Columns loaded locally. Choose date and weight columns, date order and units. Nothing has been saved.',{exact:true}).waitFor();
 try{
  await blank();await upload.setInputFiles({name:'fictional-weight-preview.csv',mimeType:'text/csv',buffer:Buffer.from('day,mass\n01/10/2026,93.2\n02/10/2026,93.2\n')});await loaded();await blank();await choose();
  await section.getByRole('button',{name:'Preview mapped readings',exact:true}).click();await confirm.waitFor({state:'visible'});
  assert.deepEqual(await rows(),[['2026-10-01','93.2'],['2026-10-02','93.2']]);assert.match(await status.innerText(),/2 mapped readings ready to review/);assert.equal(await confirm.isEnabled(),true);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));fs.mkdirSync(evidenceDir,{recursive:true});await page.screenshot({path:path.join(evidenceDir,id+'-explicit-csv-preview.png'),fullPage:true});
  await section.locator('[data-map="dateFormat"]').selectOption('mdy');assert.equal(await confirm.count(),0);await section.getByRole('button',{name:'Preview mapped readings',exact:true}).click();await confirm.waitFor({state:'visible'});
  assert.deepEqual(await rows(),[['2026-01-10','93.2'],['2026-02-10','93.2']]);
  await upload.setInputFiles({name:'fictional-duplicate-preview.csv',mimeType:'text/csv',buffer:Buffer.from('day,mass\n01/10/2026,93.2\n01/10/2026,93.2\n')});await loaded();await choose();await section.getByRole('button',{name:'Preview mapped readings',exact:true}).click();
  await status.getByText('Reading 2: Keep only one reading for each date.',{exact:true}).waitFor();assert.equal(await confirm.count(),0);assert.equal(imports,0);
  await identity(context,{site,api,email});assert.equal(await progress(context,{site,api}),before);
  return{status:'PASS',holder:'existing verified fictional commissioning identity',previewOnly:true,importAttempts:imports,explicitMapping:true,mappingChangeInvalidation:true,duplicateRejection:true,savedProgressUnchanged:true,viewport:page.viewportSize(),scope:'Signed-in Chromium preview only; import/ordinary/device acceptance separate'};
 }finally{await page.unroute('**/v1/progress/import',intercept);await upload.setInputFiles([]);if(await section.evaluate(e=>e.open))await section.locator(':scope > summary').click();}
}
export async function verifySignedInGrubDiscovery(page,{site,api,email,evidenceDir,id}){
 const context=page.context();await identity(context,{site,api,email});const p=await context.newPage();await p.setViewportSize(page.viewportSize()||{width:390,height:844});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  const r=await p.goto(site+'/member/grub',{waitUntil:'domcontentloaded',timeout:30000});assert(r?.ok());const note=p.locator('[data-food-supplement-guide="20261012"]');await note.waitFor({state:'visible',timeout:30000});assert.equal(await note.count(),1);
  const link=note.getByRole('link',{name:'Open the SHIFT food guide →',exact:true});assert.equal(await link.getAttribute('href'),'/guides/food-guide');assert((await p.locator('main').innerText()).replace(/\s+/g,' ').trim().length>100);
  await link.click();await p.locator('#recipe-choices button').first().waitFor({timeout:30000});assert.equal(new URL(p.url()).pathname,'/guides/food-guide');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  fs.mkdirSync(evidenceDir,{recursive:true});await p.screenshot({path:path.join(evidenceDir,id+'-signed-in-grub-discovery.png'),fullPage:true});await identity(context,{site,api,email});assert.deepEqual(errors,[],'Grub discovery/guide page errors');
  return{status:'PASS',route:'/member/grub',destination:'/guides/food-guide',marker:'20261012',holder:'same verified fictional identity',readOnly:true,scope:'Signed-in discovery click; source body preservation separately established by admitted diff'};
 }finally{await p.close();}
}
