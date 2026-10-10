// Optional UI and minimal consented engagement. No answers, free text, identifiers or storage.
export const pillarClient = String.raw`(function(){
function allowed(){try{return window.SSTConsent?.get()?.analytics===true&&window.SST_ANALYTICS_SUPPRESSED!==true&&Array.isArray(window.dataLayer);}catch(_){return false;}}
function count(name){try{if(allowed())window.dataLayer.push({event:'shift_'+name});}catch(_){} }
const review=document.querySelector('[data-pillar-review]');
if(review){review.querySelector('[data-pillar-tried]').addEventListener('click',function(){review.querySelector('[data-pillar-feedback]').hidden=false;review.querySelector('[data-pillar-status]').textContent='You have tried a step. Now decide what to keep or change.';count('pillar_step_tried');});
review.querySelectorAll('[data-pillar-help]').forEach(function(b){b.addEventListener('click',function(){const messages={yes:'Keep the useful part. Choose when you will try it again.',effort:'Make the step smaller or easier to organise for your next busy day.',no:'Try a different approach to the problem, or ask for support. Repeating the same thing is not the only option.'};review.querySelector('[data-pillar-status]').textContent=messages[b.dataset.pillarHelp];count('pillar_review_used');});});}
document.addEventListener('click',function(e){const a=e.target.closest?.('a');if(a&&(a.getAttribute('href')||'')==='#first-step')count('pillar_first_step_opened');});
// Count a completed hub-to-public-support arrival, never a click or a private destination.
// No referrer, destination, health answer or navigation detail is added to the event.
function publicSupportArrival(){try{
 if(window.location.pathname!=='/weight-loss-support-for-men'||!document.referrer)return;
 const from=new URL(document.referrer);
 if(from.origin!==window.location.origin||from.pathname!=='/male-obesity')return;
 const kind=window.performance?.getEntriesByType?.('navigation')?.[0]?.type;
 if(kind==='reload'||kind==='back_forward')return;
 count('pillar_onward_opened');
}catch(_){} }
if(document.readyState==='complete')publicSupportArrival();else if(typeof window.addEventListener==='function')window.addEventListener('load',publicSupportArrival,{once:true});
})();`;
export function addPillarClient(html){if(!html.includes('data-shift-weight-understanding')||html.includes('data-pillar-client'))return html;return html.replace('</body>','<script data-pillar-client>'+pillarClient+'</script></body>');}
