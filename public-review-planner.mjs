import {publicHeader,publicDrawer,publicFooter} from './public-shell-contract.mjs';

export const REVIEW_PATH='/tools/weight-management-review';
export const REVIEW_ASSET='/assets/weight-management-review-v1.js';
const ORIGIN='https://shiftsometimber.co.uk';
export const REVIEW_TITLE='Weight-management review: questions to take with you';
export const REVIEW_DESCRIPTION='Build a free checklist for a weight-management conversation: getting started, progress, treatment concerns and follow-up. No account or health details needed.';
export const REVIEW_GROUPS=Object.freeze([
 {id:'starting',label:'Getting started',heading:'Starting the conversation',intro:'You do not need to arrive with a diagnosis or a preferred treatment.',questions:[
 'What support could fit my health, work and family life?',
 'Which NHS or local services can I access, and how do I get referred?',
 'What other options can we discuss if a medicine is unsuitable or unavailable?']},
 {id:'progress',label:'Progress has slowed',heading:'Understanding progress',intro:'Bring the pattern you have noticed, including things that have become easier or harder.',questions:[
 'Which readings and time period would be useful to compare?',
 'What else should we consider alongside weight, such as everyday function or wellbeing?',
 'What is one realistic change to try, and when should we review it?']},
 {id:'treatment',label:'Treatment questions',heading:'Making treatment questions clear',intro:'Use the name and formulation on your own medicine label. A checklist cannot decide whether a symptom is safe to wait out.',questions:[
 'Could my medicines, symptoms or another health issue need a review?',
 'Which symptoms need urgent help, and which contact route should I use?',
 'What should I do if treatment is interrupted, or I cannot manage eating or drinking?']},
 {id:'follow-up',label:'What happens next',heading:'Leaving with a clear next step',intro:'Ask for instructions you can find again, including who is responsible for follow-up.',questions:[
 'Who is responsible for my next review, and when should it happen?',
 'If treatment changes or stops, what support will continue and who provides it?',
 'What costs, tests or repeat appointments should I understand, and what should I do if I cannot reach the service?']}
]);
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const REVIEW_STYLE=String.raw`
<style data-review-planner-style>
.shift-review{--ink:#050505;--cream:#e7e3da;--ash:#707762;max-width:1060px;margin:0 auto;padding:42px 22px 64px;color:var(--ink);font-family:inherit;overflow-wrap:anywhere}
html body.shift-review-page header.site-header[data-header-v2]{background:#e7e3da!important;color:#050505!important}html body.shift-review-page header.site-header[data-header-v2] a,html body.shift-review-page header.site-header[data-header-v2] .menu-trigger{color:#050505!important}html body.shift-review-page header.site-header[data-header-v2] .menu-trigger{border-color:#707762!important}body:has(.shift-review){margin:0;background:#e7e3da;color:#050505;font-family:Arial,sans-serif}body.review-menu-open{overflow:hidden}body.review-menu-open .site-drawer{display:block!important;position:fixed!important;inset:0 0 0 auto!important;width:min(92vw,390px)!important;height:100dvh!important;overflow:auto!important;transform:none!important;z-index:10001!important;background:#050505!important;color:#e7e3da!important;padding:22px!important}body.review-menu-open .site-drawer nav{display:grid;gap:14px}body.review-menu-open .site-drawer a{color:#e7e3da!important}body.review-menu-open .drawer-backdrop{display:block!important;position:fixed;inset:0;background:#05050599;z-index:10000}.shift-review *{box-sizing:border-box}.shift-review a{color:inherit;text-decoration:underline;text-underline-offset:3px}
.shift-review .review-eyebrow{font-size:.8rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;margin:0 0 12px}
.shift-review h1{font-size:clamp(2.1rem,5.8vw,4.5rem);line-height:1.06;letter-spacing:-.035em;max-width:850px;margin:0 0 20px}
.shift-review .review-lead{font-size:clamp(1.1rem,2.3vw,1.35rem);max-width:760px;line-height:1.6}
.shift-review .review-note{padding:18px 20px;margin:24px 0;background:#f3f0e9;border-left:4px solid var(--ash);line-height:1.6}
.shift-review .review-controls{border:1px solid #b9bcae;border-radius:18px;background:var(--cream);padding:20px;margin:28px 0}
.shift-review .review-controls h2{font-size:1.2rem;margin:0 0 8px}.shift-review .review-controls p{margin:8px 0;line-height:1.5}
.shift-review .review-filters{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
.shift-review button{font:inherit;min-height:46px;border:1px solid #787d6d;border-radius:999px;padding:10px 16px;background:#fffdf8;color:#050505;cursor:pointer;font-weight:700}
.shift-review button[aria-pressed="true"]{background:#050505;color:#e7e3da;border-color:#050505}
.shift-review button:focus-visible,.shift-review a:focus-visible{outline:3px solid #050505;outline-offset:4px}
.shift-review .review-grid{display:grid;grid-auto-rows:max-content;align-content:start;grid-template-columns:minmax(0,1.6fr) minmax(250px,1fr);gap:24px;align-items:start}
.shift-review .review-group{border-top:3px solid var(--ash);padding:20px 0 8px}.shift-review .review-group h2{font-size:1.65rem;line-height:1.2;margin:0 0 12px}
.shift-review p,.shift-review li{line-height:1.65}.shift-review li{margin:10px 0}
.shift-review .review-sidebar{background:#f3f0e9;border:1px solid #c5c7bb;border-radius:14px;padding:22px}
.shift-review .review-sidebar h2{font-size:1.3rem;margin-top:0}.shift-review .review-sidebar h3{font-size:1.1rem}
.shift-review .review-actions{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0}.shift-review .review-print{background:#050505;color:#e7e3da;border-color:#050505}
.shift-review [hidden]{display:none!important}.shift-review .review-next{margin-top:30px;padding-top:24px;border-top:1px solid #c5c7bb}
.shift-review .review-meta{font-size:.9rem;line-height:1.6;color:#404538}.shift-review .review-disclosure{margin-top:24px}
@media(max-width:720px){.shift-review{padding:28px 18px 46px}.shift-review .review-grid{grid-template-columns:1fr;grid-template-rows:max-content max-content}.shift-review .review-controls{padding:16px}.shift-review .review-filters button{flex:1 1 auto}.shift-review .review-sidebar{padding:18px}}
@media print{body{background:white!important;color:black!important}.shift-review{max-width:none;padding:0;font-size:11pt}.shift-review h1{font-size:24pt}.shift-review .review-grid{display:block}.shift-review .review-group{break-inside:avoid;padding:10px 0}.shift-review .review-group h2{font-size:15pt}.shift-review .review-sidebar{border:1px solid #777;background:white;padding:12px}.shift-review .review-no-print,.site-header,.site-drawer,body>header,body>footer,body>nav,.drawer-backdrop,.skip-link-v30f,[role="dialog"],[data-site-drawer]{display:none!important}.shift-review .review-disclosure{display:block!important}.shift-review a{color:black;text-decoration:none}.shift-review .review-meta{color:black}}
</style>
`;
export const REVIEW_CLIENT=String.raw`
(()=>{
 const root=document.querySelector('[data-review-planner]');if(!root)return;
 const buttons=[...root.querySelectorAll('[data-review-topic]')];
 const groups=[...root.querySelectorAll('[data-review-group]')];
 const status=root.querySelector('[data-review-status]');
 function select(id){if(id!=='all'&&!groups.some(g=>g.dataset.reviewGroup===id))return;
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.reviewTopic===id));
  for(const group of groups)group.hidden=id!=='all'&&group.dataset.reviewGroup!==id;
  const count=groups.filter(g=>!g.hidden).length;
  status.textContent=count===1?'Showing one question group. Your preparation notes and next-step questions are below.':'Showing all four question groups. Choose the questions useful to you.';
 }
 for(const button of buttons)button.addEventListener('click',()=>select(button.dataset.reviewTopic));
 const print=root.querySelector('[data-review-print]');if(print){print.hidden=false;print.addEventListener('click',()=>window.print());}
 const reset=root.querySelector('[data-review-reset]');if(reset){reset.hidden=false;reset.addEventListener('click',()=>select('all'));}
 const trigger=document.querySelector('.menu-trigger[aria-controls="site-drawer"]'),drawer=document.getElementById('site-drawer'),backdrop=document.querySelector('.drawer-backdrop'),close=drawer?.querySelector('.drawer-close');
 function menu(open){if(!trigger||!drawer)return;drawer.hidden=!open;if(backdrop)backdrop.hidden=!open;trigger.setAttribute('aria-expanded',String(open));document.body.classList.toggle('review-menu-open',open);if(open){drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');close?.focus();}else{drawer.removeAttribute('role');drawer.removeAttribute('aria-modal');trigger.focus();}}
 trigger?.addEventListener('click',()=>menu(drawer.hidden));close?.addEventListener('click',()=>menu(false));backdrop?.addEventListener('click',()=>menu(false));
 document.addEventListener('keydown',event=>{if(!drawer||drawer.hidden)return;if(event.key==='Escape'){event.preventDefault();menu(false);}if(event.key==='Tab'){const items=[...drawer.querySelectorAll('a[href],button:not([disabled])')],first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
 select('all');
})();
`;
export function reviewPlannerMain(){
 const buttons=[['all','All topics'],...REVIEW_GROUPS.map(g=>[g.id,g.label])].map(([id,label])=>'<button type="button" data-review-topic="'+id+'" aria-pressed="'+(id==='all')+'" aria-controls="review-question-groups">'+esc(label)+'</button>').join('');
 const groups=REVIEW_GROUPS.map(g=>'<section class="review-group" data-review-group="'+g.id+'" aria-labelledby="review-'+g.id+'"><h2 id="review-'+g.id+'">'+esc(g.heading)+'</h2><p>'+esc(g.intro)+'</p><ol>'+g.questions.map(q=>'<li>'+esc(q)+'</li>').join('')+'</ol></section>').join('');
 return '<main id="main-content" class="shift-review" data-review-planner>'+
 '<p class="review-eyebrow">Free tool · no account needed</p><h1>'+esc(REVIEW_TITLE)+'</h1>'+
 '<p class="review-lead">A useful conversation starts with the thing you want help with. Choose a topic, pick two or three questions and take them to your GP or treating service.</p>'+
 '<p>You can use this whether you are exploring support, receiving treatment elsewhere, or thinking about what happens afterwards.</p>'+
 '<aside class="review-note" aria-label="When to get help"><strong>Need help now?</strong> This is a preparation tool, not a symptom checker or a way to contact a clinician. If a concern needs urgent help, use the appropriate healthcare route and the instructions supplied with your medicine. In an emergency, call 999. Do not wait to complete a checklist.</aside>'+
 '<section class="review-controls review-no-print" aria-labelledby="review-topic-heading"><h2 id="review-topic-heading">What would you like to discuss?</h2><p>Choose one group or keep all the questions. You do not need to answer them on this website.</p><div class="review-filters" role="group" aria-label="Choose a question group">'+buttons+'</div><p role="status" aria-live="polite" data-review-status>All four question groups are shown below.</p></section>'+
 '<div class="review-actions review-no-print"><button class="review-print" type="button" data-review-print hidden>Print this checklist</button><button type="button" data-review-reset hidden>Show all topics</button></div>'+
 '<div class="review-grid"><div id="review-question-groups">'+groups+'</div>'+
 '<aside class="review-sidebar" aria-labelledby="review-prepare"><h2 id="review-prepare">Before the conversation</h2><p>A short note on paper or your own phone is enough. If useful, bring:</p><ul><li>The main thing you want help with and how it affects an ordinary day.</li><li>The names and formulations of your medicines and supplements, from their labels.</li><li>Any relevant readings, dates or previous instructions you already have.</li><li>What you have tried, what helped and what did not fit your week.</li></ul><p>You do not need a perfect record. If you cannot remember something, say so.</p><h3>Before you leave</h3><ul><li>What is the agreed next step?</li><li>Who is responsible, and when should it happen?</li><li>Who should you contact if things change or you have not heard back?</li></ul><p>This checklist does not recommend a medicine, change a dose or confirm eligibility for treatment.</p></aside></div>'+
 '<section class="review-next" aria-labelledby="review-next"><h2 id="review-next">Read the part that fits your question</h2><ul>'+
 '<li><a href="/articles/nhs-weight-loss-drugs">NHS weight-loss treatment: eligibility and access</a></li>'+
 '<li><a href="/articles/wegovy-side-effects-timeline">Wegovy injection side effects: duration and when to get help</a></li>'+
 '<li><a href="/articles/weight-loss-plateau-men">Weight-loss plateaus: what to review</a></li>'+
 '<li><a href="/downloads/prescriber-questions-20261006.pdf">Existing one-page questions for a UK prescriber (PDF)</a></li></ul>'+
 '<h3>Practical support between conversations</h3><p><a href="/weight-loss-support-for-men">My Timber’s free support</a> brings together food, movement, tracking and check-ins. You do not need to buy treatment to use it. It does not replace your GP, prescriber or other healthcare team.</p>'+
 '<p><strong>No stock available today.</strong> SHIFT treatment ordering is closed. SHIFT does not prescribe.</p></section>'+
 '<details class="review-disclosure"><summary>About this checklist and your information</summary><p>The question examples are SHIFT editorial prompts, prepared with AI assistance. They have not been independently clinically reviewed and do not provide a diagnosis or individual treatment advice.</p><p>This tool has no box for entering health details. Topic choices stay in this page and reset when it reloads; the checklist script does not send or save them. Printing uses your device’s print dialogue. Keep any personal notes somewhere appropriate for you.</p><p>Background: <a href="https://www.nhs.uk/conditions/overweight-and-obesity/">NHS information about overweight and obesity</a>, checked 20 October 2026. This supports the general routes to professional help, not endorsement of this checklist.</p></details>'+
 '<p class="review-meta">General information for adults · SHIFT editorial · No clinical assessment is provided by this tool.</p></main>';
}
export function reviewPlannerHTML(){
 const url=ORIGIN+REVIEW_PATH;
 const schema={'@context':'https://schema.org','@graph':[{'@type':'WebPage','@id':url+'#webpage',url,name:REVIEW_TITLE,description:REVIEW_DESCRIPTION,inLanguage:'en-GB',isAccessibleForFree:true,publisher:{'@type':'Organization',name:'SHIFT Some Timber',url:ORIGIN+'/' }},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:'Tools',item:ORIGIN+'/tools'},{'@type':'ListItem',position:3,name:'Weight-management review',item:url}]}]};
 const styles=['programme-treatment-handoff-v1.css?v=1','shift-recovery-v6.css?v=cos-live-recovery-20260909-r2','shift-compact-entry-v1.css?v=1','ask-timber-drawer-v2.css?v=8','v136-desolation-recovery.css?v=1','v137-estate-closeout.css?v=footer-wire-20260911b','header-navigation-v2.css'].map(s=>'<link rel="stylesheet" href="/assets/'+s+'">').join('');
 return '<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#050505"><title>'+esc(REVIEW_TITLE)+' | SHIFT</title><meta name="description" content="'+esc(REVIEW_DESCRIPTION)+'"><meta name="robots" content="index,follow"><link rel="canonical" href="'+url+'"><meta property="og:type" content="website"><meta property="og:title" content="'+esc(REVIEW_TITLE)+'"><meta property="og:description" content="'+esc(REVIEW_DESCRIPTION)+'"><meta property="og:url" content="'+url+'"><script type="application/ld+json">'+JSON.stringify(schema).replaceAll('<','\\u003c')+'</script>'+styles+REVIEW_STYLE+'</head><body class="sst-fullsite-v35 sst-site-v31 one-shift sst-reading-page shift-review-page"><a class="skip-link-v30f" href="#main-content">Skip to main content</a>'+publicHeader+publicDrawer+'<div class="drawer-backdrop" hidden></div>'+reviewPlannerMain()+publicFooter+'<script defer src="'+REVIEW_ASSET+'"></script></body></html>';
}
export function reviewPlannerRoute(request){
 const u=new URL(request.url);if(!['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(u.hostname)||!['GET','HEAD'].includes(request.method))return null;
 const asset=u.pathname===REVIEW_ASSET;const page=u.pathname.replace(/\.html$/,'').replace(/\/+$/,'')===REVIEW_PATH;
 if(!asset&&!page)return null;
 if(page&&(u.origin!==ORIGIN||u.pathname!==REVIEW_PATH))return Response.redirect(ORIGIN+REVIEW_PATH,301);
 const body=asset?REVIEW_CLIENT:reviewPlannerHTML();
 return new Response(request.method==='HEAD'?null:body,{headers:{'Content-Type':asset?'text/javascript; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'public, max-age=300, must-revalidate','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Shift-Review-Planner':'2026-10-20-v1'}});
}
export const REVIEW_CONTEXT=Object.freeze({
 '/articles/wegovy-side-effects-timeline':{heading:'Make a routine review easier',text:'For a non-urgent conversation, pick questions about symptoms and follow-up with the free review checklist. For symptoms needing urgent help, use the warning signs and healthcare routes above; do not wait for a routine review.'},
 '/articles/nhs-weight-loss-drugs':{heading:'Take clear questions to the conversation',text:'Use the free review checklist to organise questions about available support and what happens next. It cannot confirm NHS eligibility, arrange a referral or promise access to a medicine.'},
 '/articles/weight-loss-plateau-men':{heading:'Bring the pattern and the question',text:'Use the free review checklist to choose questions about readings, everyday routines and the next review. A checklist cannot identify why progress has slowed or make a treatment decision.'},
 '/tools':{heading:'Turn a result into useful questions',text:'A number is a starting point. Use the free review checklist to prepare questions for your GP or treating service, without entering health details on this website.'}
});
export function addReviewContext(html,path){
 const item=Object.hasOwn(REVIEW_CONTEXT,path)?REVIEW_CONTEXT[path]:null;
 if(!item||html.includes('data-review-checklist-link')||!/<main\b/i.test(html)||!/<\/main>/i.test(html))return html;
 const block='<section class="shift-review-link" data-review-checklist-link><h2>'+esc(item.heading)+'</h2><p>'+esc(item.text)+'</p><p><a href="'+REVIEW_PATH+'">Build your weight-management review checklist</a></p></section>';
 return html.replace(/<\/main>/i,block+'</main>');
}
export function addReviewDiscovery(text,path){
 if(path==='/sitemap.xml'){
  if(!/<urlset\b/i.test(text)||!/<\/urlset>/i.test(text)||text.includes('<loc>'+ORIGIN+REVIEW_PATH+'</loc>'))return text;
  return text.replace('</urlset>','<url><loc>'+ORIGIN+REVIEW_PATH+'</loc></url></urlset>');
 }
 let data;try{data=JSON.parse(text)}catch{return text}
 if(!Array.isArray(data)||data.some(x=>x?.url===REVIEW_PATH||x?.url===ORIGIN+REVIEW_PATH))return text;
 if(path==='/assets/knowledge-index.json')data.push({type:'Tool',title:REVIEW_TITLE,url:REVIEW_PATH,topic:'tools',desc:REVIEW_DESCRIPTION,keywords:['weight management','review','GP appointment','questions','treatment follow-up','plateau']});
 else if(path==='/search-index-v3a.json')data.push({url:REVIEW_PATH,title:REVIEW_TITLE,description:REVIEW_DESCRIPTION,category:'Tool',keywords:'weight management review GP appointment questions treatment follow-up plateau'});
 else return text;
 return JSON.stringify(data);
}
export async function withReviewPlannerDiscovery(response,request){
 const u=new URL(request.url),path=u.pathname.replace(/\/+$/,'')||'/';
 if(u.origin!==ORIGIN||!['GET','HEAD'].includes(request.method)||!response.ok)return response;
 const type=response.headers.get('Content-Type')||'';
 const linked=Object.hasOwn(REVIEW_CONTEXT,path)&&type.includes('text/html');
 const indexed=['/sitemap.xml','/assets/knowledge-index.json','/search-index-v3a.json'].includes(path)&&(path.endsWith('.xml')?type.includes('xml'):type.includes('json'));
 if(!linked&&!indexed)return response;
 const before=await response.text(),after=linked?addReviewContext(before,path):addReviewDiscovery(before,path);
 if(after===before)return new Response(request.method==='HEAD'?null:before,response);
 const headers=new Headers(response.headers);for(const h of ['etag','last-modified','content-length','content-encoding','content-md5','digest'])headers.delete(h);
 headers.set('Cache-Control','public, max-age=300, must-revalidate');headers.set('X-Shift-Review-Planner','2026-10-20-v1');
 return new Response(request.method==='HEAD'?null:after,{status:response.status,statusText:response.statusText,headers});
}
