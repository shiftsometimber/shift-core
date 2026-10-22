const fs=require('fs'),r=__dirname;const css=`/* Matt-approved homepage welcome, 22 October 2026. */
html body #main-content.template-home .home-hero-grid>.home-hero-copy{padding-left:0!important}
html body #main-content.template-home .home-hero-copy h1{font-size:clamp(48px,3.8vw,64px)!important;line-height:1.04!important;width:100%!important;max-width:100%!important}
html body #main-content.template-home .home-hero-copy>p{font-size:clamp(18px,1.4vw,23px)!important;line-height:1.45!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-weight:600!important}
html body #main-content.template-home .home-hero-copy>p em{font-size:inherit!important;font-weight:400!important;font-style:italic!important;color:#e7e3da!important;-webkit-text-fill-color:#e7e3da!important}
html body #main-content.template-home #sst-home-route-title{font-size:clamp(24.3px,2.88vw,46.8px)!important}
@media(max-width:1000px){html body #main-content.template-home .home-hero-copy h1{font-size:clamp(34px,5.5vw,48px)!important}}
@media(max-width:650px){html body #main-content.template-home .home-hero-grid>.home-hero-copy{padding-left:4px!important;padding-right:4px!important}html body #main-content.template-home .home-hero-copy h1{font-size:clamp(30px,8.7vw,38px)!important}html body #main-content.template-home .home-hero-copy>p{font-size:17.5px!important}}
`;
const js=`(()=>{const p=document.querySelector('.home-hero-copy>p');if(!p||p.querySelector('em'))return;for(const n of [...p.childNodes]){if(n.nodeType===3&&n.textContent.trim()==='Real talk, no judgement.'){const em=document.createElement('em');em.textContent=n.textContent;n.replaceWith(em);}}})();`;
fs.writeFileSync(r+'/welcome.css',css);fs.writeFileSync(r+'/welcome.js',js);const s=fs.readFileSync(r+'/home-before.html','utf8');fs.writeFileSync(r+'/index.html',s.replace('</head>','<style id="shift-home-welcome-20261022">'+css+'</style></head>').replace('</body>','<script id="shift-home-welcome-italic-20261022">'+js+'</script></body>'));
