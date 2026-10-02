import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {articleHTML} from '../../babylove/dynamic-public.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const payload=JSON.parse(await fs.readFile('editorial/content-audit/approved-corrections.json','utf8'));
await fs.mkdir('content-correction-preview',{recursive:true});
const browser=await chromium.launch({headless:true}),reports=[];
try{
 for(const spec of payload.articles){
  const body=await fs.readFile(spec.bodyPath,'utf8');
  let html=articleHTML({id:spec.id,slug:spec.slug,title:spec.title,summary:spec.summary,seo_title:spec.seoTitle,body,author:'SHIFT Team',publish_at:'2026-09-22T00:00:00Z'});
  html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace('<head>','<head><base href="https://shiftsometimber.co.uk/">');
  await fs.writeFile('content-correction-preview/'+spec.slug+'.html',html);
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900}});
   await page.setContent(html,{waitUntil:'networkidle'});
   const result=await page.evaluate(()=>({h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth,fragmentFailures:[...document.querySelectorAll('main a[href^="#"]')].filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).length,text:document.querySelector('main').innerText}));
   assert.equal(result.h1,1);assert.equal(result.overflow,false);assert.equal(result.fragmentFailures,0);for(const text of spec.expectedVisible)assert(result.text.includes(text),'Missing reviewed correction: '+text);for(const text of spec.forbiddenVisible)assert(!result.text.includes(text),'Unsupported claim remains: '+text);
   await page.screenshot({path:'content-correction-preview/'+spec.slug+'-'+width+'.png',fullPage:true});
   reports.push({slug:spec.slug,width,h1:result.h1,overflow:result.overflow,fragmentFailures:result.fragmentFailures});await page.close();
  }
 }
 await fs.writeFile('content-correction-preview/receipt.json',JSON.stringify({at:new Date().toISOString(),sha:process.env.GITHUB_SHA,reports,externalFormsSubmitted:false},null,2));
}finally{await browser.close();}
