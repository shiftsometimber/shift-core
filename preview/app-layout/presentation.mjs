import {focusStyles,focusClient} from './personal-focus.mjs';
import {todayStyles,todayClient} from './today.mjs';
import {refinementStyles,refinementClient} from './refinement.mjs';
import {tabStyles,tabClient} from './tabs.mjs';
import {screenStyles,screenClient} from './screens.mjs';
// App presentation uses the existing account and tool runtimes; no native bridge.
export const appStyles=String.raw`
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]){background:#050505!important;font-family:Arial,Helvetica,sans-serif!important;padding-bottom:90px!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) main{max-width:780px!important;background:#050505!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]):not([data-member-page="dashboard"]):not([data-member-page="life-back"]){background:#e7e3da!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]):not([data-member-page="dashboard"]):not([data-member-page="life-back"]) main{background:#e7e3da!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout])[data-member-page="life-back"]{color:#e7e3da!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) :is(main,main p,main h1,main h2,main h3){font-family:Arial,Helvetica,sans-serif!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) :is(main,#todayActions.mtm-home) [data-member-hero="v1"]{min-height:0!important;padding:24px 0!important;background:#050505!important;margin-bottom:18px!important;border-radius:0!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) :is(main,#todayActions.mtm-home) [data-member-hero="v1"]:after{display:none!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) :is(main,#todayActions.mtm-home) [data-member-hero="v1"]>div{max-width:100%!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) :is(main,#todayActions.mtm-home) [data-member-hero="v1"] :is(h1,h2){font-size:32px!important;line-height:1.12!important;font-weight:800!important;letter-spacing:-.035em!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) nav.sst-member-tabs{display:none!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout])[data-app-more="open"] nav.sst-member-tabs{display:flex!important;flex-wrap:wrap!important;position:relative!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) #todayActions.mtm-home .mtm-dashboard{grid-template-columns:1fr!important;gap:16px!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) #todayActions.mtm-home .mtm-panel{padding:20px!important;border-color:#707762!important;border-radius:16px!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) #todayActions.mtm-home .mtm-next{background:#e7e3da!important;color:#050505!important;padding:24px!important;border-radius:16px!important;margin:0 0 16px!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) #todayActions.mtm-home .mtm-next :is(h3,p,small,strong,span,a){color:#050505!important;-webkit-text-fill-color:#050505!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) #todayActions.mtm-home .mtm-next .mt-now-action{display:flex!important;justify-content:center;width:100%!important;background:#050505!important;color:#e7e3da!important;-webkit-text-fill-color:#e7e3da!important;min-height:50px!important;margin-top:18px!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) #dailyCheckinFollowup{padding:20px!important;border-radius:16px!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) #todayActions.mtm-home .mtm-feelings{grid-template-columns:1fr!important}
html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) :is(button,a,summary):focus-visible{outline:3px solid #707762!important;outline-offset:3px!important}
#appPreviewBar{padding:10px 16px;background:#e7e3da;color:#050505;font:13px/1.5 Arial,sans-serif}#appPreviewBar a{color:#050505;text-decoration:underline}
#appBottomNav{position:fixed;z-index:45;bottom:0;left:0;right:0;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:10px 12px max(10px,env(safe-area-inset-bottom));background:#050505;border-top:1px solid #707762;color:#e7e3da;font:700 13px/1.3 Arial,sans-serif}
#appBottomNav :is(a,button){display:flex;align-items:center;justify-content:center;min-height:48px;border:0;border-radius:9px;text-decoration:none;background:transparent;color:#e7e3da;font:inherit;cursor:pointer}
#appBottomNav [aria-current="page"]{background:#e7e3da;color:#050505}
@media(min-width:800px){#appBottomNav{max-width:780px;margin:auto;border:1px solid #707762;border-radius:14px 14px 0 0}}

.app-review-account{font:12px/1.4 Arial,Helvetica,sans-serif;background:#e7e3da;color:#050505;padding:4px 16px}.app-review-account summary{cursor:pointer;min-height:24px}.app-review-account aside{overflow-wrap:anywhere}


html body[data-app-layout="preview"]:is(#app-preview-scope,[data-app-layout]) .app-footer-details{max-width:980px;margin:20px auto;padding:16px 20px;color:#e7e3da;border-top:1px solid #46503d;font:13px/1.5 Arial,Helvetica,sans-serif}.app-footer-details>summary{cursor:pointer;min-height:44px}.app-footer-details>summary::marker{color:#b4c39a}

@media print{#appBottomNav,#appPreviewBar{display:none!important}}
`+screenStyles+tabStyles+refinementStyles+todayStyles+focusStyles;
export const appClient=todayClient+focusClient+screenClient+String.raw`(()=>{
 function current(){document.querySelectorAll('#appBottomNav a').forEach(a=>{const u=new URL(a.href),match=u.pathname.replace('/staging/member-connected/','/member/')===location.pathname.replace('/staging/member-connected/','/member/')&&(u.hash?u.hash===(location.hash||'#today'):true);if(match){if(a.getAttribute('aria-current')!=='page')a.setAttribute('aria-current','page')}else a.removeAttribute('aria-current')})}
 document.addEventListener('click',e=>{const more=e.target.closest?.('#appMore');if(!more)return;const open=document.body.dataset.appMore!=='open';document.body.dataset.appMore=open?'open':'closed';more.setAttribute('aria-expanded',String(open));if(open){const nav=document.querySelector('.sst-member-tabs');nav?.scrollIntoView({block:'start'});nav?.querySelector('a')?.focus()}},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.dataset.appMore==='open'){document.body.dataset.appMore='closed';const more=document.getElementById('appMore');more?.setAttribute('aria-expanded','false');more?.focus()}});
 
 function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n}

 function boot(){current();if(document.body.dataset.memberPage==='dashboard')document.querySelectorAll('footer').forEach(footer=>{if(footer.closest('main,details'))return;const details=el('details','app-footer-details');details.append(el('summary','','Help & legal'));footer.before(details);details.append(footer)});const account=document.getElementById('connected-account')?.closest('aside');if(account&&!account.closest('details')){const details=el('details','app-review-account');details.append(el('summary','','Fictional review account'));account.before(details);details.append(account)}const bar=document.getElementById('appBottomNav');if(bar)new MutationObserver(current).observe(bar,{subtree:true,attributes:true,attributeFilter:['href']})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();addEventListener('hashchange',current);
})();`+tabClient+refinementClient;
export function appPresentation(html,path,embedded=false){
 path=path.replace('/staging/member-connected/','/member/').replace(/\.html$/,'');
 if(!/^\/member\/(dashboard|grub|fit|life-back|check-in|settings|saved|plans|orders|ask-timber)$/.test(path)||html.includes('data-app-layout="preview"'))return html;
 if(!html.includes('data-member-chrome="v1"'))return html;
 const bar='<aside id="appPreviewBar">APP LAYOUT PREVIEW · fictional accounts only · <a href="?view=web">Compare website view</a> · <a href="/__app-review">Review &amp; health connections</a></aside>';
 const nav='<nav id="appBottomNav" aria-label="App navigation"><a href="/member/dashboard#today">Today</a><a href="/member/dashboard#visualise">Progress</a><a href="/member/life-back">Life Back</a><button id="appMore" type="button" aria-expanded="false">More</button></nav>';
 return html.replace(/<body([^>]*)>/,(_,a)=>'<body'+a+' data-app-layout="preview"'+(embedded?' data-app-panel="1"':'')+'>'+bar).replace('</body>','<style data-app-preview-style>'+appStyles+'</style>'+nav+'<script defer src="/__app-layout.mjs"></script></body>');
}
