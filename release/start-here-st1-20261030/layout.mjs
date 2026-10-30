export const release='start-here-st1-20261030';
export const assetBase='/start-here/assets/st1-20261030/';
export const ownAssets=['hero.webp','support.webp','weight.webp','blood.webp'];
export const imageRules=[
 {key:'hero',old:'/start-here/assets/hero.webp',alt:'A man and his wife sharing a relaxed breakfast together in their garden'},
 {key:'support',old:'/start-here/assets/support.webp',alt:'A man packing a simple lunch before his working day'},
 {key:'weight',old:'/start-here/assets/weight.webp',alt:'A man and his wife enjoying a walk through a market town'},
 {key:'blood',old:'/start-here/assets/blood.webp',alt:'A man reading home-test instructions beside a sealed sample tube and test kit'}
];
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
const stripStyle=html=>html.replace(/<style id="start-here-st1-20261030">[\s\S]*?<\/style>/g,'').replace(/ data-start-here-st1="start-here-st1-20261030"/g,'');
export function invariantHTML(html){return stripStyle(html).replace(/<img\b[^>]*>/g,tag=>{const rule=imageRules.find(r=>tag.includes('src="'+r.old+'"')||tag.includes('src="'+assetBase+r.key+'.webp"'));return rule?tag.replace(assetBase+rule.key+'.webp',rule.old).replace(/\s+alt="[^"]*"/,''):tag;});}
export function transformHTML(input,css){
 let html=stripStyle(input);
 if(!html.includes('id="sw-welcome"')||!html.includes('class="sw-feature sw-free"')||!html.includes('id="sw-weight-title"')||!html.includes('data-weight-start')||!html.includes('</head>'))throw new Error('Start Here structure changed; inspect before applying ST1');
 const found=new Set();
 html=html.replace(/<img\b[^>]*>/g,tag=>{const r=imageRules.find(r=>tag.includes('src="'+r.old+'"')||tag.includes('src="'+assetBase+r.key+'.webp"'));if(!r)return tag;if(found.has(r.key))throw new Error('Duplicate Start Here photo anchor '+r.key);found.add(r.key);return tag.replace(r.old,assetBase+r.key+'.webp').replace(/alt="[^"]*"/,'alt="'+r.alt+'"');});
 if(found.size!==4)throw new Error('All four Start Here photo anchors must be present');
 return html.replace('id="sw-welcome"','id="sw-welcome" data-start-here-st1="'+release+'"').replace('</head>','<style id="'+release+'">'+css+'</style></head>');
}
