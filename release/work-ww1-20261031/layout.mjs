export const release='work-ww1-20261031';
export const assetBase='/work-with-us/assets/ww1-20261031/';
export const ownAssets=[];
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
export function invariantHTML(html){return html.replace(/<style id="work-ww1-20261031">[\s\S]*?<\/style>/g,'').replace(/ data-work-ww1="work-ww1-20261031"/g,'');}
export function transformHTML(input,css){
 const html=invariantHTML(input);
 for(const needle of ['nhh-title-work-with-us','class="ww-stats"','class="ww-route-grid"','id="opportunity"','class="ww-final"','</head>'])if(!html.includes(needle))throw new Error('Work With Us structure changed; inspect before applying WW1: '+needle);
 if(!mainHTML(html))throw new Error('Work With Us main missing');
 return html.replace(/<main\b/,'<main data-work-ww1="'+release+'"').replace('</head>','<style id="'+release+'">'+css+'</style></head>');
}
