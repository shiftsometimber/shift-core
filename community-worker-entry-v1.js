import core from './worker-entry-v6.js';
import {communityRoutes} from './community-v1.js';

const ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);

export default {
  async fetch(request,env,ctx){
    const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
    if(path.startsWith('/v1/community/')||path.startsWith('/v1/hq/community/')){
      if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(request)});
      const response=await communityRoutes(request,env,ctx,(req,e,c)=>core.fetch(req,e,c));
      return withCors(response,request);
    }
    return core.fetch(request,env,ctx);
  },
  async scheduled(controller,env,ctx){
    if(typeof core.scheduled==='function')return core.scheduled(controller,env,ctx);
  }
};

function cors(request){
  const origin=request.headers.get('Origin')||'';
  const headers={
    'Access-Control-Allow-Credentials':'true',
    'Access-Control-Allow-Methods':'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type, X-Shift-Commissioning-OIDC',
    'Vary':'Origin',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'
  };
  if(ORIGINS.has(origin))headers['Access-Control-Allow-Origin']=origin;
  return headers;
}
function withCors(response,request){
  if(!response)return response;
  const headers=new Headers(response.headers);
  for(const [k,v] of Object.entries(cors(request)))headers.set(k,v);
  if(!headers.has('X-Shift-Request-Id'))headers.set('X-Shift-Request-Id',crypto.randomUUID());
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
