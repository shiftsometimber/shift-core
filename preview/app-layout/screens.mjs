// App-only composition. Original nodes, events and persistence remain authoritative.
const scope='html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout])';
const page=scope+':not([data-member-page="dashboard"])';
const rule=(selector,css)=>selector.split('|').map(s=>page+' '+s).join(',')+'{'+css+'}\n';
export const screenStyles=`
${page}{background:#050505!important;color:#e7e3da!important}
`+rule('main','background:#050505!important;color:#e7e3da!important;max-width:980px!important;padding:0 20px!important')+
rule('main :is(h1,h2,h3,h4,p,li,label,legend,small,strong,span,summary)','color:inherit!important;-webkit-text-fill-color:currentColor!important')+
rule('main :is(h1,h2,h3,h4)','font-family:Arial,Helvetica,sans-serif!important;letter-spacing:-.025em!important')+
rule('main h1','font-size:36px!important;line-height:1.08!important')+
rule('main h2','font-size:24px!important;line-height:1.2!important')+
rule('main h3','font-size:20px!important;line-height:1.25!important')+
rule('main p','font-size:14px!important;line-height:1.55!important')+
rule('main a','color:#d7e1c7!important')+
rule('main :is(input,select,textarea)','background:#20291b!important;color:#e7e3da!important;-webkit-text-fill-color:#e7e3da!important;border:1px solid #707762!important;border-radius:8px!important;min-height:44px;max-width:100%;box-sizing:border-box')+
rule('main input::placeholder|main textarea::placeholder','color:#bfc7b6!important;-webkit-text-fill-color:#bfc7b6!important')+
rule('main :is(button,.button,.btn)','background:#20291b!important;color:#e7e3da!important;-webkit-text-fill-color:#e7e3da!important;border:1px solid #707762!important;border-radius:9px!important;min-height:44px!important;font-family:Arial,Helvetica,sans-serif!important')+
rule('main :is(button,.button,.btn):is([aria-pressed="true"],[aria-selected="true"],.primary)|main :is(#saveMood,#fitGenerate,#memberDetailsSave,[data-sf-start])','background:#e7e3da!important;color:#050505!important;-webkit-text-fill-color:#050505!important')+
rule('main :is(button,input,select,textarea):disabled','opacity:.6!important')+
rule('main :is(.grub-recipe,.grub-v8-panel,.grub-spotlight article,.sf-session,.sf-next,.sf-coach,.sf-debrief,.md-panel,.md-section,.member-record-card,.member-order,.area-card,.timeline-card,.trend-panel,.win,.checkin-history)','background:linear-gradient(145deg,#141c11,#0a0e09)!important;color:#e7e3da!important;border:1px solid #46503d!important;border-radius:14px!important;padding:18px!important;min-width:0;box-shadow:none!important')+
rule('main :is(.grub-meta,.sf-metrics)','display:flex!important;flex-wrap:wrap!important;gap:8px!important;margin:12px 0!important')+
rule('main :is(.grub-meta,.sf-metrics)>*','background:#293321!important;color:#d7e1c7!important;border-radius:6px!important;padding:6px 9px!important;font-size:12px!important')+
rule('main :is(.grub-actions,.sf-exercise-actions,.sf-completion)','display:flex!important;flex-wrap:wrap!important;gap:8px!important')+
rule('main :is(.grub-actions,.sf-exercise-actions,.sf-completion)>*','flex:1 1 auto!important;font-size:13px!important')+
rule('.grub-v8-tabs','display:flex!important;gap:6px!important;overflow-x:auto!important;flex-wrap:nowrap!important;padding:6px!important;border:1px solid #46503d!important;border-radius:12px!important;background:#11160f!important;margin:0 0 18px!important')+
rule('.grub-v8-tabs button','flex:1 0 auto!important;padding:10px 12px!important;font-size:12px!important;border:0!important;background:transparent!important')+
rule('#grubRecommendation','margin:16px 0!important')+
rule('.grub-food-image','margin:12px 0!important')+
rule('.grub-food-image img','width:100%!important;height:180px!important;object-fit:cover!important;border-radius:10px!important')+
rule('.grub-food-image figcaption','font-size:11px!important;color:#bfc7b6!important')+
rule('.grub-pick-why|.grub-pick-feedback|.grub-pick-fit','padding:12px 0!important;margin:12px 0!important;background:transparent!important;border:0!important')+
rule('.grub-pick-adjust','gap:6px!important')+
rule('.grub-pick-adjust button','font-size:12px!important;padding:9px!important')+
rule('.grub-account','font-size:12px!important;padding:12px!important;border:1px solid #46503d!important;background:#11160f!important;color:#c5c8bc!important;border-radius:10px!important')+
rule('.grub-search|.grub-spotlight|#grubDiscoverResults|#grubSaved','gap:12px!important')+
rule('.grub-recipe-detail|.app-screen-details','border-top:1px solid #46503d!important;margin-top:12px!important;padding:12px 0!important;color:#c5c8bc!important')+
rule('.app-screen-details>summary|.grub-recipe-detail>summary','font-size:13px!important;min-height:36px!important;cursor:pointer;color:#e7e3da!important;display:list-item!important')+
rule('.app-screen-details[open]>summary','margin-bottom:12px!important')+
rule('.sf-session-head','display:flex!important;justify-content:space-between!important;gap:16px!important;align-items:center!important')+
rule('.sf-ring','flex-shrink:0!important;width:88px!important;height:88px!important;font-size:26px!important')+
rule('.sf-exercises','display:grid!important;gap:0!important')+
rule('.sf-exercise.mp-exercise','display:grid!important;grid-template-columns:26px 72px minmax(0,1fr)!important;gap:10px!important;padding:16px 0!important;border:0!important;border-bottom:1px solid #46503d!important;border-radius:0!important;background:transparent!important;color:#e7e3da!important')+
rule('.sf-number','grid-column:1!important;width:24px!important;height:24px!important;font-size:12px!important;background:#293321!important')+
rule('.sf-exercise-art','grid-column:2!important;width:72px!important;margin:0!important')+
rule('.sf-exercise-art img','width:72px!important;height:90px!important;object-fit:contain!important')+
rule('.sf-exercise-main','grid-column:3!important;min-width:0')+
rule('.sf-exercise-main h4','font-size:17px!important;margin:0 0 8px!important')+
rule('.sf-exercise>:is(.sf-completion,.sf-exercise-actions,.sf-difficulty)','grid-column:1/-1!important')+
rule('.sf-exercise :is(p,summary,.sf-metrics)','font-size:12px!important')+
rule('.sf-exercise-purpose','margin:8px 0!important')+
rule('[data-sf-start]','width:100%!important;margin-top:16px!important')+
rule('#journeyView>.hero','display:grid!important;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)!important;gap:20px!important;padding:12px 0 24px!important;align-items:center!important')+
rule('#journeyView .hero-copy [data-member-hero]','margin:0!important;padding:0 0 16px!important')+
rule('.score-ring','width:190px!important;height:190px!important;margin:auto!important')+
rule('.score-content strong','font-size:48px!important')+
rule('.area-grid','grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important')+
rule('.area-card','text-align:left!important;min-height:164px!important')+
rule('.area-number','font-size:30px!important')+
rule('.area-description','font-size:13px!important')+
rule('.win-art','max-width:220px!important')+
rule('.member-record-grid','display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important')+
rule('#memberDetailsPanel','background:#10160e!important;border:1px solid #46503d!important;border-radius:14px!important;padding:20px!important')+
rule('.md-grid','gap:14px!important')+
rule('#moodRow','display:flex!important;gap:8px!important;flex-wrap:wrap!important')+
rule('#moodRow>*','flex:1 1 70px!important')+
rule('#saveMood','width:100%!important')+
`${scope} :is(#panel-visualise,#panel-plans) .member-progress-map{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important;padding:18px!important;background:#11160f!important;border:1px solid #46503d!important;border-radius:14px!important}
${scope} .member-progress-map>:is(h2,p){grid-column:1/-1}
${scope} .member-progress-map a{display:block!important;padding:16px!important;border:1px solid #707762!important;border-radius:10px!important;color:#e7e3da!important;background:#20291b!important}
@media(max-width:600px){
${page} main{padding:0 14px!important}
${page} main h1{font-size:30px!important}
${page} #journeyView>.hero{grid-template-columns:1fr!important;gap:12px!important}
${page} .score-ring{width:180px!important;height:180px!important}
${page} .area-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
${page} .area-card{padding:14px!important}
${page} .timeline-grid{grid-template-columns:1fr!important}
${page} .grub-food-image img{height:150px!important}
${page} .sf-exercise.mp-exercise{grid-template-columns:24px 50px minmax(0,1fr)!important;gap:8px!important}
${page} .sf-exercise-art,${page} .sf-exercise-art img{width:50px!important;height:72px!important}
${page} .member-record-grid{grid-template-columns:1fr!important}
}
`;
export const screenClient=String.raw`
(()=>{
 const wrap=(node,title)=>{if(!node||node.closest('.app-screen-details'))return;const d=document.createElement('details'),s=document.createElement('summary');d.className='app-screen-details';s.textContent=title;node.before(d);d.append(s,node);return d};
 function compose(){
  const page=document.body.dataset.memberPage;
  if(page==='grub'){
   const tabs=document.querySelector('.grub-v8-tabs'),hero=document.querySelector('main [data-member-hero]');
   if(tabs&&hero&&!tabs.dataset.appPlaced){tabs.dataset.appPlaced='true';hero.after(tabs)}
   wrap(document.querySelector('.grub-pick-why'),'Why this meal fits');
   wrap(document.querySelector('.grub-pick-feedback'),'Help Shift learn what you like');
   wrap(document.querySelector('.grub-pick-fit'),'How this fits your movement plan');
   const adjustments=document.querySelector('.grub-pick-adjust');
   if(adjustments&&!adjustments.closest('.app-screen-details')){const title=adjustments.previousElementSibling,d=wrap(adjustments,'Adjust this meal');if(title?.textContent.trim()==='Change what matters')d.append(title)}
  }
  if(page==='fit')document.querySelectorAll('.sf-exercise-purpose').forEach(n=>wrap(n,'Why this exercise'));
  if(page==='life-back'){
   const hero=document.querySelector('#journeyView>[data-member-hero]'),copy=document.querySelector('#journeyView>.hero .hero-copy');if(hero&&copy)copy.prepend(hero);
  }
  document.querySelectorAll('footer').forEach(n=>{if(n.closest('main,details'))return;const d=wrap(n,'Help & legal');if(d)d.classList.add('app-footer-details')});
 }
 function boot(){compose();const main=document.querySelector('main');if(main)new MutationObserver(()=>{compose()}).observe(main,{childList:true,subtree:true})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();`;
