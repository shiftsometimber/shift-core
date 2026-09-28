// Same tested switching controller, retaining the website's existing presentation.
import {tabClient,tabStyles} from './preview/app-layout/tabs.mjs';
export const webToolsAsset='/assets/my-timber-web-tools.mjs';
export const webToolsClient=String.raw`
(()=>{function mount(){const root=document.getElementById('todayActions'),hero=root?.querySelector('.mtm-hero');if(!hero||root.querySelector('.app-today-shortcuts'))return;const nav=document.createElement('nav');nav.className='app-today-shortcuts';nav.setAttribute('aria-label','Today tools');for(const [name,path]of [['Today','dashboard#today'],['Shift Fit','fit'],['Shift Grub','grub'],['Life Back','life-back']]){const a=document.createElement('a');a.href='/member/'+path;a.textContent=name;nav.append(a)}hero.after(nav)}document.addEventListener('sst:today-rendered',()=>queueMicrotask(mount));if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount()})();
`+tabClient.replaceAll('view=app','view=web');
export const webToolsStyles=tabStyles.replaceAll('data-app-layout="preview"','data-web-tabs="1"').replaceAll('[data-app-layout]','[data-web-tabs]').replace('background:#050505;color-scheme:dark','background:#e7e3da;color-scheme:light')+String.raw`
body[data-web-tabs="1"] .app-today-shortcuts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 24px;padding:8px;border:1px solid #707762;border-radius:12px;background:#11140f;font:700 15px/1.4 Arial,Helvetica,sans-serif}
body[data-web-tabs="1"] .app-today-shortcuts a{display:flex;align-items:center;justify-content:center;min-height:48px;padding:8px;color:#e7e3da!important;text-align:center;text-decoration:none;border-radius:7px;box-sizing:border-box}
body[data-web-tabs="1"] .app-today-shortcuts a:focus-visible{outline:3px solid #707762;outline-offset:2px}
body[data-web-tabs="1"] .app-tool-loading{color:inherit}
@media(max-width:600px){body[data-web-tabs="1"] .app-today-shortcuts{gap:3px;font-size:13px}body[data-web-tabs="1"] .app-today-shortcuts a{padding:6px 3px}}
`;
export function webToolsPresentation(html,path,embedded=false){
 if(!html.includes('data-member-chrome="v1"')||html.includes('data-web-tabs="1"')||!(path==='/member/dashboard'||embedded))return html;
 return html.replace(/<body([^>]*)>/,(_,a)=>'<body'+a+' data-web-tabs="1"'+(embedded?' data-app-panel="1"':'')+'>').replace('</body>','<style data-web-tools-style>'+webToolsStyles+'</style><script defer src="'+webToolsAsset+'"></script></body>');
}
