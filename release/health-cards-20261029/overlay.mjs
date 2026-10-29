import original from './original-health.mjs';
export * from './original-health.mjs';
import {release,transformHTML} from './cards.mjs';
import bloods from './cards/bloods.webp';
import energy from './cards/energy.webp';
import fertility from './cards/fertility.webp';
import hair from './cards/hair.webp';
import heart from './cards/heart.webp';
import mental from './cards/mental.webp';
import sleep from './cards/sleep.webp';
import nutrition from './cards/nutrition.webp';
import testing from './cards/testing.webp';
import weight from './cards/weight.webp';
import headerH6 from './cards/header-h6.webp';
const assets={bloods,energy,fertility,hair,heart,mental,sleep,nutrition,testing,weight,'header-h6':headerH6};
export default {...original,async fetch(request,env,ctx){
 const url=new URL(request.url);
 if(!['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(url.hostname))return original.fetch(request,env,ctx);
 const asset=url.pathname.match(/^\/shift-health\/assets\/cards-20261029\/([a-z0-9-]+)\.webp$/);
 if(asset&&assets[asset[1]])return new Response(request.method==='HEAD'?null:assets[asset[1]],{status:['GET','HEAD'].includes(request.method)?200:405,headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
 const response=await original.fetch(request,env,ctx);
 if(!['GET','HEAD'].includes(request.method)||!['/shift-health','/shift-health/','/shift-health.html'].includes(url.pathname)||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 // HEAD uses the same guarded transformation path, without a response body.
 const source=request.method==='HEAD'?await original.fetch(new Request(request.url,{headers:request.headers}),env,ctx):response;
 const html=await source.text();let changed;
 try{changed=transformHTML(html)}catch(error){console.error('Approved Health introduction or category source no longer matches');return request.method==='HEAD'?response:new Response(html,response);}
 const headers=new Headers(response.headers);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(k);
 headers.set('Cache-Control','no-store');headers.set('X-Shift-Health-Cards',release);
 return new Response(request.method==='HEAD'?null:changed,{status:response.status,headers});
}};
