import {askTimberRoutes} from '../../ask-timber-v1.js';
import snapshot from './generated/snapshot.json';
import identity from './generated/identity.json';
// Public evidence snapshot only. No production DB, sessions, mail, payments,
// customer bindings, cron or account routes are attached to this preview.
const DB={prepare(sql){const key=sql.includes('FROM ai_knowledge_chunks')?'legacy':sql.includes('FROM shift_knowledge_nodes')?'graph':sql==='SELECT * FROM medicines_watch_checks'?'watch':null;if(!key||!/^SELECT\b/.test(sql))throw Error('Preview read outside public evidence');return{all:async()=>({results:snapshot[key]})}}};
const headers={'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function finish(response){const h=new Headers(response.headers);for(const[k,v]of Object.entries(headers))h.set(k,v);h.set('X-Ask-Timber-Preview-Commit',identity.commit);return new Response(response.body,{status:response.status,headers:h})}
export default{async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(Date.now()>Date.parse(identity.createdAt)+3*86400000)return new Response('Preview expired',{status:410,headers});
 if(path==='/__identity')return finish(Response.json(identity));
 if(path==='/v1/ai/chat'&&request.method==='POST'){
  const body=await request.clone().json().catch(()=>null);
  if(body?.useJourney!==false)return finish(Response.json({ok:false,error:'public_preview_only'},{status:400}));
  const clean=new Request(request.url,{method:'POST',headers:{Origin:url.origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
  return finish(await askTimberRoutes(clean,{DB,AI:env.AI}));
 }
 if(!['GET','HEAD'].includes(request.method))return new Response('Preview is public question only',{status:405,headers});
 if(path==='/'||path==='/ask-timber')return finish(await env.ASSETS.fetch(new Request(new URL('/index.html',url))));
 if(['/assets/ask-timber-v1.js','/assets/ask-timber-intent-v2.js','/api-adapter-v33d.js'].includes(path))return finish(await env.ASSETS.fetch(request));
 if(path==='/__qa'){
  const width=Number(url.searchParams.get('width'));if(![390,768,1024,1440].includes(width))return new Response('Invalid width',{status:400,headers});
  return finish(new Response(`<html><body style="margin:0;background:#333"><iframe title="Ask Timber responsive preview" src="/ask-timber" style="display:block;width:${width}px;height:1400px;border:0"></iframe></body></html>`,{headers:{'Content-Type':'text/html'}}));
 }
 if(/\.(?:css|js|png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(path))return finish(await fetch('https://0da69833.projectshift.pages.dev'+path+url.search));
 return new Response('Scoped Ask Timber preview',{status:404,headers});
}};
