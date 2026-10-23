import {panel,style,client} from './content.mjs';
export const VERSION='20261023-pathway-v1';
const hubPaths=new Set(['/mens-mental-health','/mens-mental-health/','/mens-mental-health.html']);
const feelingPaths=new Set(['/how-are-you-feeling','/how-are-you-feeling/','/how-are-you-feeling.html']);
export function enhance(html,kind){
 if(html.includes('data-gtt-pathway-release='))return html;
 if(!/<main\b[\s\S]*?<\/main>/i.test(html)||!html.includes('</head>')||!html.includes('</body>'))throw Error('Expected public page shell missing');
 if(kind==='hub'){
  const anchor=/<aside\b[^>]*class=["'][^"']*\bft-urgent\b[^"']*["'][\s\S]*?<\/aside>/i;
  if(!anchor.test(html))throw Error('Expected approved Good to Talk presentation missing');
  html=html.replace(anchor,m=>m+panel);
  html=html.replace(/(<article\b[^>]*class="ft-card"[^>]*>[\s\S]*?<a\b[^>]*href=")\/how-are-you-feeling("[^>]*>)/,'$1#your-next-step$2');
  html=html.replace('Explore how you’re feeling <svg','Find a helpful next step <svg');
  html=html.replace('</body>','<script data-gtt-pathway-release="'+VERSION+'" src="/mens-mental-health/pathway.js" defer></script></body>');
 }else{
  const banner='<section class="gtt-checkin" aria-labelledby="gtt-checkin-title" data-gtt-pathway-release="'+VERSION+'"><h2 id="gtt-checkin-title">Would help taking the next step be useful?</h2><p>This check-in is a reflection, not a mental-health assessment. Good to Talk can help you find professional support, prepare for a conversation or manage the wait.</p><p><a href="/mens-mental-health#your-next-step">Explore free support and next steps</a> · <a href="/mental-health/urgent-mental-health-help">Find urgent support</a></p><p>No account or purchase needed.</p></section>';
  html=html.replace(/<\/main>/i,banner+'</main>');
 }
 return html.replace('</head>','<style data-gtt-pathway-style>'+style+'</style></head>');
}
export default {async fetch(request,env){
 const url=new URL(request.url),read=['GET','HEAD'].includes(request.method);
 if(url.pathname==='/mens-mental-health/pathway.js'){
  if(!read)return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  return new Response(request.method==='HEAD'?null:client,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Shift-Mental-Health-Pathway':VERSION}});
 }
 const feeling=feelingPaths.has(url.pathname),binding=feeling?env.FEEL:env.GOOD;
 const target=url.hostname.endsWith('.workers.dev')?new Request(new URL(url.pathname+url.search,'https://shiftsometimber.co.uk'),request):request;
 const response=await binding.fetch(target);
 if(!read||!response.ok||!(response.headers.get('Content-Type')||'').includes('text/html')||(!feeling&&!hubPaths.has(url.pathname)))return response;
 const body=await response.text();
 // An upstream layout change must not blank or replace the public support page.
 let next;try{next=enhance(body,feeling?'feeling':'hub');}catch{return new Response(request.method==='HEAD'?null:body,response);}
 const headers=new Headers(response.headers);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(k);
 headers.set('Cache-Control','private, no-store');headers.set('X-Shift-Mental-Health-Pathway',VERSION);
 // No analytics code runs on the private notes tool; nothing typed is submitted.
 if(!feeling){headers.set('Content-Security-Policy',"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'none'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'none'; upgrade-insecure-requests");}
 return new Response(request.method==='HEAD'?null:next,{status:response.status,headers});
}};
