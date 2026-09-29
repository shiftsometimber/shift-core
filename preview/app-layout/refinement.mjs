// Presentation only: move existing controls, never duplicate account state or saves.
const root='html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout])';
const css=(selectors,rules)=>selectors.split('|').map(s=>root+' '+s).join(',')+'{'+rules+'}\n';
export const refinementStyles=
css('main','max-width:980px!important')+
css('main [data-member-hero="v1"]','padding:20px 0!important;margin:0 0 12px!important')+
css('main [data-member-hero="v1"] :is(h1,h2)','font-size:30px!important;line-height:1.1!important;max-width:22ch')+
css('main [data-member-hero="v1"] p','font-size:14px!important;line-height:1.45!important;max-width:48ch')+
css('.app-today-shortcuts','border-radius:12px!important;padding:4px!important')+
css('.app-today-shortcuts a','min-height:58px!important;padding:8px 3px!important')+
css('#todayActions.app-today-v2','gap:12px!important')+
css('#todayActions.app-today-v2 .mtm-panel','padding:16px!important;border-radius:12px!important')+
css('#todayActions.app-today-v2 .mtm-step','padding:10px 0!important;column-gap:8px!important')+
css('#todayActions.app-today-v2 .mtm-step h3','font-size:16px!important;margin:2px 0!important')+
css('#todayActions.app-today-v2 .mtm-step small','font-size:9px!important')+
css('#todayActions.app-today-v2 .mtm-step p','font-size:12px!important;font-weight:400!important')+
css('#todayActions.app-today-v2 .mtm-next','padding:14px!important;margin:12px 0 0!important')+
css('#todayActions.app-today-v2 .mtm-next h3','font-size:20px!important')+
css('#todayActions.app-today-v2 .mtm-next .app-refine-detail','color:#050505!important;border-color:#707762!important')+
css('#todayActions.app-today-v2 .mtm-week','padding:14px 16px!important')+
css('#todayActions.app-today-v2 .mtm-days','margin:10px 0!important;gap:4px!important')+
css('#todayActions.app-today-v2 .mtm-records','padding:14px!important')+
css('#todayActions.app-today-v2 .mtm-record-grid a','min-height:44px!important;padding:10px!important')+
css('#todayActions.app-today-v2 .mtm-record-grid span','display:none!important')+
css('#todayActions.app-today-v2 .mtm-ask h2','font-size:20px!important;margin:4px 0!important')+
css('#todayActions.app-today-v2 #mtmAskForm','margin-top:10px!important')+
css('.app-refine-detail','margin:8px 0!important;border:0!important;border-top:1px solid #46503d!important;padding:0!important;min-width:0;color:#e7e3da')+
css('.app-refine-detail>summary','display:flex!important;align-items:center;justify-content:space-between;gap:12px;min-height:44px!important;padding:8px 0!important;font:600 13px/1.4 Arial,Helvetica,sans-serif!important;cursor:pointer;list-style:none')+
css('.app-refine-detail>summary::after','content:"+";font-size:20px;font-weight:400')+
css('.app-refine-detail[open]>summary::after','content:"−"')+
css('.app-refine-detail>summary::-webkit-details-marker','display:none')+
css('.app-refine-more','border:1px solid #46503d!important;border-radius:12px!important;padding:0 16px!important;background:#10160e!important')+
css('.app-refine-more>summary','min-height:52px!important;font-size:15px!important')+
css('.sf-session','padding:16px!important;margin:14px 0!important')+
css('.sf-session-head','gap:10px!important')+
css('.sf-session-head h3','font-size:23px!important')+
css('.sf-ring','width:68px!important;height:68px!important;font-size:24px!important')+
css('.sf-week','padding:12px!important;font-size:11px!important;gap:8px!important;margin:12px 0!important')+
css('.sf-coach','padding:10px 12px!important;margin:10px 0!important')+
css('.sf-coach p','font-size:13px!important;margin:3px 0!important')+
css('.sf-difficulty','padding:10px!important;margin:10px 0!important')+
css('.sf-difficulty-options','display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important')+
css('.sf-difficulty-options button','padding:8px 3px!important;min-width:0!important;font-size:12px!important')+
css('.sf-current-step','padding:10px 12px!important;margin:12px 0!important;border-radius:8px!important')+
css('.sf-current-step h3','font-size:14px!important;line-height:1.4!important;margin:0!important')+
css('.sf-exercise.mp-exercise','grid-template-columns:24px 48px minmax(0,1fr)!important;gap:8px!important;padding:12px 0!important')+
css('.sf-exercise-art|.sf-exercise-art img','width:48px!important;height:64px!important;object-fit:contain!important')+
css('.sf-exercise-main h4','font-size:15px!important;line-height:1.3!important;margin:0 0 5px!important')+
css('.sf-position','display:none!important')+
css('.sf-metrics','gap:4px!important;margin:6px 0!important')+
css('.sf-metrics>*','font-size:10px!important;padding:3px 5px!important')+
css('.sf-exercise-main','display:contents!important')+
css('.sf-exercise-main>:is(h4,.sf-metrics)','grid-column:3!important')+
css('.sf-exercise-main>h4','grid-row:1!important;align-self:start')+
css('.sf-exercise-main>.sf-metrics','grid-row:2!important')+
css('.sf-exercise-art|.sf-number','grid-row:1/3!important')+
css('.sf-exercise-main>.app-refine-exercise','grid-column:1/-1!important;grid-row:4!important')+
css('.sf-exercise-main>.sf-completion','grid-column:1/-1!important;grid-row:3!important;display:flex!important;gap:5px!important')+
css('.sf-exercise>.sf-exercise-actions','grid-column:3!important;grid-row:3!important;justify-content:flex-end!important')+
css('.sf-exercise>.sf-exercise-actions:empty','display:none!important')+
css('.sf-exercise .sf-completion>button','flex:1!important')+
css('.sf-exercise :is(.sf-completion,.sf-exercise-actions) button','font-size:11px!important;padding:6px 8px!important;min-height:44px!important')+
css('.sf-exercise .sf-completion select','position:relative;min-width:180px!important;z-index:1')+
css('.sf-exercise .app-refine-exercise','background:transparent!important;border:0!important;padding:0!important;margin:0!important')+
css('.sf-exercise .app-refine-exercise>summary','font-size:12px!important;min-height:36px!important')+
css('.app-settings-section','border:1px solid #46503d!important;border-radius:12px!important;background:#10160e!important;padding:0 16px!important;margin:10px 0!important')+
css('.app-settings-section>summary','min-height:60px!important;font-size:16px!important')+
css('.app-settings-section>section|.app-settings-section>.tracker-card','padding:12px 0!important;border:0!important;margin:0!important')+
css('.app-account-details','padding:0 16px!important')+
css('.app-account-details>summary','min-height:60px!important;display:flex!important;align-items:center!important')+
css('#memberDetailsPanel','padding:12px 0!important;border:0!important;margin:0!important')+
css('.md-section','padding:10px 0!important;background:transparent!important;border:0!important')+
css('.grub-food-image img','height:160px!important')+
css('.grub-recipe','padding:14px!important')+
css('.grub-recipe h3','font-size:23px!important')+
css('.grub-search','padding:14px!important;margin:12px 0!important')+
css('.grub-spotlight','display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important')+
css('.grub-spotlight article','padding:12px!important')+
css('.grub-spotlight h3','font-size:16px!important')+
css('.grub-spotlight p','font-size:12px!important')+
css('.grub-meta','gap:6px!important;margin:10px 0!important')+
css('.grub-meta>*','font-size:11px!important;padding:5px 7px!important')+
css('#journeyView>.hero','grid-template-columns:minmax(0,1fr) 130px!important;gap:10px!important;padding:12px 0 16px!important;text-align:left!important')+
css('#journeyView .hero h1','font-size:26px!important')+
css('#journeyView .score-ring','width:124px!important;height:124px!important')+
css('#journeyView .score-content strong','font-size:36px!important')+
css('#journeyView .score-content','font-size:11px!important')+
css('#journeyView .area-grid','gap:8px!important')+
css('#journeyView .area-card','padding:12px!important;min-height:136px!important')+
css('#journeyView .area-description','font-size:12px!important;line-height:1.4!important')+
css('#journeyView .area-number','font-size:28px!important')+
css('#journeyView .timeline-grid','grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important')+
css('#journeyView .timeline-card','padding:10px!important;font-size:12px!important')+
`@media(min-width:700px){${root} #todayActions.app-today-v2{gap:16px!important}${root} .sf-exercise.mp-exercise{grid-template-columns:28px 72px minmax(0,1fr) 160px!important}${root} .sf-exercise>.sf-exercise-actions{grid-column:4!important;grid-row:1/3!important}${root} .sf-exercise-main>.sf-completion{grid-column:3!important}${root} #journeyView>.hero{grid-template-columns:minmax(0,1fr) 200px!important}${root} #journeyView .score-ring{width:180px!important;height:180px!important}}
`;

export const refinementClient=String.raw`
(()=>{
 function group(nodes,title,cls=''){nodes=nodes.filter(Boolean);if(!nodes.length||nodes[0].closest('.app-refine-detail'))return;const d=document.createElement('details'),s=document.createElement('summary');d.className='app-refine-detail '+cls;s.textContent=title;nodes[0].before(d);d.append(s,...nodes);return d}
 function refine(){
  const page=document.body.dataset.memberPage;
  if(page==='dashboard'){
   const home=document.querySelector('#todayActions.app-today-v2');if(!home?.querySelector('.app-today-grid'))return;
   if(!home.querySelector('.app-refine-more')){
    const nodes=[home.querySelector('.mtm-daily'),home.querySelector('.mtm-records')];
    const d=group(nodes,'Water, saved items & account','app-refine-more');
    if(d)home.append(d);
   }
   const next=home.querySelector('.mtm-next');
   if(next&&!next.dataset.refined){next.dataset.refined='true';group([...next.children].filter(n=>n.matches('p:not(.mtm-kicker),.mtm-change-step')),'About your next step');}
   const secondary=home.querySelector('.app-secondary-controls');if(secondary&&!secondary.dataset.refined){secondary.dataset.refined='true';home.append(secondary)}
  }
  if(page==='fit'){
   document.querySelectorAll('.sf-current-step').forEach(n=>group([...n.children].filter(c=>c.tagName==='P'),'Movement guidance & timing'));
   document.querySelectorAll('.sf-exercise-main').forEach(n=>{
    const card=n.closest('.sf-exercise'),completion=n.querySelector('.sf-completion'),swap=card?.querySelector('.sf-exercise-actions button');if(completion&&swap)completion.append(swap);
    if(n.querySelector('.app-refine-exercise'))return;
    const nodes=[...n.children].filter(c=>c.matches('details,.app-screen-details,p:not(.sf-position)'));
    const d=group(nodes,'Show me how & why','app-refine-exercise');
    if(d){const why=d.querySelector('.app-screen-details');if(why)why.open=true;const how=d.querySelector('details:not(.app-screen-details)');if(how)how.open=true}
   });
   document.querySelectorAll('.sf-difficulty').forEach(n=>group([...n.children].filter(c=>c.tagName==='P'),'About session effort'));
  }
  if(page==='settings'){
   document.querySelectorAll('#memberDetailsPanel .md-section').forEach(n=>group([n],n.querySelector('h3')?.textContent.trim()||'Details'));
   document.querySelectorAll('main .tracker-card').forEach(n=>{if(n.closest('.app-refine-detail,#memberDetailsPanel'))return;const title=n.querySelector('h2,h3');if(title)group([n],title.textContent.trim(),'app-settings-section')});
  }
  if(page==='grub'){
   const recipe=document.querySelector('#grubRecommendation .grub-recipe');
   if(recipe&&!recipe.querySelector('.app-refine-recipe')){
    const details=[...recipe.children].filter(n=>n.matches('.app-screen-details,.grub-recipe-detail'));
    group(details,'Recipe details & adjustments','app-refine-recipe');
   }
   const search=document.querySelector('.grub-search'),hero=document.querySelector('main [data-member-hero]');
   if(search&&hero&&!search.dataset.refinePlaced){search.dataset.refinePlaced='true';const tabs=document.querySelector('.grub-v8-tabs');(tabs||hero).after(search)}
  }
  if(page==='life-back')document.querySelectorAll('.trend-panel').forEach(n=>group([n],'See your progress over time'));
 }
 let pending=false;function schedule(){if(pending)return;pending=true;queueMicrotask(()=>{pending=false;refine()})}
 function boot(){refine();const main=document.querySelector('main');if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true});document.addEventListener('sst:today-rendered',schedule);document.addEventListener('invalid',e=>{let n=e.target.parentElement;while(n){if(n.tagName==='DETAILS')n.open=true;n=n.parentElement}},true)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();`;
