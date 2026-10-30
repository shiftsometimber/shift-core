export const release='continuity-c1-20261030';
export const assetBase='/clinic-gone-quiet/assets/c1-20261030/';
export const ownAssets=[];
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
export function invariantHTML(html){return html.replace(/<style id="continuity-c1-20261030">[\s\S]*?<\/style>/g,'').replace(/ data-continuity-c1="continuity-c1-20261030"/g,'');}
export function transformHTML(input,css){
 const html=invariantHTML(input);
 if(!mainHTML(html)||!html.includes('nhh-title-continuity')||!html.includes('continuity-now-title')||!html.includes('class="qpp-needs"')||!html.includes('class="qpp-reading"')||!html.includes('</head>'))throw new Error('Continuity structure changed; inspect before applying C1');
 return html.replace(/<main\b/,'<main data-continuity-c1="'+release+'"').replace('</head>','<style id="'+release+'">'+css+'</style></head>');
}
