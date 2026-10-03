import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const origin=process.env.REMAINING_PREVIEW_URL;
assert(/^https:\/\/[a-f0-9]{8}\.projectshift\.pages\.dev$/.test(origin));
const specs=JSON.parse(readFileSync('editorial/content-audit/remaining-guides.json')).articles;
const checks=new Map(specs.map(s=>['/'+s.path.replace(/\.html$/,''),[s.title,s.intro,...s.sections.map(([title])=>title)]]));
checks.set('/privacy',['request signs you out','Coaching and help requests','not a nightly purge']);
checks.set('/privacy-centre',['receipt is not confirmation']);
checks.set('/data-governance',['reviewed fulfilment','request receipt separate']);
checks.set('/dpia-summary',['receipt and sign-out do not establish']);
const browser=await chromium.launch({headless:true}),reports=[];
mkdirSync('remaining-browser-proof',{recursive:true});
try{
 for(const [path,required]of checks)for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(origin+path,{waitUntil:'networkidle',timeout:45000});assert(response.ok());assert.equal(new URL(page.url()).pathname,path);
  const r=await page.evaluate(()=>({h1:document.querySelectorAll('h1').length,text:document.querySelector('main')?.innerText.replace(/\s+/g,' '),overflow:document.documentElement.scrollWidth>innerWidth,header:!!document.querySelector('header'),footer:!!document.querySelector('footer')}));
  assert.equal(r.h1,1);assert.equal(r.overflow,false);assert(r.header&&r.footer);assert.deepEqual(errors,[]);
  for(const phrase of required)assert(r.text.includes(phrase),path+': '+phrase);
  for(const phrase of ['Balanced explanation of common','Overview of NHS access, private treatment','Explains how Orlistat','Explains how Liraglutide'])assert(!r.text.includes(phrase));
  await page.screenshot({path:'remaining-browser-proof/'+path.slice(1)+'-'+width+'.jpg',fullPage:true,type:'jpeg',quality:65});
  reports.push({path,width,h1:r.h1,overflow:r.overflow,requiredCopy:true,browserErrors:errors});await page.close();
 }
 writeFileSync('remaining-browser-proof/receipt.json',JSON.stringify({source:process.env.GITHUB_SHA,origin,at:new Date().toISOString(),reports,clinicalSignoffClaimed:false},null,2));
}finally{await browser.close();}
