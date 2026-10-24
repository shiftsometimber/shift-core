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

;(()=>{if(location.pathname.replace(/\/+$/,"")!=="/shift-health/blood-tests")return;const box=document.querySelector(".arm-explainer .arm-video"),summary=document.querySelector(".arm-explainer>summary");if(!box||!summary)return;summary.textContent="See how upper-arm collection works";box.setAttribute("data-shift-real-demo","20261024");box.innerHTML="<h3>See how upper-arm collection works.</h3><p>A real demonstration of the Tasso+ device, from preparation through to collecting the sample.</p><div class=\"shift-real-video-player\" data-real-video-player><button type=\"button\" data-load-real-video>▶ Watch the real demonstration</button></div><p class=\"small\">Tasso+ manufacturer demonstration, linked by Vitall. Final SHIFT kit and supported tests still need to be confirmed. Follow the instructions supplied with your kit. Pressing play loads Vimeo, an external video service.</p><p><a href=\"https://player.vimeo.com/video/759587605?h=643986ed24\" target=\"_blank\" rel=\"noopener\">Open the manufacturer’s demonstration directly ↗</a></p>";const s=document.createElement("style");s.textContent="html body main#main-content.massp.massp.massp[data-shift-bloods] .arm-feature .shift-real-video-player{aspect-ratio:16/9!important;width:100%!important;display:grid!important;place-items:center!important;background:#050505!important;border:1px solid #E7E3DA!important;border-radius:12px!important;overflow:hidden!important;margin:20px 0!important}html body main#main-content.massp.massp.massp[data-shift-bloods] .arm-feature .shift-real-video-player iframe{width:100%!important;height:100%!important;border:0!important;display:block!important}html body main#main-content.massp.massp.massp[data-shift-bloods] .arm-feature .shift-real-video-player button{background:#E7E3DA!important;color:#050505!important;-webkit-text-fill-color:#050505!important;border:0!important;border-radius:999px!important;min-height:48px!important;padding:14px 20px!important;margin:12px!important;font:800 15px/1.3 Arial,sans-serif!important;cursor:pointer!important}";document.head.appendChild(s);box.querySelector("[data-load-real-video]").addEventListener("click",()=>{const f=document.createElement("iframe");f.title="Tasso+ manufacturer demonstration";f.allow="fullscreen; picture-in-picture; autoplay";f.allowFullscreen=true;f.referrerPolicy="strict-origin-when-cross-origin";f.src="https://player.vimeo.com/video/759587605?h=643986ed24&dnt=1";box.querySelector("[data-real-video-player]").replaceChildren(f);});})();
