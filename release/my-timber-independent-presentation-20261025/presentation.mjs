import {assets,documents,presentationVersion,knownApprovedStyles} from './data.mjs';
const sha=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function presentationAsset(request,env){
 const path=new URL(request.url).pathname,entry=assets[path];
 if(request.method!=='GET'||!entry||entry.beforeSHA===entry.afterSHA)return null;
 const response=await env.CORE.fetch(request);
 if(response.status!==200)return response;
 const bytes=await response.arrayBuffer(),actual=await sha(bytes);
 if(actual!==entry.beforeSHA&&actual!=='95a6d37c781137b01fdc79bcd2d81b4f09f48e82c489e141705a04927de36585')return new Response(bytes,response);
 const headers=new Headers(response.headers);headers.set('Content-Type',entry.type);headers.set('Cache-Control','no-store');
 headers.set('X-Shift-My-Timber-Presentation',presentationVersion);
 for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);
 return new Response(entry.body,{status:200,headers});
}
export async function presentationDocument(request,response){
 const path=new URL(request.url).pathname.replace(/\.html$/,'').replace(/\/+$/,''),rules=documents[path];
 if(request.method!=='GET'||!rules||response.status!==200||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const before=await response.text();
 const approvedStyle=knownApprovedStyles[path];
 if(!before.includes(rules[0][0])&&!before.includes(approvedStyle)||!before.includes('data-member-experience="v1"')||!before.includes('data-member-design="20261001"'))return new Response(before,response);
 for(const [oldValue,newValue]of rules){
  if(oldValue===rules[0][0]&&before.includes(approvedStyle))continue;
  if(oldValue===newValue){if(before.split(oldValue).length!==2)return new Response(before,response);}
  else if(before.split(oldValue).length!==2&&before.split(newValue).length!==2)return new Response(before,response);
 }
 let after=before;if(approvedStyle&&after.includes(approvedStyle))after=after.replace(approvedStyle,rules[0][1]);for(const [oldValue,newValue]of rules)if(oldValue!==newValue&&after.includes(oldValue))after=after.replace(oldValue,newValue);
 if(after===before)return new Response(before,response);
 const headers=new Headers(response.headers);headers.set('X-Shift-My-Timber-Presentation',presentationVersion);
 for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
export function wrapPresentation(original){
 return {...original,async fetch(request,env,ctx){
  const asset=await presentationAsset(request,env);if(asset)return asset;
  return presentationDocument(request,await original.fetch(request,env,ctx));
 }};
}
