export const release='public-pb3-20261031';
export const assetBase='/shift-health/assets/pb3-20261031/';
export const ownAssets=[];
export const pages=[
 {key:'life',path:'/life-back',hero:'data-next-hero="life-back"',image:'/shift-health/hero-set-20261030/life-back.webp',needles:['A worked example','not a member result','Life Back records what you tell it.']},
 {key:'bloods',path:'/shift-health/blood-tests',hero:'data-shift-approved-hero="bloods"',image:'/shift-health/blood-tests?shift_hero=20261029-approved-v1-bloods-c2d9e2093b40',needles:['Ordering is not open','data-panel-switcher','id="compare-blood-tests"','Price unavailable']},
 {key:'supplements',path:'/shift-health/supplements-nutrition',hero:'data-shift-approved-hero="supplements"',image:'/shift-health/supplements-nutrition?shift_hero=20261029-approved-v1-supplements-41052b45ba9f',needles:['id="shop-categories"','Our range is taking shape.','Clear product information. No miracle claims.']},
 {key:'testing',path:'/shift-health/testing',hero:'nft-garden-hero',image:'/shift-health/assets/testing-hero-garden-approved-20261029.webp',needles:['id="range"','Prices TBC','nft-shop-toolbar','Clear filters']}
];
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
export function invariantHTML(html){return html.replace(/<style id="public-pb3-20261031">[\s\S]*?<\/style>/g,'').replace(/ data-public-pb3="public-pb3-20261031"/g,'');}
export function transformHTML(input,css,path){
 const p=pages.find(p=>p.path===path);if(!p)throw new Error('Unexpected batch page '+path);
 const html=invariantHTML(input);
 for(const needle of [p.hero,p.image,...p.needles,'</head>'])if(!html.includes(needle))throw new Error('Structure changed; inspect '+path+': '+needle);
 if(!mainHTML(html))throw new Error('Main missing '+path);
 return html.replace(/<main\b/,'<main data-public-pb3="'+release+'"').replace('</head>','<style id="'+release+'">'+css+'</style></head>');
}
