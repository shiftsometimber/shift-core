export function foodLogPresentation(log){
 if(log?.status!=='available')return null;
 const labels={kcal:['Energy','kcal'],proteinG:['Protein','g'],carbsG:['Carbohydrate','g'],fatG:['Fat','g'],fibreG:['Fibre','g'],waterMl:['Water logged here','ml']};
 const lines=period=>Object.entries(labels).flatMap(([key,[name,unit]])=>{const value=period.nutrition[key];return value?[`${name}: ${value.total.toLocaleString('en-GB')} ${unit} · amounts in ${value.recordedEntries} of ${period.entryCount} entries${value.missingEntries?' ('+value.missingEntries+' missing an amount)':''}.`]:[]});
 return {today:{heading:'Today · '+log.today.entryCount+' food '+(log.today.entryCount===1?'entry':'entries'),lines:lines(log.today)},last7Days:{heading:'Last seven days · '+log.last7Days.entryCount+' '+(log.last7Days.entryCount===1?'entry':'entries')+' across '+log.last7Days.loggedDays+' '+(log.last7Days.loggedDays===1?'day':'days'),lines:lines(log.last7Days)},note:'Totals cover what you logged. Missing food or amounts stay unknown; a logged day may be incomplete.',estimateNote:log.last7Days.estimatedEntries?'Photo-derived nutrition remains an estimate.':null};
}

// An acknowledged save is separate from refreshing a view. Responses from an
// earlier page/account must never repopulate a cleared private summary.
export function createFoodLogViewFlow({readLog,readMember,onChange,timeoutMs=15000}){
 let generation=0,controller=null,deadline;
 const clear=()=>{generation++;controller?.abort();controller=null;clearTimeout(deadline);onChange(null,'cleared')};
 const refresh=async()=>{
  const version=++generation;controller?.abort();clearTimeout(deadline);const current=new AbortController();controller=current;onChange(null,'loading');
  deadline=setTimeout(()=>{if(version===generation){generation++;current.abort();controller=null;onChange(null,'timeout')}},timeoutMs);
  try{
   const result=await readLog(current.signal);if(version!==generation)return;
   const member=await readMember(current.signal);if(version!==generation)return;
   const owner=member?.user?.id??member?.id;
   if(owner===undefined||String(owner)!==String(result.memberId))throw Error('account_changed');
   if(result.foodLog?.status!=='available')throw Error('summary_unavailable');
   onChange(result.foodLog,'available');
  }catch(error){if(version===generation)onChange(null,error.code||error.message||'unavailable')}
  finally{if(controller===current){controller=null;clearTimeout(deadline)}}
 };
 return {clear,refresh};
}

function foodLogSurfaces(present,createFlow){
 'use strict';
 if(document.documentElement.dataset.foodLogSurfaces)return;document.documentElement.dataset.foodLogSurfaces='true';
 let flow,queued=false,view=null,state='cleared',channel,observer,stopped=false;const expanded=new WeakMap();
 const roots=()=>[document.getElementById('panel-today'),document.getElementById('panel-journey')].filter(Boolean);
 const ready=()=>!document.getElementById('previewMember')||document.getElementById('previewMember').classList.contains('is-ready');
 const make=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node};
 const styles=make('style');styles.textContent='.food-log-card{box-sizing:border-box;max-width:100%;margin:12px 0;padding:14px;border:1px solid #707762;border-radius:12px;background:#e7e3da;color:#050505;overflow-wrap:anywhere}.food-log-card :is(summary,h3,h4,p,li,a){color:#050505!important}.food-log-card summary{min-height:44px;cursor:pointer;font-weight:800}.food-log-card h4{margin:12px 0 6px}.food-log-card p{margin:6px 0;line-height:1.5}.food-log-card ul{padding-left:20px}.food-log-card a{display:inline-block;min-height:44px;padding:10px 0}.food-log-card :focus-visible{outline:3px solid #707762;outline-offset:3px}';document.head.append(styles);
 function render(){
  const model=present(view);
  for(const root of roots()){
   let card=root.querySelector('[data-food-log-surface]');if(!card){card=make('aside');card.className='food-log-card';card.dataset.foodLogSurface='';card.setAttribute('aria-label','Your recorded food');root.append(card);}
   const previous=card.querySelector('details');if(previous)expanded.set(card,previous.open);const wasOpen=expanded.get(card)===true;card.replaceChildren();
   if(!model){const text=state==='loading'?'Checking your saved food log…':state==='health_consent_required'?'Optional health tracking is off or paused. Review your choice in Settings.':state==='authentication_required'||state==='account_changed'?'Sign in to see your private food log.':'Your food summary is unavailable. Open Grub to check your saved entries.';card.append(make('p',text));}
   else{
    const details=make('details');details.open=wasOpen;details.append(make('summary','Recorded food · '+view.today.entryCount+' '+(view.today.entryCount===1?'entry':'entries')+' today'));
    for(const period of [model.today,model.last7Days]){details.append(make('h4',period.heading));if(period.lines.length){const list=make('ul');for(const line of period.lines)list.append(make('li',line));details.append(list);}else details.append(make('p','No nutrition amounts recorded in these entries.'));}
    details.append(make('p',model.note));if(model.estimateNote)details.append(make('p',model.estimateNote));card.append(details);
   }
   const link=make('a','Open your food diary →');link.href='/member/grub#eaten-food';card.append(link);
  }
 }
 async function read(url,signal){const response=await fetch(url,{credentials:'same-origin',cache:'no-store',signal});if(!response.ok){let code='unavailable';try{code=(await response.json()).error||code}catch{}throw Object.assign(Error('unavailable'),{code})}return response.json()}
 flow=createFlow({readLog:signal=>read('/v1/grub/eaten',signal),readMember:signal=>read('/v1/me',signal),onChange:(value,next)=>{view=value;state=next;if(value&&(document.hidden||!ready())){view=null;state='cleared'}render()}});
 function refresh(){if(stopped)return;flow.clear();if(queued||document.hidden||!ready()||!roots().length)return;queued=true;queueMicrotask(()=>{queued=false;if(!stopped&&!document.hidden&&ready())flow.refresh()});}
 function changed(){try{channel?.postMessage({type:'invalidate'})}catch{}refresh()}
 window.addEventListener('sst:food-changed',changed);
 window.addEventListener('sst:food-remote-change',refresh);
 window.addEventListener('hashchange',refresh);
 document.addEventListener('sst:today-rendered',refresh);
 document.addEventListener('sst:journey-rendered',refresh);
 document.addEventListener('visibilitychange',()=>{flow.clear();if(!document.hidden)refresh()});
 try{channel=new BroadcastChannel('sst-food-log');channel.onmessage=event=>{if(event.data?.type==='invalidate')window.dispatchEvent(new Event('sst:food-remote-change'))}}catch{}
 observer=new MutationObserver(records=>{if(records.some(record=>record.type==='attributes'&&record.target.id==='previewMember')){refresh();return;}if(roots().some(root=>!root.querySelector('[data-food-log-surface]')))refresh();});
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 window.addEventListener('pagehide',()=>{stopped=true;flow.clear();observer.disconnect();channel?.close()});
 window.addEventListener('pageshow',()=>{if(stopped){stopped=false;observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});try{channel=new BroadcastChannel('sst-food-log');channel.onmessage=event=>{if(event.data?.type==='invalidate')window.dispatchEvent(new Event('sst:food-remote-change'))}}catch{}refresh()}});
 refresh();
}
export const foodLogRuntime='('+foodLogSurfaces.toString()+')('+foodLogPresentation.toString()+','+createFoodLogViewFlow.toString()+');';
