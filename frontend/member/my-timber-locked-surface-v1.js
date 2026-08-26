(function(){
  'use strict';
  const sheet=document.getElementById('mtLiveSheet');
  const close=document.getElementById('mtLiveClose');
  if(!sheet||!close)return;
  function show(kind){
    if(!sheet.open)sheet.showModal();
    sheet.scrollTop=0;
    document.getElementById('todayActions')?.scrollIntoView({behavior:'auto',block:'start'});
    if(kind==='water'){
      const add=()=>{const button=sheet.querySelector('[data-water]');if(button){button.click();return true}return false};
      if(!add()){let attempts=0;const timer=setInterval(()=>{attempts+=1;if(add()||attempts>30)clearInterval(timer)},100)}
    }
  }
  document.addEventListener('click',event=>{const trigger=event.target.closest('[data-mt-open]');if(!trigger)return;event.preventDefault();show(trigger.dataset.mtOpen)});
  close.addEventListener('click',()=>sheet.close());
  sheet.addEventListener('click',event=>{if(event.target===sheet)sheet.close()});
  document.addEventListener('click',event=>{const link=event.target.closest('.mt-live-sheet a[href]');if(!link)return;requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'auto'}))});
})();
