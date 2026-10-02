// Matt's approved 1 October green/black My Timber design. Presentation only.
// Existing nodes, event handlers, records, API routes and consent own all actions.
export const memberDesignVersion='20261001';
const scope='html body[data-member-design="20261001"]:is(#approved-member-design,[data-member-design]):is(#approved-member-palette,[data-member-design]):is(#approved-member-layout,[data-member-design])';
const css=(selectors,rules)=>selectors.split('|').map(s=>scope+' '+s).join(',')+'{'+rules.split(';').filter(Boolean).map(s=>s.replace(/!important/g,'')+'!important').join(';')+'}\n';
export const memberDesignStyles=scope+'{background:#707762!important;color:#000!important;font-family:Arial,Helvetica,sans-serif!important;padding-bottom:88px!important}\n'+
css('main','background:#707762;color:#000;max-width:1040px;padding:22px 20px 36px;min-height:0;box-sizing:border-box')+
css('main :is(h1,h2,h3,h4,p,li,label,legend,small,strong,b,span,summary)','color:inherit;-webkit-text-fill-color:currentColor;font-family:Arial,Helvetica,sans-serif')+
css('main :is(h1,h2)','font-weight:800;letter-spacing:-.035em')+
css('main h1','font-size:clamp(28px,4vw,40px);line-height:1.12')+
css('main h2','font-size:24px;line-height:1.2')+
css('main p','line-height:1.5')+
css('main a','color:inherit;text-underline-offset:3px')+
css('main :is(input,select,textarea)','font-size:16px;background:#e7e3da;color:#050505;-webkit-text-fill-color:#050505;border:1px solid #707762;border-radius:9px;min-height:44px;max-width:100%;box-sizing:border-box')+
css('main input::placeholder|main textarea::placeholder','color:#586045;-webkit-text-fill-color:#586045;opacity:1')+
css('main :is(button,.button,.btn,.mp-btn)','background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;border:1px solid #050505;border-radius:9px;min-height:44px;font:700 14px/1.35 Arial,sans-serif;padding:11px 14px')+
css('main :is(button,.button,.btn,.mp-btn):is([aria-pressed="true"],[aria-selected="true"],.active,.primary)','background:#707762;color:#000;-webkit-text-fill-color:#000;border-color:#050505')+
css('main :is(.sf-builder,.sf-limitations,.sf-limitation-grid label,.sf-difficulty,.sf-exercise-purpose,.checkin-card,.checkin-safety,.grub-search,.grub-workbench,.grub-week-builder,.grub-recipe,.grub-v8-panel,.grub-spotlight article,.sf-session,.sf-next,.sf-coach,.sf-debrief,.md-panel,.md-section,.member-record-card,.member-order,.area-card,.timeline-card,.trend-panel,.win,.checkin-history,.mp-photo,.mp-output)','background:#e7e3da;color:#050505;border:0;border-radius:12px;padding:16px;box-shadow:none')+
css('main [data-member-hero="v1"]|#todayActions.mtm-home .mtm-hero','min-height:0;padding:0;margin:0 0 18px;border:0;border-radius:0;background:transparent;color:#000;overflow:visible')+
css('main [data-member-hero="v1"]:after|#todayActions.mtm-home .mtm-hero:after','display:none;content:none;background:none')+
css('main [data-member-hero="v1"] :is(h1,h2)|#todayActions.mtm-home .mtm-hero h2','font-size:clamp(28px,4vw,40px);line-height:1.12;max-width:none;margin:5px 0 8px;color:#050505;-webkit-text-fill-color:#050505')+
css('main [data-member-hero="v1"] :is(p,span)|#todayActions.mtm-home .mtm-hero p','color:#000;-webkit-text-fill-color:#000;font-size:16px;line-height:1.5;margin:0;max-width:none')+
css('main [data-member-hero="v1"]>div','max-width:none')+
css('#todayActions.mtm-home .mtm-hero>img','display:none')+
css('#todayBrand','max-width:none;margin:0;padding:12px max(16px,calc((100vw - 1000px)/2));background:#050505;color:#e7e3da;display:flex;align-items:center;justify-content:space-between;gap:16px;border:0')+
css('#todayBrand>a','display:flex;align-items:center;gap:11px;color:#e7e3da;text-decoration:none;font:800 18px/1 Arial,sans-serif;min-height:44px')+
css('#todayBrand .member-design-mark','width:42px;height:42px;object-fit:contain;display:block;visibility:visible;opacity:1')+
css('#todayBrand .member-design-account','display:flex;align-items:center;justify-content:center;border:1px solid #707762;background:#707762;color:#000;border-radius:50%;width:44px;height:44px')+
css('#myTimberApp','position:static;margin:14px auto;max-width:1000px;width:calc(100% - 28px);box-sizing:border-box')+
css('#todayBrand svg|#appBottomNav svg','display:block;visibility:visible;opacity:1;width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round')+
css('header.site-header|#todayBrand .today-logo','display:none')+
css('nav.sst-member-tabs','display:none')+
css('[data-app-more="open"] nav.sst-member-tabs','display:flex')+
scope+'[data-app-more="open"] nav.sst-member-tabs{display:flex!important}\n'+
css('#appBottomNav','grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;background:#050505;border-top:1px solid #707762;max-width:none;margin:0;border-radius:0;padding:7px max(8px,calc((100vw - 1000px)/2)) max(8px,env(safe-area-inset-bottom))')+
css('#appBottomNav :is(a,button)','flex-direction:column;gap:4px;min-height:54px;font-size:11px;border-radius:10px;color:#e7e3da;padding:4px 2px;min-width:0')+
css('#appBottomNav [aria-current="page"]','background:#707762;color:#000')+
css('#appBottomNav button[aria-expanded="true"]','background:#707762;color:#000')+
css('#todayActions.app-today-v3','color:#000')+
css('#todayActions.app-today-v3 .app-today-shortcuts','margin:0 0 16px;background:#050505;border:0;border-radius:11px;padding:4px;gap:4px')+
css('#todayActions.app-today-v3 .app-today-shortcuts a','flex-direction:column;gap:4px;min-height:44px;color:#e7e3da;font-size:12px;font-weight:700;padding:6px 4px;white-space:nowrap;word-break:normal')+
css('#todayActions.app-today-v3 .app-today-shortcuts .app-line-icon','width:18px;height:18px')+
css('#todayActions.app-today-v3 .app-today-shortcuts a[aria-selected="true"]','background:#707762;color:#000')+
css('#todayActions.app-today-v3 .today-layout','display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:14px;align-items:start')+
css('#todayActions.app-today-v3 .today-meal','background:#e7e3da;color:#050505;border:0;border-radius:14px;grid-column:1;grid-row:auto;padding:0')+
css('#todayActions.app-today-v3 .today-meal-visual','aspect-ratio:2.25')+
css('#todayActions.app-today-v3 .today-meal-copy','padding:17px')+
css('#todayActions.app-today-v3 .today-meal h3','font-size:27px;margin:0 0 8px;color:#050505')+
css('#todayActions.app-today-v3 .today-meal-meta','color:#050505;font-size:15px;margin-bottom:12px')+
css('#todayActions.app-today-v3 .today-meal-action','color:#e7e3da;-webkit-text-fill-color:#e7e3da;background:#050505;min-height:44px')+
css('#todayActions.app-today-v3 :is(.today-life,.today-movement,.mtm-week,.today-focus,.today-support,.today-week-start)','background:#e7e3da;color:#050505;border:0;border-radius:12px;padding:16px;margin:0')+
css('#todayActions.app-today-v3 :is(.today-life,.today-movement,.mtm-week,.today-focus,.today-support,.today-week-start) :is(p,h2,h3,strong,span,a,label,summary)','color:#050505;-webkit-text-fill-color:#050505')+
css('#todayActions.app-today-v3 .today-movement','grid-column:2;grid-row:1;min-width:0')+
css('#todayActions.app-today-v3 .today-movement h3','font-size:23px')+
css('#todayActions.app-today-v3 .mtm-week','grid-column:1/-1;padding:16px')+
css('#todayActions.app-today-v3 .today-week-start','padding:0;margin:0 0 14px')+
css('#todayActions.app-today-v3 .today-week-start h3','font-size:20px')+
css('#todayActions.app-today-v3 .mtm-days','margin:12px 0')+
css('#todayActions.app-today-v3 .mtm-days b','background:#d3d0c5;color:#050505;border:0')+
css('#todayActions.app-today-v3 .mtm-days b.is-logged','background:#707762;color:#000')+
css('#todayActions.app-today-v3 .today-life','grid-column:2;padding:14px')+
css('#todayActions.app-today-v3 .today-focus','margin:16px 0')+
css('#todayActions.app-today-v3 .today-focus h3','font-size:22px')+
css('#todayActions.app-today-v3 .mtm-next','background:#050505;color:#e7e3da;padding:18px;border:0;border-radius:14px;margin:0 0 16px')+
css('#todayActions.app-today-v3 .mtm-next :is(h3,p,small,strong,span,a,button)','color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
css('#todayActions.app-today-v3 .mtm-next h3','font-size:23px;line-height:1.2;margin:6px 0')+
css('#todayActions.app-today-v3 .mtm-next p','font-size:14px;line-height:1.4;margin:5px 0')+
css('#todayActions.app-today-v3 .mtm-loop-controls','display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px')+
css('#todayActions.app-today-v3 .mtm-loop-controls p','flex-basis:100%;margin:0')+
css('#todayActions.app-today-v3 .mtm-loop-controls :is(button,a)','width:auto;margin:0;font-size:12px;line-height:1.35')+
css('#todayActions.app-today-v3 .mtm-next .mtm-change-step','display:inline-block;width:auto;margin:12px 0 0;padding:0;min-height:24px;font-size:13px')+
css('#todayActions.app-today-v3 .mtm-next .mt-now-action','background:#707762;color:#000;-webkit-text-fill-color:#000;font-weight:800;padding:12px 16px;min-height:44px')+
css('#todayActions.app-today-v3 .mtm-next button','background:#e7e3da;color:#050505;-webkit-text-fill-color:#050505;margin:4px;padding:10px')+
css('#todayActions.app-today-v3 .today-followthrough','margin:16px 0;gap:14px')+
css('#todayActions.app-today-v3 .today-support','margin-top:16px')+
css('#todayActions.app-today-v3 .today-support :is(.mtm-panel,.mtm-care)','background:#e7e3da;color:#050505;border:0')+
css('main :is(.app-screen-details,.app-refine-detail,.app-settings-section,.app-account-details,.grub-account)','background:#e7e3da;color:#050505;border:0;border-radius:10px;padding:10px 14px')+
css('main :is(.app-screen-details,.app-refine-detail,.app-settings-section,.app-account-details,.grub-account) :is(p,summary,h2,h3,a)','color:#050505;-webkit-text-fill-color:#050505')+
css('main :is(.grub-meta,.sf-metrics)>*','background:#d3d0c5;color:#050505;font-size:12px')+
css('main .grub-v8-tabs','background:#050505;border:0;border-radius:11px;padding:4px;margin:0 0 14px')+
css('main .grub-v8-tabs button','background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
css('main .grub-v8-tabs button:is([aria-selected="true"],.active)','background:#707762;color:#000;-webkit-text-fill-color:#000')+
css('main .grub-food-image img','height:180px;object-fit:cover')+
css('main :is(.grub-recipe-detail,.app-refine-recipe,.sf-exercise-main,.md-help)','color:#050505;-webkit-text-fill-color:#050505')+
css('#todayActions.app-today-v3 .mt-today-footer','background:#e7e3da;color:#050505;border-radius:10px;padding:12px 14px;margin:16px 0;font-size:14px')+
css('#todayActions.app-today-v3 .mt-today-footer a','color:#050505;-webkit-text-fill-color:#050505')+
css('main :is(#grubStatus,#fitStatus,[role="status"]):empty','display:none')+
css('main .sf-exercise.mp-exercise','background:transparent;color:#050505;border-bottom:1px solid #707762')+
css('main .sf-exercise details','background:#e7e3da;color:#050505;border-color:#707762')+
css('main .sf-number','background:#707762;color:#000')+
css('main .sf-session-head h3','font-size:25px')+
css('main .sf-session-head>div:first-child','min-width:0;flex:1')+
css('main .sf-session','overflow-wrap:anywhere')+
css('main .sf-ring :is(strong,small)','color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
css('main #panel-journey','background:transparent;color:#050505;border:0;padding:0')+
css('main .mj-hero','background:transparent;color:#050505;border:0;padding:0;margin:0 0 18px')+
css('main .mj-hero :is(h2,p,span)','color:#050505;-webkit-text-fill-color:#050505')+
css('main :is(.mj-next,.mj-setup-section,.mj-error,.mj-stat-grid article,.mj-story-grid article)','background:#e7e3da;color:#050505;border:0;border-radius:12px;padding:16px')+
css('main .mj-setup-section legend','background:#e7e3da;color:#050505')+
css('main .mj-next :is(p,h3,small,a)','color:#050505;-webkit-text-fill-color:#050505')+
css('main :is(.shift-progress-intro,.shift-progress-metric,.shift-progress-milestones,.mp-picture-intro)','background:#e7e3da;color:#050505;border:0;border-radius:12px;padding:16px')+
css('main :is(.shift-progress-intro,.mp-picture-intro)','display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:16px')+
css('main :is(.shift-progress-intro,.mp-picture-intro-copy) :is(h3,p,.eyebrow)','color:#050505;-webkit-text-fill-color:#050505')+
css('main .mp-picture-intro-copy','background:transparent;color:#050505;padding:0')+
css('main #panel-visualise .mp-picture-intro','display:grid;grid-template-columns:1fr')+
css('main #panel-visualise :is(.mp-picture-intro-copy,.mp-picture-trust)','grid-column:1/-1;width:100%;max-width:none;min-width:0;box-sizing:border-box')+
css('main #grubDiscoverResults :is(p,strong,small):not(button *)','color:#050505;-webkit-text-fill-color:#050505')+
css('main .mp-picture-intro h3','font-size:28px;line-height:1.15')+
css('main :is(.shift-progress-nudge,.shift-progress-score,.mp-picture-trust)','background:#050505;color:#e7e3da;border:0;border-radius:12px;padding:16px')+
css('main :is(.shift-progress-nudge,.shift-progress-score,.mp-picture-trust) :is(strong,span,small)','color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
css('main .sf-current-step','background:#e7e3da;color:#050505')+
css('main .sf-current-step :is(h3,p,summary)','color:#050505;-webkit-text-fill-color:#050505')+
css('main #journeyView>.hero','display:grid;grid-template-columns:minmax(0,1fr) 130px;gap:14px;padding:0 0 18px;align-items:center')+
css('main #journeyView .hero-copy','text-align:left')+
css('main :is(#scoreCaption,#comparison)','color:#050505;-webkit-text-fill-color:#050505;background:#e7e3da;border-radius:8px;padding:8px;font-size:14px')+
css('main #journeyView .section-heading','gap:10px;flex-wrap:wrap;align-items:center')+
css('main #journeyView .section-heading h2','font-size:16px;line-height:1.35;letter-spacing:.06em;min-width:0')+
css('main #journeyView .section-heading .text-button','white-space:normal;text-align:left;max-width:100%;box-sizing:border-box')+
css('main #journeyView .score-block','min-width:0')+
css('main #journeyView .score-ring','background:#050505;color:#e7e3da;width:100%;max-width:130px;height:auto;aspect-ratio:1')+
css('main #journeyView .timeline-grid','grid-template-columns:repeat(3,minmax(0,1fr))')+
css('main #journeyView .timeline-card>div','min-width:0')+
css('main #journeyView .score-content :is(strong,span)','color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
css('main .area-number|main .area-number>*','color:#050505;-webkit-text-fill-color:#050505')+
css('main .member-progress-map','background:#e7e3da;color:#050505;border:0')+
css('main .member-progress-map a','background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
css('main #memberDetailsPanel','background:#e7e3da;color:#050505;border:0;padding:16px')+
css('main :is(.md-section,.md-panel)','padding:12px 0')+
css('main #memberDayGuide|.app-footer-details[data-app-guide]','background:#e7e3da;color:#050505;border:0;border-radius:12px;margin:16px 0;padding:14px')+
css('main #memberDayGuide :is(p,h2,h3,summary,a)|.app-footer-details[data-app-guide]>summary','color:#050505;-webkit-text-fill-color:#050505')+
css('#sstTreatmentJourney:empty','display:none')+
scope+'[data-app-tool]:not([data-app-tool="today"]) #todayActions.app-today-v3{min-height:0!important}\n'+
scope+'[data-app-tool]:not([data-app-tool="today"]) :is(#sstTodayContext,#sstTreatmentJourney,#sstFiveLoops){display:none!important}\n'+
scope+'[data-app-tool]:not([data-app-tool="today"]) #todayActions.app-today-v3>:not(.app-today-shortcuts){display:none!important}\n'+
scope+'[data-app-panel="1"]{padding:0!important;background:#707762!important}\n'+
scope+'[data-app-panel="1"] main{padding:0!important;margin:0!important;min-height:0!important;max-width:none!important}\n'+
scope+'[data-app-panel="1"] :is(#todayBrand,#appBottomNav,#sst-footer-c,footer,.app-footer-details,#memberUtilities,#myTimberApp){display:none!important}\n'+
'@media(max-width:640px){'+css('main','padding:18px 14px 24px')+css('#todayActions.app-today-v3 .today-layout','display:flex;flex-direction:column;gap:12px')+css('#todayActions.app-today-v3 .today-layout>*','width:100%;box-sizing:border-box')+css('#todayActions.app-today-v3 .today-movement','order:-1')+css('main #journeyView>.hero','grid-template-columns:minmax(0,1fr) 112px')+css('main #journeyView .timeline-grid','grid-template-columns:minmax(0,1fr)')+css('main #journeyView .timeline-card>div','display:block;min-width:0')+css('main #journeyView .timeline-card .comparison','max-width:none')+css('main .grub-spotlight','grid-template-columns:repeat(2,minmax(0,1fr))')+css('main :is(.shift-progress-intro,.mp-picture-intro)','grid-template-columns:1fr')+'}\n'+
css('main :is(a,button,summary,input,select,textarea):focus-visible','outline:3px solid #050505;outline-offset:3px')+
css('#appBottomNav :is(a,button):focus-visible|#todayBrand a:focus-visible','outline:3px solid #e7e3da;outline-offset:2px')+
scope+' [hidden]:is(#approved-member-hidden,[hidden]):is(#approved-member-hidden-rule,[hidden]){display:none!important}\n'+
'@media print{'+css('#todayBrand|#appBottomNav','display:none')+'}';

const paths={today:'M3 11 12 3l9 8M5 10v11h5v-6h4v6h5V10',journey:'M5 20v-5m7 5V9m7 11V4',grub:'M5 3v7m3-7v7M3 3v6a3 3 0 0 0 6 0M6 12v9M18 3v18m0-18c-5 3-5 10 0 10',fit:'M4 8v8m3-11v14m10-14v14m3-11v8M7 12h10',more:'M4 12h.01M12 12h.01M20 12h.01',account:'M16 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0M4 21v-2a8 8 0 0 1 16 0v2'};
const icon=key=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+paths[key]+'"/></svg>';
const header='<header id="todayBrand" data-member-design-header><a href="/member/dashboard#today"><img class="member-design-mark" src="/fit-v3-images/sst-header-brand-mark-20261001.png" width="42" height="42" alt=""><span>MY TIMBER</span></a><a class="member-design-account" href="/member/settings" aria-label="Your account">'+icon('account')+'</a></header>';
const bottom='<nav id="appBottomNav" aria-label="My Timber navigation">'+[['Today','today','/member/dashboard#today'],['Journey','journey','/member/dashboard#journey'],['Grub','grub','/member/grub'],['Fit','fit','/member/fit']].map(([label,key,href])=>'<a href="'+href+'"'+(['grub','fit'].includes(key)?' data-app-open="'+key+'"':'')+'>'+icon(key)+'<span>'+label+'</span></a>').join('')+'<button id="appMore" type="button" aria-expanded="false">'+icon('more')+'<span>More</span></button></nav>';
export function memberDesignDocument(html){
 if(!html.includes('data-app-layout="preview"')||html.includes('data-member-design="20261001"'))return html;
 return html.replace(/<body([^>]*)>/,(_,attrs)=>'<body'+attrs+' data-member-design="20261001">'+header)
  .replace(/<nav id="appBottomNav"[\s\S]*?<\/nav>/,bottom)
  .replace('</body>','<style data-approved-member-design>'+memberDesignStyles+'</style></body>');
}
export const memberDesignClient=String.raw`(()=>{
 if(document.body.dataset.memberDesign!=='20261001')return;
 let queued=false,activeTool=null;
 const scrollingFrames=new WeakSet();
 function outerScroll(frame){
  try{
   const win=frame.contentWindow;if(!win||!frame.contentDocument?.querySelector('main'))return;
   const reset=()=>{if(win.scrollY||win.scrollX)win.scrollTo({top:0,left:0,behavior:'instant'})};
   if(!scrollingFrames.has(frame)){frame.setAttribute('scrolling','no');win.addEventListener('scroll',reset,{passive:true});scrollingFrames.add(frame)}
   reset();
  }catch{}
 }
 function compose(){
  if(document.body.dataset.memberPage!=='dashboard'){const main=document.querySelector('main'),follow=document.getElementById('dailyCheckinFollowup');if(main&&follow){const card=follow.closest('details')||follow;if(main.contains(card)&&main.lastElementChild!==card)main.append(card);}}
  const root=document.getElementById('todayActions');
  if(root?.classList.contains('app-today-v3')){
   const nav=root.querySelector('.app-today-shortcuts'),layout=root.querySelector('.today-layout'),next=root.querySelector('.mtm-next'),focus=root.querySelector('.today-focus');
   if(nav&&next&&nav.nextElementSibling!==next)nav.after(next);
   if(layout&&focus&&focus.previousElementSibling!==layout)layout.after(focus);
  }
  const tool=document.body.dataset.appTool,hash=location.hash||'#today';
  if(tool&&tool!==activeTool){const previous=activeTool;activeTool=tool;if(previous!==null)window.scrollTo({top:0,left:0,behavior:'instant'});}
  if(tool&&tool!=='today')outerScroll(document.querySelector('#appTool-'+tool+' iframe'));
  document.querySelectorAll('#appBottomNav a').forEach(a=>{
   const u=new URL(a.href),name=u.pathname.split('/').pop();
   if(['grub','fit'].includes(name)){const inline=document.body.dataset.memberPage==='dashboard'&&document.getElementById('appToolPanels');if(inline&&a.getAttribute('data-app-open')!==name)a.setAttribute('data-app-open',name);else if(!inline&&a.hasAttribute('data-app-open'))a.removeAttribute('data-app-open');}
   const selected=document.body.dataset.memberPage==='dashboard'?(tool&&tool!=='today'?name===tool:name==='dashboard'&&u.hash===hash):name===document.body.dataset.memberPage;
   if(selected&&a.getAttribute('aria-current')!=='page')a.setAttribute('aria-current','page');else if(!selected&&a.hasAttribute('aria-current'))a.removeAttribute('aria-current');
  });
 }
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;compose()})};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{compose();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-app-tool','style']})},{once:true});else{compose();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-app-tool','style']})}
 document.addEventListener('load',event=>{if(event.target.matches?.('.app-tool-frame'))schedule()},true);
 document.addEventListener('sst:today-rendered',schedule);addEventListener('hashchange',schedule);addEventListener('popstate',schedule);
})();`;
