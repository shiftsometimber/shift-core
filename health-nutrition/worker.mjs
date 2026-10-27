import {images} from './images.mjs';
import {publicProducts} from './catalogue.mjs';
import {renderDocument} from './public.mjs';
import {hqRoute} from './hq-api.mjs';
import {hqClient} from './hq-client.mjs';
const stamp='health-nutrition-approved-20261027';
const respond=(body,status=200,type='text/html; charset=utf-8')=>new Response(body,{status,headers:{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Shift-Health-Release':stamp}});
export default {async fetch(request,env,ctx){
 const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'')||'/';
 if(url.hostname==='api.shiftsometimber.co.uk')return hqRoute(request,env);
 if(url.hostname==='hq.shiftsometimber.co.uk'){
  const response=await env.HQ.fetch(request);
  if(!response.ok||!['/','/index.html'].includes(path)||!response.headers.get('Content-Type')?.includes('text/html'))return response;
  const headers=new Headers(response.headers);for(const key of ['Content-Length','Content-Encoding','ETag'])headers.delete(key);headers.set('Cache-Control','no-store');headers.set('X-Shift-Health-Release',stamp);
  const html=(await response.text()).replace('</body>','<script type="module" src="https://shiftsometimber.co.uk/shift-health/assets/hq-nutrition.js"></script></body>');
  return new Response(request.method==='HEAD'?null:html,{status:response.status,headers});
 }
 if(path==='/shift-health/assets/hq-nutrition.js'){const response=['GET','HEAD'].includes(request.method)?respond(request.method==='HEAD'?null:hqClient,200,'application/javascript; charset=utf-8'):respond('Method not allowed',405,'text/plain');response.headers.set('Access-Control-Allow-Origin','https://hq.shiftsometimber.co.uk');return response;}
 const asset=path.match(/^\/shift-health\/assets\/([a-z0-9-]+)\.webp$/);
 if(asset){if(!['GET','HEAD'].includes(request.method))return respond('Method not allowed',405,'text/plain');const source=images[asset[1]];if(!source)return respond('Not found',404,'text/plain');const [header,data]=source.split(',');const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));const response=respond(request.method==='HEAD'?null:bytes,200,header.slice(5).split(';')[0]);response.headers.set('Cache-Control','public, max-age=86400');return response;}
 if(!['/shift-health','/shift-health.html','/shift-health/supplements-nutrition'].includes(path))return env.BLOG.fetch(request);
 if(!['GET','HEAD'].includes(request.method))return respond('Method not allowed',405,'text/plain');
 const canonicalPath=path==='/shift-health.html'?'/shift-health':path;
 try{
  // The accepted live Health document supplies the real navigation, basket,
  // consent controls, newsroom and footer. No mock commerce shell is deployed.
  const shellURL=new URL(request.url);shellURL.pathname='/shift-health';shellURL.search='';
  const shell=await env.BLOG.fetch(new Request(shellURL,{method:'GET',headers:request.headers}));if(!shell.ok)return shell;
  const products=canonicalPath.includes('supplements-nutrition')?await publicProducts(env.DB):[];
  const html=renderDocument(await shell.text(),canonicalPath,url.searchParams,products);
  if(html===null)return respond('Product not found',404,'text/plain');
  return respond(request.method==='HEAD'?null:html);
 }catch(error){console.error('Health/nutrition render unavailable');return respond('This page is temporarily unavailable. Please try again shortly.',503,'text/plain; charset=utf-8');}
}};
