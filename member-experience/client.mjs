// Literal source survives Worker bundling without serializer/helper leakage.
// No network calls, browser storage, analytics or data mutations in this layer.
export const memberClient = String.raw`(() => {
  'use strict';
  const body=document.body;
  if(!body.matches('[data-member-experience="v1"]'))return;
  const page=body.dataset.memberPage,journeyRenders=new WeakSet();
  const all=(s,root=document)=>[...root.querySelectorAll(s)];
  const set=(el,key,value)=>{if(el&&el.getAttribute(key)!==String(value))el.setAttribute(key,String(value))};
  function nav(){
    const current=page==='dashboard'&&['#journey','#progress','#lifeback'].includes(location.hash)?'/member/dashboard#journey':page==='dashboard'?'/member/dashboard#today':'/member/'+page;
    all('.sst-member-tabs a').forEach(a=>{const url=new URL(a.href);if(url.pathname+url.hash===current)set(a,'aria-current','page');else a.removeAttribute('aria-current')});
  }
  nav();window.addEventListener('hashchange',nav);
  all('.sst-member-tabs a').forEach(a=>a.addEventListener('click',e=>{
    const u=new URL(a.href);
    if(page==='dashboard'&&u.pathname==='/member/dashboard'&&document.querySelector('#previewMember.is-ready')){
      const tab=document.querySelector('.mp-tab[data-panel="'+(u.hash==='#journey'?'journey':'today')+'"]');
      if(tab&&document.querySelector('#panel-journey[aria-busy="false"]')){e.preventDefault();tab.click();nav();document.querySelector(u.hash==='#journey'?'#panel-journey':'#panel-today')?.scrollIntoView({block:'start'});}
    }
  }));
  const more=document.querySelector('.member-nav-more');
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&more?.open){more.open=false;more.querySelector('summary').focus()}});
  document.addEventListener('click',e=>{if(more?.open&&!more.contains(e.target))more.open=false});
  // Existing tools create their overlays after page load, outside main. Keep
  // their original close/save handlers; add names and keyboard containment.
  const dialogs=new Map();let dialogSequence=0;
  function overlays(){
    for(const [el,state] of dialogs){if(!el.isConnected){dialogs.delete(el);if(state.custom&&state.returnTo?.isConnected)state.returnTo.focus({preventScroll:true})}}
    all('dialog,.mt-sheet[role=dialog],.wm-sort-dialog[role=dialog]').forEach(el=>{
      if(dialogs.has(el))return;
      const custom=el.tagName!=='DIALOG',returnTo=document.activeElement;
      dialogs.set(el,{custom,returnTo});
      const title=el.querySelector('h2');
      if(title&&!el.hasAttribute('aria-labelledby')){if(!title.id)title.id='member-dialog-title-'+(++dialogSequence);set(el,'aria-labelledby',title.id)}
      if(title){set(title,'tabindex','-1');title.focus()}
      if(!custom)return;
      el.addEventListener('keydown',e=>{
        if(e.key==='Escape'){e.preventDefault();e.stopPropagation();el.querySelector('[data-close]')?.click();return}
        if(e.key!=='Tab')return;
        const controls=all('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',el).filter(x=>x.getClientRects().length&&!x.closest('[hidden]'));
        const first=controls[0],last=controls.at(-1);if(!first){e.preventDefault();title?.focus();return}
        if(e.shiftKey&&(document.activeElement===first||document.activeElement===title)){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      });
    });
  }
  if(page==='grub'){
    const tabs=all('[data-grub-tab]');set(document.querySelector('.grub-v8-tabs'),'role','tablist');
    function syncTabs(){tabs.forEach(t=>{const name=t.dataset.grubTab,selected=t.classList.contains('active'),panel=document.querySelector('[data-grub-panel="'+name+'"]');set(t,'role','tab');set(t,'id','member-food-tab-'+name);set(t,'aria-controls','member-food-panel-'+name);set(t,'aria-selected',selected);set(t,'tabindex',selected?'0':'-1');set(panel,'role','tabpanel');set(panel,'id','member-food-panel-'+name);set(panel,'aria-labelledby','member-food-tab-'+name);if(panel)panel.hidden=!selected;});}
    tabs.forEach((t,i)=>{t.addEventListener('click',syncTabs);t.addEventListener('keydown',e=>{const index=e.key==='Home'?0:e.key==='End'?tabs.length-1:e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:null;if(index!==null){e.preventDefault();tabs[index].click();tabs[index].focus()}})});
    all('[data-open-grub]').forEach(b=>b.addEventListener('click',()=>{syncTabs();tabs.find(t=>t.dataset.grubTab===b.dataset.openGrub)?.focus()}));
    if(location.hash==='#saved')tabs.find(t=>t.dataset.grubTab==='saved')?.click();syncTabs();
    set(document.querySelector('#sgIngredientInput'),'aria-label','Add an ingredient');set(document.querySelector('#sgAddIngredient'),'aria-label','Add ingredient');
    set(document.querySelector('#shoppingInput'),'aria-label','Add a shopping item');set(document.querySelector('#shoppingForm button'),'aria-label','Add shopping item');
    set(document.querySelector('#grubDiscoverResults'),'aria-live','polite');
  }
  all('#fitStatus,#grubStatus,#grubWeekStatus').forEach(el=>{set(el,'role','status');set(el,'aria-live','polite')});
  if(page==='check-in'){
    const row=document.querySelector('#moodRow'),save=document.querySelector('#saveMood'),result=document.querySelector('#checkinResult');
    set(row,'role','group');set(row,'aria-label','How you feel today');
    const status=document.createElement('p');status.className='member-action-status';set(status,'role','status');set(status,'aria-live','polite');save?.after(status);
    function syncMood(){all('[data-mood]').forEach(b=>set(b,'aria-pressed',b.classList.contains('active')));if(save){status.textContent=save.disabled?'Saving your private check-in…':/SIGN IN|COULD NOT|UNAVAILABLE|CHOOSE/.test(save.textContent)?save.textContent:'';all('[data-mood],#moodNote').forEach(el=>el.disabled=save.disabled);}}
    all('[data-mood]').forEach(b=>b.addEventListener('click',()=>{if(save&&!save.disabled)save.textContent='GIVE ME MY NEXT STEP →';if(result)result.hidden=true;syncMood()}));
    if(save)new MutationObserver(syncMood).observe(save,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
    document.addEventListener('shift:mood-required',()=>all('[data-mood]')[0]?.focus());
    document.addEventListener('shift:mood-saved',()=>{const h=result?.querySelector('h2');set(h,'tabindex','-1');h?.focus({preventScroll:true});status.textContent='Your check-in is saved.'});
    syncMood();if(location.hash==='#history'){const history=document.querySelector('.checkin-history');if(history){history.open=true;history.scrollIntoView({block:'start'})}}
  }
  // Label controls created by the existing tool clients without changing handlers.
  function labels(){
    all('#panel-journey .mj-hero,#panel-journey .mj-setup').forEach(el=>{
      if(journeyRenders.has(el))return;journeyRenders.add(el);
      const strip=el.querySelector('.mj-support-strip');if(strip)el.after(strip);
      // Existing Worker weekly client listens for this event. The Pages V2
      // renderer replaced its host without notifying that client.
      document.dispatchEvent(new CustomEvent('sst:journey-rendered'));
    });
    all('#sgIngredientChips [data-remove]').forEach(b=>set(b,'aria-label','Remove '+b.textContent.replace(/ ×$/,'')));
    all('#shoppingList [data-check],#shoppingList [data-delete]').forEach(b=>{const item=b.closest('.shopping-item'),text=item?.querySelector('span')?.textContent||'item';set(b,'aria-label',b.hasAttribute('data-delete')?'Remove '+text:(item?.classList.contains('done')?'Mark needed: ':'Mark bought: ')+text)});
    nav();
  }
  labels();overlays();let queued=false;
  new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;labels();overlays()})}}).observe(body,{childList:true,subtree:true});
})();`;
