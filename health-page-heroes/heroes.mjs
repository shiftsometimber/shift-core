export const version='20261029-approved-v1';
const guide='<path d="M3 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H3zM12 7a3 3 0 0 1 3-3h6v15h-5a4 4 0 0 0-4 2"/>';
const sign='<path d="M11 2v20M4 5h12l4 3-4 3H4zM20 14H8l-4 3 4 3h12z"/>';
const flask='<path d="M8 3h8M9 3v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V3M7 14h10"/>';
const sheet='<path d="M5 2h10l4 4v16H5zM14 2v5h5M8 11h8M8 15h8M8 19h5"/>';
const check='<path d="M9 3H5v19h14V3h-4M9 2h6v4H9zM8 10l1 1 2-2M13 10h3M8 15l1 1 2-2M13 15h3"/>';
export const pages=[
 {id:'testosterone',path:'/shift-health/testosterone-energy',worker:'shift-blog-publisher',kind:'testosterone',eyebrow:'TESTOSTERONE & ENERGY',headline:['Low energy?','Look at the bigger picture.'],copy:'Understand symptoms, explore testing and learn when to seek medical advice.',extra:'Low energy can have many causes.',labels:['Symptoms explained','Testing information','Next steps'],icons:[guide,flask,sign],cta:'Explore testosterone & energy',target:'#prompt-heading',crop:.55,alt:'A man sitting on a park bench in autumn daylight.'},
 {id:'bloods',path:'/shift-health/blood-tests',worker:'shift-bloods-public',kind:'bloods',eyebrow:'SHIFT BLOODS',headline:['Less guesswork.','A clearer picture.'],copy:'Compare Baseline, Advanced and Complete.',extra:'See what each panel covers and how samples are collected.',labels:['Baseline','Advanced','Complete'],icons:[sheet,sheet,sheet],cta:'Compare the panels',target:'#compare-blood-tests',note:'Coming soon · Ordering is not open',crop:.44,alt:'A man looking at his phone by a café window.'},
 {id:'hair',path:'/shift-health/hair-loss',worker:'shift-health-nutrition-20261027',kind:'product',eyebrow:'HAIR LOSS',headline:['Hair changes?','Start with clear information.'],copy:'Understand common causes, explore your options and learn when to seek advice.',labels:['Causes explained','Options explored','Next steps'],icons:['<circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/>',guide,sign],cta:'Explore hair loss',target:'#understand',crop:.55,alt:'A man with thinning hair seated comfortably in a barber shop.'},
 {id:'pressure',path:'/shift-health/blood-pressure-monitor',worker:'shift-health-nutrition-20261027',kind:'product',eyebrow:'BLOOD PRESSURE MONITORING',headline:['Home blood pressure.','Understand your numbers.'],copy:'Learn how to take a home reading, keep a useful record and know when to seek advice.',labels:['Take a reading','Keep a record','Know your next step'],icons:['<rect x="3" y="3" width="12" height="14" rx="3"/><path d="M7 3v14M15 13h3a4 4 0 0 1 0 8h-4"/>',sheet,sign],cta:'Explore blood pressure monitoring',target:'#understand',crop:.52,alt:'A man taking a home reading with a generic upper-arm blood pressure monitor.'},
 {id:'mental',path:'/mens-mental-health',worker:'shift-mytimber-support-20261023',kind:'mental',eyebrow:'GOOD TO TALK · MENTAL WELLBEING',headline:['You don’t need','the perfect words.'],copy:'Start with how you feel. Find practical guidance, help with a first conversation and routes to further support.',labels:['Practical guidance','Starting a conversation','Finding support'],icons:[guide,'<path d="M12 3a9 7 0 0 0-8 10l-2 5 6-2M12 3a9 7 0 0 1 8 10M16 10a7 5 0 0 0-6 7 7 5 0 0 0 8 2l4 2-1-4a7 5 0 0 0-5-7Z"/>',sign],cta:'Find your next step',target:'#your-next-step',note:'Free guidance. No account needed.',urgent:'Need urgent help? Find urgent support.',urgentTarget:'/mental-health/urgent-mental-health-help',crop:.45,alt:'Two men having a quiet conversation beside a local football pitch.'},
 {id:'sleep',path:'/shift-health/sleep-apnoea',worker:'shift-health-nutrition-20261027',kind:'product',eyebrow:'SLEEP APNOEA',headline:['Still tired after sleep?','Find your next step.'],copy:'Explore the signs of sleep apnoea, understand assessment and learn when to seek help.',labels:['Signs explained','Assessment options','Next steps'],icons:['<path d="M20 16A9 9 0 0 1 8 3a9 9 0 1 0 12 13Z"/>',check,sign],cta:'Explore sleep apnoea',target:'#understand',crop:.48,alt:'A man sleeping on his side in a comfortable bedroom.'},
 {id:'supplements',path:'/shift-health/supplements-nutrition',worker:'shift-health-nutrition-20261027',kind:'supplements',eyebrow:'SUPPLEMENTS & NUTRITION',headline:['Supplements.','Understand what you’re taking.'],copy:'Explore ingredients, purpose and suitability—so you can make a more informed choice.',labels:['What’s in it','Why consider it','Who it suits'],icons:['<rect x="5" y="2" width="14" height="4" rx="1"/><path d="M6 7h12l2 4v11H4V11zM4 12h16"/>',guide,check],cta:'Explore supplements',target:'#shop-categories',note:'Clear product information. No miracle claims.',crop:.59,alt:'A man considering an illustrative unbranded supplement container at his desk.'}
];
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export const byPath=path=>pages.find(p=>p.path===path.replace(/\/$/,'').replace(/\.html$/,''));
export function assetKey(p,asset){return version+'-'+p.id+'-'+asset.sha256.slice(0,12);}
export function imageURL(p,asset){return p.path+'?shift_hero='+assetKey(p,asset);}
export function renderHero(p,asset){
 const ratio=(asset.width*(1-p.crop)/asset.height).toFixed(5);
 return '<section class="shh-hero" data-shift-approved-hero="'+p.id+'" aria-labelledby="shh-title" style="--shh-photo-width:'+((1-p.crop)*100).toFixed(2)+'%;--shh-photo-ratio:'+ratio+'"><figure class="shh-photo"><img src="'+imageURL(p,asset)+'" width="'+asset.width+'" height="'+asset.height+'" alt="'+escape(p.alt)+'" fetchpriority="high" decoding="async"></figure><div class="shh-copy"><p class="shh-brand">SHIFT HEALTH</p><p class="shh-eyebrow">'+escape(p.eyebrow)+'</p><h1 id="shh-title">'+p.headline.map(escape).join('<br>')+'</h1><p class="shh-lede">'+escape(p.copy)+(p.extra?'<br>'+escape(p.extra):'')+'</p><ul class="shh-benefits">'+p.labels.map((label,i)=>'<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p.icons[i]+'</svg><span>'+escape(label)+'</span></li>').join('')+'</ul><a class="shh-cta" href="'+p.target+'">'+escape(p.cta)+'</a>'+(p.note?'<p class="shh-note">'+escape(p.note)+'</p>':'')+(p.urgent?'<a class="shh-urgent" href="'+p.urgentTarget+'">'+escape(p.urgent)+'</a>':'')+'</div></section>';
}
export function replaceHero(html,p,asset){
 if(html.includes('data-shift-approved-hero="'+p.id+'"'))return {html,changed:false,already:true};
 const hero=renderHero(p,asset);let count=0,out=html;
 const one=(pattern,replace)=>{const matches=[...out.matchAll(pattern)];if(matches.length!==1)throw Error('Hero boundary changed: '+p.id+' ('+matches.length+')');out=out.replace(pattern,(...args)=>{count++;return typeof replace==='function'?replace(...args):replace;});};
 if(p.kind==='testosterone')one(/<p\b[^>]*class=["'][^"']*\bth-eyebrow\b[^"']*["'][^>]*>[\s\S]*?<\/p>\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*<p\b[^>]*class=["'][^"']*\bth-lead\b[^"']*["'][^>]*>[\s\S]*?<\/p>\s*<p\b[^>]*class=["'][^"']*\bth-intro\b[^"']*["'][^>]*>[\s\S]*?<\/p>/gi,hero);
 else if(p.kind==='product')one(/<section\b[^>]*class=["'][^"']*\bproductHero\b[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi,(_,inside)=>{
  const figures=[...inside.matchAll(/<figure\b[\s\S]*?<\/figure>/gi)];if(figures.length!==1)throw Error('Product photograph boundary changed');
  const context=inside.replace(figures[0][0],'').replace(/<h1\b([^>]*)>/i,'<h2$1>').replace(/<\/h1>/i,'</h2>');
  return hero+'<section class="productHero shh-original-context">'+context+'</section>';
 });
 else if(p.kind==='mental')one(/<section\b[^>]*class=["'][^"']*\bft-hero\b[^"']*["'][^>]*>[\s\S]*?<\/section>/gi,hero);
 else if(p.kind==='supplements')one(/<section\b[^>]*class=["'][^"']*\bnutrition-poster\b[^"']*["'][^>]*>[\s\S]*?<\/section>/gi,hero);
 else if(p.kind==='bloods'){
  one(/<div\b[^>]*class=["'][^"']*\bhero-grid\b[^"']*["'][^>]*>/gi,match=>hero+match);
  one(/(<section\b[^>]*class=["'][^"']*\bhero-copy\b[^"']*["'][^>]*>)\s*<span\b[^>]*class=["'][^"']*\beyebrow\b[^"']*["'][^>]*>[\s\S]*?<\/span>\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*<p\b[^>]*>[\s\S]*?<\/p>/gi,(_,opening)=>opening);
 }
 if(!count)throw Error('Unknown hero type');
 return {html:out,changed:true};
}
