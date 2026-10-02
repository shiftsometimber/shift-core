import assert from 'node:assert/strict';
import {createServer} from 'node:http';import {createRequire} from 'node:module';import {mkdirSync,writeFileSync} from 'node:fs';
import {banner,css} from '../home-route-banner.mjs';import {optimiseHomeFont,restoreHomeFont} from './public-font-delivery.mjs';import {fontProof} from './home-font-subset.mjs';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.COACHING_PROOF_DIR||'/tmp/shift-coach-font-proof';mkdirSync(out,{recursive:true});
const before='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:16px Arial}*{box-sizing:border-box}</style>'+css+'</head><body><main id="main-content">'+banner+'</main></body></html>',after=optimiseHomeFont('/',before);
assert.equal(restoreHomeFont('/',after),before);
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end(req.url==='/before'?before:after);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({...(process.env.COACHING_CHROMIUM?{executablePath:process.env.COACHING_CHROMIUM}:{}),args:['--no-sandbox']});const checks=[];
try{
 for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:1100},reducedMotion:'reduce'});const samples=[];
  for(const variant of ['before','after']){
   await page.goto('http://127.0.0.1:'+server.address().port+'/'+variant);await page.evaluate(()=>document.fonts.ready);
   const state=await page.locator('#sst-home-route').evaluate(el=>({text:el.innerText,rect:el.getBoundingClientRect().toJSON(),font:document.fonts.check('700 25px ShiftRouteCondensed'),links:[...el.querySelectorAll('a')].map(a=>a.getAttribute('href'))}));assert(state.font);
   samples.push({state,image:await page.locator('#sst-home-route').screenshot({path:out+'/font-'+width+'-'+variant+'.png',animations:'disabled'})});
  }
  assert.deepEqual(samples[1].state,samples[0].state);assert(samples[0].image.equals(samples[1].image),'Font pixels changed at '+width);
  checks.push({width,layoutAndPixelsIdentical:true,fontLoaded:true});await page.close();
 }
 const report={scope:'Local browser comparison of unchanged approved banner with original and delivery-subset font; not production speed evidence',fontProof,checks};writeFileSync(out+'/font-delivery-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();await new Promise(r=>server.close(r));}
