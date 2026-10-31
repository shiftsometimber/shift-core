export const release='health-hb1-20261031';
export const assetBase='/shift-health/assets/hb1-20261031/';
export const ownAssets=[];
export const pages=[{key:'pressure',path:'/shift-health/blood-pressure-monitor',hero:'pressure',image:'/shift-health/blood-pressure-monitor?shift_hero=20261029-approved-v1-pressure-2f28da96a967',faqs:2},{key:'testosterone',path:'/shift-health/testosterone-energy',hero:'testosterone',image:'/shift-health/testosterone-energy?shift_hero=20261029-approved-v1-testosterone-1eea86432b85',faqs:5}];
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
export function invariantHTML(html){return html.replace(/<style id="health-hb1-20261031">[\s\S]*?<\/style>/g,'').replace(/ data-health-hb1="health-hb1-20261031"/g,'');}
export function transformHTML(input,css,path){
 const p=pages.find(p=>p.path===path);if(!p)throw new Error('Unexpected health batch page '+path);
 const html=invariantHTML(input);
 for(const needle of ['data-shift-approved-hero="'+p.hero+'"',p.image,'No stock available today','</head>'])if(!html.includes(needle))throw new Error('Structure changed; inspect '+path+': '+needle);
 if(!mainHTML(html))throw new Error('Main missing '+path);
 return html.replace(/<main\b/,'<main data-health-hb1="'+release+'"').replace('</head>','<style id="'+release+'">'+css+'</style></head>');
}
