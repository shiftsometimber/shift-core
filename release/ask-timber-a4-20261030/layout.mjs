export const release='ask-timber-a4-20261030';
export const assetBase='/ask-timber/assets/a4-20261030/';
export const topics=['food','movement','weight','wellbeing'];
export const clientURL=assetBase+'prompts.js';
export const addClient=html=>html.includes('src="'+clientURL+'"')?html:html.replace(/<\/body>/i,()=>'<script defer src="'+clientURL+'"></script></body>');
export const guideImages=['energy','bloods','testing','fertility','sleep','nutrition'];
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0];
export const scripts=html=>[...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(m=>m[0]);
export function element(html,tag,needle){
 const start=html.indexOf(needle);if(start<0)throw Error('Missing approved element '+needle);
 const open=html.lastIndexOf('<'+tag,start);if(open<0)throw Error('Missing opening '+tag);
 const re=new RegExp('<\\/?'+tag+'\\b[^>]*>','gi');re.lastIndex=open;let depth=0,m;
 while((m=re.exec(html))){depth+=m[0].startsWith('</')?-1:1;if(depth===0)return html.slice(open,re.lastIndex);}
 throw Error('Unclosed '+tag);
}
export function transformHTML(html,css){
 if(html.includes('data-ask-a4="'+release+'"')){
  const style=html.match(/<style data-ask-a4-style="[^"]*">[\s\S]*?<\/style>/)?.[0];
  if(!style)throw Error('Current A4 stylesheet missing');
  return addClient(html.replace(style,()=>'<style data-ask-a4-style="'+release+'">'+css+'</style>'));
 }
 const main=mainHTML(html);if(!main?.includes('data-ask-guided-version="20261021"'))throw Error('Unrecognised current Ask Timber layout');
 let hero=element(main,'section','class="atg-hero"');
 let wider=element(main,'section','id="wider-health-topics"');
 let composer=element(main,'section','class="atg-composer"');
 let start=element(main,'section','class="atg-start"');
 const response=element(main,'section','id="timberResponse"');
 const boundary=main.match(/<p class="atg-boundary">[\s\S]*?<\/p>/)?.[0];
 const how=element(main,'div','class="atg-how"');
 const contact=how.match(/<a\b[^>]*href="[^"]*\/contact"[^>]*>[\s\S]*?<\/a>/)?.[0];
 const bottom=element(main,'div','class="atg-bottom"');
 if(!boundary||!contact)throw Error('Non-clinical boundary or human contact missing');
 hero=hero.replace(wider,'').replace(/<h1\b[^>]*>/,'<h1 id="atg-title">').replace('<br>',' ').replace(/<span>YOUR NEXT STEP STARTS HERE<\/span>/,'');
 const suggestions=element(composer,'div','id="atg-suggestions"');
 const form=element(composer,'form','id="timberForm"');
 composer=composer.replace(suggestions,'').replace(form,()=>form+suggestions);
 composer=composer.replace(/<\/section>$/,()=>'<div class="ata-boundary">'+boundary+contact+'</div></section>');
 const topicMarkup=element(start,'div','class="atg-topics"');
 let pictures=topicMarkup;
 for(const topic of topics){
  const button=element(pictures,'button','data-topic="'+topic+'"');
  const picture=button.replace(/<span class="atg-icon">[\s\S]*?<\/span>/,'').replace(/<span class="atg-card-arrow">[\s\S]*?<\/span>/,'').replace(/(<button\b[^>]*>)/,()=>button.match(/^<button\b[^>]*>/)[0]+'<img class="ata-topic-photo" src="'+assetBase+topic+'.webp" alt="" width="900" height="600" loading="lazy" decoding="async">');
  pictures=pictures.replace(button,()=>picture);
 }
 start='<section class="atg-start" aria-labelledby="atg-start-title"><div class="atg-section-head"><h2 id="atg-start-title">What could you use a hand with?</h2><span>Optional topic (helps tailor the answer)</span></div>'+pictures+'</section>';
 let index=0;
 wider=wider.replace(/(<button\b[^>]*class="kh-prompt"[^>]*>)/g,tag=>tag+'<img src="/shift-health/assets/cards-20261029/'+guideImages[index++]+'.webp" alt="" width="960" height="640" loading="lazy" decoding="async">');
 if(index!==6)throw Error('Preserve exactly six wider health prompt controls');
 const newMain='<main class="atg" id="main-content" data-ask-guided-version="20261021" data-ask-a4="'+release+'"><div class="atg-wrap">'+hero+composer+response+start+wider+bottom+'</div></main>';
 return addClient(html.replace(main,()=>newMain).replace(/<\/head>/i,()=>'<style data-ask-a4-style="'+release+'">'+css+'</style></head>'));
}
export const outsideScope=html=>html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/i,'<main>APPROVED ASK A4</main>').replace(/<style data-ask-a4-style="[^"]*">[\s\S]*?<\/style>/g,'').replace(/<script defer src="\/ask-timber\/assets\/a4-20261030\/prompts\.js"><\/script>/g,'');
