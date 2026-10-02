// Read-only production audit. No login, private records, forms or API mutations.
const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const {chromium,webkit}=require(process.env.APP_TOOLS+'/node_modules/playwright');
const base='https://shiftsometimber.co.uk',dir='book-voice-live-proof';fs.mkdirSync(dir,{recursive:true});
const edits=JSON.parse(fs.readFileSync('editorial/book-voice/edits.json'));
const report={source:process.env.GITHUB_SHA,checkedAt:new Date().toISOString(),productionWrites:0,coverage:[],cases:[],limits:['Signed-in functional acceptance remains in the guarded production release workflow.','Browser phone/desktop viewports are not native-device certification.']};
(async()=>{try{
 const sitemap=await(await fetch(base+'/sitemap.xml')).text();const newsPaths=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1])).filter(u=>u.origin===base&&u.pathname.startsWith('/medicine-news/')).map(u=>u.pathname);assert(newsPaths.length);
 let news;for(const path of newsPaths.slice(0,20)){const r=await fetch(base+path);if(r.ok&&(await r.text()).includes(edits[12].new)){news=path;break}}assert(news,'New SHIFT take label is live');
 const paths=[...new Set(edits.filter(e=>e.kind==='public').map(e=>e.route)),news,'/member/saved','/member/grub','/assets/member-experience/grub.mjs','/assets/member-experience/fit.mjs','/assets/member-experience/checkin-followup.mjs'];
 const coverage=new Set();for(const path of paths){const r=await fetch(base+path,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);const html=await r.text();if(path.endsWith('.mjs'))new vm.Script(html);
  for(const [i,e]of edits.entries()){
   const target=e.kind==='news'?news:e.kind==='public'||e.source==='member-experience/entry.mjs'?e.route:e.source==='member-experience/grub-runtime.mjs'&&e.old.startsWith('Updating a meal')?'/member/grub':'/assets/member-experience/'+(e.source.includes('checkin-followup')?'checkin-followup':e.source.includes('grub')?'grub':'fit')+'.mjs';
   if(target!==path)continue;assert(html.includes(e.new),'Missing live copy '+i+' '+path);assert(!html.includes(e.old),'Old live copy '+i+' '+path);coverage.add(i);
  }
 }
 assert.equal(coverage.size,23);report.coverage=[...coverage].sort((a,b)=>a-b);
 for(const [engine,name]of [[chromium,'chromium'],[webkit,'webkit']])for(const width of [390,1440]){const browser=await engine.launch(),ctx=await browser.newContext({viewport:{width,height:900}}),p=await ctx.newPage();const row={engine:name,width,pages:[]};report.cases.push(row);try{for(const path of ['/about','/life-back','/articles/food-noise-after-stopping-glp1','/programme',news]){
   const response=await p.goto(base+path,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);if(await p.locator('[data-consent="necessary"]').isVisible().catch(()=>false))await p.locator('[data-consent="necessary"]').click();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await p.locator('#preview-only').count(),0);const clipped=await p.locator('main button,main a.btn,main [role="button"]').evaluateAll(els=>els.filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&el.scrollWidth>el.clientWidth+2).map(el=>el.textContent.trim()));assert.deepEqual(clipped,[]);
   await p.screenshot({path:dir+'/'+name+'-'+width+'-'+path.slice(1).replaceAll('/','-')+'.png',fullPage:true});row.pages.push({path,status:'pass',overflow:false,clippedControls:[]});
  }}finally{await browser.close()}}
 console.log('PASS: all 23 approved edits live; public Chromium/WebKit phone and desktop layouts verified.');
}finally{fs.writeFileSync(dir+'/report.json',JSON.stringify(report,null,2))}})().catch(e=>{console.error(e);process.exitCode=1});
