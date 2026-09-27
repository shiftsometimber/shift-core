import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {PUBLIC_HEADERS} from '../babylove/response-policy.mjs';
const production='https://shiftsometimber.co.uk',origin=process.argv[2]||production;
const paths=['/articles/wegovy-cost-uk','/articles/oral-semaglutide-for-weight-loss','/articles/mounjaro-cost-uk','/medicine-news/bolt-pharmacy-ads-banned-asa'];
const report={checked_at:new Date().toISOString(),origin,source_sha:process.env.GITHUB_SHA||null,checks:[]};
const meta=(html,key)=>html.match(new RegExp('<meta\\b[^>]*(?:name|property)=["\']'+key+'["\'][^>]*content=["\']([^"\']*)'))?.[1];
const schema=html=>[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{const o=JSON.parse(m[1]);return o['@graph']||o}).find(o=>['Article','BlogPosting','NewsArticle'].includes(o['@type']));
const mainText=html=>(html.match(/<main\b[\s\S]*?<\/main>/i)?.[0]||'').replace(/<\/?(?:main|section|div|p|h[1-6]|ul|ol|li|table|tr|td|th|blockquote)\b[^>]*>/gi,' ').replace(/<[^>]+>/g,'').replace(/\[([^\]]+)\]\((?:https:\/\/|\/)[^\s)]+\)/g,'$1').replace(/\s+/g,' ').trim();
try{
 for(const path of paths){
  const response=await fetch(origin+path,{signal:AbortSignal.timeout(25000)});assert.equal(response.status,200,path);
  const html=await response.text();
  for(const [name,value] of Object.entries(PUBLIC_HEADERS))assert.equal(response.headers.get(name),value,path+' '+name);
  assert.equal((html.match(/<h1\b/gi)||[]).length,1,path+' H1');
  assert.equal((html.match(/rel=["']canonical["']/gi)||[]).length,1,path+' canonical count');
  assert(html.includes('href="'+production+path+'"'),path+' self canonical');
  for(const key of ['og:title','og:description','og:url','og:image','twitter:card','twitter:title','twitter:description','twitter:image'])assert(meta(html,key),path+' '+key);
  const data=schema(html);assert(data?.datePublished,path+' genuine date');assert(data.image,path+' representative image');assert(data.publisher?.logo,path+' publisher logo');
  if(path.startsWith('/articles/'))for(const script of ['analytics-bootstrap-v1.js','consent-v4a.js','analytics-events-v31b.js'])assert.equal(html.split(script).length-1,1,path+' '+script);
  const head=await fetch(origin+path,{method:'HEAD',signal:AbortSignal.timeout(25000)});assert.equal(head.status,200);
  for(const [name,value] of Object.entries(PUBLIC_HEADERS))assert.equal(head.headers.get(name),value,path+' HEAD '+name);
  if(origin!==production){
   assert.match(response.headers.get('x-robots-tag'),/noindex/);
   const before=await fetch(production+path,{signal:AbortSignal.timeout(25000)});assert.equal(before.status,200);const old=await before.text();
   assert.equal(mainText(html),mainText(old),path+' original main content');
   assert.equal(data.datePublished,schema(old).datePublished,path+' original publication date');
  }
  const image=new URL(meta(html,'og:image').replace(/&amp;/g,'&'));assert.equal(image.origin,production);
  let ir;const imageAttempts=[];
  // A newly deployed workers.dev endpoint can briefly see an upstream 502.
  // Bound retries, retain every status, and never accept a persistent error.
  for(let attempt=0;attempt<3;attempt++){
   ir=await fetch(origin+image.pathname+image.search,{signal:AbortSignal.timeout(25000)});imageAttempts.push(ir.status);
   if(ir.status!==502||attempt===2)break;
   await ir.body?.cancel();await new Promise(resolve=>setTimeout(resolve,2000));
  }
  assert.equal(ir.status,200,path+' sharing image attempts '+imageAttempts.join(','));assert.match(ir.headers.get('content-type'),/^image\//);await ir.arrayBuffer();
  report.checks.push({path,status:'pass',main_content_preserved:origin!==production,datePublished:data.datePublished,sharing_image:image.pathname,image_attempt_statuses:imageAttempts,server_timing:response.headers.get('server-timing')});
 }
}catch(error){report.error=error.message;process.exitCode=1;console.error(error)}
mkdirSync('article-quality-proof',{recursive:true});writeFileSync('article-quality-proof/quality.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
