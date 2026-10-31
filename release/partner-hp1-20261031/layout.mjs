export const release='partner-hp1-20261031';
export const assetBase='/husband-help/assets/hp1-20261031/';
export const ownAssets=[];
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
export function invariantHTML(html){return html.replace(/<style id="partner-hp1-20261031">[\s\S]*?<\/style>/g,'').replace(/ data-partner-hp1="partner-hp1-20261031"/g,'');}
export function transformHTML(input,css){
 const html=invariantHTML(input);
 for(const needle of ['nhh-title-partner-support','id="nhh-content-start"','class="hpp-reading"','data-share-my-timber','data-share-status','</head>'])if(!html.includes(needle))throw new Error('Partner support structure changed; inspect before applying HP1: '+needle);
 if(!mainHTML(html))throw new Error('Partner support main missing');
 return html.replace(/<main\b/,'<main data-partner-hp1="'+release+'"').replace('</head>','<style id="'+release+'">'+css+'</style></head>');
}
