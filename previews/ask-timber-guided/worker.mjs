import {main,style,client} from './content.mjs';
const origin='https://shiftsometimber.co.uk';
const finish=r=>{const h=new Headers(r.headers);h.set('X-Robots-Tag','noindex, nofollow');h.set('Cache-Control','private, no-store');return new Response(r.body,{status:r.status,headers:h});};
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/__ask-guided/client.js'&&request.method==='GET')return finish(new Response(client,{headers:{'Content-Type':'application/javascript; charset=utf-8'}}));
 if(url.pathname==='/v1/ai/chat'&&request.method==='POST'){
  if(request.headers.get('Origin')!==url.origin)return finish(Response.json({ok:false,error:'origin_not_allowed'},{status:403}));
  const body=await request.json().catch(()=>null);if(typeof body?.message!=='string'||body.message.trim().length<3||body.message.length>900)return finish(Response.json({ok:false,error:'message_required'},{status:400}));
  // Public questions only: no forwarded cookies, authorisation, member history or private flags.
  const clean=new Request(origin+'/v1/ai/chat',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin},body:JSON.stringify({message:body.message,useJourney:false,personalisation:false,stream:body.stream===true}),signal:request.signal});
  return finish(await env.CORE.fetch(clean));
 }
 if(!['GET','HEAD'].includes(request.method))return finish(new Response('Preview supports public questions only',{status:405}));
 const isPage=['/','/ask-timber','/ask-timber/'].includes(url.pathname),target=origin+(isPage?'/ask-timber':url.pathname)+url.search;
 const upstream=await env.CORE.fetch(new Request(target,{method:request.method}));
 if(!isPage||!upstream.ok||!(upstream.headers.get('Content-Type')||'').includes('text/html'))return finish(upstream);
 const headers=new Headers(upstream.headers);for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);
 headers.set('X-Shift-Ask-Preview','20261021-guided-v1');
 const response=new Response(upstream.body,{status:upstream.status,headers});
 return finish(new HTMLRewriter().on('main',{element(e){e.setAttribute('id','main-content');e.setAttribute('class','atg');e.setAttribute('data-ask-guided-preview','20261021');e.setInnerContent(main,{html:true})}}).on('body',{element(e){e.setAttribute('data-template','ask-timber-guided');e.append('<script src="/__ask-guided/client.js" defer></script>',{html:true})}}).on('head',{element(e){e.append('<style data-ask-guided-style>'+style+'</style>',{html:true})}}).on('script[src]',{element(e){if(['/assets/ask-timber-v1.js','/assets/ask-timber-intent-v2.js','/api-adapter-v33d.js','/analytics-bootstrap-v1.js','/analytics-v3a.js','/analytics-events-v31b.js','/register-sw-v3a.js'].some(s=>e.getAttribute('src')?.split('?')[0]===s))e.remove();}}).on('.product-status-v42h',{element(e){e.remove()}}).transform(response));
}};
