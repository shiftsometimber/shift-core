import {askTimberRoutes} from '../../ask-timber-v1.js';
import snapshot from './generated/snapshot.json';
import identity from './generated/identity.json';
import {memberExperienceRoutes} from '../../member-experience/entry.mjs';
// Public evidence snapshot only. No production DB, sessions, mail, payments,
// customer bindings, cron or account routes are attached to this preview.
const DB={prepare(sql){const key=sql.includes('FROM ai_knowledge_chunks')?'legacy':sql.includes('FROM shift_knowledge_nodes')?'graph':sql==='SELECT * FROM medicines_watch_checks'?'watch':null;if(!key||!/^SELECT\b/.test(sql))throw Error('Preview read outside public evidence');return{all:async()=>({results:snapshot[key]})}}};
const headers={'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function finish(response){const h=new Headers(response.headers);for(const[k,v]of Object.entries(headers))h.set(k,v);h.set('X-Ask-Timber-Preview-Commit',identity.commit);return new Response(response.body,{status:response.status,headers:h})}
export default{async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(Date.now()>Date.parse(identity.createdAt)+3*86400000)return new Response('Preview expired',{status:410,headers});
 // Synthetic recovery UI only: there are no accounts, emails or auth endpoints here.
 if(path==='/v1/auth/turnstile-config')return finish(Response.json({enabled:false,required:false,preview:true}));
 if(path==='/v1/me')return finish(Response.json({error:'unauthorised'},{status:401}));
 if(path==='/v1/auth/request-password-reset'&&request.method==='POST')return finish(Response.json({ok:true,message:'Preview check complete. No reset email has been sent.'}));
 if(path==='/__identity')return finish(Response.json(identity));
 if(path==='/v1/ai/chat'&&request.method==='POST'){
  const body=await request.clone().json().catch(()=>null);
  if(body?.useJourney!==false)return finish(Response.json({ok:false,error:'public_preview_only'},{status:400}));
  const clean=new Request(request.url,{method:'POST',headers:{Origin:url.origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
  return finish(await askTimberRoutes(clean,{DB,AI:env.AI}));
 }
 if(!['GET','HEAD'].includes(request.method))return new Response('Preview is public question only',{status:405,headers});
 if(['/member-login','/member-login.html','/member/dashboard','/member/dashboard.html'].includes(path))return finish(await env.ASSETS.fetch(new Request(new URL(path.includes('dashboard')?'/dashboard.html':'/login.html',url))));
 const memberAsset=memberExperienceRoutes(request,{MEMBER_EXPERIENCE_V1_ENABLED:'true'});if(memberAsset)return finish(memberAsset);
 if(path==='/'||path==='/ask-timber')return finish(await env.ASSETS.fetch(new Request(new URL('/index.html',url))));
 if(['/assets/ask-timber-v1.js','/assets/ask-timber-v1.css','/assets/ask-timber-intent-v2.js','/api-adapter-v33d.js'].includes(path))return finish(await env.ASSETS.fetch(request));
 if(path==='/__qa'){
  const width=Number(url.searchParams.get('width'));if(![390,768,1024,1440].includes(width))return new Response('Invalid width',{status:400,headers});
  return finish(new Response(`<html><body style="margin:0;background:#333"><iframe title="Ask Timber responsive preview" src="/ask-timber" style="display:block;width:${width}px;height:1400px;border:0"></iframe></body></html>`,{headers:{'Content-Type':'text/html'}}));
 }
 const ownAsset=await env.ASSETS.fetch(request);if(ownAsset.ok)return finish(ownAsset);
 if(/\.(?:css|js|png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(path))return finish(await fetch('https://0da69833.projectshift.pages.dev'+path+url.search));
 return new Response('Scoped Ask Timber preview',{status:404,headers});
}};
