export const release='weight-mw1-20261031';
export const assetBase='/mens-weight-management/assets/mw1-20261031/';
export const ownAssets=[];
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
export function invariantHTML(html){return html.replace(/<style id="weight-mw1-20261031">[\s\S]*?<\/style>/g,'').replace(/ data-weight-mw1="weight-mw1-20261031"/g,'');}
export function transformHTML(input,css){
 const html=invariantHTML(input);
 for(const needle of ['nhh-title-weight-management','id="help-me-lose-weight-first-week"','id="shift-depth-weight-support"','id="build-your-next-useful-step"','class="authority-facts"','class="authority-jumps"','class="shift-topic-guides"','</head>'])if(!html.includes(needle))throw new Error('Weight-management structure changed; inspect before applying MW1: '+needle);
 if(!mainHTML(html))throw new Error('Weight-management main missing');
 return html.replace(/<main\b/,'<main data-weight-mw1="'+release+'"').replace('</head>','<style id="'+release+'">'+css+'</style></head>');
}
