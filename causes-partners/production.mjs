import {causesMarkup,causesStyles,causesRuntime} from './public-content.mjs';
export const CAUSES_PATH='/our-causes-partners';
const assetPath='/assets/causes/hopeful-outlook-hero.webp';
export function renderCausesDocument(shell){
 if(!/<main\b[\s\S]*?<\/main>/i.test(shell))throw Error('Causes page requires the existing public shell');
 let html=shell.replace(/<main\b[\s\S]*?<\/main>/i,()=>causesMarkup)
  .replace(/<title>[\s\S]*?<\/title>/gi,'')
  .replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi,'')
  .replace(/<meta\b(?=[^>]*(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'])[^>]*>/gi,'')
  .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,'')
  .replace(/<script\b[^>]*src=["'][^"']*(?:programme|shift-service-bridge-v1)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi,'')
  .replace(/data-template=["']shift-programme["']/g,'data-template="shift-causes"')
  .replace(/(<a\b[^>]*href=["']\/programme["'][^>]*?)\saria-current=["']page["']/gi,'$1');
 const title='Our Causes & Partners | Shift Some Timber';
 html=html.replace('</head>',()=>'<title>'+title+'</title><meta name="description" content="Support for the whole you: food and body image, mental health, drugs and alcohol, injury and recovery, pain and movement."><link rel="canonical" href="https://shiftsometimber.co.uk'+CAUSES_PATH+'"><meta property="og:title" content="'+title+'"><meta property="og:type" content="website"><meta property="og:url" content="https://shiftsometimber.co.uk'+CAUSES_PATH+'"><meta property="og:image" content="https://shiftsometimber.co.uk/assets/og-default.jpg"><style data-shift-causes>'+causesStyles+'</style></head>');
 return html.replace('</body>',()=>'<script data-shift-causes>'+causesRuntime+'</script></body>');
}
export async function causesPublicRoute(request,env,loadShell){
 const path=new URL(request.url).pathname;
 if(path!==assetPath&&path.replace(/\/+$/,'')!==CAUSES_PATH)return null;
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
 if(path===assetPath){
  if(!env.MEMBER_ASSETS)return new Response('Image unavailable',{status:503});
  const response=await env.MEMBER_ASSETS.fetch(new Request('https://member-assets.local'+assetPath));
  const headers=new Headers(response.headers);headers.set('Content-Type','image/webp');headers.set('X-Content-Type-Options','nosniff');
  return new Response(request.method==='HEAD'?null:response.body,{status:response.status,headers});
 }
 const shell=await loadShell();if(!shell.ok)return shell;
 const html=renderCausesDocument(await shell.text()),headers=new Headers(shell.headers);
 for(const name of ['content-length','content-encoding','etag','last-modified','x-robots-tag'])headers.delete(name);
 headers.set('Content-Type','text/html; charset=utf-8');headers.set('Cache-Control','public, max-age=60, must-revalidate');headers.set('X-Shift-Causes','public-v1');
 return new Response(request.method==='HEAD'?null:html,{status:200,headers});
}
