
(()=>{
 const root=document.querySelector('[data-review-planner]');if(!root)return;
 const buttons=[...root.querySelectorAll('[data-review-topic]')];
 const groups=[...root.querySelectorAll('[data-review-group]')];
 const status=root.querySelector('[data-review-status]');
 function select(id){if(id!=='all'&&!groups.some(g=>g.dataset.reviewGroup===id))return;
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.reviewTopic===id));
  for(const group of groups)group.hidden=id!=='all'&&group.dataset.reviewGroup!==id;
  const count=groups.filter(g=>!g.hidden).length;
  status.textContent=count===1?'Showing one question group. Your preparation notes and next-step questions are below.':'Showing all four question groups. Choose the questions useful to you.';
 }
 for(const button of buttons)button.addEventListener('click',()=>select(button.dataset.reviewTopic));
 const print=root.querySelector('[data-review-print]');if(print){print.hidden=false;print.addEventListener('click',()=>window.print());}
 const reset=root.querySelector('[data-review-reset]');if(reset){reset.hidden=false;reset.addEventListener('click',()=>select('all'));}
 const trigger=document.querySelector('.menu-trigger[aria-controls="site-drawer"]'),drawer=document.getElementById('site-drawer'),backdrop=document.querySelector('.drawer-backdrop'),close=drawer?.querySelector('.drawer-close');
 function menu(open){if(!trigger||!drawer)return;drawer.hidden=!open;if(backdrop)backdrop.hidden=!open;trigger.setAttribute('aria-expanded',String(open));document.body.classList.toggle('review-menu-open',open);if(open){drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');close?.focus();}else{drawer.removeAttribute('role');drawer.removeAttribute('aria-modal');trigger.focus();}}
 trigger?.addEventListener('click',()=>menu(drawer.hidden));close?.addEventListener('click',()=>menu(false));backdrop?.addEventListener('click',()=>menu(false));
 document.addEventListener('keydown',event=>{if(!drawer||drawer.hidden)return;if(event.key==='Escape'){event.preventDefault();menu(false);}if(event.key==='Tab'){const items=[...drawer.querySelectorAll('a[href],button:not([disabled])')],first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
 select('all');
})();
