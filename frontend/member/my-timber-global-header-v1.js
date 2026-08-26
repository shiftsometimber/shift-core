(function(){
  'use strict';
  const button=document.querySelector('[data-mt-site-menu]');
  const menu=document.getElementById('mtSiteMenu');
  if(!button||!menu)return;
  function close(){menu.hidden=true;button.setAttribute('aria-expanded','false');button.textContent='MENU'}
  button.addEventListener('click',()=>{
    const opening=menu.hidden;
    menu.hidden=!opening;
    button.setAttribute('aria-expanded',String(opening));
    button.textContent=opening?'CLOSE':'MENU';
  });
  menu.addEventListener('click',event=>{if(event.target.closest('a'))close()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
  document.addEventListener('click',event=>{if(!menu.hidden&&!menu.contains(event.target)&&event.target!==button)close()});
})();
