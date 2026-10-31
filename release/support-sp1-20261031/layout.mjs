export const release='support-sp1-20261031';
export const assetBase='/weight-loss-support-for-men/assets/sp1-20261031/';
export const ownAssets=[];
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
export function invariantHTML(html){return html.replace(/<style id="support-sp1-20261031">[\s\S]*?<\/style>/g,'').replace(/ data-support-sp1="support-sp1-20261031"/g,'').replace(/<div data-support-sp1-topic="\d+">/g,'').replace(/<\/div><!--support-sp1-topic-->/g,'');}
export function transformHTML(input,css){
 let html=invariantHTML(input);
 for(const needle of ['nhh-title-free-support','id="awareness-first-step"','class="spp-features"','class="spp-reading"','class="continuity-faq"','</head>'])if(!html.includes(needle))throw new Error('Free support structure changed; inspect before applying SP1: '+needle);
 if(!mainHTML(html))throw new Error('Free support main missing');
 let count=0;
 html=html.replace(/(<section\b[^>]*\bid="awareness-first-step"[^>]*>)([\s\S]*?)(<\/section>)/,(match,open,body,close)=>open+body.replace(/(<h3\b[\s\S]*?)(?=<h3\b|$)/g,topic=>'<div data-support-sp1-topic="'+(++count)+'">'+topic+'</div><!--support-sp1-topic-->')+close);
 if(count!==6)throw new Error('Expected six original practical topics; found '+count);
 return html.replace(/<main\b/,'<main data-support-sp1="'+release+'"').replace('</head>','<style id="'+release+'">'+css+'</style></head>');
}
