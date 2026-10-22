export function presentStopping(html){
 const match=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);if(!match)throw Error('Missing guide');
 const body=match[1],takeaways=body.match(/<section class="cluster-takeaways">[\s\S]*?<\/section>/)?.[0];if(!takeaways)throw Error('Missing original takeaways');
 const hero=body.match(/^<section class="cluster-hero">[\s\S]*?<\/section>/)?.[0];if(!hero)throw Error('Missing original hero');
 return html.replace(match[0],match[0].replace(body,hero+'<div class="sgp-takeaway-wrap">'+takeaways+'</div>'+body.replace(hero,'').replace(takeaways,'')));
}
const relocate='<script data-stopping-presentation-flow>(()=>{const move=()=>{const main=document.querySelector("main.sgp"),panel=main?.querySelector(".sst-service-bridge"),anchor=main?.querySelector(".cluster-safety");if(panel&&anchor&&panel.nextElementSibling!==anchor)anchor.before(panel);};new MutationObserver(move).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener("DOMContentLoaded",move,{once:true});})();</script>';

export {relocate};
