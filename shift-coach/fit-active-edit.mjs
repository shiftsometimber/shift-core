import {memberImageViewerRuntime} from './member-image-viewer.mjs';
// Preserve active Fit editing while the approved screen composer receives a
// saved session. All original screen markup, styles and disclosure labels stay.
import assert from 'node:assert/strict';
const original="const wrap=(node,title)=>{if(!node||node.closest('.app-screen-details'))return;const d=document.createElement('details'),s=document.createElement('summary');d.className='app-screen-details';s.textContent=title;node.before(d);d.append(s,node);return d};";
const repaired="const wrap=(node,title)=>{if(!node||node.closest('.app-screen-details'))return;const active=title==='Adjust your session'&&node.contains(document.activeElement)?document.activeElement:null;const d=document.createElement('details'),s=document.createElement('summary');d.className='app-screen-details';s.textContent=title;if(active)d.open=true;node.before(d);d.append(s,node);if(active)active.focus({preventScroll:true});return d};";
export function fitActiveEditAsset(source){
 assert.equal(source.split(original).length,2,'Fit focus repair requires the exact approved composer');
 const after=source.replace(original,repaired);assert.equal(after.replace(repaired,original),source);return after;
}
export function originalFitActiveEditAsset(source){return source.replace(repaired,original);}
export async function withFitActiveEdit(request,response){
 if(request.method!=='GET'||new URL(request.url).pathname!=='/assets/my-timber-layout.mjs'||response.status!==200)return response;
 assert(response.headers.get('Content-Type')?.includes('javascript'),'Approved member-layout asset must remain JavaScript');
 const after=fitActiveEditAsset(await response.text())+memberImageViewerRuntime,headers=new Headers(response.headers);
 for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);
 headers.set('Cache-Control','no-store');headers.set('X-Shift-Fit-Active-Edit','20261004');
 return new Response(after,{status:response.status,headers});
}
