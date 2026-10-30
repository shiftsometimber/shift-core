export const release='health-cards-approved-20261029-r5';
export const cards=[
 {key:'bloods',label:'Bloods',title:'A clearer picture.',eyebrow:'SHIFT HEALTH · BLOODS',copy:'Explore blood tests, what they can tell you and what happens next.',cta:'Explore blood tests',alt:'An ordinary man at home, with two sealed sample tubes in the foreground.'},
 {key:'energy',label:'Energy & testosterone',title:'Energy & testosterone.',copy:'Understand changes in energy, strength and sex drive. Explore testing and assessment.',cta:'Explore the guide',alt:'A man with his padel racket beside the court.'},
 {key:'fertility',label:'Fertility',title:'Fertility.',copy:'Understand male fertility, what tests can tell you and when to seek advice.',cta:'Explore fertility',alt:'A couple walking their dog together in an autumn park.'},
 {key:'hair',label:'Hair & skin',title:'Hair & skin.',copy:'Understand hair loss and skin concerns, with clear information on your next steps.',cta:'Explore hair & skin',alt:'A man chatting with his barber during a haircut.'},
 {key:'heart',label:'Heart health',title:'Heart health.',copy:'Explore blood pressure, cholesterol and practical information for your next step.',cta:'Explore heart health',alt:'A man taking a break beside a planter in his garden.'},
 {key:'mental',label:'Mental wellbeing',title:'Mental wellbeing.',copy:'Find practical support, ways to talk and clear routes to further help.',cta:'Find support',alt:'Matt relaxing in his conservatory with his copper Cavapoo, Millie.'},
 {key:'sleep',label:'Sleep',title:'Sleep.',copy:'Explore snoring, poor sleep and the route to a proper assessment.',cta:'Explore sleep',alt:'A dad watching children play football from the touchline in warm evening light.'},
 {key:'nutrition',label:'Supplements & Nutrition',title:'Supplements & nutrition.',copy:'Explore protein, vitamins and everyday nutrition. Find what fits your routine.',cta:'Explore nutrition',alt:'A man holding a shaker while relaxing on a gym bench after his session.'},
 {key:'testing',label:'Testing & Wellbeing',title:'Testing & wellbeing.',copy:'Explore home tests, what they can tell you and what happens next.',cta:'Explore testing',alt:'A couple looking through the instructions for a home test together.'},
 {key:'weight',label:'Weight loss',title:'Weight loss.',copy:'Explore weight-management options and find free support through My Timber.',cta:'Explore weight loss',alt:'An ordinary man walking beside a northern canal in warm morning light.'}
];
export const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&#38;','&').replaceAll('&nbsp;',' ').trim();
export function extractLinks(html){
 const grids=[...html.matchAll(/<nav\b[^>]*class=["'][^"']*\bsst-health-grid\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi)];
 if(grids.length!==1)throw Error('Expected one live Health category grid');
 const own=grids[0][0].includes('data-health-card-release="health-cards-approved-20261029');
 const links=[...grids[0][0].matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((m,i)=>({href:m[1].match(/\bhref=["']([^"']+)["']/i)?.[1],label:own&&m[2].includes('id="shc-title-'+cards[i]?.key+'"')?cards[i].label:decode((m[2].match(/<span[^>]*>([^<>]*)<\/span>\s*$/i)||[])[1]||'')}));
 if(![9,10].includes(links.length))throw Error('Expected nine existing categories or the approved ten-card layout');
 for(let i=0;i<links.length;i++)if(links[i].label.toLowerCase()!==cards[i].label.toLowerCase()||!links[i].href?.startsWith('/')||links[i].href.startsWith('//'))throw Error('Unexpected category destination or order: '+links[i].label);
 return{grid:grids[0][0],links};
}
export const css=`
#main-content #shift-health-range .sst-health-grid.shc-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px!important;margin:26px 0!important;padding:0!important}
#main-content #shift-health-range .shc-grid .shc-card{display:flex!important;flex-direction:row!important;justify-content:flex-start!important;align-items:center!important;position:relative!important;isolation:isolate!important;overflow:hidden!important;box-sizing:border-box!important;min-height:370px!important;margin:0!important;padding:26px!important;background:#050505!important;border:1px solid #353a30!important;border-radius:14px!important;text-align:left!important;text-decoration:none!important;color:#E7E3DA!important;box-shadow:none!important;transform:none!important}
#main-content #shift-health-range .shc-grid .shc-card:last-child:nth-child(odd){grid-column:1/-1!important;width:calc(50% - 9px)!important;justify-self:center!important}
#main-content #shift-health-range .shc-grid .shc-photo{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;object-position:center!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;z-index:-2!important}
#main-content #shift-health-range .shc-grid .shc-card:before{content:''!important;position:absolute!important;inset:0!important;background:linear-gradient(90deg,rgba(5,5,5,.88) 0%,rgba(5,5,5,.66) 34%,rgba(5,5,5,.10) 74%,transparent 100%)!important;z-index:-1!important;pointer-events:none!important}
#main-content #shift-health-range .shc-grid .shc-copy{display:block!important;position:relative!important;flex:none!important;z-index:1!important;width:64%!important;max-width:340px!important;margin:0!important;padding:0!important}
#main-content #shift-health-range .shc-grid .shc-eyebrow{display:block!important;font:700 11px/1.4 Arial,Helvetica,sans-serif!important;letter-spacing:.17em!important;color:#c5ceaf!important;margin:0 0 12px!important;padding:0!important}
#main-content #shift-health-range .shc-grid .shc-title{font:700 clamp(28px,2.6vw,40px)/1.04 Arial,Helvetica,sans-serif!important;letter-spacing:-.035em!important;color:#E7E3DA!important;max-width:13ch!important;margin:0 0 15px!important;padding:0!important;text-wrap:balance!important}
#main-content #shift-health-range .shc-grid .shc-description{font:400 16px/1.45 Arial,Helvetica,sans-serif!important;letter-spacing:normal!important;color:#E7E3DA!important;max-width:27ch!important;margin:0 0 20px!important;padding:0!important}
#main-content #shift-health-range .shc-grid .shc-cta{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:12px!important;min-height:44px!important;padding:11px 17px!important;margin:0!important;border-radius:30px!important;background:#707762!important;color:#050505!important;font:700 14px/1.2 Arial,Helvetica,sans-serif!important;letter-spacing:normal!important}
#main-content #shift-health-range .shc-grid .shc-card:hover{border-color:#a7af94!important}
#main-content #shift-health-range .shc-grid .shc-card:focus-visible{outline:3px solid #E7E3DA!important;outline-offset:4px!important}
@media(max-width:820px){#main-content #shift-health-range .sst-health-grid.shc-grid{grid-template-columns:1fr!important;gap:16px!important}#main-content #shift-health-range .shc-grid .shc-card{min-height:350px!important;padding:24px!important}#main-content #shift-health-range .shc-grid .shc-card:last-child:nth-child(odd){grid-column:auto!important;width:100%!important}#main-content #shift-health-range .shc-grid .shc-copy{width:64%!important}#main-content #shift-health-range .shc-grid .shc-title{font-size:32px!important}#main-content #shift-health-range .shc-grid .shc-photo{object-position:64% center!important}}
@media(max-width:360px){#main-content #shift-health-range .shc-grid .shc-card{padding:20px!important;min-height:370px!important}#main-content #shift-health-range .shc-grid .shc-copy{width:72%!important}#main-content #shift-health-range .shc-grid .shc-title{font-size:29px!important}#main-content #shift-health-range .shc-grid .shc-description{font-size:15px!important}#main-content #shift-health-range .shc-grid .shc-cta{font-size:13px!important;padding:11px 13px!important}}
#main-content #shift-health-range .shh-hero{display:block!important;margin:0!important;padding:0!important;border:0!important}
#main-content #shift-health-range .shh-hero .sst-health-hero-copy{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}
#main-content #shift-health-range .shh-hero .sst-overline{display:block!important;margin:0 0 18px!important;color:#aeb79d!important;font:700 12px/1.4 Arial,Helvetica,sans-serif!important;letter-spacing:.18em!important}
#main-content #shift-health-range .shh-hero h1{max-width:none!important;font:800 clamp(42px,6vw,76px)/1 Arial,Helvetica,sans-serif!important;letter-spacing:-.045em!important;color:#E7E3DA!important;margin:0 0 24px!important;padding:0!important}
#main-content #shift-health-range .shh-hero .sst-health-hero-copy>p{max-width:1050px!important;font:400 20px/1.55 Arial,Helvetica,sans-serif!important;color:#E7E3DA!important;margin:0 0 28px!important;padding:0!important}
#main-content #shift-health-range .shh-hero .sst-health-hero-photo{display:block!important;width:100%!important;max-width:none!important;overflow:hidden!important;border-radius:0!important;border:0!important;margin:0!important;padding:0!important}
#main-content #shift-health-range .shh-hero .sst-health-hero-photo img{display:block!important;position:static!important;width:100%!important;height:auto!important;max-height:none!important;aspect-ratio:1610/977!important;object-fit:contain!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important}
#main-content #shift-health-range .shh-hero figcaption{display:block!important;margin:0!important;padding:14px 20px!important;background:#707762!important;color:#050505!important;font:700 17px/1.4 Arial,Helvetica,sans-serif!important}
#main-content #shift-health-range .shh-chooser{display:block!important;margin:32px 0 0!important;padding:0!important;border:0!important}
#main-content #shift-health-range .shh-chooser h2{font:700 clamp(30px,3vw,38px)/1.1 Arial,Helvetica,sans-serif!important;letter-spacing:-.035em!important;color:#E7E3DA!important;margin:0 0 10px!important;padding:0!important}
#main-content #shift-health-range .shh-chooser p{font:400 16px/1.5 Arial,Helvetica,sans-serif!important;color:#c5c2ba!important;margin:0!important;padding:0!important}
#main-content #shift-health-range .sst-features>article:only-child{grid-column:1/-1!important}
@media(max-width:820px){#main-content #shift-health-range .shh-hero h1{font-size:clamp(38px,10.8vw,60px)!important;margin-bottom:20px!important}#main-content #shift-health-range .shh-hero .sst-health-hero-copy>p{font-size:16px!important;margin-bottom:24px!important}#main-content #shift-health-range .shh-hero figcaption{font-size:14px!important;padding:12px 14px!important}#main-content #shift-health-range .shh-chooser{margin-top:28px!important}}
`;
export const desktopCss=`
@media(min-width:821px){
#main-content #shift-health-range .shh-hero{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr)!important;align-items:center!important;gap:32px!important}
#main-content #shift-health-range .shh-hero h1{font-size:clamp(40px,4.2vw,60px)!important;margin-bottom:20px!important}
#main-content #shift-health-range .shh-hero .sst-health-hero-copy>p{font-size:18px!important;line-height:1.5!important;margin-bottom:0!important}
}
`;
export const r5Css=`
#main-content #shift-health-range .shh-hero.shr-hero{display:flex!important;position:relative!important;isolation:isolate!important;overflow:hidden!important;box-sizing:border-box!important;align-items:center!important;min-height:400px!important;padding:36px!important;gap:0!important;border:1px solid #353a30!important;border-radius:14px!important;background:#050505!important}
#main-content #shift-health-range .shr-hero::before{content:''!important;position:absolute!important;inset:0!important;z-index:-1!important;pointer-events:none!important;background:linear-gradient(90deg,rgba(5,5,5,.22),rgba(5,5,5,.12) 45%,transparent 70%)!important}
#main-content #shift-health-range .shr-hero .sst-health-hero-copy{position:relative!important;z-index:1!important;width:48%!important;max-width:520px!important;min-width:0!important;border:0!important;padding:0!important;margin:0!important}
#main-content #shift-health-range .shr-hero .sst-overline{margin-bottom:16px!important}
#main-content #shift-health-range .shr-hero h1{font-size:clamp(38px,4.2vw,56px)!important;margin-bottom:20px!important}
#main-content #shift-health-range .shr-hero .sst-health-hero-copy>p{font-size:18px!important;line-height:1.5!important;margin:0!important}
#main-content #shift-health-range .shr-hero .sst-health-hero-photo{position:absolute!important;inset:0!important;z-index:-2!important;width:100%!important;height:100%!important;margin:0!important;border:0!important;border-radius:0!important}
#main-content #shift-health-range .shr-hero .sst-health-hero-photo img{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;max-height:none!important;aspect-ratio:auto!important;object-fit:cover!important;object-position:right top!important}
@media(max-width:820px){
#main-content #shift-health-range .shh-hero.shr-hero{display:block!important;min-height:0!important;padding:210px 22px 24px!important}
#main-content #shift-health-range .shr-hero .sst-health-hero-photo{height:250px!important;bottom:auto!important}
#main-content #shift-health-range .shr-hero::before{background:linear-gradient(180deg,transparent 0,transparent 120px,#050505 245px)!important}
#main-content #shift-health-range .shr-hero .sst-health-hero-copy{width:100%!important;max-width:none!important}
#main-content #shift-health-range .shr-hero h1{font-size:clamp(34px,10vw,42px)!important;margin-bottom:18px!important}
#main-content #shift-health-range .shr-hero .sst-health-hero-copy>p{font-size:16px!important;line-height:1.5!important}
}
`;
export const bottomCss=`
#main-content #shift-health-range .sst-linkline.shh-useful{display:block!important;margin:30px 0 0!important;padding:0!important;border:0!important}
#main-content #shift-health-range .shh-useful h2{font:700 30px/1.15 Arial,Helvetica,sans-serif!important;letter-spacing:-.03em!important;color:#E7E3DA!important;margin:0 0 18px!important;padding:0!important}
#main-content #shift-health-range .shh-useful .sst-actions{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;margin:0!important;padding:0!important}
#main-content #shift-health-range .shh-useful .sst-action{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;width:100%!important;min-width:0!important;min-height:80px!important;box-sizing:border-box!important;margin:0!important;padding:20px 18px!important;border:1px solid #353a30!important;border-radius:14px!important;background:#050505!important;color:#E7E3DA!important;font:700 17px/1.35 Arial,Helvetica,sans-serif!important;text-align:left!important;text-decoration:none!important;white-space:normal!important;box-shadow:none!important;transform:none!important}
#main-content #shift-health-range .shh-useful .sst-action:hover{border-color:#707762!important}
#main-content #shift-health-range .shh-bottom-label{display:block!important;min-width:0!important}
#main-content #shift-health-range .shh-line-arrow{display:block!important;flex:0 0 20px!important;width:20px!important;height:20px!important;max-width:none!important;margin:0!important;pointer-events:none!important}
#main-content #shift-health-range .sst-free.shh-free{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:28px!important;margin:28px 0 0!important;padding:30px!important;border:0!important;border-radius:16px!important;background:#E7E3DA!important;color:#050505!important}
#main-content #shift-health-range .shh-free>div{min-width:0!important;max-width:720px!important}
#main-content #shift-health-range .shh-free .sst-overline{display:block!important;margin:0 0 12px!important;padding:0!important;color:#050505!important;font:700 11px/1.4 Arial,Helvetica,sans-serif!important;letter-spacing:.17em!important}
#main-content #shift-health-range .shh-free h2{font:700 clamp(28px,3vw,36px)/1.1 Arial,Helvetica,sans-serif!important;letter-spacing:-.035em!important;margin:0!important;padding:0!important;color:#050505!important}
#main-content #shift-health-range .shh-free p{font:400 16px/1.55 Arial,Helvetica,sans-serif!important;max-width:64ch!important;margin:14px 0 0!important;padding:0!important;color:#050505!important}
#main-content #shift-health-range .shh-free>.sst-action{display:inline-flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;min-height:48px!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin:0!important;padding:14px 20px!important;border:1px solid #050505!important;border-radius:28px!important;background:#050505!important;color:#E7E3DA!important;font:700 15px/1.35 Arial,Helvetica,sans-serif!important;text-decoration:none!important;white-space:normal!important;box-shadow:none!important;transform:none!important}
#main-content #shift-health-range .shh-useful a:focus-visible{outline:3px solid #E7E3DA!important;outline-offset:4px!important}
#main-content #shift-health-range .shh-free a:focus-visible{outline:3px solid #050505!important;outline-offset:4px!important}
@media(max-width:820px){#main-content #shift-health-range .shh-useful h2{font-size:26px!important}#main-content #shift-health-range .shh-useful .sst-actions{grid-template-columns:1fr!important;gap:10px!important}#main-content #shift-health-range .shh-useful .sst-action{min-height:66px!important;padding:18px!important}#main-content #shift-health-range .sst-free.shh-free{grid-template-columns:1fr!important;gap:22px!important;padding:24px!important}#main-content #shift-health-range .shh-free>.sst-action{width:100%!important}}
`;
export const introduction='SHIFT Health brings together clear information and carefully selected solutions for men’s health. From weight management and health tests to sleep, energy, heart health and wellbeing, explore your options and find the support that’s right for you.';
export const photoAssets=[...cards.map(c=>({key:c.key,file:c.key+'.webp',url:'/shift-health/assets/cards-20261029/'+c.key+'.webp'})),{key:'header-h6',file:'header-h6.webp',url:'/shift-health/assets/cards-20261029/header-h6.webp'},{key:'header-r5',file:'header-r5.webp',url:'/shift-health/assets/cards-20261029/header-r5.webp'}];
const heroPattern=/<section\b[^>]*class=["'][^"']*\bsst-health-hero\b[^"']*["'][^>]*>[\s\S]*?<\/section>/gi;
const weightPattern=/<article\b[^>]*class=["'][^"']*\bsst-feature-weight-management\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi;
const chooserPattern=/<header class="shh-chooser"[^>]*>[\s\S]*?<\/header>/g;
const stylePattern=/<style data-health-card-styles="20261029">[\s\S]*?<\/style>/g;
const bottomStylePattern=/<style data-health-bottom-styles="20261029">[\s\S]*?<\/style>/g;
const desktopStylePattern=/<style data-health-desktop-styles="20261029">[\s\S]*?<\/style>/g;
const r5StylePattern=/<style data-health-r5-styles="20261030">[\s\S]*?<\/style>/g;
export const outsideR5Scope=html=>html.replace(heroPattern,'__APPROVED_HERO__').replace(r5StylePattern,'').replace(/data-health-card-release="[^"]+"/,'data-health-card-release="VERSION"');
const usefulPattern=/<section\b[^>]*class=["'][^"']*\bsst-linkline\b[^"']*["'][^>]*>[\s\S]*?<\/section>/g;
const freePattern=/<section\b[^>]*class=["'][^"']*\bsst-free\b[^"']*["'][^>]*>[\s\S]*?<\/section>/g;
const lineArrow='<svg class="shh-line-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const categorySchemaId='https://shiftsometimber.co.uk/shift-health#health-categories';
function removeCategorySchema(html){return html.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,(tag,body)=>{try{return JSON.parse(body)['@id']===categorySchemaId?'':tag;}catch{return tag;}});}
const duplicateFeatures=[
 {pattern:/<article\b[^>]*class=["'][^"']*\bsst-feature-bloods\b[^"']*["'][^>]*>[\s\S]*?<\/article>/g,title:'Understand your health with SHIFT Bloods'},
 {pattern:/<article\b[^>]*class=["'][^"']*\bsst-feature-testosterone\b[^"']*["'][^>]*>[\s\S]*?<\/article>/g,title:'Testosterone: start with understanding'},
 {pattern:/<article\b[^>]*class=["'][^"']*\bsst-feature-nutrition\b[^"']*["'][^>]*>[\s\S]*?<\/article>/g,title:'Supplements & Nutrition.'},
 {pattern:/<section\b[^>]*class=["'][^"']*\bnft-hub\b[^"']*["'][^>]*>[\s\S]*?<\/section>/g,title:'A little less guesswork.'}
];
export function removeDuplicateFeatures(html){
 let out=html;
 for(const {pattern,title} of duplicateFeatures){
  const matches=[...out.matchAll(pattern)];
  if(matches.length>1)throw Error('Ambiguous duplicate Health feature: '+title);
  if(matches.length){
   const heading=matches[0][0].match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1];
   if(!heading||decode(heading.replace(/<[^>]*>/g,'')).replace(/\s+/g,' ')!==title)throw Error('Unexpected content in the duplicate Health feature: '+title);
   out=out.replace(matches[0][0],'');
  }
 }
 return out.replace(/<div\b[^>]*class=["'][^"']*\bsst-features\b[^"']*["'][^>]*>\s*<\/div>/g,'');
}
function polishClosingSections(html){
 const specs=[{pattern:usefulPattern,className:'shh-useful',links:new Map([['/shift-health/health-mot','Explore the Health MOT'],['/shift-health/shift-measure','Track your measurements'],['/shift-health/stop-smoking','Stopping smoking']])},{pattern:freePattern,className:'shh-free',links:new Map([['/member/dashboard','Explore free My Timber']])}];
 let out=html;
 for(const {pattern,className,links} of specs){
  const matches=[...out.matchAll(pattern)];if(matches.length!==1)throw Error('Expected exactly one closing Health section: '+className);
  const original=matches[0][0];let count=0;
  let block=original.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/g,(_,attrs,body)=>{
   const href=attrs.match(/\bhref="([^"]+)"/)?.[1];
   const label=decode(body.replace(/<[^>]*>/g,'')).replace(/&#(?:x(?:2197|fe0e|fe0f)|8599|65038|65039);/gi,'').replace(/[\u2197\uFE0E\uFE0F]/g,'').replace(/\s+/g,' ').trim();
   if(links.get(href)!==label)throw Error('Unexpected closing Health link: '+label);
   count++;return '<a'+attrs+'><span class="shh-bottom-label">'+esc(label)+'</span>'+lineArrow+'</a>';
  });
  if(count!==links.size)throw Error('Closing Health link count changed');
  block=block.replace(/^<section\b[^>]*>/,tag=>tag.replace(/\bclass="([^"]*)"/,(_,classes)=>'class="'+(classes.split(/\s+/).includes(className)?classes:classes+' '+className)+'"'));
  out=out.replace(original,()=>block);
 }
 return out;
}
export function outsideApprovedScope(html){
 return removeDuplicateFeatures(removeCategorySchema(html).replace(stylePattern,'').replace(bottomStylePattern,'').replace(desktopStylePattern,'').replace(r5StylePattern,'').replace(heroPattern,'__APPROVED_HEADER__').replace(chooserPattern,'').replace(/<nav\b[^>]*class=["'][^"']*\bsst-health-grid\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi,'__APPROVED_GRID__').replace(weightPattern,'').replace(usefulPattern,'__USEFUL_LINKS__').replace(freePattern,'__MY_TIMBER__'));
}
export function approvedLinks(html){
 const {links}=extractLinks(html);
 if(links.length===10)return links;
 const weights=[...html.matchAll(weightPattern)];
 if(weights.length!==1)throw Error('Expected the existing weight-management feature to migrate');
 const href=weights[0][0].match(/\bhref="([^"]+)"/)?.[1];
 if(!href?.startsWith('/')||href.startsWith('//'))throw Error('Existing weight-management destination missing');
 return [...links,{label:cards[9].label,href}];
}
export function transformHTML(html){
 const {grid}=extractLinks(html),links=approvedLinks(html);
 const heroes=[...html.matchAll(heroPattern)];if(heroes.length!==1)throw Error('Expected exactly one existing Health introduction');
 const hero='<section class="sst-health-hero shh-hero shr-hero" data-health-header-release="R5"><div class="sst-health-hero-copy"><span class="sst-overline">SHIFT HEALTH</span><h1>Men’s health.<br>Made clearer.</h1><p>'+esc(introduction)+'</p></div><figure class="sst-health-hero-photo"><img src="/shift-health/assets/cards-20261029/header-r5.webp" fetchpriority="high" alt="A dad and his teenage son preparing dinner together in a home kitchen." width="2016" height="780"></figure></section>';
 const chooser='<header class="shh-chooser"><h2>What would you like to sort?</h2><p>Choose a starting point.</p></header>';
 const newGrid='<nav class="sst-health-grid shc-grid" aria-label="Explore your health" data-health-card-release="'+release+'">'+cards.map((c,i)=>'<a class="shc-card" href="'+esc(decode(links[i].href))+'" aria-labelledby="shc-label-'+c.key+' shc-title-'+c.key+'"><img class="shc-photo" src="/shift-health/assets/cards-20261029/'+c.key+'.webp" alt="'+esc(c.alt)+'" width="1586" height="992" loading="lazy" decoding="async"><div class="shc-copy"><p class="shc-eyebrow" id="shc-label-'+c.key+'">'+esc(c.eyebrow||'SHIFT HEALTH')+'</p><h2 class="shc-title" id="shc-title-'+c.key+'">'+esc(c.title)+'</h2><p class="shc-description">'+esc(c.copy)+'</p><span class="shc-cta">'+esc(c.cta)+' <span aria-hidden="true">→</span></span></div></a>').join('')+'</nav>';
 const schema={'@context':'https://schema.org','@type':'ItemList','@id':categorySchemaId,name:'SHIFT Health categories',itemListElement:cards.map((c,i)=>({'@type':'ListItem',position:i+1,name:c.label,url:'https://shiftsometimber.co.uk'+decode(links[i].href)}))};
 const out=polishClosingSections(removeDuplicateFeatures(removeCategorySchema(html).replace(stylePattern,'').replace(bottomStylePattern,'').replace(desktopStylePattern,'').replace(r5StylePattern,'').replace(chooserPattern,'').replace(heroes[0][0],()=>hero).replace(grid,()=>chooser+newGrid).replace(weightPattern,'').replace('</head>','<style data-health-card-styles="20261029">'+css+'</style><style data-health-bottom-styles="20261029">'+bottomCss+'</style><style data-health-desktop-styles="20261029">'+desktopCss+'</style><style data-health-r5-styles="20261030">'+r5Css+'</style><script type="application/ld+json">'+JSON.stringify(schema).replaceAll('<','\\u003c')+'</script></head>')));
 if(outsideApprovedScope(out)!==outsideApprovedScope(html))throw Error('The change extends beyond the approved Health header, grid and removal of duplicate features');
 return out;
}
