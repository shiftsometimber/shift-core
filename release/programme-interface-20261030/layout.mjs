export const release='programme-real-interface-20261030';
export const assetBase='/programme/assets/interface-20261030/';
export const ownAssets=['today.jpg'];
export const heroOpen='<section class="pv-hero" aria-labelledby="pv-title">';
export const plate='<div class="pv-real-screen-stage" data-programme-screen role="img" aria-label="My Timber Today: an illustrative saved dinner plan in the approved interface"><div class="pv-real-screen"><img class="pv-real-screen-body" src="'+assetBase+'today.jpg" alt="" width="430" height="1221"><div class="pv-real-screen-nav" aria-hidden="true"><img src="'+assetBase+'today.jpg" alt="" width="430" height="1221"></div><span class="pv-real-screen-notch" aria-hidden="true"></span></div></div>';
export const mainHTML=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
export function stripOwned(html){return html.replace(plate,'').replace(/ data-programme-interface="programme-real-interface-20261030"/g,'').replace(/<style id="programme-real-interface-20261030">[\s\S]*?<\/style>/g,'').replace(/<script defer src="\/programme\/assets\/interface-20261030\/runtime(?:-v\d+)?\.js(?:\?v=\d+)?" data-programme-interface-runtime><\/script>/g,'');}
export function transformHTML(input,css){
 const html=stripOwned(input);
 if(html.split(heroOpen).length!==2||!mainHTML(html)||!html.includes('</head>')||!html.includes('</body>'))throw new Error('Programme structure changed; inspect before replacing its screen');
 return html.replace(/<main\b/, '<main data-programme-interface="'+release+'"').replace(heroOpen,heroOpen+plate).replace('</head>','<style id="'+release+'">'+css+'</style></head>').replace('</body>','<script defer src="'+assetBase+'runtime-v2.js" data-programme-interface-runtime></script></body>');
}
