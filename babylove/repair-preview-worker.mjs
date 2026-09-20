import {oralPublicRoute,ARTICLE} from './oral-public.mjs';
import {babyLoveRoutes} from './webhook.mjs';
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname.startsWith('/v1/integrations/'))return await babyLoveRoutes(request,env)||new Response('Not found',{status:404});
 if(url.pathname.startsWith('/assets/')||/\.(?:js|css)$/.test(url.pathname)){url.hostname='shiftsometimber.co.uk';url.port='';return fetch(url);}
 const row={...ARTICLE,status:'published',decision:'approved',publish_at:'2026-09-20T16:00:00Z'};
 const previewEnv={DB:{prepare(){return{bind(){return this},async first(){return row}}}}};
 url.hostname='shiftsometimber.co.uk';url.port='';
 return await oralPublicRoute(new Request(url,request),previewEnv)||new Response('Preview: open '+ARTICLE.path,{status:404});
}};
