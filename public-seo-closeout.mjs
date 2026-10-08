import {improvePracticalGuides,PRACTICAL_GUIDES} from './public-practical-guides.mjs';
const DESCRIPTIONS = new Map([
  ['/mental-health/medication-and-weight', 'Plain-English guidance on how mental-health medication can affect weight, practical next steps, and when to seek professional help.'],
  ['/mental-health/when-someone-refuses-help', 'Plain-English guidance for when someone refuses mental-health help, including safety concerns, practical boundaries and when to seek professional support.'],
]);

export const PERFORMANCE_SNIPPETS=Object.freeze({
  '/articles/wegovy-side-effects-timeline':{
    title:'Do Wegovy Side Effects Go Away? How Long They Last | SHIFT',
    description:'Do Wegovy side effects go away? They often ease over time, but timing varies. See common effects, warning signs and when to get medical help.'
  },
  '/articles/nhs-weight-loss-drugs':{
    title:'NHS Weight-Loss Drugs: Eligibility & Access in the UK | SHIFT',
    description:'Can you get weight-loss medication on the NHS? See current eligibility, England’s phased access, GP questions and what support to ask for if you do not qualify.'
  }
});
export const ARTICLE_IMAGE_REPAIR_PATHS=Object.freeze([
  '/articles/wegovy-side-effects-timeline',
  '/articles/nhs-weight-loss-drugs',
  '/articles/stopping-glp1'
]);

const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export const PUBLIC_TWITTER_IMAGE='<meta name="twitter:image" content="https://shiftsometimber.co.uk/assets/og-default.jpg">';
export const SHARING_IMAGE_PATHS=Object.freeze(['/commercial-principles','/contact','/downloads-resources','/partner-with-us','/press-centre','/shift-promise','/waiting-list-journey','/programme']);
export const PUBLIC_LINK_TARGETS=Object.freeze({
  '/my-timber':'/member/dashboard',
  '/articles/mounjaro-vs-wegovy':'/compare-weight-loss-treatments',
  '/member/journey':'/member/dashboard#journey',
  '/member/progress':'/member/dashboard#journey',
});

// These eight public documents already use this exact Open Graph image.
// Preserve a page-specific Twitter image if a later editorial change provides one.
export function completePublicSharingImage(html,path){
  if(!SHARING_IMAGE_PATHS.includes(path)||/<meta\b[^>]*\bname\s*=\s*["']twitter:image["']/i.test(html))return html;
  return html.replace(/<\/head\s*>/i,PUBLIC_TWITTER_IMAGE+'</head>');
}

export function repairPublicSeoLinks(html){
  // Anchors only: never rewrite scripts, forms, API requests or external hosts.
  return html.replace(/<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>|<!--[\s\S]*?-->|<a\b[^>]*>/gi,tag=>!/^<a\b/i.test(tag)?tag:tag.replace(/(\s)href\s*=\s*(["'])(.*?)\2/i,(attr,space,quote,href)=>{
    if(!href.includes('/member/')&&!href.includes('/my-timber')&&!href.includes('/articles/mounjaro-vs-wegovy'))return attr;
    let url;try{url=new URL(href,'https://shiftsometimber.co.uk')}catch{return attr}
    if(!['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk'].includes(url.origin))return attr;
    const target=PUBLIC_LINK_TARGETS[url.pathname];if(!target)return attr;
    const next=new URL(target,'https://shiftsometimber.co.uk');
    return space+'href='+quote+next.pathname+url.search+(next.hash||url.hash)+quote;
  }));
}

export const mentalHealthDescription = path => DESCRIPTIONS.get(path) || null;

// Owner-approved six-topic navigation: existing canonical pages, no new medicine claims.
export const SIX_TOPIC_SEO = Object.freeze({
 '/explore-knowledge': {title: 'Men’s Weight Loss & Mental Health Guides | SHIFT', description: 'Find UK guides to men’s mental health, weight loss, Mounjaro, Wegovy and retatrutide research, plus food, movement, sleep and support.'},
 '/mens-weight-management': {title: 'Weight Loss for Men UK: Getting Started & Support | SHIFT', description: 'Help with weight loss for men: explore food, movement, sleep, treatment choices and practical support around work, family and everyday life.'},
 '/mens-mental-health': {description: 'Free UK men’s mental health information: stress, anxiety, low mood, sleep, relationships, supporting someone and finding professional or urgent help.'},
 '/mounjaro': {description: 'Mounjaro information for UK men: evidence, side effects, NHS and private access, costs, food, movement and questions for your prescriber.'},
 '/wegovy': {description: 'Wegovy information for UK men: injection and tablet differences, side effects, access, costs and questions about support during and after treatment.'},
 '/guides/retatrutide-uk-guide': {title: 'Retatrutide (Reta) UK: Availability, Trials & Safety', description: 'What is Reta? Read the retatrutide UK guide to regulatory status, trial results, safety uncertainties and why research is different from treatment access.'}
});
const topicLink=(href,label,detail)=>`<li><a href="${href}">${label}</a> — ${detail}</li>`;
const sixTopicLinks=[
 topicLink('/mens-mental-health','Men’s mental health','free information and routes to appropriate support, independent of weight-loss treatment.'),
 topicLink('/mens-weight-management','Weight loss for men','food, movement, routines and the different support options.'),
 topicLink('/mounjaro','Mounjaro for men in the UK','understand the medicine and prepare questions for your prescriber.'),
 topicLink('/wegovy','Wegovy in the UK','keep injection and tablet questions separate.'),
 topicLink('/guides/retatrutide-uk-guide','Retatrutide (Reta) research','check the evidence, regulatory status and uncertainty; this is information, not an offer of supply.'),
 topicLink('/start-here','Help me lose weight: where to start','choose a starting point without needing to decide on medicine first.')
].join('');
const relatedLinks={
 '/explore-knowledge': `<h2>Find help with weight loss, mental health or treatment questions</h2><p>Start with the question that brought you here. These six routes connect to guides about food, movement, sleep, stress, confidence and life during and after treatment.</p><ul>${sixTopicLinks}</ul><h3>Help me lose weight: choose the first question</h3><p>If you are unsure where to begin, start with <a href="/mens-weight-management">the men’s weight-management guide</a>. For an ordinary working week, explore <a href="/guides/nutrition-protein-calories-meal-planning">food and meal planning</a>, <a href="/guides/exercise-walking-strength-mobility">walking and suitable movement</a>, or <a href="/guides/sleep-stress-mindset-emotional-eating-maintenance">sleep, stress and emotional eating</a>. If you need mental-health support, <a href="/mens-mental-health">Good to Talk</a> is free to read without joining a weight-loss programme.</p>`,
 '/mens-weight-management': `<h2>Help me lose weight: find the part you need next</h2><p>You do not have to solve food, exercise, sleep and treatment choices in one sitting. Choose the guide closest to the question you have today.</p><ul>${topicLink('/guides/nutrition-protein-calories-meal-planning','Food and meal planning','explore practical food ideas around budget, work and family meals.')}${topicLink('/guides/exercise-walking-strength-mobility','Walking, strength and mobility','read about movement options and when individual advice matters.')}${topicLink('/guides/sleep-stress-mindset-emotional-eating-maintenance','Sleep, stress and emotional eating','look at routines and difficult weeks without blame.')}${topicLink('/mens-mental-health','Men’s mental health support','find self-help information and appropriate professional support.')}${topicLink('/mounjaro','Mounjaro information','prepare questions about evidence, access and practical trade-offs.')}${topicLink('/wegovy','Wegovy information','understand the injection and tablet questions.')}${topicLink('/start-here','Help choosing your starting point','use Start Here when you are unsure which route to explore.')}</ul>`,
 '/mens-mental-health': `<h2>Find the mental-health question closest to your situation</h2><p>You can read these guides without joining SHIFT or considering weight-loss treatment. Start with how things feel, or with the person you are worried about.</p><ul>${topicLink('/mental-health/stress-overwhelm','Stress and feeling overwhelmed','when everyday pressures feel too much.')}${topicLink('/mental-health/anxiety-overthinking','Anxiety and overthinking','information about worry and finding support.')}${topicLink('/mental-health/feeling-low','Feeling low','explore what you are experiencing and when to get help.')}${topicLink('/mental-health/sleep-mental-health','Sleep and mental health','understand the questions to discuss when sleep is difficult.')}${topicLink('/mental-health/helping-someone','Supporting someone else','read about asking, listening and appropriate support.')}${topicLink('/mental-health/getting-professional-help','Getting professional help','prepare for the next conversation.')}${topicLink('/mental-health/urgent-mental-health-help','Urgent mental-health help','find the appropriate UK support route when help cannot wait.')}</ul>`,
 '/mounjaro': `<h2>Mounjaro questions: costs, everyday support and treatment changes</h2><p>Use the guide that matches your question. Information about food, movement or costs does not replace your prescriber’s assessment or medicine instructions.</p><ul>${topicLink('/articles/mounjaro-cost-uk','Mounjaro costs in the UK','compare what a dated quote includes.')}${topicLink('/articles/nhs-weight-loss-drugs','NHS weight-loss medicine access','understand why eligibility and actual access are different questions.')}${topicLink('/guides/nutrition-protein-calories-meal-planning','Food during weight-loss treatment','explore meal-planning and nutrition questions.')}${topicLink('/articles/glp-1-muscle-loss','Weight-loss medicines and muscle','prepare questions about strength, nutrition and evidence limits.')}${topicLink('/articles/stopping-glp1','Stopping weight-loss treatment','plan the conversation with your treating service.')}${topicLink('/articles/food-noise-after-stopping-glp1','Food noise after stopping GLP-1 treatment','read the evidence and practical support limits.')}</ul>`,
 '/wegovy': `<h2>Wegovy questions: side effects, costs and everyday support</h2><p>Use information for your exact formulation. A guide about the injection must not be treated as instructions for the tablet, or the other way round.</p><ul>${topicLink('/articles/wegovy-side-effects-timeline','Wegovy side effects and warning signs','know what to record and when to seek appropriate help.')}${topicLink('/articles/wegovy-cost-uk','Wegovy costs in the UK','read about comparing the whole quote.')}${topicLink('/comparisons/medications/wegovy-injection-vs-tablets','Wegovy injection versus tablets','compare the formulations and their practical differences.')}${topicLink('/articles/nhs-weight-loss-drugs','NHS medicine access','check the relevant pathway and local service.')}${topicLink('/articles/glp-1-and-exercise','Movement during GLP-1 treatment','explore activity and safety questions.')}${topicLink('/articles/stopping-glp1','Support after stopping treatment','prepare for ongoing care and everyday routines.')}</ul>`,
 '/guides/retatrutide-uk-guide': `<h2>Reta research and related UK medicine questions</h2><p>Research, regulatory authorisation, NHS access and actual supply are separate questions. Use the evidence above for retatrutide; these related guides help you explore the wider context.</p><ul>${topicLink('/mounjaro','Mounjaro UK information','read about a different medicine; separate trials are not a head-to-head comparison.')}${topicLink('/wegovy','Wegovy UK information','keep formulation, evidence and access questions separate.')}${topicLink('/articles/glp-1-muscle-loss','Weight-loss medicines and muscle research','understand the limits of body-composition claims.')}${topicLink('/mens-weight-management','Weight loss for men','explore support options without waiting for a future medicine.')}</ul>`
};
const topicStyle='<style data-six-topic-seo-style>.shift-topic-guides{box-sizing:border-box;max-width:1100px;margin:32px auto;padding:24px;border:1px solid #707762;border-radius:12px;background:#050505;color:#e7e3da;font:17px/1.6 Arial,sans-serif}.shift-topic-guides h2,.shift-topic-guides h3,.shift-topic-guides p,.shift-topic-guides li,.shift-topic-guides a{color:#e7e3da!important}.shift-topic-guides h2{font-size:clamp(1.4rem,3vw,2rem);line-height:1.25}.shift-topic-guides li{margin:12px 0}.shift-topic-guides a{text-decoration:underline;text-underline-offset:3px}.shift-topic-guides a:focus-visible{outline:3px solid #e7e3da;outline-offset:4px}@media(max-width:600px){.shift-topic-guides{padding:18px;margin:24px 0;overflow-wrap:anywhere}}</style>';
export function withSixTopicGuides(html,path){
 const copy=SIX_TOPIC_SEO[path];if(!copy||!/<main\b/i.test(html)||!/<\/main\s*>/i.test(html))return html;
 if(html.includes('data-six-topic-seo='))return html;
 // Existing article, safety guidance, authorship, review dates and schema survive.
 if(copy.title){html=html.replace(/<title>[\s\S]*?<\/title>/i,`<title>${esc(copy.title)}</title>`).replace(/<meta\b(?=[^>]*(?:property|name)\s*=\s*["'](?:og:title|twitter:title)["'])[^>]*>/gi,'');html=html.replace('</head>',`<meta property="og:title" content="${esc(copy.title)}"><meta name="twitter:title" content="${esc(copy.title)}"></head>`)}
 html=html.replace(/<meta\b(?=[^>]*(?:name|property)\s*=\s*["'](?:description|og:description|twitter:description)["'])[^>]*>/gi,'');
 html=html.replace('</head>',`<meta name="description" content="${esc(copy.description)}"><meta property="og:description" content="${esc(copy.description)}"><meta name="twitter:description" content="${esc(copy.description)}">${topicStyle}</head>`);
 return html.replace(/<\/main\s*>/i,`<section class="shift-topic-guides" data-six-topic-seo="${esc(path)}" aria-label="Related guides">${relatedLinks[path]}</section></main>`);
}

export function repairPerformanceSnippet(html,path){
 const item=PERFORMANCE_SNIPPETS[path];if(!item)return html;
 html=html.replace(/<title>[\s\S]*?<\/title>/i,`<title>${esc(item.title)}</title>`);
 html=html.replace(/<meta\b(?=[^>]*(?:name|property)\s*=\s*["'](?:description|og:title|twitter:title|og:description|twitter:description)["'])[^>]*>/gi,'');
 return html.replace('</head>',`<meta name="description" content="${esc(item.description)}"><meta property="og:title" content="${esc(item.title)}"><meta name="twitter:title" content="${esc(item.title)}"><meta property="og:description" content="${esc(item.description)}"><meta name="twitter:description" content="${esc(item.description)}"></head>`);
}
export function repairArticleImageSchema(html,path){
 if(!ARTICLE_IMAGE_REPAIR_PATHS.includes(path))return html;
 const image='https://shiftsometimber.co.uk/assets/og-default.jpg';
 return html.replace(/<script\b([^>]*)type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi,(whole,a,b,json)=>{
  try{
   const data=JSON.parse(json),nodes=Array.isArray(data)?data:Array.isArray(data?.['@graph'])?data['@graph']:[data];let changed=false;
   for(const node of nodes){const types=Array.isArray(node?.['@type'])?node['@type']:[node?.['@type']];if(types.includes('Article')&&!node.image){node.image=image;changed=true}}
   return changed?`<script${a}type="application/ld+json"${b}>${JSON.stringify(data).replace(/</g,'\\u003c')}</script>`:whole;
  }catch{return whole}
 });
}

export async function withPublicSeoCloseout(response, request) {
  const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
  const description = DESCRIPTIONS.get(path);
  const type = String(response?.headers?.get('content-type') || '').toLowerCase();
  if ((!description && !SIX_TOPIC_SEO[path] && !PRACTICAL_GUIDES[path] && !PERFORMANCE_SNIPPETS[path] && !ARTICLE_IMAGE_REPAIR_PATHS.includes(path)) || !response.ok || !type.includes('text/html') || !['GET','HEAD'].includes(request.method)) return response;
  let html = await response.text();
  if(description) html = html
    .replace(/<meta\b(?=[^>]*\bname\s*=\s*["'](?:description|twitter:description)["'])[^>]*>/gi, '')
    .replace(/<meta\b(?=[^>]*\bproperty\s*=\s*["']og:description["'])[^>]*>/gi, '')
    .replace('</head>', `<meta name="description" content="${esc(description)}"><meta property="og:description" content="${esc(description)}"><meta name="twitter:description" content="${esc(description)}"></head>`);
  html = repairArticleImageSchema(repairPerformanceSnippet(improvePracticalGuides(withSixTopicGuides(html,path),path),path),path);
  const headers = new Headers(response.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.delete('etag');
  headers.delete('last-modified');
  headers.set('cache-control', 'public, max-age=300, must-revalidate');
  headers.set('x-shift-seo-closeout', '2026-09-17');
  return new Response(request.method === 'HEAD' ? null : html, {status:response.status,statusText:response.statusText,headers});
}