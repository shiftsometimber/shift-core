import {chromium} from '/tmp/shift-audit-tools/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync} from 'node:fs';import assert from 'node:assert/strict';
const dir='/private/tmp/shift-mental-closeout-20261003',origin=process.env.PROOF_ORIGIN;assert(origin);
const build=JSON.parse(readFileSync(dir+'/build.json')),browser=await chromium.launch({headless:true}),rows=[];
const entries=Object.entries(build.expected);
try{await Promise.all([0,1,2,3].map(async lane=>{
 const page=await browser.newPage();
 for(let i=lane;i<entries.length;i+=4){const [rel,expected]=entries[i];for(const width of [390,1440]){
 await page.setViewportSize({width,height:900});
 let response,html;
 for(let attempt=0;attempt<30;attempt++){
 response=await page.goto(origin+'/'+rel.replace(/\.html$/,''),{waitUntil:'domcontentloaded'});html=await response.text();
 if(response.status()===200&&expected.every(fragment=>html.includes(fragment)))break;
 await new Promise(resolve=>setTimeout(resolve,2000));
 }
 assert.equal(response.status(),200,rel);for(const fragment of expected)assert(html.includes(fragment),rel+' missing correction '+fragment.slice(0,90));
 await page.locator('main h1').waitFor();
 const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth));assert.equal(overflow,0,rel);
 assert(await page.locator('main').innerText());
 rows.push({rel,width,status:response.status(),overflow});
 }}
 await page.close();
}));writeFileSync(dir+'/proof.json',JSON.stringify({at:new Date().toISOString(),origin,fingerprint:build.candidate,rows},null,2));console.log(JSON.stringify({origin,checks:rows.length,allPassed:true}));}
finally{await browser.close();}
