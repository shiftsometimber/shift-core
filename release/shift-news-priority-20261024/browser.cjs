const fs=require('fs'),assert=require('assert/strict'),{chromium}=require('/Users/shiftsometimberltd/SST/my-timber-experience-20261015/node_modules/playwright');
const d='/Users/shiftsometimberltd/SST/website-review-evidence-20261023/ticker-latest-20261024/priority',mode=process.argv[2],origin='https://shiftsometimber.co.uk',lead='/medicine-news/mps-obesity-treatment-access-support-october-2026';
(async()=>{const browser=await chromium.launch({headless:true}),out={at:new Date().toISOString(),mode,cases:[],nonReadRequests:[]};
const paths=mode==='stage'?[JSON.parse(fs.readFileSync(d+'/stage.json')).origin+'/__ticker_preview']:['/treatment-centre','/explore-knowledge','/shop','/shift-newsroom',lead,'/start-here','/programme','/shift-health','/wegovy','/foundayo','/weight-loss-tablets-for-men','/about','/help','/contact','/member/dashboard','/shift-health/blood-tests','/timber-shed','/work-with-us','/'];
let expected;
for(const width of [390,1440]){const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
await ctx.route('**/*',route=>{const req=route.request();if(!['GET','HEAD','OPTIONS'].includes(req.method())){out.nonReadRequests.push({method:req.method(),url:req.url()});return route.abort();}if(/google-analytics|googletagmanager|cloudflareinsights/.test(req.url()))return route.abort();return route.continue();});
const p=await ctx.newPage();p.setDefaultTimeout(10000);
for(const path of paths){const url=path.startsWith('https:')?path:origin+path;const response=await p.goto(url,{waitUntil:'domcontentloaded',timeout:30000});assert.equal(response.status(),200,url);
const strip=p.locator('#shift-public-news'),count=await strip.count();if(!count){out.cases.push({path,width,ticker:false});continue;}
await p.waitForFunction(()=>document.querySelector('#shift-public-news')?.dataset.edition==='shift-news-shared-v3',{},{timeout:12000});
const data=await strip.evaluate(s=>({count:document.querySelectorAll('#shift-public-news').length,label:s.querySelector('.shift-news-label')?.textContent,edition:s.dataset.edition,visible:!!s.getClientRects().length,links:[...s.querySelectorAll('.shift-news-copy:not([aria-hidden]) a')].map(a=>({text:a.textContent,path:new URL(a.href).pathname})),asset:[...document.scripts].filter(x=>x.src.includes('public-news-ticker-v1.js')).map(x=>x.src),overflow:document.documentElement.scrollWidth>innerWidth,duplicates:[...s.querySelectorAll('[aria-hidden] a')].every(a=>a.tabIndex===-1)}));
assert.equal(data.count,1,url);assert.equal(data.label,'SHIFT News:');assert.equal(data.links[0].path,lead,url);assert(data.duplicates);assert.equal(data.asset.length,1,url);
if(expected)assert.deepEqual(data.links,expected,url);else expected=data.links;
out.cases.push({path,width,ticker:true,...data});
if(mode==='stage'||path==='/treatment-centre')await p.screenshot({path:d+'/'+mode+'-'+width+'.png',fullPage:false});
}
await ctx.close();}
await browser.close();out.pass=true;out.sameHeadlinesAndOrder=true;out.tickerSurfaces=out.cases.filter(x=>x.ticker).length;out.withoutTicker=out.cases.filter(x=>!x.ticker).map(x=>({path:x.path,width:x.width}));assert(out.tickerSurfaces>0);fs.writeFileSync(d+'/'+(mode==='stage'?'stage-browser':'production-browser')+'.json',JSON.stringify(out,null,2));console.log(JSON.stringify({pass:out.pass,cases:out.cases.length,tickerSurfaces:out.tickerSurfaces,withoutTicker:out.withoutTicker,hidden:out.cases.filter(x=>x.ticker&&!x.visible).map(x=>x.path),overflow:out.cases.filter(x=>x.overflow).map(x=>x.path),sameHeadlinesAndOrder:true,first:expected[0]}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
