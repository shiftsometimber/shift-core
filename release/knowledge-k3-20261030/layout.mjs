export const release='knowledge-k3-20261030';
export const assetBase='/knowledge/assets/k3-20261030/';
export const ownAssets=['hero','bloods','results','sleep'];
const health=key=>'/shift-health/assets/cards-20261029/'+key+'.webp';
const ask=key=>'/ask-timber/assets/a4-20261030/'+key+'.webp';
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0];
export const articleBlocks=html=>[...mainHTML(html).matchAll(/<article\b[^>]*\bdata-kh-card(?:=["'][^"']*["'])?[^>]*>[\s\S]*?<\/article>/gi)].map(x=>x[0]);
export function element(html,tag,needle){
 const at=html.indexOf(needle);if(at<0)throw Error('Current Knowledge element missing '+needle);const start=html.lastIndexOf('<'+tag,at);if(start<0)throw Error('Opening element missing '+tag);
 const re=new RegExp('<\\/?'+tag+'\\b[^>]*>','gi');re.lastIndex=start;let depth=0,m;
 while((m=re.exec(html))){depth+=m[0].startsWith('</')?-1:1;if(depth===0)return html.slice(start,re.lastIndex);}
 throw Error('Unclosed '+tag);
}
export const styleTag=css=>'<style data-knowledge-k3-style="'+release+'">'+css+'</style>';
export function photoFor(article,index){
 const topic=article.match(/data-kh-topic=["']([^"']+)["']/)?.[1],title=(article.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1]||'').replace(/<[^>]*>/g,' ').toLowerCase();
 if(topic==='bloods')return assetBase+(/results|thyroid|vitamin/.test(title)?'results':'bloods')+'.webp';
 if(topic==='fertility')return /head|relationship/.test(title)?health('mental'):health('fertility');
 if(topic==='testing')return /invalid|reliab|prepar/.test(title)?assetBase+'results.webp':health('testing');
 if(topic==='sleep')return /driving|work|tracker/.test(title)?health('sleep'):assetBase+'sleep.webp';
 if(topic==='supplements')return /protein|hydration|food|actually/.test(title)?ask('food'):health('nutrition');
 if(topic==='testosterone')return /blood|test/.test(title)?assetBase+'bloods.webp':health('energy');
 const category=article.match(/<small\b[^>]*>([^<]*)<\/small>/i)?.[1]?.toLowerCase();
 if(/sleep|snoring/.test(title))return assetBase+'sleep.webp';
 if(/blood|cholesterol|diabetes|prediabetes/.test(title))return assetBase+'bloods.webp';
 if(category==='nutrition'||/protein|meal|takeaway|barbecue|bbq/.test(title))return ask('food');
 if(category==='fitness'||/walking|football|exercise|strength/.test(title))return index%2?ask('movement'):health('energy');
 if(category==='mind'||/stress|confidence|mental|motivation/.test(title))return index%2?health('mental'):ask('wellbeing');
 if(category==='health')return health('heart');
 return index%2?health('weight'):ask('movement');
}
export function stripCardPresentation(raw){
 if(!raw.includes('<div class="k3-row-copy">'))return raw;
 return raw.replace(/<img class="k3-guide-photo"[^>]*>/,'').replace('<div class="k3-row-copy">','').replace(/<\/div><\/article>$/,'</article>');
}
export function transformHTML(html,css){
 const main=mainHTML(html);if(!main?.includes('data-shift-knowledge')||!main.includes('data-kh-search'))throw Error('Unrecognised Knowledge hub; preserve current page');
 if(main.includes('data-knowledge-k3="'+release+'"')){
  const old=html.match(/<style data-knowledge-k3-style="[^"]*">[\s\S]*?<\/style>/)?.[0];if(!old)throw Error('Owned K3 style missing');return html.replace(old,()=>styleTag(css));
 }
 const hero=element(main,'header','class="kh-hero"'),nav=element(hero,'nav','aria-label="Knowledge topics"'),filter=element(main,'div','class="kh-filter"');
 const opening=hero.match(/^<header\b[^>]*>/)[0];
 const copy=hero.slice(opening.length,-'</header>'.length).replace(nav,'');
 const nextHero=opening+'<div class="k3-hero-copy">'+copy+'</div><img class="k3-hero-photo" src="'+assetBase+'hero.webp" alt="A man browsing SHIFT Knowledge on an iPad in a library, viewed over his shoulder." width="2400" height="1000" fetchpriority="high"></header>';
 let changed=main.replace(/^<main\b/,'<main data-knowledge-k3="'+release+'"').replace(hero,()=>nextHero).replace(filter,()=>filter+nav);
 let index=0;changed=changed.replace(/<article\b[^>]*\bdata-kh-card(?:=["'][^"']*["'])?[^>]*>[\s\S]*?<\/article>/gi,raw=>{
  const photo=photoFor(raw,index++),open=raw.match(/^<article\b[^>]*>/)[0],inner=raw.slice(open.length,-'</article>'.length);
  return open+'<img class="k3-guide-photo" src="'+photo+'" alt="" width="960" height="640" loading="lazy" decoding="async"><div class="k3-row-copy">'+inner+'</div></article>';
 });
 if(index<50)throw Error('Current complete guide collection was not recognised');
 return html.replace(main,()=>changed).replace(/<\/head>/i,()=>styleTag(css)+'</head>');
}
export const outsideMain=html=>html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/i,'<main>APPROVED K3</main>').replace(/<style data-knowledge-k3-style="[^"]*">[\s\S]*?<\/style>/g,'');
export function mainInvariant(html){
 let main=mainHTML(html).replace(/ data-knowledge-k3="[^"]*"/,'');
 main=main.replace(element(main,'header','class="kh-hero"'),'<K3_HERO>');
 main=main.replace(element(main,'div','class="kh-filter"'),'<K3_FILTER>');
 if(main.includes('aria-label="Knowledge topics"'))main=main.replace(element(main,'nav','aria-label="Knowledge topics"'),'');
 return main.replace(/<article\b[^>]*>[\s\S]*?<\/article>/gi,stripCardPresentation);
}
