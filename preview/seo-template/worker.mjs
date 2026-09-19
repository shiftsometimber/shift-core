import {candidateDocument} from './transform.mjs';
import {SHARING_IMAGE_PATHS} from '../../public-seo-closeout.mjs';
import {PATHS} from '../../editorial/five-articles/render.mjs';
const origin='https://shiftsometimber.co.uk';
const pages=new Set([...SHARING_IMAGE_PATHS,...PATHS,'/shift-newsroom','/articles/wegovy-cost-uk','/weight-loss-injections-for-men','/tools','/tools/calories','/tools/sleep','/tools/steps','/tools/walking','/tools/water','/progress-centre-methodology','/guides/exercise-walking-strength-mobility','/guides/nutrition-protein-calories-meal-planning','/guides/sleep-stress-mindset-emotional-eating-maintenance']);
const previewHeaders={'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export default {async fetch(request){
 const url=new URL(request.url),path=url.pathname;
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only preview',{status:405,headers:previewHeaders});
 if(path==='/__qa'){
  const width=Number(url.searchParams.get('width')),page=url.searchParams.get('path');
  if(![390,1440].includes(width)||!pages.has(page))return new Response('Invalid preview',{status:400,headers:previewHeaders});
  return new Response(`<html><head><meta name="robots" content="noindex"></head><body style="margin:0;background:#050505"><iframe title="SEO repair preview" src="${page}" style="display:block;width:${width}px;height:950px;border:0"></iframe></body></html>`,{headers:{...previewHeaders,'Content-Type':'text/html; charset=utf-8'}});
 }
 const asset=/^\/assets\/[a-zA-Z0-9/_.,-]+\.(?:js|css|jpg|png|webp|svg|woff2?|ico)$/.test(path)||/^\/[a-zA-Z0-9_-]+\.(?:js|css)$/.test(path)||path==='/research/uk-mens-weight-health-statistics/chart.svg';
 if(!pages.has(path)&&!asset&&path!=='/v1/radar/ticker')return new Response('Outside the public preview',{status:404,headers:previewHeaders});
 const upstream=await fetch(origin+path+url.search,{headers:{Accept:asset?'*/*':'text/html'},redirect:'manual'});
 const headers=new Headers(upstream.headers);for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified','Set-Cookie'])headers.delete(key);
 for(const [key,value] of Object.entries(previewHeaders))headers.set(key,value);
 if(!upstream.ok||!pages.has(path))return new Response(request.method==='HEAD'?null:upstream.body,{status:upstream.status,headers});
 return new Response(request.method==='HEAD'?null:await candidateDocument(await upstream.text(),path),{status:200,headers});
}};
