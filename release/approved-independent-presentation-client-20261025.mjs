import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
// Exact four navigation integration edits from the separately approved and
// deployed presentation source. No arbitrary asset, reader or hash is accepted.
export const approvedPresentationClientRecord=Object.freeze({
  "kind": "EXACT_ALREADY_APPROVED_INDEPENDENT_PRESENTATION_CLIENT_20261025",
  "approvedSource": "cce036bd7e513fd3f032b9d25fd4297bec23f8af",
  "approvedSourceBlob": "4b8e048262f3a70fccf7e3ff4aa7f3e7b2acc239",
  "baseSHA256": "95a6d37c781137b01fdc79bcd2d81b4f09f48e82c489e141705a04927de36585",
  "approvedSHA256": "66c340f4af1bb9ba47fdda476119802acafe9b34630e80d57228b05f0d71e816",
  "changes": [
    {
      "start": 26996,
      "end": 27891,
      "before": " function select(key,push=false,hash=''){if(!toolKeys.includes(key))key='today';chosen=key;syncTabs();if(!host)return;if(push){const u=new URL(location.href);if(key==='today')u.searchParams.delete('tool');else u.searchParams.set('tool',key);u.hash='today';history.pushState(null,'',u)}host.hidden=key==='today';if(key!=='today'&&!panels.has(key))createPanel(key,hash);else if(key!=='today'&&hash){const frame=panels.get(key).frame;try{frame.contentWindow.location.hash=hash;frame.contentWindow.dispatchEvent(new Event('hashchange'))}catch{}}panels.forEach((v,k)=>{v.panel.hidden=k!==key;if(k===key)requestAnimationFrame(()=>measure(v.frame))}); }\n function mount(){const root=document.getElementById('todayActions');if(!root?.querySelector('.app-today-shortcuts'))return;if(!host){host=document.createElement('div');host.id='appToolPanels';host.hidden=true;root.after(host)}select(queryTool())}\n",
      "after": " function select(key,push=false,hash=''){if(!toolKeys.includes(key))key='today';chosen=key;syncTabs();if(!host)return;if(push){const u=new URL(location.href);if(key==='today')u.searchParams.delete('tool');else u.searchParams.set('tool',key);u.hash='today';history.pushState(null,'',u)}host.hidden=key==='today';if(key!=='today'&&!panels.has(key))createPanel(key,hash);else if(key!=='today'&&hash){const frame=panels.get(key).frame;try{frame.contentWindow.location.hash=hash;frame.contentWindow.dispatchEvent(new Event('hashchange'))}catch{}}if(key!=='today'){document.querySelector('.mp-tab[data-panel=\"today\"]')?.click();document.getElementById('panel-today')?.setAttribute('hidden','');}else if(location.hash==='#today')document.querySelector('.mp-tab[data-panel=\"today\"]')?.click();panels.forEach((v,k)=>{v.panel.hidden=k!==key;if(k===key)requestAnimationFrame(()=>measure(v.frame))}); }\n function mount(){const root=document.getElementById('todayActions');if(!root?.querySelector('.app-today-shortcuts'))return;if(!host){host=document.createElement('div');host.id='appToolPanels';host.hidden=true;(root.closest('#panel-today')||root).after(host)}select(queryTool());mainPanel()}\n"
    },
    {
      "start": 28589,
      "end": 28808,
      "before": " addEventListener('popstate',()=>select(queryTool()));addEventListener('resize',()=>panels.forEach(v=>measure(v.frame)));addEventListener('scroll',()=>{const v=panels.get(chosen);if(v)measure(v.frame)},{passive:true});\n",
      "after": " function mainPanel(){if(!['#journey','#visualise','#plans'].includes(location.hash)||document.body.dataset.memberSession!=='ready')return;const u=new URL(location.href);if(u.searchParams.has('tool')){u.searchParams.delete('tool');history.replaceState(null,'',u)}select('today')}document.addEventListener('sst:app-tool-select',event=>{if(document.body.dataset.memberSession==='ready'&&document.querySelector('#previewMember.is-ready')&&toolKeys.includes(event.detail?.tool))select(event.detail.tool,true)});addEventListener('hashchange',mainPanel);addEventListener('popstate',()=>{select(queryTool());mainPanel()});addEventListener('resize',()=>panels.forEach(v=>measure(v.frame)));addEventListener('scroll',()=>{const v=panels.get(chosen);if(v)measure(v.frame)},{passive:true});\n"
    },
    {
      "start": 65983,
      "end": 66291,
      "before": "  const navToday=e.target.closest?.('#appBottomNav a');if(navToday&&document.body.dataset.memberPage==='dashboard'){const target=new URL(navToday.href);if(target.pathname==='/member/dashboard'&&target.hash==='#today'&&!target.searchParams.get('tool')){$('.mp-tab[data-panel=\"today\"]')?.click();schedule();}}\n",
      "after": "  const navToday=e.target.closest?.('#appBottomNav a');if(navToday&&document.body.dataset.memberPage==='dashboard'){const target=new URL(navToday.href);if(target.pathname==='/member/dashboard'&&target.hash==='#today'&&!target.searchParams.get('tool')){document.dispatchEvent(new CustomEvent('sst:app-tool-select',{detail:{tool:'today'}}));$('.mp-tab[data-panel=\"today\"]')?.click();schedule();}}\n"
    },
    {
      "start": 73743,
      "end": 73743,
      "before": "",
      "after": "      document.dispatchEvent(new CustomEvent('sst:app-tool-select',{detail:{tool:'today'}}));\n"
    }
  ]
});
const sha=value=>createHash('sha256').update(value).digest('hex');
export function approvedPresentationAppClient(expected){
 const r=approvedPresentationClientRecord;assert.equal(sha(expected),r.baseSHA256,'Approved presentation predecessor changed');
 let out='',cursor=0;for(const change of r.changes){assert(change.start>=cursor&&change.end>=change.start,'Presentation delta order changed');assert.equal(expected.slice(change.start,change.end),change.before,'Approved presentation before-image changed');out+=expected.slice(cursor,change.start)+change.after;cursor=change.end;}
 out+=expected.slice(cursor);assert.equal(sha(out),r.approvedSHA256,'Approved presentation after-image changed');return out;
}
export function approvedPresentationAppExpectation(actual,expected){
 const r=approvedPresentationClientRecord;
 if(sha(expected)!==r.baseSHA256||sha(actual)!==r.approvedSHA256)return expected;
 return approvedPresentationAppClient(expected);
}
