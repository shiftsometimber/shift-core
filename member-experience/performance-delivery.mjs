// Finite non-personalised code templates. Personal reads, authentication and
// every write always remain with the current handler and its existing guards.
import {performanceRuntime,performanceStyles} from './performance-client.mjs';
export function augmentPerformanceDocument(html,assets={}){
 if(html.includes('data-mt-performance="20261101"'))return html;
 const boot='<style data-mt-performance="20261101">'+performanceStyles+'</style><script>'+performanceRuntime+'</script>';
 html=html.replace(/<head\b[^>]*>/i,m=>m+boot);
 const seen=new Set();
 return html.replace(/<(script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>(?:\s*<\/script>)?/gi,(tag,type,href)=>{
 const path=href.split('?')[0],asset=assets[path];
 if(path==='/assets/member-shell-v6.js'){if(seen.has(path))return '';seen.add(path);}
 if(!asset)return tag;
 return tag.replace(href,href+(href.includes('?')?'&amp;':'?')+'mtv='+asset.sha256.slice(0,20));
 });
}
export function wrapMemberPerformance(original,templates,assets,kind){
 const finite=/^\/member\/(?:dashboard|grub|fit|orders|saved|plans|settings|check-in|my-shift|my-target|my-why|achievements|ask-timber|treatment|life-back(?:\/.*)?)$/;
 return {...original,async fetch(request,env,ctx){
 const u=new URL(request.url),read=['GET','HEAD'].includes(request.method);
 const enabled=kind==='documents'?env.MY_TIMBER_V6_RELEASE_ENABLED==='true':env.MEMBER_EXPERIENCE_V1_ENABLED==='true';
 if(!enabled||!read)return original.fetch(request,env,ctx);
 const asset=assets[u.pathname];
 if(asset&&asset.owner===kind){
  const versioned=u.searchParams.get('mtv')===asset.sha256.slice(0,20),headers={'Content-Type':asset.type,'Cache-Control':versioned?'public, max-age=31536000, immutable':'public, max-age=0, must-revalidate','ETag':'"'+asset.sha256+'"','X-Content-Type-Options':'nosniff','X-My-Timber-Performance':'20261101','Server-Timing':'mt-static;dur=0'};
  if(request.headers.get('If-None-Match')===headers.ETag)return new Response(null,{status:304,headers});
  return new Response(request.method==='HEAD'?null:asset.body,{headers});
 }
 if(request.method!=='GET'||!finite.test(u.pathname))return original.fetch(request,env,ctx);
 const t=performance.now(),key=u.pathname+u.search,template=templates[key],upstream=[];
 let response;
 if(request.method==='GET'&&template&&template.owner===kind&&request.headers.get('X-My-Timber-Profile-Original')!=='1'){
  response=new Response(template.html,{status:200,headers:template.headers});
 }else{
  const timed={...env};
  for(const k of ['CORE','SUPPORT'])if(env[k]?.fetch)timed[k]={fetch:async(...args)=>{const a=performance.now(),r=await env[k].fetch(...args);upstream.push({name:k.toLowerCase(),ms:performance.now()-a});return r;}};
  response=await original.fetch(request,timed,ctx);
 }
 if(request.method!=='GET'||!finite.test(u.pathname)||!response.ok||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const fetchMs=performance.now()-t,renderAt=performance.now(),html=augmentPerformanceDocument(await response.text(),assets),h=new Headers(response.headers);
 for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])h.delete(k);
 h.set('Cache-Control','no-store, private');h.append('Vary','Cookie');h.set('X-My-Timber-Performance','20261101');
 h.append('Server-Timing','mt-document;dur='+fetchMs.toFixed(1)+', mt-inject;dur='+(performance.now()-renderAt).toFixed(1)+(upstream.length?', '+upstream.map(x=>'mt-'+x.name+';dur='+x.ms.toFixed(1)).join(', '):''));
 return new Response(html,{status:response.status,statusText:response.statusText,headers:h});
 }};
}
