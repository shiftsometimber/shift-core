import {oralPublicRoute,ARTICLE} from './oral-public.mjs';
import {babyLoveRoutes} from './webhook.mjs';
export default {async fetch(request,env){
 const url=new URL(request.url);
 const imagePath=new URL(ARTICLE.images[0].url).pathname;
 if(url.pathname===imagePath)return env.MEMBER_ASSETS.fetch(request);
 if(url.pathname==='/__preview/mobile')return new Response('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Article mobile preview</title></head><body style="margin:0;background:#707762"><iframe title="390px article preview" src="'+ARTICLE.path+'" style="display:block;width:390px;height:844px;border:0;margin:auto"></iframe></body></html>',{headers:{'Content-Type':'text/html','X-Robots-Tag':'noindex'}});
 if(url.pathname.startsWith('/v1/integrations/'))return await babyLoveRoutes(request,env)||new Response('Not found',{status:404});
 if(url.pathname.startsWith('/assets/')||/\.(?:js|css)$/.test(url.pathname)){url.hostname='shiftsometimber.co.uk';url.port='';return fetch(url);}
 const row={...ARTICLE,status:'published',decision:'approved',publish_at:'2026-09-20T16:00:00Z'};
 const previewEnv={DB:{prepare(){return{bind(){return this},async first(){return row}}}}};
 url.hostname='shiftsometimber.co.uk';url.port='';
 const response=await oralPublicRoute(new Request(url,request),previewEnv);
 if(response?.status===200&&request.method==='GET')return new Response((await response.text()).replaceAll(ARTICLE.images[0].url,new URL(imagePath,request.url).href),{headers:response.headers});
 return response||new Response('Preview: open '+ARTICLE.path,{status:404});
}};
