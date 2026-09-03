(()=>{
  'use strict';
  if(!/^\/member\/dashboard(?:\.html)?$/.test(location.pathname))return;
  const getItems=async()=>{
    try{
      const response=await fetch('https://api.shiftsometimber.co.uk/v1/radar/ticker',{headers:{accept:'application/json'},cache:'no-store'});
      if(response.ok){const payload=await response.json();if(payload?.current&&Array.isArray(payload.items)&&payload.items.some(x=>x?.headline))return payload.items.filter(x=>x?.headline)}
    }catch{}
    try{
      const response=await fetch('/medicine-news',{headers:{accept:'text/html'},cache:'no-store'});
      if(!response.ok)return[];
      const copy=new DOMParser().parseFromString(await response.text(),'text/html');
      return [...copy.querySelectorAll('.news-grid>article')].map(card=>({headline:card.querySelector('h2')?.textContent?.trim()||'',url:`/medicine-news${card.id?`#${encodeURIComponent(card.id)}`:''}`,publishedAt:card.querySelector('time[datetime]')?.getAttribute('datetime')||''})).filter(x=>x.headline).sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0));
    }catch{return[]}
  };
  const ensurePanel=()=>{
    let panel=document.getElementById('panel-medicines');
    if(!panel){
      const host=document.querySelector('.member-product');
      if(!host)return null;
      panel=document.createElement('section');panel.className='mp-panel';panel.id='panel-medicines';host.append(panel);
      const tabs=document.querySelector('.mp-tabs');
      if(tabs&&!tabs.querySelector('[data-panel="medicines"]')){const button=document.createElement('button');button.className='mp-tab';button.dataset.panel='medicines';button.textContent='Medicines Watch';tabs.append(button)}
    }
    return panel;
  };
  const render=(panel,items)=>{
    panel.innerHTML='<div class="ma34-med-head"><div><p class="ma34-kicker">SHIFT AI Newsroom</p><h2>Medicines Watch</h2><p>The same full approved wire shown across Shift. No separate member edition.</p></div></div><section class="medicine-ticker-v138" aria-label="Full approved wire from SHIFT AI Newsroom"><div class="site-wrap"><strong>SHIFT AI Newsroom</strong><span data-ticker-track></span></div></section><p><a class="ma34-btn" href="/medicine-news">Open SHIFT AI Newsroom →</a></p><p class="ma34-disclaimer">General information only. Medicine and dose decisions belong with an appropriately qualified prescriber.</p>';
    const track=panel.querySelector('[data-ticker-track]');
    const addGroup=clone=>{const group=document.createElement('span');group.dataset.tickerGroup='';if(clone)group.setAttribute('aria-hidden','true');items.forEach(item=>{const a=document.createElement('a');a.href=item.url||'/medicine-news';a.textContent=`${item.headline} →`;a.dataset.tickerHeadline='';if(clone)a.tabIndex=-1;group.append(a)});track.append(group);return group};
    const first=addGroup(false);addGroup(true);
    let offset=0,last=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame=time=>{if(!last)last=time;if(!paused){offset-=24*Math.min((time-last)/1000,.05);const width=first.getBoundingClientRect().width+32;if(width&&-offset>=width)offset+=width;track.style.transform=`translate3d(${offset}px,0,0)`}last=time;requestAnimationFrame(frame)};
    const ticker=panel.querySelector('.medicine-ticker-v138');ticker.onmouseenter=()=>paused=true;ticker.onmouseleave=()=>paused=false;ticker.onfocusin=()=>paused=true;ticker.onfocusout=()=>paused=false;requestAnimationFrame(frame);
  };
  const start=async()=>{
    let panel=ensurePanel();
    if(!panel){const observer=new MutationObserver(()=>{panel=ensurePanel();if(panel){observer.disconnect();start()}});observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),8000);return}
    const items=await getItems();
    if(items.length)render(panel,items);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,400));else setTimeout(start,400);
})();
