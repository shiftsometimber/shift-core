import {baseline,candidate} from './generated/page.mjs';
import font from './assets/barlow-condensed-700.ttf';
const origin='https://shiftsometimber.co.uk';
const h={'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store','X-Shift-Preview':'homepage-banner-only-20260930'};
export default {async fetch(request){const u=new URL(request.url);if(!['GET','HEAD'].includes(request.method))return new Response('Read-only preview',{status:405,headers:h});
if(u.pathname==='/robots.txt')return new Response('User-agent: *\nDisallow: /\n',{headers:h});
if(u.pathname==='/')return new Response(request.method==='HEAD'?null:(u.searchParams.get('baseline')==='1'?baseline:candidate),{headers:{...h,'Content-Type':'text/html; charset=utf-8'}});
if(u.pathname==='/__banner/barlow-condensed-700.ttf')return new Response(font,{headers:{...h,'Content-Type':'font/ttf'}});
if(/^\/(?:assets\/)[a-zA-Z0-9/_.,-]+\.(?:js|css|jpg|jpeg|png|webp|svg|woff2?|ico)$/.test(u.pathname)||/^\/[a-zA-Z0-9_-]+\.(?:js|css|webmanifest|ico)$/.test(u.pathname)){
const r=await fetch(origin+u.pathname+u.search,{redirect:'manual'}),headers=new Headers(r.headers);headers.delete('Set-Cookie');for(const [k,v]of Object.entries(h))headers.set(k,v);return new Response(request.method==='HEAD'?null:r.body,{status:r.status,headers});}
if(/^\/(?:v1|api|hq)(?:\/|$)/.test(u.pathname))return new Response('Outside read-only homepage preview',{status:404,headers:h});
return new Response(null,{status:302,headers:{...h,Location:origin+u.pathname+u.search+u.hash}});
}};
