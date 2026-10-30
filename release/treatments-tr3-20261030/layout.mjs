export const release='treatments-tr3-20261030';
export const assetBase='/treatment-centre/assets/tr3-20261030/';
export const ownAssets=['hero.webp','weight.webp','understanding.webp','support.webp'];
export const imageRules=[
 {key:'hero',old:'/treatment-centre/images/fe2ff3512cc1688c25bc7b8058450467f3049e8b3cf0941a97e116bea5226efb.jpg',alt:'A bald man reading his phone beside a local football training ground'},
 {key:'weight',old:'/treatment-centre/images/56321dd493410978e34f16ab00cbbcac3caee2ba8bed33e335e5c67f785ef9ca.jpg',alt:'A man and his wife walking together along a market-town street'},
 {key:'understanding',old:'/treatment-centre/images/cb825ce0efda57ce6a88e29ef265dc6ccea5e7c1bff06972e81ce4a3f9e93543.jpg',alt:'A silver-haired man using an iPad in a bright conservatory'},
 {key:'support',old:'/treatment-centre/images/b02b36dc2dc10cf97eac7ba5856d267e08f07eaacc07abb0a306ab87adf8bd86.jpg',alt:'A man enjoying a relaxed moment outdoors in the park'}
];
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
const stripStyle=html=>html.replace(/<style id="treatments-tr3-20261030">[\s\S]*?<\/style>/g,'').replace(/ data-treatments-tr3="treatments-tr3-20261030"/g,'');
export function invariantHTML(html){return stripStyle(html).replace(/<img\b[^>]*>/g,tag=>{const r=imageRules.find(r=>tag.includes('src="'+r.old+'"')||tag.includes('src="'+assetBase+r.key+'.webp"'));return r?tag.replace(assetBase+r.key+'.webp',r.old).replace(/\s+alt="[^"]*"/,''):tag;});}
export function transformHTML(input,css){
 let html=stripStyle(input);if(!mainHTML(html)||!html.includes('class="tv-hero"')||!html.includes('class="tv-support"')||!html.includes('</head>'))throw new Error('Treatments structure changed; inspect before applying TR3');
 const found=new Set();html=html.replace(/<img\b[^>]*>/g,tag=>{const r=imageRules.find(r=>tag.includes('src="'+r.old+'"')||tag.includes('src="'+assetBase+r.key+'.webp"'));if(!r)return tag;if(found.has(r.key))throw new Error('Duplicate Treatments photograph '+r.key);found.add(r.key);return tag.replace(r.old,assetBase+r.key+'.webp').replace(/alt="[^"]*"/,'alt="'+r.alt+'"');});
 if(found.size!==4)throw new Error('All four approved TR3 photograph anchors must be present');
 return html.replace(/<main\b/,'<main data-treatments-tr3="'+release+'"').replace('</head>','<style id="'+release+'">'+css+'</style></head>');
}
