import {memberExperienceEntry,memberExperienceRoutes} from '../entry.mjs';
import {fixtureClient} from './fixtures.mjs';
import {contrastCheckClient} from './contrast.mjs';
import pins from './pins.json' with {type:'json'};
import {searchGrubRecipes} from '../grub-search.mjs';
import {improveGrubClient} from '../grub-client.mjs';
let recipeCatalogue;
const prefix='/staging/member/',sourcePrefix='/staging/member-source/';
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'"};
const scripts={dashboard:['member-my-timber-problem-v1.js','member-my-journey-v2.js','member-my-journey-checkin-v1.js'],grub:['assets/member-grub-v8.js','assets/member-grub-persistence-v1.js'],fit:['shift-fit-approved-v1.js'],'check-in':['app.js','assets/member-checkin-experience-v1.js','assets/health-data-consent-v42o.js'],settings:['assets/health-data-consent-v42o.js'],saved:[]};
const sourceRequest=(request,path)=>new Request(new URL(sourcePrefix+path,request.url));
const checkerHTML='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Timber review</title><script defer src="/staging/member/checker.mjs"></script><style>body{margin:20px;background:#e7e3da;color:#11140f;font:16px/1.5 Arial}label{display:inline-block;margin:0 16px 12px 0}select{font:inherit;padding:10px;min-height:44px}iframe{display:block;height:850px;border:1px solid #707762;background:#e7e3da}</style></head><body><h1>My Timber review</h1><p>Existing member tools, revised presentation. Fictional data; saves disabled.</p><label>Screen <select id="screen">'+Object.keys(scripts).map(x=>'<option value="'+x+'">'+x+'</option>').join('')+'</select></label><label>Viewport width <select id="width"><option>320</option><option>375</option><option selected>390</option><option>768</option><option>1024</option><option>1280</option></select></label><label>Viewport height <select id="height"><option>480</option><option>667</option><option selected>850</option></select></label><p role="status" id="metrics">Measuring…</p><button type="button" id="check-contrast">Check text contrast</button><details><summary>Text contrast measurements</summary><pre id="contrast-results" style="white-space:pre-wrap">Not checked yet.</pre></details><details><summary>Control measurements</summary><pre id="controls" style="white-space:pre-wrap">Checking controls…</pre></details><iframe id="layout-frame" title="Fictional My Timber screen" src="/staging/member/dashboard#journey" width="390"></iframe></body></html>';
const checkerJS=String.raw`const frame=document.querySelector('#layout-frame'),metrics=document.querySelector('#metrics'),controls=document.querySelector('#controls');let observer,resizeObserver;
function measure(){
 const doc=frame.contentDocument;if(!doc)return;
 const area=doc.documentElement.clientWidth,content=Math.max(doc.documentElement.scrollWidth,doc.body.scrollWidth);
 metrics.textContent=frame.width+'px frame · '+area+'px content area · '+content+'px content width · '+(content<=area?'No horizontal overflow':'Horizontal overflow detected');
 const visible=el=>el.getClientRects().length&&!el.closest('[hidden]');
 const checks=[...doc.querySelectorAll('main input[type=checkbox],main input[type=radio],dialog input[type=checkbox]')].filter(visible).map(el=>({id:el.id||el.name||el.type,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));
 const overlays=[...doc.querySelectorAll('dialog[open],[role=dialog]')].filter(visible).map(el=>{const r=el.getBoundingClientRect();return {name:el.querySelector('h2')?.textContent,width:el.clientWidth,content:el.scrollWidth,horizontalOverflow:el.scrollWidth>el.clientWidth+1,withinViewport:r.left>=0&&r.right<=area+1&&r.top>=0&&r.bottom<=doc.documentElement.clientHeight+1,scrollable:el.scrollHeight>el.clientHeight,buttons:[...el.querySelectorAll('button')].map(b=>({text:b.textContent,disabled:b.disabled,width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height}))}});
 controls.textContent=JSON.stringify({viewport:{width:area,height:doc.documentElement.clientHeight},checks,overlays},null,2);
}
frame.addEventListener('load',()=>{observer?.disconnect();resizeObserver?.disconnect();observer=new MutationObserver(measure);observer.observe(frame.contentDocument.body,{childList:true,subtree:true,attributes:true});resizeObserver=new ResizeObserver(measure);resizeObserver.observe(frame.contentDocument.documentElement);frame.contentDocument.addEventListener('change',measure);frame.contentWindow.addEventListener('resize',measure);measure()});
document.querySelector('#width').addEventListener('change',e=>{frame.width=e.target.value;requestAnimationFrame(measure)});
document.querySelector('#height').addEventListener('change',e=>{frame.style.height=e.target.value+'px';requestAnimationFrame(measure)});
document.querySelector('#screen').addEventListener('change',e=>{metrics.textContent='Measuring…';frame.src='/staging/member/'+e.target.value+(e.target.value==='dashboard'?'#journey':'')});`;
export async function memberReviewRoutes(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path.startsWith('/assets/member-experience/'))return memberExperienceRoutes(request,{MEMBER_EXPERIENCE_V1_ENABLED:'true'});
 if(!path.startsWith(prefix)&&!path.startsWith(sourcePrefix))return null;
 if(path===prefix+'grub/search'){
   if(request.method!=='POST')return Response.json({message:'Use recipe search.'},{status:405,headers});
   if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return Response.json({message:'Cross-origin request rejected.'},{status:403,headers});
   const body=await request.text();if(body.length>8000)return Response.json({message:'Search is too long.'},{status:413,headers});
   try{
     const input=JSON.parse(body);
     if(!recipeCatalogue){const r=await env.STAGING_ASSETS.fetch(new Request(new URL('/staging/grub-approved.json',url)));if(!r.ok)throw Error('catalogue unavailable');recipeCatalogue=await r.json()}
     return Response.json(searchGrubRecipes(input,recipeCatalogue),{headers});
   }catch{return Response.json({message:'Recipes could not be loaded. Please try again.'},{status:503,headers})}
 }
 if(request.method!=='GET')return new Response('Read-only design review.',{status:405,headers});
 if(path===prefix+'review')return new Response(checkerHTML,{headers:{...headers,'Content-Type':'text/html'}});
 if(path===prefix+'checker.mjs')return new Response(checkerJS+contrastCheckClient,{headers:{...headers,'Content-Type':'text/javascript'}});
 if(path===prefix+'fixture.mjs')return new Response(fixtureClient,{headers:{...headers,'Content-Type':'text/javascript'}});
 if(path.startsWith(sourcePrefix)){
   const name=path.slice(sourcePrefix.length);if(!pins.some(p=>p.path===name)||!name.endsWith('.css'))return new Response('Unknown review asset.',{status:404,headers});
   const asset=await env.STAGING_ASSETS.fetch(request);return new Response(asset.body,{status:asset.status,headers:{...headers,'Content-Type':'text/css'}});
 }
 if(path.startsWith(prefix+'script/')){
   const name=path.slice((prefix+'script/').length);if(!Object.values(scripts).flat().includes(name))return new Response('Unknown review script.',{status:404,headers});
   let js=await(await env.STAGING_ASSETS.fetch(sourceRequest(request,name))).text();
   if(name==='assets/member-grub-v8.js')js=improveGrubClient(js);
   if(name==='app.js'){
     const start=js.indexOf('// Mood — canonical account-backed check-in.'),end=js.indexOf('// My Why',start);
     if(start<0||end<0)return new Response('Pinned check-in source unavailable.',{status:503,headers});
     js=js.slice(start,end);
     // The real client collapses all non-auth errors into a retry instruction.
     // Explain our explicit preview rejection without turning it into success.
     const from="sm.textContent=e?.status===401?'SIGN IN TO SAVE':'COULD NOT SAVE — TRY AGAIN'";
     if(!js.includes(from))return new Response('Pinned check-in feedback unavailable.',{status:503,headers});
     js=js.replace(from,"sm.textContent=e?.code==='member_review_read_only'?'PREVIEW — SAVING DISABLED':e?.code==='health_consent_required'?'HEALTH TRACKING IS OFF':e?.status===401?'SIGN IN TO SAVE':'COULD NOT SAVE — TRY AGAIN'");
   }
   if(name==='assets/member-grub-persistence-v1.js'){
     const from="button.textContent = 'Not saved — retry';";
     if(!js.includes(from))return new Response('Pinned food feedback unavailable.',{status:503,headers});
     js=js.replace(from,"button.textContent = error.code === 'member_review_read_only' ? 'Preview — saving disabled' : 'Not saved — retry';");
   }
   // Lexical fixture transport/storage; preview-only error wording above.
   const lead="const fetch=window.SST_MEMBER_REVIEW_FETCH;const localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};const location={pathname:window.location.pathname.replace('/staging',''),hash:window.location.hash};";
   return new Response('(()=>{'+lead+js+'})();',{headers:{...headers,'Content-Type':'text/javascript'}});
 }
 const name=path.slice(prefix.length);if(!Object.hasOwn(scripts,name))return new Response('Unknown review screen.',{status:404,headers});
 let html=await(await env.STAGING_ASSETS.fetch(sourceRequest(request,'member/'+name+'.html'))).text();
 // Exclude auth, analytics, service workers and public widgets from this sandbox.
 html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*rel="(?:preconnect|preload|prefetch|manifest)"[^>]*>/gi,'');
 html=html.replace(/<button\b[^>]*id="askTimberLaunch"[^>]*>[\s\S]*?<\/button>/,'');
 if(name==='check-in')html=html.replace(/(<button\b[^>]*id="saveMood")/,'<p class="checkin-consent" id="memberPreviewSaveNote">Preview only: saving is disabled. You can explore these screens, but no check-in or consent choice will be saved here.</p>$1 aria-describedby="memberPreviewSaveNote"');
 html=html.replace(/(href=")(\/[^"?]+\.css)([^\"]*")/g,(_,a,b,c)=>a+sourcePrefix+b.slice(1)+c);
 if(name==='dashboard')html=html.replace(/<section\b[^>]*id="previewAuth"[^>]*>[\s\S]*?<\/section>/,'').replace(/id="previewMember" hidden/,'id="previewMember"').replace('class="preview-member"','class="preview-member is-ready"').replace(/(id="memberTabs") hidden/,'$1');
 html=html.replace('</head>','<script defer src="'+prefix+'fixture.mjs"></script>'+scripts[name].map(s=>'<script defer src="'+prefix+'script/'+s+'"></script>').join('')+'</head>');
 html=html.replace(/(<body\b[^>]*>)/,'$1<p id="memberReviewNote" style="margin:0;padding:10px 20px;background:#dce2d0;color:#25351e;font:13px/1.5 Arial">Design review · fictional data · saves disabled · live site unchanged</p>');
 if(name==='grub')html=html.replace('Design review · fictional data · saves disabled · live site unchanged','Recipe trial · existing reviewed catalogue · account saving disabled');
 const response=await memberExperienceEntry(new Request(new URL('/member/'+name,url)),{MEMBER_EXPERIENCE_V1_ENABLED:'true',WORK_V1_ENABLED:'true'},new Response(html,{headers:{'Content-Type':'text/html'}}));
 const pageHeaders={...headers,'Content-Type':'text/html; charset=utf-8'};
 if(name==='grub')pageHeaders['Content-Security-Policy']=headers['Content-Security-Policy'].replace("connect-src 'none'","connect-src 'self'");
 return new Response(response.body,{headers:pageHeaders});
}
