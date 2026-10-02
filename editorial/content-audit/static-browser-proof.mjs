import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const origin=process.env.STATIC_PREVIEW_URL;assert(/^https:\/\/[a-f0-9]{8}\.projectshift\.pages\.dev$/.test(origin));
const data=JSON.parse(readFileSync('editorial/content-audit/static-articles.json'));
const browser=await chromium.launch({headless:true});mkdirSync('static-browser-proof',{recursive:true});const reports=[];
try{for(const spec of data.articles){for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900}});await page.goto(origin+'/articles/'+spec.slug,{waitUntil:'networkidle',timeout:45000});
 assert(new URL(page.url()).origin===origin,'Preview unexpectedly left its own origin');
 const result=await page.evaluate(()=>({h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth,brokenFragments:[...document.querySelectorAll('main a[href^="#"]')].map(a=>a.getAttribute('href').slice(1)).filter(id=>!document.getElementById(id)),text:document.querySelector('main').innerText,articleText:document.querySelector('article').innerText,header:!!document.querySelector('header'),footer:!!document.querySelector('footer'),brokenImages:[...document.images].filter(i=>i.getBoundingClientRect().width>0&&!i.complete||i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src'))}));
 assert.equal(result.h1,1);assert.equal(result.overflow,false);assert.deepEqual(result.brokenFragments,[]);assert(result.header&&result.footer);
 assert(result.articleText.includes(spec.intro));for(const [heading] of spec.sections)assert(result.articleText.includes(heading));assert(result.text.includes('2 October 2026'));
 for(const forbidden of ['That sounds straightforward','wet Wednesday','Written and researched by Matt','10 April 2026'])assert(!result.text.includes(forbidden));
 assert(result.articleText.split(/\s+/).length>260,'Reading content unexpectedly short');
 await page.screenshot({path:'static-browser-proof/'+spec.slug+'-'+width+'.jpg',fullPage:true,type:'jpeg',quality:65});
 reports.push({slug:spec.slug,width,h1:result.h1,overflow:result.overflow,brokenFragments:result.brokenFragments,header:result.header,footer:result.footer,brokenImages:result.brokenImages});await page.close();
}}
 writeFileSync('static-browser-proof/receipt.json',JSON.stringify({at:new Date().toISOString(),sha:process.env.GITHUB_SHA,origin,reports,formsSubmitted:false,customerAccountsAccessed:false,clinicalReviewClaimed:false},null,2));
}finally{await browser.close();}
