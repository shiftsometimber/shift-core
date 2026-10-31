export const release='comparison-cp1-20261031';
export const assetBase='/compare-weight-loss-treatments/assets/cp1-20261031/';
export const ownAssets=[];
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
export function invariantHTML(html){return html.replace(/<style id="comparison-cp1-20261031">[\s\S]*?<\/style>/g,'').replace(/ data-comparison-cp1="comparison-cp1-20261031"/g,'');}
export function transformHTML(input,css){
 const html=invariantHTML(input);
 for(const needle of ['nhh-title-treatment-comparison','id="mounjaro-vs-wegovy"','class="authority-facts"','class="authority-jumps"','id="frequently-asked-questions"','</head>'])if(!html.includes(needle))throw new Error('Comparison structure changed; inspect before applying CP1: '+needle);
 if(!mainHTML(html))throw new Error('Comparison main missing');
 return html.replace(/<main\b/,'<main data-comparison-cp1="'+release+'"').replace('</head>','<style id="'+release+'">'+css+'</style></head>');
}
