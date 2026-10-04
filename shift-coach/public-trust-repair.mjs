// Owner-requested public audit repairs, 3 October 2026. No customer-record writes.
export const crisis = '<aside data-shift-urgent-help><h2>Need help now?</h2><p>If you or someone else is in immediate danger, call <a href="tel:999">999</a> or go to A&amp;E. For someone to talk to, call Samaritans free on <a href="tel:116123?oai_link_source=model_response_hotline">116 123</a>, day or night. <a href="https://www.samaritans.org/how-we-can-help/contact-samaritan/?oai_link_source=model_response_hotline">Samaritans contact information</a>.</p><p>My Timber check-ins and AI replies are not monitored by a clinician or emergency team. Do not wait for a reply here if you need urgent help.</p></aside>';
export const pages = {
 '/terms-of-sale': ['Treatment orders and terms of sale', '<p>SHIFT is not currently accepting medicine orders or treatment payments. You can use My Timber free without buying treatment.</p><h2>Before treatment ordering opens</h2><p>The named prescribing service and dispensing pharmacy, their responsibilities, the full price, what is included, delivery arrangements and applicable sale terms must be available before any payment. A prescription is a clinical decision; payment cannot guarantee approval.</p><h2>If treatment is not approved</h2><p>There is no live SHIFT treatment checkout at present. Before it opens, the checkout must explain whether payment is authorised or collected, what happens if treatment is declined, any separately agreed assessment charge, and the refund process and timescale. Do not pay for treatment through an unsolicited link.</p><h2>Cancellations and payment queries</h2><p>See <a href="/refunds">cancellations and refunds</a>. If you believe you have already paid SHIFT for treatment, <a href="/contact?type=payment-query">contact us</a> with the date and order reference. Do not send card details or medical records through the general contact form.</p><p>These current-status terms do not replace your statutory rights or the terms supplied with an existing purchase. <a href="/terms">Website terms</a>.</p>'],
 '/refunds': ['Cancellations and refunds', '<p>SHIFT treatment ordering and treatment payments are not currently open. My Timber is free and does not require a medicine purchase or a paid subscription.</p><h2>A payment you have already made</h2><p><a href="/contact?type=payment-query">Contact SHIFT</a> with your order reference, payment date and what you need help with. Do not include full card details. We need to identify the seller and transaction before confirming the applicable cancellation or refund route.</p><h2>If treatment is declined</h2><p>Before any future treatment checkout opens, it must state what happens to an authorisation or collected payment if the prescriber declines treatment, including any separately agreed assessment fee and refund timescale. Those arrangements are not yet a live service.</p><h2>Cancelling an order</h2><p>For an existing purchase, contact the seller named on your confirmation promptly. Cancellation options depend on what you bought and whether a service has started or goods have been supplied. Nothing on this page removes your statutory rights. Do not return medicines without instructions from the dispensing pharmacy.</p><p><a href="/terms-of-sale">Treatment ordering status and sale terms</a> · <a href="/complaints">Complaints</a></p>'],
 '/accessibility': ['Accessibility', '<p>We want SHIFT and My Timber to be usable with a keyboard, screen reader, enlarged text and reduced motion. Accessibility work is ongoing; we have not completed an independent WCAG conformance audit and do not claim full conformance.</p><h2>Using the site</h2><p>You can zoom using your browser and use the larger-text and reduced-motion controls in the footer. Interactive features, forms and member tools may still have barriers.</p><h2>Report a barrier or request another format</h2><p><a href="/contact?type=accessibility">Contact us</a> or email <a href="mailto:hello@shiftsometimber.co.uk">hello@shiftsometimber.co.uk</a>. Tell us which page or task is affected, what went wrong, and which device or assistive technology you use if you are comfortable sharing it. Do not include private health information.</p><p>Statement updated 3 October 2026.</p>']
};
const pathOf=r=>new URL(r.url).pathname.replace(/\.html$/,'').replace(/\/+$/,'')||'/';
// 4 October: publisher full text reviewed (37 studies, 9341 participants).
// Repair the sole broken source anchor; retain the existing cautious summary,
// historical review date, wording, scripts, layout and all other sources.
export const STOPPING_BMJ_OLD='https://www.bmj.com/content/390/bmj-2025-083108';
export const STOPPING_BMJ_CURRENT='https://www.bmj.com/content/392/bmj-2025-085304';
const sourceAnchors=(html,from,to)=>html.replace(/<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>|<!--[\s\S]*?-->|<a\b[^>]*>/gi,tag=>!/^<a\b/i.test(tag)?tag:tag.replace(/(\s)href\s*=\s*(["'])(.*?)\2/i,(attribute,space,quote,url)=>url===from?space+'href='+quote+to+quote:attribute));
export function repairStoppingCitation(html){return sourceAnchors(html,STOPPING_BMJ_OLD,STOPPING_BMJ_CURRENT);}
export function restoreStoppingCitation(path,input,{required=false}={}){
 if(path!=='/articles/stopping-glp1')return input;
 const html=input.toString('utf8'),restored=sourceAnchors(html,STOPPING_BMJ_CURRENT,STOPPING_BMJ_OLD);
 const current=(html.match(new RegExp(STOPPING_BMJ_CURRENT.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length;
 if(required&&current!==1)throw Error('Expected exactly one reviewed stopping-treatment BMJ source');
 if(current>1)throw Error('Duplicate stopping-treatment BMJ source');
 return Buffer.from(restored);
}
export function trustRoute(request){
 const p=pathOf(request);
 if(p==='/assets/contact-reference-init.js')return new Response(contactInit,{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'}});
 if(p==='/v1/shift/visualise')return Response.json({ok:false,error:'feature_withdrawn',message:'AI weight-change images are no longer available. You can still save real progress photos.'},{status:410,headers:{'Cache-Control':'no-store'}});
 if(p==='/clinician-dashboard-v3d')return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
 if(p==='/.well-known/security.txt'||p==='/security.txt')return new Response('Contact: mailto:hello@shiftsometimber.co.uk\nExpires: 2027-04-03T00:00:00Z\nPreferred-Languages: en\nCanonical: https://shiftsometimber.co.uk/.well-known/security.txt\n',{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'}});
 return null;
}
export function repairHtml(html,path){
 if(path==='/')return html;
 if(path==='/articles/stopping-glp1')return repairStoppingCitation(html);
 html=html.replace(/(<(?:p|nav)\b[^>]*class=["']footer-legal-links["'][^>]*>)/i,'$1<a href="/terms-of-sale">Sale terms</a><a href="/refunds">Cancellations &amp; refunds</a><a href="/accessibility">Accessibility statement</a>');
 if(path.startsWith('/member/')){
  html=html.replace(/<h3>Weight illustrations<\/h3>[\s\S]*?(?=<h3>Saved real progress photos<\/h3>)/,'');
  html=html.replace(/<label class="consent"><input id="visualConsent"[^>]*>[\s\S]*?<\/label>/,'<input id="visualConsent" type="checkbox" hidden disabled aria-hidden="true">');
  html=html.replace('Save a real progress photo privately, then choose whether to create clearly labelled AI illustrations. Nothing here is a prediction or clinical assessment.','Save real progress photos privately. Your progress is personal: no generated weight-change images or predicted results.');
 }
 if(path==='/contact')html=html.replace(/<script\b[^>]*src=["']\/assets\/contact-submit-v4\.js[^"']*["'][^>]*><\/script>/gi,'<script defer src="/assets/contact-reference-init.js"></script>');
 if(path==='/lounge')html=html
  .replace(/<meta\b(?=[^>]*http-equiv=["']refresh["'])[^>]*>/gi,'')
  .replace(/<script\b[^>]*>\s*window\.location\.replace\(["']\/["']\);?\s*<\/script>/gi,'')
  .replace(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*>/gi,'')
  .replace(/<\/head>/i,'<link rel="canonical" href="https://shiftsometimber.co.uk/lounge"></head>');
 html=html.replace(/No paid influence on conclusions\./g,'Commercial relationships disclosed.');
 if(/urgent-help|crisis|suicid/.test(path)&&!html.includes('data-shift-urgent-help'))html=html.replace(/<\/main>/i,crisis+'</main>');
 if(path==='/treatment-centre'){
  html=html.replace(/Payment does not guarantee prescribing\./g,'Treatment ordering and payment are not currently open.');
  html=html.replace(/<\/main>/i,'<p><a href="/terms-of-sale">Treatment ordering status and sale terms</a> · <a href="/refunds">Cancellations and refunds</a></p></main>');
 }
 if(path==='/advertise-with-us')html=html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/i,'<main id="main-content"><h1>Advertising enquiries</h1><p>Advertising enquiries do not buy editorial coverage, favourable conclusions or clinical recommendations. Any advertising must be clearly identified and kept separate from independent information. A commercial enquiry is not an accepted advertising agreement.</p><p><a href="/commercial-principles">Commercial principles</a> · <a href="/contact">Contact SHIFT</a></p></main>');
 return html;
}
export async function withTrustRepair(request,response){
 const path=pathOf(request);if(path==='/')return response;
 const relevant=pages[path]||path.startsWith('/member/')||/^\/(?:medicine-news|newsroom)(?:\/|$)/.test(path)||/urgent-help|crisis|suicid/.test(path)||['/robots.txt','/lounge','/contact','/treatment-centre','/advertise-with-us','/commercial-principles','/articles/stopping-glp1'].includes(path);
 if(!relevant)return response;
 const headers=new Headers(response.headers);
 if(path==='/robots.txt'&&response.ok){let body=await response.text();body=body.replace(/^.*clinician-dashboard-v3d.*\n?/gm,'');headers.delete('Content-Length');headers.delete('ETag');return new Response(body,{status:200,headers});}
 if(!response.ok||!headers.get('Content-Type')?.includes('text/html'))return response;
 let html=await response.text();
 if(pages[path]){
  const [title,content]=pages[path];
  html=html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/i,`<main class="page-template template-legal-utility" id="main-content"><div class="standard-layout"><section class="pagehero"><div class="wrap"><h1>${title}</h1></div></section><section class="content"><div class="wrap prose">${content}</div></section></div></main>`).replace(/<title>[\s\S]*?<\/title>/i,`<title>${title} | Shift Some Timber</title>`).replace(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*>/gi,`<link rel="canonical" href="https://shiftsometimber.co.uk${path}">`);
 }
 html=repairHtml(html,path);
 if(/^\/(?:medicine-news|newsroom)(?:\/|$)/.test(path)){
  headers.set('X-Robots-Tag','noindex, follow');
  html=html.replace(/<meta\b(?=[^>]*name=["']robots["'])[^>]*>/gi,'').replace('</head>','<meta name="robots" content="noindex,follow"></head>');
 }
 for(const h of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(h);
 headers.set('Cache-Control','no-store');headers.set('X-Shift-Trust-Repair','2026-10-03');
 return new Response(request.method==='HEAD'?null:html,{status:response.status,headers});
}

const contactInit=String.raw`(()=>{const init=()=>{const form=document.getElementById('shiftContactForm');if(!form)return;const params=new URLSearchParams(location.search),product=params.get('product'),name=params.get('name'),type=params.get('type'),select=document.getElementById('ct-subject'),message=document.getElementById('ct-message');if(select){const routeStock=()=>{if(String(select.value).toLowerCase()==='stock update')location.assign('/waiting-list-journey');};select.addEventListener('input',routeStock);select.addEventListener('change',routeStock);}if(type&&select){const option=Array.from(select.options).find(o=>o.text.toLowerCase()===type.toLowerCase());if(option)select.value=option.value;}if(product&&message&&!message.value)message.value='Please tell me about '+(name||product)+'.\n\nSHIFT Health reference: '+product;};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();})();`;
export async function withContactReference(request){
 if(new URL(request.url).pathname!=='/v1/contact'||request.method!=='POST')return request;
 let ref;try{ref=new URL(request.headers.get('Referer'));}catch{return request;}
 if(!['shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(ref.hostname)||ref.pathname!=='/contact')return request;
 const product=ref.searchParams.get('product');if(!product||product.length>200)return request;
 let body;try{body=await request.clone().json();}catch{return request;}
 if(typeof body.message!=='string')return request;
 const reference='SHIFT Health reference: '+product;
 if(!body.message.includes(reference))body.message+='\n\n'+reference;
 body.product=product;
 const headers=new Headers(request.headers);headers.delete('Content-Length');
 return new Request(request,{headers,body:JSON.stringify(body)});
}

// Release comparison reverses only the two reviewed notices and one added link row.
// All remaining content continues through the existing full-page hash comparison.
export function restoreTrustCentre(path,input,{required=false}={}){
 if(path!=='/treatment-centre')return input;
 let html=String(input);
 // PR #1039 reviewed these two public-source MOT corrections. Restore their
 // exact predecessor only for the existing release fingerprint, never for users.
 const mot=[
  ['The Health MOT guide explains a proposed blood-test route and how it differs from the older browser questionnaire. No test or clinical review is booked by reading it.','Explore the SHIFT Health MOT home blood test and what it covers.'],
  ['>Read the Health MOT guide</a>','>Explore the Health MOT</a>']
 ];
 if(mot.some(([current])=>html.includes(current))){
  for(const [current,prior]of mot){
   if(html.split(current).length-1!==1||html.includes(prior))throw Error('Expected exactly one of each reviewed Health MOT correction');
   html=html.replace(current,prior);
  }
 }
 const prior='Payment does not guarantee prescribing.',current='Treatment ordering and payment are not currently open.';
 const links='<p><a href="/terms-of-sale">Treatment ordering status and sale terms</a> · <a href="/refunds">Cancellations and refunds</a></p>';
 const count=s=>html.split(s).length-1;
 if(!required&&count(current)===0&&count(links)===0)return html;
 if(count(current)!==2||count(prior)!==0||count(links)!==1)throw Error('Expected exact treatment trust repair: two notices and one link row');
 return html.replaceAll(current,prior).replace(links,'');
}
