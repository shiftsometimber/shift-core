import {main,style,client as previewClient} from '../../previews/ask-timber-guided/content.mjs';
import {askTimberRoutes} from '../../ask-timber-v1.js';
import {publicKnowledgeDB} from './public-db.mjs';
const origin='https://shiftsometimber.co.uk';
export const client=previewClient.replace("fetch('/v1/ai/chat'","fetch('/ask-timber/question'");
export default {async fetch(request,env){
 const u=new URL(request.url),staged=u.hostname.endsWith('.workers.dev');
 const finish=r=>{const h=new Headers(r.headers);if(staged)h.set('X-Robots-Tag','noindex, nofollow');return new Response(r.body,{status:r.status,headers:h});};
 if(u.pathname==='/ask-timber/client.js'&&['GET','HEAD'].includes(request.method))return finish(new Response(request.method==='HEAD'?null:client,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'private, no-store'}}));
 if(u.pathname==='/ask-timber/question'){
  if(request.method!=='POST')return finish(Response.json({ok:false,error:'method_not_allowed'},{status:405}));
  const supplied=request.headers.get('Origin');if(supplied!==u.origin&&!['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk'].includes(supplied))return finish(Response.json({ok:false,error:'origin_not_allowed'},{status:403}));
  const body=await request.json().catch(()=>null);if(typeof body?.message!=='string'||body.message.trim().length<3||body.message.length>900)return finish(Response.json({ok:false,error:'message_required'},{status:400}));
  const clean=new Request(origin+'/v1/ai/chat',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({message:body.message,useJourney:false,personalisation:false,stream:body.stream===true}),signal:request.signal});
  const publicEnv={DB:publicKnowledgeDB(env.PUBLIC_DB),AI:env.AI,SHIFT_AI_PRACTICAL_CONTEXT:'true',SHIFT_AI_CONVERSATION_MEMORY:'false',SHIFT_AI_EXTERNAL_FETCH:async()=>new Response('Unavailable',{status:503})};
  return finish(await askTimberRoutes(clean,publicEnv));
 }
 const target=staged?new Request(new URL(u.pathname+u.search,origin),request):request;
 const upstream=await env.CORE.fetch(target);
 if(!['GET','HEAD'].includes(request.method)||!['/ask-timber','/ask-timber/'].includes(u.pathname)||!upstream.ok||!(upstream.headers.get('Content-Type')||'').includes('text/html'))return finish(upstream);
 const h=new Headers(upstream.headers);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])h.delete(k);h.set('Cache-Control','private, no-store');h.set('X-Shift-Ask-Version','20261021-guided-v1');
 return finish(new HTMLRewriter().on('main',{element(e){e.setAttribute('id','main-content');e.setAttribute('class','atg');e.setAttribute('data-ask-guided-version','20261021');e.setInnerContent(main,{html:true})}}).on('body',{element(e){e.setAttribute('data-template','ask-timber-guided');e.append('<script src="/ask-timber/client.js" defer></script>',{html:true})}}).on('head',{element(e){e.append('<style data-ask-guided-style>'+style+'</style>',{html:true})}}).on('script[src]',{element(e){if(['/assets/ask-timber-v1.js','/assets/ask-timber-intent-v2.js','/api-adapter-v33d.js'].includes(e.getAttribute('src')?.split('?')[0]))e.remove();}}).on('.product-status-v42h',{element(e){e.remove()}}).transform(new Response(upstream.body,{status:upstream.status,headers:h})));
}};
