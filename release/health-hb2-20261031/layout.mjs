export const release='health-hb2-20261031';
export const assetBase='/shift-health/assets/hb2-20261031/';
export const ownAssets=[];
export const pages=[{key:'sleep',path:'/shift-health/sleep-apnoea',hero:'data-shift-approved-hero="sleep"',image:'/shift-health/sleep-apnoea?shift_hero=20261029-approved-v1-sleep-5835af825682',faqs:2},{key:'confidence',path:'/shift-health/erectile-dysfunction',hero:'data-next-hero="confidence"',image:'/shift-health/hero-set-20261030/confidence.webp',faqs:2}];
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
export function invariantHTML(html){return html.replace(/<style id="health-hb2-20261031">[\s\S]*?<\/style>/g,'').replace(/ data-health-hb2="health-hb2-20261031"/g,'');}
export function transformHTML(input,css,path){
 const p=pages.find(p=>p.path===path);if(!p)throw new Error('Unexpected health page '+path);
 const html=invariantHTML(input);
 for(const needle of [p.hero,p.image,'No stock available today','id="understand"','id="questions"','</head>'])if(!html.includes(needle))throw new Error('Structure changed; inspect '+path+': '+needle);
 if(!mainHTML(html))throw new Error('Main missing '+path);
 return html.replace(/<main\b/,'<main data-health-hb2="'+release+'"').replace('</head>','<style id="'+release+'">'+css+'</style></head>');
}
