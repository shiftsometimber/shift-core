// Optional UI and minimal consented engagement. No answers, free text, identifiers or storage.
export const pillarClient = String.raw`(function(){
function count(name){try{if(window.SSTConsent?.get()?.analytics===true&&window.SST_ANALYTICS_SUPPRESSED!==true&&Array.isArray(window.dataLayer))window.dataLayer.push({event:'shift_'+name});}catch(_){} }
const review=document.querySelector('[data-pillar-review]');
if(review){review.querySelector('[data-pillar-tried]').addEventListener('click',function(){review.querySelector('[data-pillar-feedback]').hidden=false;review.querySelector('[data-pillar-status]').textContent='You have tried a step. Now decide what to keep or change.';count('pillar_step_tried');});
review.querySelectorAll('[data-pillar-help]').forEach(function(b){b.addEventListener('click',function(){const messages={yes:'Keep the useful part. Choose when you will try it again.',effort:'Make the step smaller or easier to organise for your next busy day.',no:'Try a different approach to the problem, or ask for support. Repeating the same thing is not the only option.'};review.querySelector('[data-pillar-status]').textContent=messages[b.dataset.pillarHelp];count('pillar_review_used');});});}
document.addEventListener('click',function(e){const a=e.target.closest?.('a');if(!a)return;const h=a.getAttribute('href')||'';if(h==='#first-step')count('pillar_first_step_opened');else if(/^\/(start-here|shift-health|weight-loss-support-for-men|member\/dashboard)([?#]|$)/.test(h))count('pillar_onward_opened');});
})();`;
export function addPillarClient(html){if(!html.includes('data-shift-weight-understanding')||html.includes('data-pillar-client'))return html;return html.replace('</body>','<script data-pillar-client>'+pillarClient+'</script></body>');}
