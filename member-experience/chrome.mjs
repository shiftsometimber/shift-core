// Shared presentation only: no API calls, account writes or authentication changes.
export const memberChromeVersion='member-chrome-20260917-v1';
export function memberNavigation(work=false){
 const links=[['/member/dashboard#today','Today'],['/member/dashboard#journey','Journey'],['/member/grub','Grub'],['/member/fit','Fit'],['/member/check-in','Check-in'],['/member/life-back','Life Back']];
 return '<span class="member-nav-label">MY TIMBER</span><div class="member-nav-tools">'+links.map(([href,label])=>'<a href="'+href+'">'+label+'</a>').join('')+'</div><details class="member-nav-more"><summary>More</summary><div><a class="mp-tab" data-panel="visualise" href="/member/dashboard#visualise">Progress &amp; photos</a><a class="mp-tab" data-panel="plans" href="/member/dashboard#plans">My Plans</a><a href="/member/saved">Saved &amp; records</a><a href="/member/settings">Settings &amp; privacy</a><a href="/member/ask-timber">Ask Timber</a>'+(work?'<a href="/member/work">My workplace programme</a>':'')+'</div></details>';
}
export const memberChromeStyles=String.raw`
html body[data-member-chrome="v1"][data-member-page] main{max-width:1180px!important;width:100%!important;box-sizing:border-box!important;margin:0 auto!important;padding:28px 24px 64px!important}
html body[data-member-chrome="v1"][data-member-page] nav.sst-member-tabs{position:relative;z-index:30;display:flex;align-items:center;justify-content:flex-start;flex-wrap:nowrap;gap:22px;box-sizing:border-box;width:100%;padding:12px max(24px,calc((100vw - 1132px)/2));margin:0;background:#11140f!important;border:0!important;color:#e7e3da!important;overflow:visible;font:700 15px/1.4 Arial,sans-serif}
html body[data-member-chrome="v1"] nav.sst-member-tabs .member-nav-label{font-size:12px;letter-spacing:.15em;font-weight:800;color:#c2c9b1;white-space:nowrap}
html body[data-member-chrome="v1"] nav.sst-member-tabs .member-nav-tools{display:flex;align-items:center;gap:4px;flex:1;min-width:0}
html body[data-member-chrome="v1"][data-member-page] nav.sst-member-tabs a{display:inline-block;font:700 15px/1.4 Arial,sans-serif!important;padding:10px 14px!important;border:0!important;border-radius:6px!important;background:transparent!important;color:#e7e3da!important;-webkit-text-fill-color:currentColor!important;text-decoration:none;white-space:nowrap}
html body[data-member-chrome="v1"][data-member-page] nav.sst-member-tabs a:is([aria-current=page],:hover,:focus-visible){background:#e7e3da!important;color:#050505!important;-webkit-text-fill-color:#050505!important}
html body[data-member-chrome="v1"] nav.sst-member-tabs a *{color:inherit!important;-webkit-text-fill-color:currentColor!important}
html body[data-member-chrome="v1"] nav.sst-member-tabs .member-nav-more{position:relative;flex-shrink:0;color:#e7e3da;background:none;border:0;margin:0;padding:0}
html body[data-member-chrome="v1"] nav.sst-member-tabs summary{cursor:pointer;padding:10px 8px;font:700 15px/1.4 Arial,sans-serif;min-height:44px;box-sizing:border-box}
html body[data-member-chrome="v1"] nav.sst-member-tabs .member-nav-more>div{position:absolute;right:0;top:100%;width:260px;max-width:calc(100vw - 32px);padding:10px;box-sizing:border-box;background:#11140f;border:1px solid #707762;box-shadow:0 14px 28px #05050533}
html body[data-member-chrome="v1"][data-member-page] nav.sst-member-tabs .member-nav-more a{display:block!important;white-space:normal}
html body[data-member-chrome="v1"] nav.sst-member-tabs :is(a,summary):focus-visible{outline:2px solid #707762;outline-offset:3px}
html body[data-member-chrome="v1"] :is(main,#todayActions.mtm-home) [data-member-hero="v1"]{position:relative!important;isolation:isolate;display:block!important;overflow:hidden!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;min-height:218px!important;margin:0 0 28px!important;padding:36px 42% 36px 32px!important;border:0!important;border-radius:16px!important;background:#11140f!important;color:#e7e3da!important;box-shadow:none!important}
html body[data-member-chrome="v1"] :is(main,#todayActions.mtm-home) [data-member-hero="v1"]:after{content:''!important;display:block!important;position:absolute!important;inset:0 0 0 58%!important;z-index:-1!important;opacity:1!important;background:linear-gradient(90deg,#11140f 0%,#11140f00 60%),url('/assets/home-hero-men-v32o.jpg') center/cover no-repeat!important;background-position:center,center 28%!important;pointer-events:none}
html body[data-member-chrome="v1"] :is(main,#todayActions.mtm-home) [data-member-hero="v1"]>div{max-width:100%!important;min-width:0;position:relative}
html body[data-member-chrome="v1"] :is(main,#todayActions.mtm-home) [data-member-hero="v1"] :is(h1,h2){margin:8px 0 16px!important;font-size:clamp(32px,4.1vw,48px)!important;font-weight:800!important;line-height:1.05!important;font-family:inherit!important;letter-spacing:-.04em!important;color:#e7e3da!important;-webkit-text-fill-color:currentColor!important;max-width:650px!important}
html body[data-member-chrome="v1"] :is(main,#todayActions.mtm-home) [data-member-hero="v1"] :is(p,span){color:#dadfd0!important;-webkit-text-fill-color:currentColor!important;font:400 17px/1.5 Arial,sans-serif!important;margin:0!important}
html body[data-member-chrome="v1"] :is(main,#todayActions.mtm-home) [data-member-hero="v1"] :is(.eyebrow,.sf-kicker,.mtm-kicker),html body[data-member-chrome="v1"] main .mj-hero[data-member-hero="v1"]>p:first-child{font-size:11px!important;font-weight:800!important;letter-spacing:.13em!important;color:#c5cdb3!important}
html body[data-member-chrome="v1"] :is(main,#todayActions.mtm-home) [data-member-hero="v1"] :is(h1,h2) :is(span,em,strong){font:inherit!important;color:inherit!important;letter-spacing:inherit!important;-webkit-text-fill-color:currentColor!important}
html body[data-member-chrome="v1"] #todayActions.mtm-home .mtm-hero[data-member-hero="v1"]>img{display:none!important}
html body[data-member-chrome="v1"] main .member-shell{margin:0!important;width:100%!important;max-width:none!important}
html body[data-member-chrome="v1"] :is(#panel-plans,#panel-visualise){padding:0!important;border:0!important;background:transparent!important}
html body[data-member-chrome="v1"][data-member-page="life-back"] .workspace{max-width:none;padding:0}
html body[data-member-chrome="v1"][data-member-page="life-back"] .hero{padding-top:0;min-height:0}
@media(max-width:900px){html body[data-member-chrome="v1"] nav.sst-member-tabs .member-nav-label{display:none}}
@media(max-width:600px){
 html body[data-member-chrome="v1"][data-member-page] main{padding:20px 16px 48px!important}
 html body[data-member-chrome="v1"][data-member-page] nav.sst-member-tabs{flex-wrap:wrap;gap:4px;padding:8px 12px}
 html body[data-member-chrome="v1"] nav.sst-member-tabs .member-nav-tools{flex:1 1 100%;justify-content:space-between;gap:0}
 html body[data-member-chrome="v1"][data-member-page] nav.sst-member-tabs .member-nav-tools a{padding:10px 6px!important;font-size:13px!important}
 html body[data-member-chrome="v1"] nav.sst-member-tabs .member-nav-more{margin-left:auto}
 html body[data-member-chrome="v1"] :is(main,#todayActions.mtm-home) [data-member-hero="v1"]{padding:24px 34% 24px 20px!important;min-height:218px!important;border-radius:12px!important}
 html body[data-member-chrome="v1"] :is(main,#todayActions.mtm-home) [data-member-hero="v1"]:after{inset:0 0 0 62%!important}
 html body[data-member-chrome="v1"] :is(main,#todayActions.mtm-home) [data-member-hero="v1"] :is(h1,h2){font-size:28px!important}
 html body[data-member-chrome="v1"] :is(main,#todayActions.mtm-home) [data-member-hero="v1"] :is(p,span){font-size:15px!important}
}
@media print{html body[data-member-chrome="v1"] nav.sst-member-tabs{display:none!important}html body[data-member-chrome="v1"] :is(main,#todayActions.mtm-home) [data-member-hero="v1"]:after{display:none!important}}
`;
export const memberChromeClient=String.raw`(()=>{
 'use strict';
 if(document.body.dataset.memberChrome!=='v1')return;
 const page=document.body.dataset.memberPage,all=s=>[...document.querySelectorAll(s)];
 const mark=el=>{if(el&&el.dataset.memberHero!=='v1')el.dataset.memberHero='v1';};
 function wrap(heading,container){
  if(!heading||heading.closest('[data-member-hero]'))return;
  const nodes=[heading],previous=heading.previousElementSibling;
  if(previous?.matches('.eyebrow,.sf-kicker,.mtm-kicker'))nodes.unshift(previous);
  const following=heading.nextElementSibling;
  if(following?.matches('p,.intro')&&!following.querySelector('input,button,select,textarea'))nodes.push(following);
  const hero=document.createElement('header');hero.className='member-tool-hero';hero.dataset.memberHero='v1';
  (container||nodes[0]).before(hero);nodes.forEach(node=>hero.append(node));
 }
 function refresh(){
  all('.member-tool-hero,.mj-hero,.mt-arrival,.mtm-hero').forEach(mark);
  if(page==='dashboard'){
   wrap(document.querySelector('#panel-plans > h2'));
   wrap(document.querySelector('#panel-visualise > h2'));
  }else if(page==='life-back'){
   wrap(document.querySelector('#journeyView .hero-copy h1'),document.querySelector('#journeyView > .hero'));
  }else if(!document.querySelector('main [data-member-hero]')){
   wrap(document.querySelector('main h1'));
  }
  const hash=['#journey','#progress','#lifeback'].includes(location.hash)?'#journey':['#visualise','#plans'].includes(location.hash)?location.hash:'#today';
  const current=page==='dashboard'?'/member/dashboard'+hash:'/member/'+page;
  all('.sst-member-tabs a').forEach(a=>{
   const u=new URL(a.href),path=u.pathname.replace('/staging/member-connected/','/member/').replace(/\.html$/,'')+u.hash;
   if(path===current){if(a.getAttribute('aria-current')!=='page')a.setAttribute('aria-current','page')}else if(a.hasAttribute('aria-current'))a.removeAttribute('aria-current');
  });
 }
 refresh();window.addEventListener('hashchange',refresh);
 let queued=false;new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;refresh()})}}).observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
 const more=document.querySelector('.member-nav-more');
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&more?.open){more.open=false;more.querySelector('summary').focus()}});
 document.addEventListener('click',e=>{if(more?.open&&!more.contains(e.target))more.open=false});
})();`;
export function addMemberChrome(html,name){
 if(html.includes('data-member-chrome="v1"'))return html;
 return html.replace(/<body([^>]*)>/,(_,attrs)=>'<body'+attrs+' data-member-chrome="v1"'+(attrs.includes('data-member-page=')?'':' data-member-page="'+name+'"')+'>')
  .replace('</body>','<link rel="stylesheet" href="/assets/member-experience/chrome.css?v='+memberChromeVersion+'"><script defer src="/assets/member-experience/chrome.mjs?v='+memberChromeVersion+'"></script></body>');
}
export function lifeBackChrome(html,work=false){
 return addMemberChrome(html.replace(/<div class="preview-strip">[\s\S]*?<\/header>/,'<nav class="sst-member-tabs" aria-label="My Timber">'+memberNavigation(work)+'</nav>').replace(/<nav class="member-nav"[^>]*>[\s\S]*?<\/nav>/,''),'life-back');
}
