import {frozenAssets} from './generated/assets.mjs';
import {pages,ticker} from './generated/pages.mjs';
import {seoAssetResponse} from '../../public-seo-presentation.mjs';
import {legacyAuthorityRedirects} from '../../public-shell-contract.mjs';
import {publicTickerAsset} from '../../public-navigation-policy.mjs';
const origin='https://shiftsometimber.co.uk';
const headers={'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
export default {async fetch(request,env){
 const url=new URL(request.url),raw=url.pathname,prefixed=raw.startsWith('/__baseline/'),baseline=prefixed||url.searchParams.get('__seo_baseline')==='1',path=prefixed?raw.slice('/__baseline'.length):raw;
 const h={...headers,'X-Shift-Preview':'reta-repair-20260924','X-Shift-Preview-Commit':env.CANDIDATE_SHA||'unidentified'};
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only preview',{status:405,headers:{...h,Allow:'GET, HEAD'}});
 if(raw==='/robots.txt')return new Response('User-agent: *\nDisallow: /\n',{headers:{...h,'Content-Type':'text/plain'}});
 if(!baseline&&legacyAuthorityRedirects[path.replace(/\/+$/,'')]){
  const target=new URL(legacyAuthorityRedirects[path.replace(/\/+$/,'')],url);target.search=url.search;
  return new Response(null,{status:301,headers:{...h,Location:target.href,'X-Shift-Production-Destination':origin+target.pathname+target.search}});
 }
 const asset=seoAssetResponse(request)||publicTickerAsset(request);
 if(asset){const out=new Headers(asset.headers);out.set('X-Robots-Tag','noindex, nofollow');return new Response(asset.body,{status:asset.status,headers:out});}
 if(path==='/v1/radar/ticker')return new Response(request.method==='HEAD'?null:ticker,{headers:{...h,'Content-Type':'application/json'}});
 const page=pages[path.replace(/\/+$/,'')||'/'];
 if(page)return new Response(request.method==='HEAD'?null:page[baseline?'baseline':'candidate'],{headers:{...h,'Content-Type':'text/html; charset=utf-8','X-Shift-Preview-Mode':baseline?'baseline':'candidate'}});
 const publicAsset=/^\/assets\/[a-zA-Z0-9/_.,-]+\.(?:js|css|jpg|jpeg|png|webp|svg|woff2?|ico)$/.test(path)||/^\/[a-zA-Z0-9_-]+\.(?:js|css|webmanifest|ico)$/.test(path)||path==='/articles/mounjaro-cost-uk/image';
 if(!publicAsset)return new Response('Outside the approved public preview',{status:404,headers:h});
 const frozen=frozenAssets[path+url.search]||frozenAssets[path];
 if(frozen)return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(frozen.base64),c=>c.charCodeAt(0)),{headers:{...h,'Content-Type':frozen.type}});
 // Anonymous public bytes only. Never forward cookies, credentials or POSTs.
 const source=await fetch(new Request(origin+path+url.search,{method:request.method}),{redirect:'manual'});
 const out=new Headers(source.headers);out.delete('Set-Cookie');out.set('X-Robots-Tag','noindex, nofollow');
 return new Response(request.method==='HEAD'?null:source.body,{status:source.status,headers:out});
}};
