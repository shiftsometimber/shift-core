export const release='provider-p1-20261030';
export const assetBase='/provider-switch/assets/p1-20261030/';
export const ownAssets=[];
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
export function invariantHTML(html){return html.replace(/<style id="provider-p1-20261030">[\s\S]*?<\/style>/g,'').replace(/ data-provider-p1="provider-p1-20261030"/g,'');}
export function transformHTML(input,css){
 const html=invariantHTML(input);
 if(!mainHTML(html)||!html.includes('nhh-title-switching')||!html.includes('continuity-now-title')||!html.includes('class="psp-needs"')||!html.includes('class="psp-reading"')||!html.includes('</head>'))throw new Error('Continuity structure changed; inspect before applying P1');
 return html.replace(/<main\b/,'<main data-provider-p1="'+release+'"').replace('</head>','<style id="'+release+'">'+css+'</style></head>');
}
