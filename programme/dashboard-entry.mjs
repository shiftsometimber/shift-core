import {PRIVATE_HEADERS} from './routes.mjs';
import {ProgrammeStore} from './store.mjs';
export const DASHBOARD_ANCHOR='<section class="preview-member" id="previewMember" hidden>';
// One authenticated entry, scoped to the dashboard response. No source HTML,
// existing navigation, styles or authentication behaviour is rewritten.
export async function programmeDashboardEntry(request,env,response,{authenticate}){
 const path=new URL(request.url).pathname;
 if(request.method!=='GET'||!['/member/dashboard','/member/dashboard.html'].includes(path)||env.PROGRAMME_V1_ENABLED!=='true'||!env.PROGRAMME_DB||!response.ok||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 let state;try{const auth=await authenticate(request,env);if(auth.response)return response;state=await new ProgrammeStore(env.PROGRAMME_DB).get(auth.userId)}catch{return response}
 if(!state)return response;
 const original=response.clone(),html=await response.text();
 if(!html.includes(DASHBOARD_ANCHOR)||html.includes('id="sstProgrammeEntry"'))return original;
 const entry=`<section class="mt-card" id="sstProgrammeEntry" aria-labelledby="sstProgrammeEntryTitle"><h2 id="sstProgrammeEntryTitle">Your Programme</h2><p>${state.entitlement.active?'Your saved plans, weekly review and the changes you choose.':'Return to your saved plans, shopping lists and review history. Manual choices remain available.'}</p><a class="mt-button" href="/member/programme">${state.entitlement.active?'Open my Programme':'Open my saved Programme'}</a></section>`;
 const headers=new Headers(response.headers);for(const [k,v]of Object.entries(PRIVATE_HEADERS))headers.set(k,v);for(const h of ['Content-Length','ETag','Last-Modified'])headers.delete(h);
 return new Response(html.replace(DASHBOARD_ANCHOR,entry+DASHBOARD_ANCHOR),{status:response.status,statusText:response.statusText,headers});
}
