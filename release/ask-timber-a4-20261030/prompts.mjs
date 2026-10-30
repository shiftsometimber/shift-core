export const promptClient=String.raw`(()=>{'use strict';
const root=document.querySelector('main[data-ask-a4]'),input=document.getElementById('timberQuestion');
if(!root||!input||root.dataset.a4PromptReady)return;root.dataset.a4PromptReady='true';
root.addEventListener('click',event=>{const control=event.target.closest('#wider-health-topics [data-timber-prompt]');if(!control||!root.contains(control))return;
input.value=control.dataset.timberPrompt.slice(0,900);input.dispatchEvent(new Event('input',{bubbles:true}));input.focus({preventScroll:true});
document.querySelector('.atg-composer').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
});
})();`;
