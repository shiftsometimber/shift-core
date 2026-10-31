export const release='hair-hl1-20261031';
export const assetBase='/shift-health/hair-loss/assets/hl1-20261031/';
export const ownAssets=[];
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
export function invariantHTML(html){return html.replace(/<style id="hair-hl1-20261031">[\s\S]*?<\/style>/g,'').replace(/ data-hair-hl1="hair-hl1-20261031"/g,'');}
export function transformHTML(input,css){
 const html=invariantHTML(input);
 for(const needle of ['data-shift-approved-hero="hair"','id="understand"','id="included"','id="decide"','id="evidence"','id="process"','id="questions"','No stock available today','</head>'])if(!html.includes(needle))throw new Error('Hair-loss structure changed; inspect before HL1: '+needle);
 if(!mainHTML(html))throw new Error('Hair-loss main missing');
 return html.replace(/<main\b/,'<main data-hair-hl1="'+release+'"').replace('</head>','<style id="'+release+'">'+css+'</style></head>');
}
