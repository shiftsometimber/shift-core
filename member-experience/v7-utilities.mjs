export function v7Utilities(){
 'use strict';
 const pref='/member/life-back/preferences';
 function enhance(){
  if(document.body?.dataset.memberSession!=='ready')return false;
  const q=new URLSearchParams(location.search),more=q.get('timber')==='stuff'?document.querySelector('main'):document.getElementById('memberMoreDialog');
  if(more&&!more.querySelector('a[href="'+pref+'"]')){
   const old=[...more.querySelectorAll('a[href]')].find(a=>new URL(a.href,location.href).pathname==='/member/settings'&&/Account|settings/i.test(a.textContent));
   if(old){const a=old.cloneNode(true);a.href=pref;a.removeAttribute('id');a.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
    const walk=document.createTreeWalker(a,NodeFilter.SHOW_TEXT);let n;while(n=walk.nextNode()){if(/Account.*settings/i.test(n.textContent))n.textContent='Preferences';else if(/Profile, units and privacy/.test(n.textContent))n.textContent='Show weight and your Journey view';}
    old.before(a);
   }
  }
  const input=document.getElementById('askInput'),about=new URLSearchParams(location.hash.replace(/^#/,'' )).get('about');
  if(input&&about&&!input.dataset.v7Context){
   input.dataset.v7Context='1';input.value=('About today’s action: '+about+'\n').slice(0,200);input.dispatchEvent(new Event('input',{bubbles:true}));
   const p=document.createElement('p');p.textContent='Asking about your current action: '+about;p.id='mtV7AskContext';input.closest('form').before(p);
  }
  return !!more?.querySelector('a[href="'+pref+'"]')||!!input?.dataset.v7Context;
 }
 function start(){if(enhance())return;const relevant=new URLSearchParams(location.search).get('timber')==='stuff'||location.pathname==='/member/ask-timber';if(!relevant)return;
  let queued=false;const o=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;if(enhance())o.disconnect();});});o.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-member-session']});addEventListener('pagehide',()=>o.disconnect(),{once:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
export const v7UtilitiesRuntime='('+v7Utilities.toString()+')();';
