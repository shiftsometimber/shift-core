import {headers} from './routes.mjs';
import {DASHBOARD_ANCHOR} from '../programme/dashboard-entry.mjs';
export async function workDashboardEntry(request,env,response,{authenticate}){
 if(env.WORK_V1_ENABLED!=='true'||request.method!=='GET'||!['/member/dashboard','/member/dashboard.html'].includes(new URL(request.url).pathname)||!response.ok||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 try{const auth=await authenticate(request,env);if(auth.response)return response}catch{return response}
 const original=response.clone(),body=await response.text();if(!body.includes(DASHBOARD_ANCHOR)||body.includes('id="sstWorkEntry"'))return original;
 const entry='<section class="mt-card" id="sstWorkEntry"><h2>SHIFT for Work</h2><p>Have a workplace invitation? Join privately or return to your employer-funded programme.</p><a class="mt-button" href="/member/work">My workplace programme</a></section>';
 const h=new Headers(response.headers);for(const [k,v]of Object.entries(headers))h.set(k,v);for(const key of ['Content-Length','ETag','Last-Modified'])h.delete(key);
 return new Response(body.replace(DASHBOARD_ANCHOR,entry+DASHBOARD_ANCHOR),{status:response.status,headers:h});
}
