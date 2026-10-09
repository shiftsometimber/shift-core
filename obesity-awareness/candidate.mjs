import {candidate} from './content.mjs';
export const PATH=candidate.path;
const ORIGIN='https://shiftsometimber.co.uk';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const once=(html,before,after)=>{if(html.split(before).length!==2)throw Error('awareness_source_drift');return html.replace(before,()=>after)};
const mainRE=/<main\b[^>]*>[\s\S]*?<\/main>/gi;
const schemaRE=/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi;
const style=`.shift-understanding{box-sizing:border-box;max-width:960px;margin:32px auto;padding:24px;color:#050505;background:#e7e3da;font:18px/1.65 system-ui,sans-serif}.shift-understanding h1{font-size:clamp(32px,5vw,56px);line-height:1.1}.shift-understanding h2{font-size:28px;line-height:1.25;margin-top:36px}.shift-understanding a{color:#304435;text-underline-offset:.2em;overflow-wrap:anywhere}.shift-understanding .lead{font-size:22px}.shift-understanding .small{font-size:15px}.shift-understanding .action-panel,.shift-understanding .note{padding:20px;background:#f6f3ed;border:2px solid #707762}.shift-understanding .button{display:inline-block;min-height:48px;padding:12px 20px;margin:8px 18px 8px 0;background:#050505;color:#e7e3da}.shift-understanding summary{cursor:pointer;padding:12px 6px;min-height:48px;font-weight:700}.shift-understanding details{border-top:1px solid #707762;padding:8px 0}.shift-understanding :focus-visible{outline:3px solid #050505;outline-offset:4px}@media(max-width:600px){.shift-understanding{margin:20px auto;padding:18px;font-size:17px}.shift-understanding h2{font-size:25px}.shift-understanding .lead{font-size:20px}}`;
export const pillarFooter='<section data-male-obesity-footer><h2>Male obesity</h2><a href="/male-obesity">Understanding obesity</a><a href="/male-obesity#why-hard">Why it can be hard</a><a href="/male-obesity#getting-help">Getting appropriate help</a><a href="/male-obesity#keeping-progress">Keeping progress</a><a href="/weight-loss-support-for-men">Free support for men</a></section>';
export function amendPillarChrome(html,path){
 if(['/','/index','/index.html','/home','/home.html'].includes(path)||/^\/(?:member|api|v1|hq|admin)(?:\/|$)/.test(path))return html;
 if(html.includes('data-male-obesity-footer'))return html;
 const footer=/<footer\b[^>]*class=["'][^"']*site-footer[^"']*["'][^>]*>[\s\S]*?<\/footer>/i;
 html=html.replace(footer,part=>part.replace('<section><h2>Explore</h2>',pillarFooter+'<section><h2>Explore</h2>'));
 html=html.replace(/(<aside\b[^>]*id=["']site-drawer["'][^>]*>)([\s\S]*?)(<\/aside>)/i,(all,open,body,close)=>open+body.replace(/(<a href="\/member\/dashboard"[^>]*>My Timber<\/a>)/,'$1<a href="/male-obesity">Male obesity</a>')+close);
 const css='<style data-pillar-chrome>html body #sst-footer-c .fc-main{grid-template-columns:minmax(240px,1.6fr) repeat(6,minmax(0,1fr))}html body #sst-footer-c [data-male-obesity-footer] a{min-height:44px;display:flex!important;align-items:center}@media(max-width:1100px){html body #sst-footer-c .fc-main{grid-template-columns:repeat(3,minmax(0,1fr))}html body #sst-footer-c .footer-brand{grid-column:1/-1}}@media(max-width:640px){html body #sst-footer-c .fc-main{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:360px){html body #sst-footer-c .fc-main{grid-template-columns:1fr}}</style>';
 return html.replace('</head>',css+'</head>');
}
export function renderCandidate(shell){
 if((shell.match(mainRE)||[]).length!==1||!shell.includes('</head>'))throw Error('awareness_invalid_shell');
 // Retain existing header/navigation/footer/consent verbatim. Shell review is a separate gate.
 let html=shell.replace(mainRE,()=>'<main id="main-content" class="shift-understanding" data-shift-weight-understanding>'+candidate.body+'</main>')
 .replace(/<title>[\s\S]*?<\/title>/gi,'')
 .replace(/<meta\b(?=[^>]*(?:name|property)\s*=\s*["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'])[^>]*>/gi,'')
 .replace(/<link\b(?=[^>]*rel\s*=\s*["']canonical["'])[^>]*>/gi,'').replace(schemaRE,'')
 .replace(/<script\b[^>]*src=["'][^"']*(?:programme|shift-service-bridge-v1)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi,'');
 const graph={'@context':'https://schema.org','@graph':[{'@type':'Article',headline:'Male obesity: understanding weight and finding support',description:candidate.description,inLanguage:'en-GB',mainEntityOfPage:ORIGIN+PATH,publisher:{'@type':'Organization',name:'Shift Some Timber'},citation:['https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight','https://www.nhs.uk/conditions/overweight-and-obesity/','https://www.niddk.nih.gov/health-information/weight-management/adult-overweight-obesity/eating-physical-activity']},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:'Male obesity',item:ORIGIN+PATH}]}]};
 return amendPillarChrome(html.replace('</head>',`<title>${esc(candidate.title)}</title><meta name="description" content="${esc(candidate.description)}"><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="${ORIGIN+PATH}"><style data-weight-understanding>${style}</style><script type="application/ld+json">${JSON.stringify(graph).replace(/</g,'\\u003c')}</script></head>`),PATH);
}
export function amendSupportingDocument(path,input){
 if(!['/weight-loss-support-for-men','/mental-health/mental-health-and-weight','/articles/weight-loss-plateau-men','/mens-weight-management','/articles/evidence-based-weight-loss'].includes(path))return input;
 if((input.match(mainRE)||[]).length!==1)throw Error('awareness_invalid_shell');
 if(input.includes('data-weight-understanding-addition'))return input;
 let html=input,addition='';
 if(path==='/weight-loss-support-for-men'){
  // Changes apply atomically; ambiguous upstream copy aborts, never partially rewrites.
  const replacements=[
   ['Can I use My Timber after stopping Mounjaro or Wegovy?','Can I use My Timber after treatment has ended?'],
   ['Check-ins and “did it help?” feedback let My Timber adapt the next step. If something did not fit your week, the next step should get smaller. If it did not help, My Timber should change the approach rather than simply repeat it.','Review whether your step helped, then decide what to change. If it took too much effort, simplify it. If it did not address the problem, try a different approach or ask for support.'],
   ['Practical food and movement options for real weeks, with thousands of recipe and movement variations available inside My Timber.','Browse meal ideas in Grub and review the guidance available in Fit. Check food suitability and whether an activity is appropriate for you.'],
   ['<a href="/articles/stopping-glp1">Read the stopping-treatment guide</a>','<a href="#keeping-progress">Plan how to keep useful routines</a>'],
   ['<a href="/articles/food-noise-after-stopping-glp1">Food noise after stopping GLP-1</a>','<a href="/male-obesity#healthcare">Prepare a healthcare question</a>'],
   ['<p>If you are exploring options, <a href="/start-here">Start Here</a> can help you understand the routes. If you only want the free support, open My Timber directly.</p>','<p>Use the public first step below before opening an account. For clinical questions, speak to a GP or your treating service.</p>'],
   ['<p>You do not need to fill in your life story before My Timber can help. The first experience starts with one useful question, then learns more only when it is relevant.</p>','<p>You can use the public guidance below without an account. Sign in or register to use saved personal records in My Timber.</p>']
  ];
  // The named FAQ also occurs inside JSON-LD. Replace only exact, counted pairs.
  for(const [before,after]of replacements){const count=html.split(before).length-1;if(count!==(before.startsWith('Can I')?2:1))throw Error('awareness_source_drift');html=html.split(before).join(after)}
  addition=candidate.supportAddition;
 }else if(path==='/mental-health/mental-health-and-weight')addition=candidate.moodAddition;
 else if(path==='/articles/weight-loss-plateau-men')addition=candidate.plateauAddition;
 else addition='<p>If you keep wondering why this is so hard, read <a href="'+PATH+'">our explanation of hunger, weight regain and the practical barriers to weight loss</a>. Then choose one useful step for the week you actually have.</p>';
 const block='<section id="awareness-first-step" class="shift-understanding" data-weight-understanding-addition>'+addition+'</section>';
 // Place the public help before the account CTA on support. Keep urgent-help content intact elsewhere.
 if(path==='/weight-loss-support-for-men'){
  html=once(html,'<div class="continuity-actions"><a class="continuity-button" href="/member/dashboard?from=weight-loss-support" data-support-mytimber-cta>Open My Timber free →</a><a href="/programme">See how the Programme fits together</a></div>','<div class="continuity-actions"><a class="continuity-button" href="#awareness-first-step">Find one useful step →</a><a href="/member/dashboard?from=weight-loss-support" data-support-mytimber-cta>Open My Timber free</a></div>');
  html=once(html,'<section><h2>What you actually get</h2>',block+'<section><h2>What you actually get</h2>');
 }
 else html=once(html,'</main>',block+'</main>');
 return html;
}
function candidateResponse(response,html,head=false){
 const headers=new Headers(response.headers);for(const name of ['Content-Length','Content-Encoding','ETag','Last-Modified','Content-MD5','Digest'])headers.delete(name);
 headers.set('Content-Type','text/html; charset=utf-8');headers.set('Cache-Control','no-store');headers.set('X-Robots-Tag','noindex, nofollow');headers.set('X-Shift-Weight-Understanding','review-only');
 return new Response(head?null:html,{status:response.status,headers});
}
function unavailable(head){return new Response(head?null:'<!doctype html><html lang="en-GB"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Guide temporarily unavailable | SHIFT</title></head><body><main><h1>We can’t load the guide right now</h1><p>You can still choose tomorrow’s meal and a simpler fallback, or write down the question you want to take to your GP. No account is needed to do either.</p><p><a href="https://www.nhs.uk/conditions/overweight-and-obesity/">Read the NHS information about weight and support</a>.</p></main></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}})}
// Review adapter only. Not imported by production or included in approved release composition.
export function withWeightUnderstandingReview(worker){return {async fetch(request,env={},ctx){
 if(env.SHIFT_WEIGHT_UNDERSTANDING_REVIEW!=='1'||!['GET','HEAD'].includes(request.method))return worker.fetch(request,env,ctx);
 const url=new URL(request.url),path=url.pathname;
 if(path===PATH){
  const shellURL=new URL(url);shellURL.pathname='/programme';shellURL.search='';
  try{
   const shell=await worker.fetch(new Request(shellURL,{method:'GET',headers:request.headers}),env,ctx);
   if(!shell.ok||!(shell.headers.get('Content-Type')||'').includes('text/html'))return unavailable(request.method==='HEAD');
   return candidateResponse(shell,renderCandidate(await shell.text()),request.method==='HEAD');
  }catch{return unavailable(request.method==='HEAD')}
 }
 // HEAD uses the same generated header semantics as GET without returning a body.
 if(['/','/index','/index.html','/home','/home.html'].includes(path)||/^\/(?:member|api|v1|hq|admin)(?:\/|$)/.test(path))return worker.fetch(request,env,ctx);
 const r=await worker.fetch(request.method==='HEAD'?new Request(url,{method:'GET',headers:request.headers}):request,env,ctx);
 if(r.status!==200||!(r.headers.get('Content-Type')||'').includes('text/html'))return request.method==='HEAD'?new Response(null,r):r;
 return candidateResponse(r,amendPillarChrome(amendSupportingDocument(path,await r.text()),path),request.method==='HEAD');
}}}
