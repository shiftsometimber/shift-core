const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/Users/shiftsometimberltd/SST/my-timber-experience-20261015/node_modules/playwright');
const ROOT=__dirname,AFTER=path.join(ROOT,'after'),build=JSON.parse(fs.readFileSync(path.join(ROOT,'prepared-changes.json'))).build;
const report={at:new Date().toISOString(),build,mode:'staged-live-response',checks:[],screenshots:[],errors:[],productionAcceptance:false};
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function section(text,pattern){const start=text.search(pattern);assert.ok(start>=0,'Section anchor');const tokens=/<(\/?)section\b[^>]*>/gi;tokens.lastIndex=start;let depth=0,m;while((m=tokens.exec(text))){depth+=m[1]?-1:1;if(depth===0)return {start,end:tokens.lastIndex,text:text.slice(start,tokens.lastIndex)}}throw Error('Unclosed section')}
const revisedStart=fs.readFileSync(path.join(AFTER,'start-here.html'),'utf8');
const nextOfficial=section(revisedStart,/<section\b[^>]*class="sh-official-v72"/).text;
const nextResult=section(revisedStart,/<section\b[^>]*id="quickResult"/).text;
const tags='<meta name="public-shell-build" content="'+build+'"><link id="publicFeedbackStyles" rel="stylesheet" href="/assets/public-feedback-v1.css?v='+build+'"><script id="publicFeedbackClient" defer src="/assets/public-feedback-v1.js?v='+build+'"></script>';
const type=p=>p.endsWith('.css')?'text/css; charset=utf-8':p.endsWith('.js')?'application/javascript; charset=utf-8':'text/html; charset=utf-8';
async function stage(route){const url=new URL(route.request().url()),p=url.pathname;const file=path.join(AFTER,p);
 if(!route.request().isNavigationRequest()&&fs.existsSync(file)&&fs.statSync(file).isFile()){await route.fulfill({status:200,body:fs.readFileSync(file),contentType:type(p)});return}
 if(!route.request().isNavigationRequest()){await route.continue();return}
 const response=await route.fetch();let body=await response.text();
 if(!(response.headers()['content-type']||'').includes('text/html')){await route.fulfill({response,body});return}
 body=body.replace(/Ask Shift/gi,'Ask Timber').replace('</head>',tags+'</head>');
 if(p==='/'){body=body.replace('>Blokes</span>','>blokes</span>').replace('>Themselves</span>','>themselves</span>').replace('<p>Practical tools. Real talk. Individual support.<br/>No judgement. Just a clear path to better health, more energy and getting your life back.</p>','<p>Practical weight and health support for men, with free tools for food, movement and tracking your progress.<br/>Real talk, no judgement.</p>')}
 if(p==='/start-here'){for(const [pattern,replacement]of [[/<section\b[^>]*class="sh-official-v72"/,nextOfficial],[/<section\b[^>]*id="quickResult"/,nextResult]]){const old=section(body,pattern);body=body.slice(0,old.start)+replacement+body.slice(old.end)}body=body.replace('/start-here-v72.js?v=direct-detail-20260912','/assets/start-here-support-v1.js?v='+build)}
 await route.fulfill({response,body,headers:{...response.headers(),'content-length':String(Buffer.byteLength(body)),'cache-control':'no-store'}});
}
async function dismiss(page){const b=page.getByRole('button',{name:'Necessary only',exact:true});if(await b.count())await b.click();}
async function screenshot(page,name){const file=path.join(ROOT,'screenshots',name+'.png');fs.mkdirSync(path.dirname(file),{recursive:true});await page.screenshot({path:file,fullPage:false});report.screenshots.push(file)}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'});await context.route('https://shiftsometimber.co.uk/**',stage);const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 if(process.env.REUSE_BUDGET_CASES==='1'){const before=JSON.parse(fs.readFileSync(path.join(ROOT,'prepared-changes-before-h1-css.json'))),oldProof=JSON.parse(fs.readFileSync(path.join(ROOT,'preview-browser-proof-before-h1-css.json'))),now=JSON.parse(fs.readFileSync(path.join(ROOT,'prepared-changes.json')));assert.equal(before.changes.find(x=>x.path==='/assets/start-here-support-v1.js').afterSHA256,now.changes.find(x=>x.path==='/assets/start-here-support-v1.js').afterSHA256);const accepted=oldProof.checks.filter(x=>x.budgetBand);assert.equal(accepted.length,5);report.checks.push(...accepted.map(x=>({...x,reusedFromBuild:before.build,unchangedQuizBytes:true})));}
 if(process.env.REUSE_BUDGET_CASES!=='1')for(const [band,label]of [['nhs','£0 / NHS'],['under100','Under £100'],['band150','£100–£150'],['band200','£150–£200'],['over200','£200+']]){
  await page.goto('https://shiftsometimber.co.uk/start-here',{waitUntil:'domcontentloaded'});await dismiss(page);
  await page.locator('[data-multi="why"] button').filter({hasText:'Lose weight'}).first().click();await page.locator('[data-quick-next]').click();
  await page.locator('[data-multi="med"], [data-one="med"]').locator('button').filter({hasText:'Either'}).first().click();await page.locator('[data-one="access"] button').filter({hasText:'Both'}).click();await page.locator('[data-quick-next]').click();
  await page.locator('[data-budget-band="'+band+'"]').click();await page.locator('[data-quick-next]').click();
  await page.locator('#quickResult').waitFor({state:'visible'});const result=await page.locator('#quickResult').innerText();
  assert.equal(new URL(page.url()).pathname,'/start-here');assert.ok(!/Mounjaro|Wegovy|Orlistat|Foundayo|matches your|also worth comparing|below the displayed/i.test(result));assert.equal(await page.locator('#quickResult').getAttribute('data-budget-band'),band);assert.equal(await page.locator('[data-result-budget]').innerText(),label+' per calendar month');
  assert.deepEqual(await page.locator('[data-support-routes] a').evaluateAll(xs=>xs.map(x=>new URL(x.href).pathname)),['/treatment-centre','/programme','/guides/nhs-weight-management-uk-guide','/member/dashboard']);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('sstMedicineMatch')),null);report.checks.push({budgetBand:band,correctBudget:true,neutralRouteOrder:true,noNamedMedicineResults:true,noRedirect:true,noMedicineRecommendationCache:true});if(band==='band150')await screenshot(page,'start-here-result-390');
 }
 const priorGeometry=JSON.parse(fs.readFileSync(path.join(ROOT,'preview-browser-proof-before-member-readiness.json')));assert.equal(priorGeometry.build,build);const geometryAccepted=priorGeometry.checks.filter(x=>x.route&&x.viewport);report.checks.push(...geometryAccepted.map(x=>({...x,reusedCompletedGeometry:true})));
 for(const viewport of [{width:320,height:800},{width:390,height:844},{width:1024,height:768},{width:1440,height:1000}]){
  await page.setViewportSize(viewport);
  for(const route of ['/','/programme','/member/grub','/member/fit']){
   if(geometryAccepted.some(x=>x.route===route&&x.viewport.width===viewport.width&&x.viewport.height===viewport.height))continue;
   await page.goto('https://shiftsometimber.co.uk'+route,{waitUntil:'domcontentloaded'});await dismiss(page);await page.locator('#publicFeedbackClient').waitFor({state:'attached'});if(viewport.width<=1100)await page.locator('[data-compact-utility="1"]').first().waitFor({state:'visible'});await page.waitForTimeout(200);
   if(viewport.width<=1100){
    const controls=page.locator('#askTimberLaunch,#sstCookieSettings');const n=await controls.count();assert.ok(n>=1);
    const geometry=await controls.evaluateAll(xs=>xs.map(x=>{const r=x.getBoundingClientRect(),s=getComputedStyle(x);return {id:x.id,w:r.width,h:r.height,position:s.position,hasIcon:!!x.querySelector('svg'),label:x.getAttribute('aria-label'),host:x.parentElement.id}}));
    for(const g of geometry){assert.equal(g.w,44);assert.equal(g.h,44);assert.ok(['relative','static'].includes(g.position),JSON.stringify(g));assert.ok(g.hasIcon);assert.ok(['publicUtilities','memberUtilities'].includes(g.host));}
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow '+route+' '+viewport.width);
    await controls.first().scrollIntoViewIfNeeded();await screenshot(page,route.replaceAll('/','-').replace(/^-$/,'home')+'-'+viewport.width+'-controls');report.checks.push({route,viewport,controls:geometry,noFixedOverlay:true,noHorizontalOverflow:true});
   }else{await screenshot(page,route.replaceAll('/','-').replace(/^-$/,'home')+'-'+viewport.width);report.checks.push({route,viewport,desktopPreserved:true})}
   if(route==='/'){assert.equal((await page.locator('h1').innerText()).replace(/\s+/g,' ').trim(),'Helping ordinary blokes feel like themselves again.');assert.ok(await page.getByText('Practical weight and health support for men, with free tools for food, movement and tracking your progress.',{exact:false}).count());}
  }
 }
 await page.setViewportSize({width:320,height:800});await page.goto('https://shiftsometimber.co.uk/',{waitUntil:'domcontentloaded'});await dismiss(page);await page.locator('#sstCookieSettings').click();assert.ok(await page.getByRole('button',{name:'Necessary only',exact:true}).isVisible());await page.getByRole('button',{name:'Necessary only',exact:true}).click();await page.locator('#askTimberLaunch').click();assert.ok(await page.locator('#askTimberDrawer').isVisible());report.checks.push({cookieReopens:true,askTimberOpens:true});
 await context.close();
 }finally{await browser.close();fs.writeFileSync(path.join(ROOT,'preview-browser-proof.json'),JSON.stringify(report,null,2))}
 console.log(JSON.stringify({build,checks:report.checks.length,errors:report.errors,screenshots:report.screenshots.length,pass:true}));
})().catch(e=>{report.failure={message:e.message,stack:e.stack};fs.writeFileSync(path.join(ROOT,'preview-browser-proof.json'),JSON.stringify(report,null,2));console.error(e.stack);process.exitCode=1});
