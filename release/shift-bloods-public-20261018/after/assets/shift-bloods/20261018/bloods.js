(() => {
 'use strict';
 const storageKey='shift-bloods-choice-v1';
 const scope=document.querySelector('[data-shift-bloods]');if(!scope)return;
 const validPanels=['baseline','advanced','complete'];
 let saved={panel:'baseline',collection:'finger-prick'};
 try {const candidate=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(candidate&&validPanels.includes(candidate.panel))saved=candidate;}catch{}
 function remember(panel,collection){saved={panel,collection};try{sessionStorage.setItem(storageKey,JSON.stringify(saved));}catch{}}
 function collectionFor(id){return id==='complete'?(saved.collection==='nurse-home'?'nurse-home':'clinic'):(saved.collection==='upper-arm'?'upper-arm':'finger-prick');}
 const chooser=scope.querySelector('[data-panel-switcher]');
 if(chooser){
  const tabs=Array.from(chooser.querySelectorAll('[data-panel-tab]'));
  const panels=Array.from(chooser.querySelectorAll('[data-panel-content]'));
  function select(id,moveFocus=false){
   if(!validPanels.includes(id))return;
   tabs.forEach(tab=>{const active=tab.dataset.panelTab===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&moveFocus)tab.focus();});
   panels.forEach(panel=>{panel.hidden=panel.dataset.panelContent!==id;});
   chooser.dataset.selected=id;
   remember(id,collectionFor(id));
  }
  tabs.forEach((tab,index)=>{
   tab.addEventListener('click',()=>select(tab.dataset.panelTab));
   tab.addEventListener('keydown',event=>{let target=null;if(event.key==='ArrowRight')target=(index+1)%tabs.length;if(event.key==='ArrowLeft')target=(index+tabs.length-1)%tabs.length;if(event.key==='Home')target=0;if(event.key==='End')target=tabs.length-1;if(target!==null){event.preventDefault();select(tabs[target].dataset.panelTab,true);}});
  });
  chooser.hidden=false;
  const fallback=scope.querySelector('[data-switcher-fallback]');if(fallback)fallback.hidden=true;
  select(saved.panel);
 }
 scope.querySelectorAll('[data-panel-choice]').forEach(link=>link.addEventListener('click',()=>{const id=link.dataset.panelChoice;remember(id,collectionFor(id));}));
 const method=scope.querySelector('[data-collection-choice]');
 if(method){
  const descriptions=Array.from(scope.querySelectorAll('[data-collection-description]'));
  function updateCollection(){
   if(![...method.options].some(o=>o.value===method.value))method.value=method.options[0].value;
   remember(method.dataset.panel,method.value);
   descriptions.forEach(item=>item.hidden=item.dataset.collectionDescription!==method.value);
  }
  if([...method.options].some(o=>o.value===saved.collection))method.value=saved.collection;
  updateCollection();
  method.addEventListener('change',updateCollection);
 }
 const next=scope.querySelector('[data-preview-continue]');
 if(next)next.addEventListener('click',()=>{const result=scope.querySelector('[data-next-step]');if(result){result.hidden=false;result.focus();next.hidden=true;}});
 const stage=scope.querySelector('[data-example-stage]');
 if(stage)stage.addEventListener('change',()=>{scope.querySelectorAll('[data-example-content]').forEach(item=>item.hidden=item.dataset.exampleContent!==stage.value);});
 scope.querySelector('[data-open-review]')?.addEventListener('click',()=>{const notes=scope.querySelector('#review-notes');if(notes)notes.open=!notes.open;});
})();
