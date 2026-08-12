import legacy from './hq-ai.js';
import {watchtowerSnapshot} from './watchtower-v1.js';
import {outcomesSnapshot} from './outcomes-v1.js';

export default{async fetch(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(request.method==='GET'&&(path==='/v1/hq/watchtower'||path==='/v1/hq/outcomes')){
    const auth=await legacy.fetch(new Request(new URL('/v1/hq/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!auth.ok)return auth;
    if(path==='/v1/hq/watchtower')return json(await watchtowerSnapshot(env));
    return json(await outcomesSnapshot(env.DB));
  }
  return legacy.fetch(request,env,ctx);
}};
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
