// Persistent same-origin tool panels: reuse each tool's original runtime and account.
export const tabStyles=String.raw`
html body[data-app-layout="preview"][data-app-tool]:not([data-app-tool="today"]) #todayActions>:not(.mtm-hero):not(.app-today-shortcuts){display:none!important}
html body[data-app-layout="preview"][data-app-tool]:not([data-app-tool="today"]) [data-app-guide]{display:none!important}
html body[data-app-layout="preview"] .app-today-shortcuts a{background:transparent!important}
html body[data-app-layout="preview"] .app-today-shortcuts a[aria-selected="true"]{background:#303a27!important;color:#e7e3da!important}
#appToolPanels{margin-top:16px;min-width:0}#appToolPanels[hidden],#appToolPanels>[hidden]{display:none!important}
.app-tool-frame{display:block;width:100%;height:400px;border:0;background:#050505;color-scheme:dark}
.app-tool-loading{padding:18px;color:#e7e3da;font:14px/1.5 Arial,sans-serif}.app-tool-loading a{color:inherit}
html body[data-app-layout="preview"][data-app-panel="1"]:is(#app-preview-scope,[data-app-layout]){padding:0!important;margin:0!important;min-height:0!important}
html body[data-app-layout="preview"][data-app-panel="1"]:is(#app-preview-scope,[data-app-layout]) main{padding:0!important;min-height:0!important;max-width:none!important}
html body[data-app-panel="1"] [data-app-panel-chrome],html body[data-app-panel="1"] :is(#appPreviewBar,#appBottomNav,.app-footer-details,.app-review-account,.sst-member-tabs){display:none!important}
html body[data-app-panel="1"] dialog[open]{position:fixed!important;top:var(--app-dialog-top,16px)!important;bottom:auto!important;left:0!important;right:0!important;margin:0 auto!important;transform:none!important;max-height:var(--app-dialog-height,70vh)!important}
`;
export const tabClient=String.raw`
(()=>{
 const toolKeys=['today','fit','grub','life-back'];
 if(document.body.dataset.appPanel==='1'){
  function trim(){const main=document.querySelector('main');if(!main)return;let n=main;while(n&&n!==document.body){for(const sibling of n.parentElement.children){if(sibling===n||sibling.matches('script,style,link,dialog,[role="dialog"],#memberSessionStatus'))continue;if(!sibling.hasAttribute('data-app-panel-chrome'))sibling.setAttribute('data-app-panel-chrome','')}n=n.parentElement}}
  trim();new MutationObserver(trim).observe(document.body,{childList:true,subtree:true});return;
 }
 if(document.body.dataset.memberPage!=='dashboard')return;
 const panels=new Map();let chosen='today',host;
 function queryTool(){const v=new URL(location.href).searchParams.get('tool');return toolKeys.includes(v)?v:'today'}
 function syncTabs(){const nav=document.querySelector('.app-today-shortcuts');if(!nav)return;nav.setAttribute('role','tablist');nav.setAttribute('aria-label','My Timber tools');nav.querySelectorAll('a').forEach((a,i)=>{const key=toolKeys[i];a.dataset.appTab=key;a.id='appTab-'+key;a.setAttribute('role','tab');a.setAttribute('aria-selected',String(chosen===key));a.setAttribute('tabindex',chosen===key?'0':'-1');if(key!=='today')a.setAttribute('aria-controls','appTool-'+key)});document.body.dataset.appTool=chosen}
 function measure(frame){try{const d=frame.contentDocument,main=d?.querySelector('main');if(!main)return;const h=Math.ceil(main.getBoundingClientRect().height+main.getBoundingClientRect().top+40);if(Math.abs(parseFloat(frame.style.height||'400')-h)>2)frame.style.height=Math.max(360,h)+'px';const top=Math.max(16,-frame.getBoundingClientRect().top+16);d.documentElement.style.setProperty('--app-dialog-top',top+'px');d.documentElement.style.setProperty('--app-dialog-height',Math.max(220,innerHeight-120)+'px')}catch{}}
 function createPanel(key){const panel=document.createElement('section');panel.id='appTool-'+key;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','appTab-'+key);const loading=document.createElement('p');loading.className='app-tool-loading';loading.setAttribute('role','status');loading.textContent='Loading '+({'fit':'Shift Fit','grub':'Shift Grub','life-back':'Life Back'}[key])+'…';const frame=document.createElement('iframe');frame.className='app-tool-frame';frame.title={'fit':'Shift Fit','grub':'Shift Grub','life-back':'Life Back'}[key];frame.src='/member/'+key+'?view=app&app_panel=1';panel.append(loading,frame);host.append(panel);panels.set(key,{panel,frame});
 frame.addEventListener('load',()=>{try{const d=frame.contentDocument;if(!d?.querySelector('main')){loading.textContent='This tool could not load. ';const a=document.createElement('a');a.href='/member/'+key+'?view=app';a.textContent='Open '+frame.title;a.target='_top';loading.append(a);return}loading.hidden=true;const ro=new ResizeObserver(()=>measure(frame));ro.observe(d.querySelector('main'));measure(frame);d.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const u=new URL(a.href),path=u.pathname.replace('/staging/member-connected/','/member/');if(u.origin===location.origin){const next=toolKeys.find(k=>k!=='today'&&path==='/member/'+k);if(next){e.preventDefault();select(next,true);return}if(path==='/member/dashboard'&&(!u.hash||u.hash==='#today')){e.preventDefault();select('today',true);return}if(u.pathname===new URL(frame.src).pathname&&u.hash)return}if(!a.target)a.target='_top'},true)}catch{loading.textContent='Unable to load this tool.'}});
 }
 function select(key,push=false){if(!toolKeys.includes(key))key='today';chosen=key;syncTabs();if(!host)return;host.hidden=key==='today';if(key!=='today'&&!panels.has(key))createPanel(key);panels.forEach((v,k)=>{v.panel.hidden=k!==key;if(k===key)requestAnimationFrame(()=>measure(v.frame))});if(push){const u=new URL(location.href);if(key==='today')u.searchParams.delete('tool');else u.searchParams.set('tool',key);u.hash='today';history.pushState(null,'',u)} }
 function mount(){const root=document.getElementById('todayActions');if(!root?.querySelector('.app-today-shortcuts'))return;if(!host){host=document.createElement('div');host.id='appToolPanels';host.hidden=true;root.after(host)}select(queryTool())}
 document.addEventListener('click',e=>{const tab=e.target.closest?.('[data-app-tab]');if(!tab||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();select(tab.dataset.appTab,true)},true);
 document.addEventListener('keydown',e=>{const tab=e.target.closest?.('[data-app-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=toolKeys.indexOf(tab.dataset.appTab),next=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;document.querySelector('[data-app-tab="'+toolKeys[next]+'"]').focus();select(toolKeys[next],true)});
 addEventListener('popstate',()=>select(queryTool()));addEventListener('resize',()=>panels.forEach(v=>measure(v.frame)));addEventListener('scroll',()=>{const v=panels.get(chosen);if(v)measure(v.frame)},{passive:true});
 document.addEventListener('sst:today-rendered',()=>queueMicrotask(mount));if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();`;
