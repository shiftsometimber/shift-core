import {guideMarkup,guideStyles,guideData,guideRuntime} from './content.mjs';
export const GUIDE_PATH='/guides/food-and-supplements';
export const GUIDE_ASSETS='/assets/food-supplement-guide/';
// Existing nutrition pages are the verified discovery surfaces. No supplement
// product page or stock is invented; explicit future product paths can be added
// only when they exist and are authorised.
export const DISCOVERY_PATHS=new Set(['/member/grub','/guides/nutrition-guide','/guides/nutrition-protein-calories-meal-planning','/articles/protein-for-men-weight-management']);
const normal=p=>p.replace(/\.html$/,'').replace(/\/+$/,'')||'/';
export function renderFoodGuideDocument(shell){
 if(!/<main\b[\s\S]*?<\/main>/i.test(shell))throw Error('Guide requires the accepted website shell');
 let html=shell.replace(/<main\b[\s\S]*?<\/main>/i,()=>guideMarkup)
  .replace(/<title>[\s\S]*?<\/title>/gi,'')
  .replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi,'')
  .replace(/<meta\b(?=[^>]*(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+)["'])[^>]*>/gi,'')
  .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,'')
  .replace(/<script\b[^>]*src=["'][^"']*(?:programme|shift-service-bridge-v1)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi,'')
  .replace(/\bsst-article-template-v31\b/g,'shift-food-guide-page')
  .replace(/data-template=["']shift-programme["']/g,'data-template="food-supplement-guide"')
  .replace(/(<a\b[^>]*href=["']\/programme["'][^>]*?)\saria-current=["']page["']/gi,'$1');
 const canonical='https://shiftsometimber.co.uk'+GUIDE_PATH;
 html=html.replace('</head>','<title>Food &amp; Supplements: What Is Worth Taking? | SHIFT</title><meta name="description" content="A food-first guide for men: explore goals, diet context, supplement evidence and one practical next step."><link rel="canonical" href="'+canonical+'"><meta property="og:title" content="Food &amp; Supplements | SHIFT"><meta property="og:type" content="website"><meta property="og:url" content="'+canonical+'"><meta property="og:image" content="https://shiftsometimber.co.uk/assets/og-default.jpg"><link rel="stylesheet" href="'+GUIDE_ASSETS+'styles.css?v=20261012"><script defer src="'+GUIDE_ASSETS+'data.js?v=20261012"></script><script defer src="'+GUIDE_ASSETS+'guide.js?v=20261012"></script></head>');
 return html.replace(/href=["']#main-content["']/g,'href="#shift-food-guide"');
}
export async function foodSupplementGuideRoute(request,loadShell){
 if(!['GET','HEAD'].includes(request.method))return null;
 const path=normal(new URL(request.url).pathname);
 const asset={'styles.css':[guideStyles,'text/css'],'data.js':[guideData,'text/javascript'],'guide.js':[guideRuntime,'text/javascript']}[path.slice(GUIDE_ASSETS.length)];
 if(path.startsWith(GUIDE_ASSETS))return asset?new Response(request.method==='HEAD'?null:asset[0],{headers:{'Content-Type':asset[1]+'; charset=utf-8','Cache-Control':'public, max-age=300, must-revalidate','X-Content-Type-Options':'nosniff'}}):new Response('Guide asset not found',{status:404});
 if(path!==GUIDE_PATH)return null;
 const shell=await loadShell();if(!shell.ok)return shell;
 const html=renderFoodGuideDocument(await shell.text()),headers=new Headers(shell.headers);
 for(const k of ['content-length','content-encoding','etag','last-modified'])headers.delete(k);
 headers.set('Content-Type','text/html; charset=utf-8');headers.set('Cache-Control','no-store');headers.set('X-Shift-Food-Guide','20261012');
 return new Response(request.method==='HEAD'?null:html,{status:200,headers});
}
export const guideDiscoveryNote='<aside data-food-supplement-guide="20261012" aria-label="Food and supplement guide" style="margin:20px auto;padding:18px;max-width:1100px;border:1px solid #707762;background:#e7e3da;color:#050505;box-sizing:border-box"><strong>Food first. Supplements with a purpose.</strong><p style="margin:8px 0;color:#050505">Explore your goal, ordinary meals and the evidence before deciding whether anything is worth taking.</p><a href="'+GUIDE_PATH+'" style="color:#050505;font-weight:700;display:inline-block;padding:10px 0">Open the Food &amp; Supplements guide →</a></aside>';
export async function withFoodGuideDiscovery(request,response){
 if(request.method!=='GET'||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html')||!DISCOVERY_PATHS.has(normal(new URL(request.url).pathname)))return response;
 const before=await response.text();
 const after=before.includes('data-food-supplement-guide="20261012"')?before:before.replace(/(<main\b[^>]*>)/i,'$1'+guideDiscoveryNote);
 const headers=new Headers(response.headers);
 for(const k of ['content-length','content-encoding','etag','last-modified'])headers.delete(k);
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
