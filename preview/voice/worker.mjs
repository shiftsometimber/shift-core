import edits from './edits.json';
import {checkinFollowupStyles} from '../../member-experience/checkin-followup-client.mjs';
const production='https://shiftsometimber.co.uk';
const publicPaths=[...new Set(edits.filter(e=>e.kind==='public').map(e=>e.route))];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const headers={'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'none'; form-action 'none'; frame-src 'self'; object-src 'none'; base-uri 'self'"};
const style='body{background:#050505;color:#e7e3da;font:17px/1.6 Arial;margin:0;padding:28px;box-sizing:border-box}main{max-width:960px;margin:auto}h1{font-size:32px;line-height:1.2}h2{font-size:24px}h3{font-size:19px}a{color:#e7e3da}article{border:1px solid #707762;padding:20px;margin:20px 0;overflow-wrap:anywhere}small{display:block}p{max-width:760px}button{font:inherit;padding:12px;background:#e7e3da;color:#050505;border:1px solid #707762}'+checkinFollowupStyles;
const shell=(title,body)=>'<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><style>'+style+'</style></head><body><main>'+body+'</main></body></html>';
export default {async fetch(request){
 const url=new URL(request.url),path=url.pathname;
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only editorial preview. Nothing was saved.',{status:405,headers});
 if(path==='/__review')return new Response(shell('SHIFT voice preview','<h1>Website voice preview</h1><p>23 targeted copy changes. This is a separate editorial preview. The live website has not been changed.</p><p>Public pages use the current live layout with proposed text. Preview forms and API connections are disabled. Member examples are labelled static copy samples, not a working account.</p><h2>Public pages</h2><ul>'+publicPaths.map(p=>'<li><a href="'+p+'">'+p+'</a> · <a href="/__qa?width=390&path='+p+'">390px</a> · <a href="/__qa?width=1440&path='+p+'">1440px</a></li>').join('')+'</ul><p><a href="/__member-copy">My Timber, Grub and Fit copy samples</a></p><p><a href="/__changes">Full before-and-after list</a></p>'),{headers});
 if(path==='/__changes')return new Response(shell('Copy changes','<h1>Before and after</h1>'+edits.map((e,i)=>'<article><h2>'+(i+1)+'. '+esc(e.route)+'</h2><h3>Before</h3><p>'+esc(e.old)+'</p><h3>Proposed</h3><p>'+esc(e.new)+'</p><small>'+esc(e.reason)+'</small></article>').join('')),{headers});
 if(path==='/__member-copy')return new Response(shell('Member copy samples','<h1>My Timber copy samples</h1><p>Static editorial samples from the current source. No account is connected and these examples do not save data. Full authenticated screen checks remain a release gate.</p>'+edits.filter(e=>e.kind==='member'||e.kind==='news').map(e=>'<article data-copy-sample><small>'+esc(e.route)+'</small><p>'+esc(e.new)+'</p></article>').join('')),{headers});
 if(path==='/__qa'){
  const width=Number(url.searchParams.get('width')),target=url.searchParams.get('path');
  if(![390,1440].includes(width)||![...publicPaths,'/__member-copy'].includes(target))return new Response('Invalid preview',{status:400,headers});
  return new Response('<!doctype html><html><head><title>Responsive copy preview</title><style>body{margin:0;background:#050505}iframe{border:0;display:block}</style></head><body><iframe title="'+width+'px editorial preview" src="'+target+'" width="'+width+'" height="1000"></iframe></body></html>',{headers});
 }
 if(path.startsWith('/v1/')||path.startsWith('/member/')||path==='/start-here')return new Response(shell('Preview only','<h1>Editorial preview only</h1><p>This preview does not connect to an account, take payments or submit forms.</p><a href="/__review">Back to the review</a>'),{headers});
 const allowed=publicPaths.includes(path)||path.startsWith('/assets/')||path.startsWith('/medicine-news/')||/\.(css|js|mjs|png|jpg|webp|svg|woff2?|ico)$/.test(path)||path==='/DEPLOYMENT-FINGERPRINT.json';
 if(!allowed)return new Response(shell('Outside preview','<h1>This page is outside the editorial preview</h1><a href="/__review">Back to the review</a>'),{status:404,headers});
 const r=await fetch(production+path,{headers:{Accept:request.headers.get('Accept')||'*/*'},redirect:'manual'});
 const h=new Headers(r.headers);for(const k of ['Set-Cookie','Content-Length','Content-Encoding','ETag'])h.delete(k);
 h.set('X-Robots-Tag','noindex, nofollow');h.set('Cache-Control','no-store');h.set('Content-Security-Policy',headers['Content-Security-Policy']);
 if(/text\/html|javascript/.test(h.get('Content-Type')||'')){
  let body=await r.text(),applied=0;
  for(const e of edits.filter(e=>e.kind==='public'||e.kind==='news')){
   if(e.route!==path&&e.kind!=='news'&&!(path.startsWith('/assets/')&&e.route==='/programme'))continue;
   if(body.includes(e.old)){if(body.split(e.old).length!==2)return new Response('Copy anchor repeated: review source before continuing',{status:409,headers});body=body.replace(e.old,e.new);applied++;}
  }
  const expected=edits.filter(e=>e.kind==='public'&&e.route===path).length;
  if(expected&&applied!==expected)return new Response('Live copy changed: expected '+expected+' anchors, found '+applied+'. Preview held for review.',{status:409,headers});
  h.set('X-Voice-Changes',String(applied));return new Response(request.method==='HEAD'?null:body,{status:r.status,headers:h});
 }
 return new Response(request.method==='HEAD'?null:r.body,{status:r.status,headers:h});
}};
