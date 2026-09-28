import {webToolsAsset,webToolsClient,webToolsPresentation} from './member-inline-tools.mjs';
// The approved presentation only. No preview Worker, fixture, database or auth route.
import {appPresentation,appClient} from './preview/app-layout/presentation.mjs';
const routes=/^\/member\/(dashboard|grub|fit|life-back|check-in|settings|saved|plans|orders|ask-timber)$/;
export const appAsset='/assets/my-timber-layout.mjs';
export const launchAsset='/assets/my-timber-layout-launch.mjs';
export const launchClient=`(()=>{if(matchMedia('(display-mode: standalone)').matches||navigator.standalone===true){const u=new URL(location.href);if(!u.searchParams.has('view')){u.searchParams.set('view','app');location.replace(u.href)}}})();`;
export function livePresentation(html,path,embedded=false){
 const after=appPresentation(html,path,embedded);
 if(after===html)return html;
 return after.replace(/<aside id="appPreviewBar">[\s\S]*?<\/aside>/,'').replace('src="/__app-layout.mjs"','src="'+appAsset+'"');
}
export async function withAppLayout(request,response){
 const u=new URL(request.url);
 if(request.method!=='GET')return response;
 if([appAsset,launchAsset,webToolsAsset].includes(u.pathname))return new Response(u.pathname===appAsset?appClient:u.pathname===webToolsAsset?webToolsClient:launchClient,{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(!routes.test(u.pathname)||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const choice=u.searchParams.get('view'),app=choice==='app'||choice!=='web'&&/(?:^|;\s*)shift_app_view=1(?:;|$)/.test(request.headers.get('Cookie')||'');
 const before=await response.text();
 let after=app?livePresentation(before,u.pathname,u.searchParams.get('app_panel')==='1'&&/\/(fit|grub|life-back)$/.test(u.pathname)):webToolsPresentation(before,u.pathname,u.searchParams.get('app_panel')==='1'&&/\/(fit|grub|life-back)$/.test(u.pathname));
 if(!app&&u.pathname==='/member/dashboard'&&choice!=='web'&&before.includes('data-member-chrome="v1"'))after=after.replace('</body>','<script defer src="'+launchAsset+'"></script></body>');
 const headers=new Headers(response.headers);
 if(after!==before||choice==='app'||choice==='web'||app)headers.set('Cache-Control','no-store, private');
 const vary=new Set((headers.get('Vary')||'').split(',').map(s=>s.trim()).filter(Boolean));vary.add('Cookie');headers.set('Vary',[...vary].join(', '));
 if(choice==='app'||choice==='web')headers.append('Set-Cookie','shift_app_view='+(choice==='app'?'1':'')+'; Path=/member; Secure; HttpOnly; SameSite=Lax; Max-Age='+(choice==='app'?'2592000':'0'));
 if(after!==before)for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(k);
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
