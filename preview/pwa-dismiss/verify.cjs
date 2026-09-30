const assert=require('node:assert/strict'),fs=require('node:fs');
const watchdog=setTimeout(()=>{console.error('Browser proof exceeded 120 seconds');process.exit(1)},120000);
(async()=>{
 const {chromium,webkit}=require(process.env.BROWSER_TOOLS+'/node_modules/playwright');
 const {withPwa,pwaAssets}=await import('../../my-timber-pwa/presentation.mjs');
 const origin='https://pwa-dismiss.test';
 const request=p=>new Request(origin+p);
 const html=await(await withPwa(request('/member/dashboard'),new Response('<html><head><meta charset="utf-8"><style>body{margin:0;background:#050505;color:#E7E3DA;font:16px/1.5 Arial,sans-serif}header,main,footer{padding:16px}</style></head><body><header>MY TIMBER</header><main><h1>Today, handled.</h1><p>Your saved steps stay here.</p></main><footer>Settings</footer></body></html>',{headers:{'Content-Type':'text/html'}}))).text();
 fs.mkdirSync('pwa-dismiss-proof',{recursive:true});const proof=[];
 for(const [name,engine]of Object.entries({chromium,webkit})){
 console.log('Starting',name);const browser=await engine.launch({timeout:30000});
 try{for(const installed of [false,true]){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.pathname==='/assets/apple-touch-icon.png')return route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="none" stroke="#707762"/><text x="12" y="28" fill="#E7E3DA">S</text></svg>'});const asset=pwaAssets(request(url.pathname));await route.fulfill(asset?{status:asset.status,contentType:asset.headers.get('content-type'),body:await asset.text()}:{status:200,contentType:'text/html; charset=utf-8',body:html});});
 if(installed)await context.addInitScript(()=>Object.defineProperty(navigator,'standalone',{value:true,configurable:true}));
 console.log(name,{installed});const page=await context.newPage();page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);await page.goto(origin+'/member/dashboard');await page.locator('#pwaInstallHelp').waitFor({state:'attached'});
 assert.equal(await page.locator('#myTimberApp').isVisible(),!installed);
 if(!installed){await page.getByRole('button',{name:'Dismiss add My Timber to your phone'}).click();assert.equal(await page.locator('#myTimberApp').isVisible(),false);await page.reload();assert.equal(await page.locator('#myTimberApp').isVisible(),false);}
 await page.screenshot({path:`pwa-dismiss-proof/${name}-${installed?'installed':'dismissed'}.png`});
 await page.goto(origin+'/member/dashboard?setup=app#myTimberApp');assert.equal(await page.locator('#myTimberApp').isVisible(),true);assert.equal(await page.locator('#myTimberApp').getAttribute('open'),'');
 await page.screenshot({path:`pwa-dismiss-proof/${name}-${installed?'installed':'browser'}-help.png`});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);proof.push({browser:name,installed,hidden:true,reopen:true,noOverflow:true});await context.close();
 }}finally{await browser.close()}
 }
 fs.writeFileSync('pwa-dismiss-proof/results.json',JSON.stringify(proof,null,2));console.log('PASS install card hidden in standalone and after remembered dismissal; explicit help reopens');
})().then(()=>clearTimeout(watchdog)).catch(e=>{console.error(e);process.exit(1)});
