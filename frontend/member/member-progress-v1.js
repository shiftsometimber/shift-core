// Shift Some Timber — G2-011 whole-person Progress productisation.
// Reuses the canonical /v1/progress/summary contract and the existing Progress Picture surface.
(function(){
  'use strict';
  if(location.pathname!=='/member/dashboard'&&location.pathname!=='/member/dashboard.html')return;
  // The current master loads its reviewed weekly check-in itself. Its restored
  // Progress tool must not add a second copy with duplicate event handlers.
  if(document.body.dataset.memberTools!=='v1'){
    if(!document.querySelector('link[data-journey-checkin]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/member-my-journey-checkin-v1.css?v=1';l.dataset.journeyCheckin='v1';document.head.appendChild(l)}
    if(!document.querySelector('script[data-journey-checkin]')){const s=document.createElement('script');s.src='/member-my-journey-checkin-v1.js?v=1';s.dataset.journeyCheckin='v1';document.head.appendChild(s)}
  }

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let weightUnits='stone_lb';
  const weightValue=kg=>{if(weightUnits==='kg')return `${kg.toFixed(1)}kg`;const tenths=Math.round(kg*2.2046226218*10);return weightUnits==='lb'?`${(tenths/10).toFixed(1)} lb`:`${Math.floor(tenths/140)} st ${((tenths%140)/10).toFixed(1)} lb`;};
  const cleanNumber=v=>Number.isFinite(Number(v))?Number(v):null;
  const formatValue=m=>{
    if(m.latest==null)return '—';
    const value=Number(m.latest);
    if(m.key==='steps')return Math.round(value).toLocaleString('en-GB');
    if(m.key==='sleep')return `${value.toFixed(1)}h`;
    if(m.key==='weight')return weightValue(value);
    if(m.key==='waist')return `${value.toFixed(1)}cm`;
    if(m.key==='mood')return `${value}/10`;
    return `${Math.round(value)}${m.unit==='mmHg'?'':''}`;
  };
  const deltaCopy=m=>{
    if(m.delta==null)return 'Add another check-in to see the direction.';
    if(Math.abs(Number(m.delta))<0.05)return 'Holding steady since your first log.';
    const n=Number(m.delta),abs=Math.abs(n);
    if(m.key==='weight')return `${weightUnits==='kg'?abs.toFixed(1)+' kg':(abs*2.2046226218).toFixed(1)+' lb'} ${n>0?'up':'down'} since your first logged weight.`;
    const amount=m.key==='steps'?Math.round(abs).toLocaleString('en-GB'):Number(abs.toFixed(1)).toLocaleString('en-GB');
    const suffix=m.unit&&m.unit!=='/10'?` ${m.unit}`:'';
    if(m.direction==='improving')return `${amount}${suffix} moving the right way.`;
    return `${amount}${suffix} ${n>0?'up':'down'} since your first log.`;
  };
  const metricCard=m=>`<article class="shift-progress-metric ${m.direction==='improving'?'is-improving':''}">
    <span class="shift-progress-label">Overall · ${esc(m.label)}</span>
    <strong>${esc(formatValue(m))}</strong>
    <small>Latest across your retained records. ${esc(deltaCopy(m))}</small>
  </article>`;

  function chartValue(metric,value,units){
    if(metric.key==='weight'){
      if(units==='kg')return value.toFixed(1)+' kg';
      const tenths=Math.round(value*2.2046226218*10);
      return units==='lb'?(tenths/10).toFixed(1)+' lb':Math.floor(tenths/140)+' st '+((tenths%140)/10).toFixed(1)+' lb';
    }
    if(metric.key==='waist')return Number(value.toFixed(1))+' cm';
    if(metric.key==='steps')return Math.round(value).toLocaleString('en-GB')+' steps';
    if(metric.key==='sleep')return Number(value.toFixed(1))+' h';
    if(metric.key==='mood')return Number(value.toFixed(1))+'/10';
    return Number(value.toFixed(1))+' mmHg';
  }
// Informational projections from recorded facts. No clinical target or dose advice.
function weightProjection(series, now=Date.now()) {
 const DAY=86400000, today=new Date(now).toISOString().slice(0,10), byDay=new Map();
 for(const r of Array.isArray(series)?series:[]) {
  if(!r||typeof r.on!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.on)||typeof r.value!=='number'||!Number.isFinite(r.value)||r.value<20||r.value>400)continue;
  const at=Date.parse(r.on+'T00:00:00Z');
  if(!Number.isFinite(at)||new Date(at).toISOString().slice(0,10)!==r.on||r.on>today||at<now-57*DAY)continue;
  byDay.set(r.on,{on:r.on,at,value:r.value});
 }
 const points=[...byDay.values()].sort((a,b)=>a.at-b.at), last=points.at(-1);
 const unavailable=reason=>({status:'unavailable',reason,recordedDays:points.length});
 if(points.length<8||last.at-points[0].at<28*DAY)return unavailable('Add readings on at least eight different days across four weeks.');
 if(now-last.at>8*DAY)return unavailable('Add a recent weight before extending the trend.');
 const slopes=[];for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)if(points[j].at-points[i].at>=7*DAY)slopes.push((points[j].value-points[i].value)/((points[j].at-points[i].at)/DAY));
 slopes.sort((a,b)=>a-b);const q=p=>slopes[Math.floor((slopes.length-1)*p)], mid=q(.5), lo=q(.25), hi=q(.75);
 if(!slopes.length||lo<0&&hi>0)return unavailable('The recent readings do not show a consistent direction.');
 if(Math.abs(mid)<.005)return unavailable('Your recent trend is broadly steady; no weight-loss projection is shown.');
 const date=n=>new Date(last.at+n*DAY).toISOString().slice(0,10), round=n=>Math.round(n*10)/10;
 const projection=[0,7,14,21,28].map(n=>({on:date(n),value:round(last.value+mid*n),low:round(last.value+lo*n),high:round(last.value+hi*n)}));
 if(projection.some(p=>p.low<20||p.high>400||!Number.isFinite(p.value)))return unavailable('The recent trend cannot be extended within this view.');
 return {status:'ready',from:last.on,to:date(28),recordedDays:points.length,weeklyChangeKg:round(mid*7),projection,meaning:'If your recent trend continues. The shaded scenarios use variation in recorded trends; they are not a probability interval or a guaranteed outcome. No target date or treatment recommendation.'};
}

  // Calendar filters use the member-facing UK day, including BST boundaries.
  function londonDay(now=Date.now()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));}
  // Seven calendar days of dated records, including gaps, are enough to
  // name a rolling seven-day window. Invalid/future readings never age it.
  function recentRangeLabel(metrics,now=Date.now()){
    const today=londonDay(now),end=Date.parse(today+'T00:00:00Z');
    let first=null;
    for(const metric of metrics||[])for(const row of metric.series||[]){
      if(!row||typeof row.value!=='number'||!Number.isFinite(row.value)||typeof row.on!=='string')continue;
      const on=row.on.slice(0,10),stamp=Date.parse(on+'T00:00:00Z');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(on)||!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,10)!==on||on>today)continue;
      if(first===null||stamp<first)first=stamp;
    }
    return first!==null&&(end-first)/86400000>=7?'Last 7 days':'Since you started';
  }
  function periodBounds(period,now=Date.now()){
    const today=londonDay(now),at=Date.parse(today+'T00:00:00Z');
    const valid=on=>typeof on==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(on)&&Number.isFinite(Date.parse(on+'T00:00:00Z'))&&new Date(on+'T00:00:00Z').toISOString().slice(0,10)===on;
    if(period&&typeof period==='object'){
      if(!valid(period.from)||!valid(period.to)||period.from>period.to)throw Error('Choose valid dates, with To on or after From.');
      if(period.to>today)throw Error('Choose dates up to today. Future days have not been recorded.');
      return {from:period.from,to:period.to};
    }
    if(period==='all')return {from:'0000-01-01',to:today};
    if(period==='week'){const offset=(new Date(at).getUTCDay()+6)%7;return {from:new Date(at-offset*86400000).toISOString().slice(0,10),to:today};}
    if(period==='3months'){const d=new Date(at),month=d.getUTCMonth()-3,first=new Date(Date.UTC(d.getUTCFullYear(),month,1)),lastDay=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();return {from:new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth(),Math.min(d.getUTCDate(),lastDay))).toISOString().slice(0,10),to:today};}
    const days=Number(period);if(!Number.isInteger(days)||days<1||days>36600)throw Error('Choose one of the available date ranges.');
    return {from:new Date(at-(days-1)*86400000).toISOString().slice(0,10),to:today};
  }
  // Compare only distinct saved dates selected by the chart. Never estimate a
  // reading at a period boundary or attribute a change to food or medication.
  function rangeChangeMarkup(metric,points,units,date){
    if(!points.length)return '';
    if(points.length===1)return '<section class="shift-chart-period-summary" aria-label="What I notice"><h4>What I notice</h4><p>One saved reading on '+esc(date(points[0].on))+'. It is too soon to describe a change. Add another when you’re ready.</p></section>';
    const first=points[0],last=points.at(-1),delta=last.value-first.value;
    const deltaUnits=metric.key==='weight'&&units==='stone_lb'?'lb':units;
    const change=delta===0?'No change between these recorded readings.':chartValue(metric,Math.abs(delta),deltaUnits)+' '+(delta<0?'down':'up');
    return '<section class="shift-chart-period-summary" aria-label="What I notice"><h4>What I notice</h4><p><span>First recorded · '+esc(date(first.on))+' · '+esc(chartValue(metric,first.value,units))+'</span><span aria-hidden="true"> → </span><span>Latest recorded · '+esc(date(last.on))+' · '+esc(chartValue(metric,last.value,units))+'</span></p><strong>'+esc(change)+'</strong><p>Between your first and latest saved readings in this range. Missing dates are not estimated.</p></section>';
  }
  function progressChartMarkup(metric,units,period,now=Date.now(),width=620,forecast=null){
    const today=londonDay(now),bounds=periodBounds(period,now);
    const daily=new Map();
    for(const row of metric.series||[]){
      if(!row||typeof row.value!=='number'||!Number.isFinite(row.value)||typeof row.on!=='string')continue;
      const on=row.on.slice(0,10),stamp=Date.parse(on+'T00:00:00Z');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(on)||!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,10)!==on||on>today||on<bounds.from||on>bounds.to)continue;
      daily.set(on,{on,stamp,value:row.value});
    }
    const points=[...daily.values()].sort((a,b)=>a.stamp-b.stamp);
    const dateFormat=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/London'}),date=on=>dateFormat.format(new Date(on+'T00:00:00Z'));
    if(!points.length)return '<p class="shift-chart-empty">No readings in this period. Try all records, or <a href="/member/dashboard#journey">add a measurement in Journey</a>.</p>';
    const first=points[0],last=points.at(-1),extra=forecast?.status==='ready'?forecast.projection:[],min=Math.min(...points.map(p=>p.value),...extra.map(p=>p.low)),max=Math.max(...points.map(p=>p.value),...extra.map(p=>p.high)),pad=(max-min)*.12||Math.max(Math.abs(max)*.03,1),low=Math.max(0,min-pad),high=max+pad;
    const w=Math.min(620,Math.max(300,Number(width)||620)),left=100,right=w-28,top=24,bottom=206;
    const endStamp=extra.length?Date.parse(extra.at(-1).on+'T00:00:00Z'):last.stamp;
    const x=p=>points.length===1?(left+right)/2:left+(p.stamp-first.stamp)/(endStamp-first.stamp||1)*(right-left);
    const y=p=>bottom-(p.value-low)/(high-low||1)*(bottom-top);
    const grid=[low,(low+high)/2,high].map(v=>{const yy=y({value:v});return '<line x1="'+left+'" x2="'+right+'" y1="'+yy.toFixed(2)+'" y2="'+yy.toFixed(2)+'" stroke="#b8bead"/><text x="88" y="'+(yy+4).toFixed(2)+'" text-anchor="end">'+esc(chartValue(metric,v,units))+'</text>';}).join('');
    const line=points.length>1?'<polyline data-measured-line="true" points="'+points.map(p=>x(p).toFixed(2)+','+y(p).toFixed(2)).join(' ')+'" fill="none" stroke="#34412c" stroke-width="3"/>':'';
    const dots=points.map((p,i)=>{const label=date(p.on)+': '+chartValue(metric,p.value,units);return '<g class="shift-chart-point" tabindex="'+(i===0?0:-1)+'" role="button" aria-label="'+esc(label)+'" data-on="'+esc(p.on)+'" data-point="'+i+'" data-reading="'+esc(label)+'"><circle class="shift-chart-hit" cx="'+x(p).toFixed(2)+'" cy="'+y(p).toFixed(2)+'" r="22" fill="transparent"/><circle class="shift-chart-dot" cx="'+x(p).toFixed(2)+'" cy="'+y(p).toFixed(2)+'" r="5" fill="#34412c"/></g>';}).join('');
    const extension=extra.length?'<polygon data-trend-scenarios points="'+[...extra.map(p=>({...p,value:p.low})),...extra.slice().reverse().map(p=>({...p,value:p.high}))].map(p=>x({stamp:Date.parse(p.on+'T00:00:00Z')}).toFixed(2)+','+y(p).toFixed(2)).join(' ')+'" fill="#707762" opacity=".15"/><polyline data-informational-projection points="'+extra.map(p=>x({stamp:Date.parse(p.on+'T00:00:00Z')}).toFixed(2)+','+y(p).toFixed(2)).join(' ')+'" fill="none" stroke="#34412c" stroke-width="2" stroke-dasharray="6 5"/>':'';
    const labels=points.length>1?'<text x="'+left+'" y="238">'+esc(date(first.on))+'</text><text x="'+right+'" y="238" text-anchor="end">'+esc(date(extra.at(-1)?.on||last.on))+'</text>':'<text x="'+((left+right)/2)+'" y="238" text-anchor="middle">'+esc(date(first.on))+'</text>';
    return rangeChangeMarkup(metric,points,units,date)+'<p class="shift-chart-latest"><strong>'+esc(chartValue(metric,last.value,units))+'</strong><span>Latest recorded · '+esc(date(last.on))+'</span></p><svg class="shift-chart-svg" viewBox="0 0 '+w+' 260" role="group" aria-labelledby="shiftChartTitle shiftChartDescription"><title id="shiftChartTitle">'+esc(metric.label)+' over time</title><desc id="shiftChartDescription">'+points.length+' recorded '+(points.length===1?'day':'days')+'. Latest saved reading on each day. '+esc(date(first.on))+' to '+esc(date(last.on))+'.</desc>'+grid+line+extension+dots+labels+'</svg><p class="shift-chart-readout" aria-live="polite">'+(points.length===1?'One reading. Add another when you’re ready.':'Tap a dot to see its reading.')+'</p><details class="shift-chart-records"><summary>See readings</summary><table><thead><tr><th scope="col">Date</th><th scope="col">'+esc(metric.label)+'</th></tr></thead><tbody>'+points.map(p=>'<tr><td>'+esc(date(p.on))+'</td><td>'+esc(chartValue(metric,p.value,units))+'</td></tr>').join('')+'</tbody></table></details>';
  }
  const chartStyles='<style>.shift-progress-chart{margin:22px 0;padding:20px;border:1px solid #707762;border-radius:16px;background:#f7f5ef;color:#050505}.shift-chart-controls{display:flex;flex-wrap:wrap;gap:12px}.shift-chart-controls label{flex:1;min-width:140px}.shift-chart-controls select{display:block;width:100%;min-height:44px;font:inherit;padding:8px;margin-top:5px;background:#fff;color:#050505;border:1px solid #707762;border-radius:8px}.shift-chart-latest{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap}.shift-chart-latest strong{font-size:30px}.shift-chart-latest span{font-size:14px}.shift-chart-svg{display:block;width:100%;height:auto;overflow:visible;font:12px Arial,sans-serif;color:#050505}.shift-chart-svg text{fill:currentColor}.shift-chart-point{cursor:pointer;outline:none}.shift-chart-point:focus .shift-chart-dot{stroke:#050505;stroke-width:5}.shift-chart-readout{min-height:24px}.shift-chart-records summary{min-height:44px;cursor:pointer;padding:10px 0}.shift-chart-records table{width:100%;border-collapse:collapse}.shift-chart-records td,.shift-chart-records th{text-align:left;padding:8px;border-bottom:1px solid #b8bead}.shift-pattern-sources{display:grid;gap:8px;margin:14px 0}.shift-pattern-sources label{min-height:44px;display:flex;align-items:center;gap:8px}.shift-pattern-panel button{min-height:44px;font:inherit;padding:8px 12px;border:1px solid #707762;border-radius:8px;background:#050505;color:#e7e3da;margin:8px 0}.shift-context-label select{display:block;width:100%;min-height:44px;font:inherit;margin:8px 0}.shift-context-detail{overflow-wrap:anywhere}.shift-chart-svg [data-context-id]{cursor:pointer}.shift-chart-svg [data-context-id]:focus{outline:2px solid #050505}.shift-pattern-panel details summary{min-height:44px;padding:10px 0}.shift-pattern-panel [data-pattern-result]{overflow-wrap:anywhere}.shift-photo-journey label{display:block;margin:12px 0}.shift-photo-journey input,.shift-photo-journey textarea,.shift-photo-journey select{display:block;box-sizing:border-box;width:100%;max-width:100%;min-height:44px;font:inherit}.shift-photo-journey button{min-height:44px;font:inherit;margin:10px 0}.shift-photo-journey summary{min-height:44px;cursor:pointer}.shift-chart-controls select:focus-visible,.shift-chart-records summary:focus-visible{outline:3px solid #707762;outline-offset:3px}@media(max-width:480px){.shift-progress-chart{padding:12px}.shift-chart-latest strong{font-size:26px}}</style>';
  let patternData=null,patternVersion=0;
  function contextMarkers(metric,patterns,period,now=Date.now(),width=620,forecast=null){
    if(!patterns||patterns.status!=='available')return '';
    const today=londonDay(now),bounds=periodBounds(period,now);
    const readings=(metric?.series||[]).filter(r=>typeof r.value==='number'&&Number.isFinite(r.value)&&/^\d{4}-\d{2}-\d{2}$/.test(r.on||'')&&r.on<=today&&r.on>=bounds.from&&r.on<=bounds.to).sort((a,b)=>a.on.localeCompare(b.on));
    const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'});
    const events=[...patterns.doses.map(d=>({...d,type:'jab',label:d.medicine+' · Jab recorded · '+(d.site||'Site unrecorded')+' · '+(d.dose?'Recorded strength: '+d.dose:'Dose strength not separately recorded')})),...patterns.symptoms.map(s=>({...s,type:'symptom',label:'Symptoms · '+s.note+' · '+(s.timeBasis==='reported_onset'?'Reported start time':'Log time; start time unknown')}))].filter(e=>Number.isFinite(Date.parse(e.at))).map(e=>({...e,on:fmt.format(new Date(e.at))})).filter(e=>e.on<=today&&e.on>=bounds.from&&e.on<=bounds.to).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
    const options=events.map(e=>'<option value="'+esc(e.id)+'">'+esc(new Date(e.at).toLocaleString('en-GB',{timeZone:'Europe/London'})+' · '+e.label)+'</option>').join('');
    let rail='';
    if(readings.length){const first=Date.parse(readings[0].on),recordedLast=Date.parse(readings.at(-1).on),last=forecast?.status==='ready'?Math.max(recordedLast,Date.parse(forecast.to)):recordedLast,w=Math.min(620,Math.max(300,Number(width)||620)),left=100,right=w-28;const buckets=new Map();for(const e of events){if(Date.parse(e.on)<first||Date.parse(e.on)>recordedLast)continue;const key=e.on+'_'+e.type;if(!buckets.has(key))buckets.set(key,e)}
      const grouped=[];for(const type of ['jab','symptom']){let cluster=null;for(const e of [...buckets.values()].filter(e=>e.type===type).sort((a,b)=>a.on.localeCompare(b.on))){const xx=first===last?(left+right)/2:left+(Date.parse(e.on)-first)/(last-first)*(right-left);if(!cluster||xx-cluster.lastX>=44){cluster={type,items:[],lastX:xx};grouped.push(cluster);}cluster.items.push({...e,x:xx});cluster.lastX=xx;}}
      rail='<svg class="shift-chart-svg" viewBox="0 0 '+w+' 104" role="group" aria-label="Recorded jabs and symptom dates aligned with the chart above"><text x="8" y="31">Jabs</text><text x="8" y="75">Symptoms</text>'+grouped.map(group=>{const e=group.items[0],x=group.items.reduce((sum,item)=>sum+item.x,0)/group.items.length,y=group.type==='jab'?27:71,label=group.items.length>1?group.items.length+' nearby recorded '+(group.type==='jab'?'jab':'symptom')+' dates; choose a record below':e.on+': '+e.label;return '<g role="button" tabindex="0" data-context-id="'+esc(e.id)+'" data-context-count="'+group.items.length+'" aria-label="'+esc(label)+'"><title>'+esc(label)+'</title><circle cx="'+x.toFixed(2)+'" cy="'+y+'" r="22" fill="transparent"/>'+group.items.map(item=>group.type==='jab'?'<rect x="'+(item.x-4).toFixed(2)+'" y="'+(y-4)+'" width="8" height="8" transform="rotate(45 '+item.x.toFixed(2)+' '+y+')" fill="#050505"/>':'<circle cx="'+item.x.toFixed(2)+'" cy="'+y+'" r="4" fill="#707762"/>').join('')+'</g>';}).join('')+'</svg>' ;
    }
    return '<section aria-label="Jab and symptom context">'+rail+(events.length?'<label class="shift-context-label">Jab or symptom detail<select data-context-event><option value="">Choose a recorded event</option>'+options+'</select></label><p class="shift-context-detail" aria-live="polite"></p>':'<p>No recorded jabs or symptoms in this selected period.</p>')+'</section>';
  }
  function bindContext(host){const select=host.querySelector('[data-context-event]');if(select){select.onchange=()=>{host.querySelector('.shift-context-detail').textContent=select.selectedIndex>0?select.options[select.selectedIndex].textContent:'';};host.querySelectorAll('[data-context-id]').forEach(mark=>{const choose=()=>{select.value=mark.dataset.contextId;select.onchange();if(Number(mark.dataset.contextCount)>1)host.querySelector('.shift-context-detail').textContent+=' · Nearby dates are grouped for tapping. Choose any record in the list.';};mark.onclick=choose;mark.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};});}}
  function mountPatterns(host){
    const section=document.createElement('section');section.className='shift-progress-chart shift-pattern-panel';
    section.innerHTML='<h3>Jabs, symptoms and your week</h3><p>Choose which saved records to compare. Missing logs stay unknown.</p><div class="shift-pattern-sources">'+[['treatment','Jabs and symptoms'],['food','Food notes and protein snapshots'],['fit','Exercises marked done'],['progress','Steps and sleep readings']].map(([value,label])=>'<label><input type="checkbox" value="'+value+'"> '+label+'</label>').join('')+'</div><button type="button" data-pattern-show>Show context</button><div data-pattern-result aria-live="polite"></div>';
    host.append(section);let currentSources=[],disposeWeek=null;
    const sources=()=>[...section.querySelectorAll('input:checked')].map(e=>e.value);
    const result=section.querySelector('[data-pattern-result]'),showButton=section.querySelector('[data-pattern-show]');
    const clear=()=>{++patternVersion;disposeWeek?.();disposeWeek=null;patternData=null;currentSources=[];result.replaceChildren();drawChart(host);};
    section.querySelectorAll('input').forEach(e=>e.onchange=clear);
    showButton.onclick=async()=>{
      const selected=sources();if(!selected.includes('treatment')){result.textContent='Choose jabs and symptoms to use this optional view.';return;}
      const version=++patternVersion;disposeWeek?.();disposeWeek=null;patternData=null;result.textContent='Checking your saved records…';showButton.disabled=true;
      try{const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);let response;try{response=await fetch((window.SST_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'')+'/v1/member/treatment/insights?sources='+encodeURIComponent(selected.join(',')),{credentials:'include',cache:'no-store',signal:controller.signal});}finally{clearTimeout(timeout)}const body=await response.json();if(version!==patternVersion||document.hidden||!section.isConnected)return;
        if(!response.ok){if(response.status===401){++renderVersion;chartData=null;patternData=null;host.replaceChildren();throw Error('Please sign in again to view your private records.')}throw Error(response.status===409?'Optional health tracking is off or paused. Review your tracking choice first.':response.status===404?'This optional pattern view is not available yet.':'The records could not be checked. Please try again.');}
        patternData=body.patterns;currentSources=selected;drawChart(host);result.replaceChildren();
        const notices=patternData.observations.length?patternData.observations.map(o=>o.text+' '+o.limitation):['There are not enough comparable recorded days or completed jab windows to describe a repeated pattern yet.'];
        for(const text of notices){const p=document.createElement('p');p.textContent=text;result.append(p)}if(patternData.historyMayBeLimited){const p=document.createElement('p');p.textContent='This view has reached its history limit; some records may be omitted.';result.append(p)}
        const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='See the recorded context by day';details.append(summary);for(const d of patternData.contextDays){const p=document.createElement('p');p.textContent=d.on+': '+[d.symptoms===true?'Symptom entry':d.symptoms===false?'Explicit no-symptoms entry':'Symptoms unknown',d.foodNote?'Food note: '+d.foodNote:null,d.foodEaten?.length?'Recorded as eaten: '+d.foodEaten.map(f=>f.food).join('; '):null,d.proteinGrams!==undefined?'Latest protein snapshot: '+d.proteinGrams+' g':null,d.exercisesDone!==undefined?d.exercisesDone+' individual exercises marked done':null,d.steps!==undefined?'Steps: '+d.steps:null,d.sleep_hours!==undefined?'Sleep: '+d.sleep_hours+' hours':null].filter(Boolean).join(' · ');details.append(p)}result.append(details);
        if(body.weekViewAvailable){
          if(!document.querySelector('link[data-treatment-week]')){const link=document.createElement('link');link.rel='stylesheet';link.href='/assets/member-experience/treatment-week.css';link.dataset.treatmentWeek='v1';document.head.append(link)}
          const slot=document.createElement('div');result.append(slot);
          import('/assets/member-experience/treatment-week.mjs').then(({mountTreatmentWeek})=>{if(version===patternVersion&&!document.hidden&&section.isConnected)disposeWeek=mountTreatmentWeek(slot,{sources:currentSources,apiBase:window.SST_API_BASE,onPrivateDenied:code=>{++renderVersion;++patternVersion;patternData=null;chartData=null;host.textContent=code===401?'Please sign in again to view your private records.':'Optional health tracking is off or paused.';}})}).catch(()=>{if(version===patternVersion&&!document.hidden&&slot.isConnected)slot.textContent='The optional week view could not load. Your recorded context is still available.';});
        }
        if(window.SST_API?.askShiftAI){const ask=document.createElement('button');ask.type='button';ask.textContent='Ask Timber to explain these records';ask.onclick=async()=>{const aiVersion=patternVersion;ask.disabled=true;const answer=document.createElement('p');answer.textContent='Checking the current records…';result.append(answer);try{const r=await SST_API.askShiftAI({message:'Explain the timing and descriptive comparisons in my selected saved records.',useJourney:true,usePatterns:true,patternSources:currentSources,personalisation:true});if(aiVersion===patternVersion&&!document.hidden&&section.isConnected){if(r.delivery!=='verified_recorded_facts')throw Error('Verified pattern answer unavailable.');answer.textContent=r.answer;}}catch(e){if(aiVersion===patternVersion&&!document.hidden&&section.isConnected){if(e.status===401){++renderVersion;++patternVersion;patternData=null;chartData=null;host.textContent='Please sign in again to view your private records.';}else{if(e.status===409){patternData=null;drawChart(host);result.replaceChildren();result.append(answer);}answer.textContent=e.message||'The explanation could not be checked.';}}}finally{ask.disabled=false;}};result.append(ask)}
      }catch(e){if(version===patternVersion&&!document.hidden&&section.isConnected){patternData=null;result.textContent=e.message||'The records could not be checked.';drawChart(host);}}finally{showButton.disabled=false;}
    };
  }

  let chartData=null,chartMetric='',chartPeriod='28',chartRange=null,chartRangeChosen=false,renderVersion=0,showForecast=false,scheduledRender=null;
  function drawChart(host){
    const chart=host.querySelector?.('.shift-progress-chart');if(!chart||!chartData)return;
    const metrics=chartData.metrics.filter(m=>Array.isArray(m.series)&&m.series.length);
    if(!chartRangeChosen&&recentRangeLabel(chartData.metrics)==='Since you started')chartPeriod='7';
    if(!metrics.some(m=>m.key===chartMetric))chartMetric=(metrics.find(m=>m.key==='weight')||metrics[0])?.key||'';
    const metric=metrics.find(m=>m.key===chartMetric);if(!metric)return;const estimate=metric.key==='weight'?weightProjection(metric.series):null;const forecast=showForecast&&chartPeriod!=='custom'&&estimate?.status==='ready'?estimate:null;const activePeriod=chartPeriod==='custom'?chartRange:chartPeriod;
    chart.innerHTML='<h3>Your progress over time</h3><div class="shift-chart-controls"><label>Measure<select data-chart-metric>'+metrics.map(m=>'<option value="'+esc(m.key)+'"'+(m.key===chartMetric?' selected':'')+'>'+esc(m.label)+'</option>').join('')+'</select></label><label>Period<select data-chart-period>'+[['7',recentRangeLabel(chartData.metrics)],['14','2 weeks'],['28','4 weeks'],['3months','3 months'],['custom','Custom'],['all','All records']].map(([v,label])=>'<option value="'+v+'"'+(v===chartPeriod?' selected':'')+'>'+label+'</option>').join('')+'</select></label></div>'+(chartData.historyMayBeLimited?'<p>This view shows up to 1,000 records from each log.</p>':'')+'<div class="shift-chart-view">'+progressChartMarkup(metric,weightUnits,activePeriod,Date.now(),chart.clientWidth-24,forecast)+contextMarkers(metric,patternData,activePeriod,Date.now(),chart.clientWidth-24,forecast)+'</div>';
    if(metric.key==='weight'&&chartPeriod!=='custom'){chart.insertAdjacentHTML('beforeend','<label class="shift-forecast-toggle"><input type="checkbox" data-weight-forecast '+(showForecast?'checked':'')+'> Show an informational 4-week projection</label><p class="shift-forecast-note">'+esc(showForecast?(estimate.status==='ready'?estimate.meaning:estimate.reason):'Optional. Based only on recorded weights, with no guaranteed outcome or target date.')+'</p>');chart.querySelector('[data-weight-forecast]').onchange=e=>{showForecast=e.target.checked;drawChart(host);chart.querySelector('[data-weight-forecast]').focus();};}
    mountRangeButtons(chart,host);mountCustomDates(chart,host);bindContext(host);
    chart.querySelector('[data-chart-metric]').onchange=e=>{chartMetric=e.target.value;drawChart(host);chart.querySelector('[data-chart-metric]').focus();};
    chart.querySelector('[data-chart-period]').onchange=e=>{selectPeriod(e.target.value,host);chart.querySelector('[data-chart-period]').focus();};
    const show=e=>{const point=e.target.closest?.('[data-point]');if(point){chart.querySelector('.shift-chart-readout').textContent=point.dataset.reading;host._choosePhotoDate?.(point.dataset.on);chart.querySelectorAll('[data-point]').forEach(p=>p.setAttribute('tabindex',p===point?'0':'-1'));}};
    chart.onclick=show;if(chart._readingFocus)chart.removeEventListener('focusin',chart._readingFocus);chart._readingFocus=show;chart.addEventListener('focusin',show);
    chart.onkeydown=e=>{const point=e.target.closest?.('[data-point]');if(!point)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();show(e);}if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const points=[...chart.querySelectorAll('[data-point]')],index=points.indexOf(point),next=e.key==='Home'?0:e.key==='End'?points.length-1:Math.max(0,Math.min(points.length-1,index+(e.key==='ArrowRight'?1:-1)));points[next].focus();}};
  }

  function selectPeriod(value,host){
    chartPeriod=value;chartRangeChosen=true;
    if(chartPeriod==='custom'&&!chartRange){const to=londonDay();chartRange={from:new Date(Date.parse(to+'T00:00:00Z')-27*86400000).toISOString().slice(0,10),to};}
    drawChart(host);
  }
  function mountRangeButtons(chart,host){
    const nav=document.createElement('nav');nav.className='shift-chart-range-buttons';nav.setAttribute('aria-label','Progress date range');
    for(const [value,label]of [['7',recentRangeLabel(chartData.metrics)],['14','2 weeks'],['28','4 weeks'],['3months','3 months'],['custom','Custom']]){const button=document.createElement('button');button.type='button';button.dataset.chartRange=value;button.textContent=label;button.setAttribute('aria-pressed',String(chartPeriod===value));button.onclick=()=>{selectPeriod(value,host);if(value==='custom')chart.querySelector('.shift-chart-custom-dates input')?.focus();else chart.querySelector('[data-chart-range="'+value+'"]')?.focus();};nav.append(button);}
    chart.querySelector('.shift-chart-controls').before(nav);
  }
  // The existing PR1392 custom-date flow is carried forward against current
  // main. Filtering affects the genuine chart/context only, never saved records.
  function mountCustomDates(chart,host){
    if(chartPeriod!=='custom')return;
    const form=document.createElement('form');form.className='shift-chart-custom-dates';form.setAttribute('aria-label','Custom progress dates');
    form.innerHTML='<div class="shift-chart-controls"><label>From<input type="date" name="from" required></label><label>To<input type="date" name="to" required></label></div><p role="alert" data-date-error></p><button type="submit">Show these dates</button>';
    form.elements.from.value=chartRange.from;form.elements.to.value=chartRange.to;form.elements.from.max=londonDay();form.elements.to.max=londonDay();
    chart.querySelector('.shift-chart-controls').after(form);
    form.onsubmit=e=>{e.preventDefault();try{const next={from:form.elements.from.value,to:form.elements.to.value};periodBounds(next);chartRange=next;drawChart(host);host.querySelector('.shift-chart-view')?.scrollIntoView({block:'nearest',behavior:'instant'});}catch(error){form.querySelector('[data-date-error]').textContent=error.message;}};
  }

  function photoCalendarTimestamp(on){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(on)||!Number.isFinite(Date.parse(on+'T00:00:00Z'))||new Date(on+'T00:00:00Z').toISOString().slice(0,10)!==on)throw Error('Choose a valid photo date.');
    const midnight=Date.parse(on+'T00:00:00Z'),zone=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',timeZoneName:'shortOffset'});
    let minutes=0;
    for(let i=0;i<2;i++){
      const name=zone.formatToParts(new Date(midnight-minutes*60000)).find(p=>p.type==='timeZoneName')?.value;
      const offset=/^GMT(?:([+-])(\d{1,2})(?::(\d{2}))?)?$/.exec(name||'');
      if(!offset)throw Error('Photo date could not be confirmed.');
      minutes=offset[1]?(offset[1]==='-'?-1:1)*(Number(offset[2])*60+Number(offset[3]||0)):0;
    }
    const suffix=minutes===0?'Z':(minutes<0?'-':'+')+String(Math.floor(Math.abs(minutes)/60)).padStart(2,'0')+':'+String(Math.abs(minutes)%60).padStart(2,'0');
    return on+'T00:00:00'+suffix;
  }

  const photoDate=on=>{const at=Date.parse(String(on).slice(0,10)+'T00:00:00Z');return Number.isFinite(at)?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/London'}).format(new Date(at)):'Unknown date';};
  let clearPrivatePhotos=()=>{};
  function mountPhotoJourney(host){
    if(!window.SST_API?.listProgressPhotos||!window.SST_API?.saveProgressPhoto)return;
    const section=document.createElement('details');section.className='shift-progress-chart shift-photo-journey';
    section.innerHTML='<summary>Your private photo journey (optional)</summary><p>Dated photos alongside your own records. No body scoring, generated transformation or public sharing.</p><form data-journey-photo><label>Choose photo<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required></label><label>Photo date<input name="on" type="date" required></label><details><summary>Add a weight or Life Back note (optional)</summary><label>Weight at that time (kg)<input name="weight" type="number" min="20" max="400" step="0.1"></label><label>A moment you want to remember<textarea name="note" maxlength="500" placeholder="A walk, an easier journey, something that mattered"></textarea></label></details><p>Saving keeps a resized copy privately in your account. Up to 60 photos; each can be deleted.</p><button type="submit">Save private photo</button></form><p data-photo-status role="status"></p><div data-photo-list></div>';
    host.append(section);const form=section.querySelector('form'),status=section.querySelector('[data-photo-status]'),list=section.querySelector('[data-photo-list]');
    const today=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'});form.elements.on.value=today;form.elements.on.max=today;
    let photos=[],urls=new Map(),version=0,operation=null,loadPending=false;
    const revoke=()=>{for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();};
    clearPrivatePhotos=()=>{++version;revoke();photos=[];operation=null;list.replaceChildren();form.reset();};
    const active=v=>v===version&&!document.hidden&&section.isConnected;
    const fail=error=>{if(error.status===401||error.status===409&&/consent|tracking/.test(error.code||'')){clearPrivatePhotos();host.replaceChildren();host.textContent=error.status===401?'Please sign in again to view private records.':'Review optional health tracking before viewing your private records.';}else status.textContent=error.message||'Photos are unavailable just now. Your saved records have not been changed.';};
    async function image(photo,v){
      if(urls.has(photo.id))return urls.get(photo.id);
      const response=await fetch(SST_API.progressPhotoUrl(photo.id),{credentials:'include',cache:'no-store'});
      if(!response.ok)throw Object.assign(Error(response.status===401?'Please sign in again.':'This photo could not be loaded.'),{status:response.status,code:response.status===409?'health_consent_required':''});
      const blob=await response.blob();if(!active(v))return null;
      const url=URL.createObjectURL(blob);if(urls.has(photo.id))URL.revokeObjectURL(url);else urls.set(photo.id,url);return urls.get(photo.id);
    }
    async function display(){
      const v=++version;revoke();list.replaceChildren();
      if(!photos.length){list.textContent='No private photos yet. Add one only if it is useful to you.';return;}
      list.innerHTML='<label>First photo<select data-photo-first aria-label="First photo">'+photos.map(p=>'<option value="'+p.id+'">'+esc(photoDate(p.captured_at))+'</option>').join('')+'</select></label>'+(photos.length>1?'<label>Compare with<select data-photo-second aria-label="Compare with">'+photos.map(p=>'<option value="'+p.id+'">'+esc(photoDate(p.captured_at))+'</option>').join('')+'</select></label>':'')+'<div data-photo-compare style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px"></div><label>Find photos for a recorded date<input data-photo-find type="date"></label><p data-photo-match role="status"></p>';
      const first=list.querySelector('[data-photo-first]'),second=list.querySelector('[data-photo-second]');if(second)second.value=photos.at(-1).id;
      let drawVersion=0;
      async function compare(){
        const d=++drawVersion,chosen=[first.value,second?.value].filter((id,i,a)=>id&&a.indexOf(id)===i),target=list.querySelector('[data-photo-compare]');target.replaceChildren();
        for(const id of chosen){const p=photos.find(p=>String(p.id)===id);if(!p)continue;const figure=document.createElement('figure');figure.style.margin='0';const caption=document.createElement('figcaption');caption.textContent=photoDate(p.captured_at)+(p.weight_kg?' · '+p.weight_kg+' kg':'')+(p.note?' · '+p.note:'');figure.append(caption);target.append(figure);
          const remove=document.createElement('button');remove.type='button';remove.textContent='Delete this photo';let armed=false;remove.onclick=async()=>{if(!armed){armed=true;remove.textContent='Confirm permanent deletion';return;}remove.disabled=true;try{await SST_API.deleteProgressPhoto(p.id);if(!active(v))return;photos=photos.filter(x=>x.id!==p.id);status.textContent='Private photo deleted.';await display();}catch(e){if(active(v))fail(e);}finally{remove.disabled=false;}};figure.append(remove);
          try{const url=await image(p,v);if(!url||!active(v)||d!==drawVersion)return;const img=document.createElement('img');img.src=url;img.alt='Your saved private photo dated '+photoDate(p.captured_at);img.style.cssText='width:100%;height:auto;max-height:420px;object-fit:contain';figure.prepend(img);}catch(e){if(active(v)&&d===drawVersion)fail(e);}
        }
      }
      first.onchange=compare;if(second)second.onchange=compare;
      const find=list.querySelector('[data-photo-find]');find.onchange=()=>{const on=find.value,p=photos.find(p=>p.captured_at.slice(0,10)===on),message=list.querySelector('[data-photo-match]');if(!p){message.textContent='No photo saved for that date. Other dates remain available above.';return;}first.value=p.id;message.textContent='Photo saved on '+photoDate(on)+'.';compare();};
      host._choosePhotoDate=on=>{find.value=on;find.onchange();};await compare();
    }
    async function load(){if(loadPending)return;loadPending=true;const v=++version;status.textContent='Loading private photos…';try{const r=await SST_API.listProgressPhotos();if(!active(v))return;photos=r.photos||[];status.textContent='';await display();}catch(e){if(active(v)||active(v+1))fail(e);}finally{loadPending=false;}}
    section.addEventListener('toggle',()=>{if(section.open&&!photos.length)load();else if(!section.open){++version;revoke();list.replaceChildren();photos=[];host._choosePhotoDate=null;}});
    form.addEventListener('input',()=>{operation=null;});
    form.onsubmit=async e=>{e.preventDefault();const file=form.elements.photo.files[0];if(!file||!form.reportValidity())return;const v=version,button=form.querySelector('button');button.disabled=true;for(const input of form.elements)input.disabled=true;status.textContent='Resizing and saving your private photo…';
      try{const bitmap=await createImageBitmap(file),scale=Math.min(1,1000/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.78));if(!active(v))return;if(!blob||blob.size>512000)throw Error('Choose a smaller photo and try again.');
        if(!operation)operation={id:crypto.randomUUID(),file:new File([blob],'private-progress.jpg',{type:'image/jpeg'}),meta:{capturedAt:photoCalendarTimestamp(form.elements.on.value),source:'progress_journey',note:form.elements.note.value.trim(),...(form.elements.weight.value?{weightKg:Number(form.elements.weight.value)}:{})}};
        await SST_API.saveProgressPhoto(operation.file,{...operation.meta,operationId:operation.id});if(!active(v))return;operation=null;form.reset();form.elements.on.value=today;status.textContent='Private photo saved. No image generation was used.';await load();
      }catch(e){if(active(v))fail(e);}finally{for(const input of form.elements)input.disabled=false;}
    };
  }

  const explicitWeightMapping=(()=>{
// Local preview only. The existing authenticated import route remains the write boundary.
const MAX_BYTES=32000;
function fail(message){throw new Error(message);}
function readWeightTable(text,delimiter=','){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BYTES)fail('Use a CSV no larger than 32 KB.');
 if(![',',';','\t'].includes(delimiter))fail('Choose comma, semicolon or tab.');
 text=text.replace(/^\uFEFF/,'');
 const rows=[];let row=[],value='',quoted=false,closed=false;
 const field=()=>{row.push(value);value='';closed=false;if(row.length>64)fail('Use no more than 64 columns.');};
 const line=()=>{field();if(row.some(v=>v.trim()!==''))rows.push(row);row=[];if(rows.length>366)fail('Use no more than 365 readings plus a heading.');};
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){value+='"';i++;}else{quoted=false;closed=true;}}else{value+=c;}continue;}
  if(c===delimiter){field();continue;}
  if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;line();continue;}
  if(closed)fail('Unexpected text after a quoted field.');
  if(c==='"'){if(value!=='')fail('Quote a whole field.');quoted=true;}else{value+=c;}
 }
 if(quoted)fail('Close the quoted field.');
 if(value!==''||row.length||closed)line();
 if(rows.length<2)fail('Include column headings and at least one reading.');
 const width=rows[0].length;
 if(rows.some(r=>r.length!==width))fail('Every row must have the same number of columns.');
 return {headings:rows[0],rows:rows.slice(1)};
}
function number(raw,decimal){
 const value=raw.trim();
 const pattern=decimal===','?/^\d+(?:,\d+)?$/:/^\d+(?:\.\d+)?$/;
 if(!pattern.test(value))fail('Use a plain positive number; do not include units or thousands separators.');
 const n=Number(value.replace(',','.'));if(!Number.isFinite(n))fail('Check the weight.');return n;
}
function date(raw,format,today){
 const s=raw.trim();let year,month,day;
 if(format==='ymd'){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);if(!m)fail('Use YYYY-MM-DD dates.');[,year,month,day]=m;}
 else{const m=/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(s);if(!m)fail('Use four-digit years in the chosen date format.');year=m[3];[day,month]=format==='dmy'?[m[1],m[2]]:[m[2],m[1]];}
 const on=`${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
 const at=Date.parse(on+'T00:00:00Z');
 if(!Number.isFinite(at)||new Date(at).toISOString().slice(0,10)!==on||on>today)fail('Use a real date that is not in the future.');
 return on;
}
function previewMappedWeights(text,mapping,now=Date.now()){
 if(!mapping||typeof mapping!=='object')fail('Choose the date and weight columns, date format and unit.');
 const {dateColumn,weightColumn,poundsColumn=null,dateFormat,unit,delimiter=',',decimal='.'}=mapping;
 if(!['ymd','dmy','mdy'].includes(dateFormat)||!['kg','lb','st_lb'].includes(unit)||!['.',','].includes(decimal))fail('Choose a supported date format, weight unit and decimal separator.');
 const table=readWeightTable(text,delimiter),width=table.headings.length;
 const columns=[dateColumn,weightColumn,...(unit==='st_lb'?[poundsColumn]:[])];
 if(columns.some(n=>!Number.isInteger(n)||n<0||n>=width)||new Set(columns).size!==columns.length)fail('Choose distinct existing columns.');
 if(!Number.isFinite(now))fail('Check the current date.');
 const today=new Date(now).toISOString().slice(0,10),seen=new Set(),rows=[];
 for(let i=0;i<table.rows.length;i++){
  try{
   const r=table.rows[i],on=date(r[dateColumn],dateFormat,today);
   if(seen.has(on))fail('Keep only one reading for each date.');
   let weight=number(r[weightColumn],decimal);
   if(unit==='st_lb'){const pounds=number(r[poundsColumn],decimal);if(!Number.isInteger(weight)||pounds>=14)fail('Use whole stones and pounds below 14.');weight=weight*14+pounds;}
   const weightKg=unit==='kg'?weight:weight*0.45359237;
   if(weightKg<20||weightKg>400)fail('Use weights between 20 and 400 kg.');
   // No rounding before range checks. Normalise only for the preview/import payload.
   rows.push({on,weightKg:Math.round(weightKg*1000)/1000});seen.add(on);
  }catch(e){fail(`Reading ${i+1}: ${e.message}`);}
 }
 return {rows,meaning:'Preview only: confirm dates, units and converted weights before importing. Existing same-date readings are kept by My Timber. This imports weight only; no prescriptions, doses, notes or photos.',sourceHeadings:table.headings};
}

return {readWeightTable,previewMappedWeights};
})();
  function mountWeightImport(host){
    const section=document.createElement('details');section.className='shift-progress-chart';
    section.innerHTML='<summary>Bring your weight history (optional)</summary><button type="button" data-weight-export>Download recorded weights (CSV)</button><p>Export uses recorded weights available in this Progress view; it excludes projections. Your account export holds the wider saved history.</p><p>Choose your date and weight columns, date order and units. Preview every converted reading before saving. Up to 365 readings and 32 KB. Weight only: no prescriptions, doses, notes or photos.</p><form><label>Choose CSV<input type="file" accept=".csv,text/csv" required></label><label>Column separator<select data-map="delimiter"><option value=",">Comma</option><option value=";">Semicolon</option><option value="tab">Tab</option></select></label><label>Date column<select data-map="dateColumn" required><option value="">Choose a column</option></select></label><label>Weight or whole-stones column<select data-map="weightColumn" required><option value="">Choose a column</option></select></label><label>Date order<select data-map="dateFormat" required><option value="">Choose date order</option><option value="ymd">Year-month-day (YYYY-MM-DD)</option><option value="dmy">Day-month-year</option><option value="mdy">Month-day-year</option></select></label><label>Weight unit<select data-map="unit" required><option value="">Choose units</option><option value="kg">Kilograms</option><option value="lb">Pounds</option><option value="st_lb">Whole stones and a separate pounds column</option></select></label><label data-pounds-label hidden>Pounds column<select data-map="poundsColumn"><option value="">Choose a column</option></select></label><label>Decimal separator<select data-map="decimal"><option value=".">Point (94.5)</option><option value=",">Comma (94,5)</option></select></label><button>Preview mapped readings</button></form><p data-import-status role="status"></p><div data-import-preview></div>';
    host.append(section);const status=section.querySelector('[data-import-status]'),preview=section.querySelector('[data-import-preview]'),fileInput=section.querySelector('input[type="file"]'),fields=Object.fromEntries([...section.querySelectorAll('[data-map]')].map(el=>[el.dataset.map,el]));let rows=null,version=0;
    const invalidate=()=>{++version;rows=null;preview.replaceChildren();};
    const delimiter=()=>fields.delimiter.value==='tab'?'\t':fields.delimiter.value;
    async function columns(){
      invalidate();const v=version,file=fileInput.files[0];if(!file)return;
      if(file.size>32000){status.textContent='Choose a CSV no larger than 32 KB.';return;}
      try{const table=explicitWeightMapping.readWeightTable(await file.text(),delimiter());if(v!==version||document.hidden||!section.isConnected)return;
        for(const key of ['dateColumn','weightColumn','poundsColumn']){const field=fields[key];field.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='Choose a column';field.append(empty);table.headings.forEach((heading,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=(i+1)+': '+(heading||'(empty heading)');field.append(option);});}
        status.textContent='Columns loaded locally. Choose date and weight columns, date order and units. Nothing has been saved.';
      }catch(error){status.textContent=error.message;}
    }
    fileInput.onchange=columns;fields.delimiter.onchange=columns;
    for(const [key,field]of Object.entries(fields))if(key!=='delimiter')field.onchange=()=>{invalidate();section.querySelector('[data-pounds-label]').hidden=fields.unit.value!=='st_lb';fields.poundsColumn.required=fields.unit.value==='st_lb';status.textContent='Mapping changed. Preview again before importing.';};
    section.querySelector('[data-weight-export]').onclick=()=>{const byDay=new Map();for(const r of chartData?.metrics?.find(m=>m.key==='weight')?.series||[])if(/^\d{4}-\d{2}-\d{2}$/.test(r.on)&&typeof r.value==='number'&&Number.isFinite(r.value))byDay.set(r.on,r.value);if(!byDay.size){status.textContent='No recorded weights are available to export yet.';return;}const text='date,weight_kg\n'+[...byDay].sort((a,b)=>a[0].localeCompare(b[0])).map(([on,value])=>on+','+value).join('\n'),url=URL.createObjectURL(new Blob([text],{type:'text/csv'})),link=document.createElement('a');link.href=url;link.download='my-timber-recorded-weights.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Recorded weights downloaded to this device. Nothing has been shared.';};
    section.querySelector('form').onsubmit=async e=>{e.preventDefault();invalidate();const v=version,file=fileInput.files[0];if(!file||file.size>32000){status.textContent='Choose a CSV no larger than 32 KB.';return;}
      try{const text=await file.text();if(v!==version||document.hidden||!section.isConnected)return;
        const mapped=explicitWeightMapping.previewMappedWeights(text,{dateColumn:fields.dateColumn.value===''?null:Number(fields.dateColumn.value),weightColumn:fields.weightColumn.value===''?null:Number(fields.weightColumn.value),poundsColumn:fields.poundsColumn.value===''?null:Number(fields.poundsColumn.value),dateFormat:fields.dateFormat.value,unit:fields.unit.value,delimiter:delimiter(),decimal:fields.decimal.value});
        rows=mapped.rows;status.textContent=rows.length+' mapped readings ready to review. '+mapped.meaning;
        preview.innerHTML='<details open><summary>Converted readings to import</summary><table><thead><tr><th>Date (YYYY-MM-DD)</th><th>Weight (kg)</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(r.on)+'</td><td>'+esc(r.weightKg)+'</td></tr>').join('')+'</tbody></table></details><p>Existing weight records for the same dates are kept. Confirm only if the dates and converted kilogram weights are correct.</p><button data-import-confirm>Confirm import</button>';
        preview.querySelector('button').onclick=async()=>{if(v!==version||document.hidden||!section.isConnected||!rows)return;const button=preview.querySelector('button');button.disabled=true;try{const response=await fetch((window.SST_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'')+'/v1/progress/import',{method:'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows})}),b=await response.json();if(v!==version||document.hidden||!section.isConnected)return;
          if(!response.ok){if(response.status===401||response.status===409){rows=null;clearPrivatePhotos();chartData=null;host.replaceChildren();host.textContent=response.status===401?'Please sign in again.':'Review optional health tracking before importing.';return;}throw Error(b.message||'Import could not be confirmed. Preview again before retrying.');}
          rows=null;preview.replaceChildren();status.textContent=b.imported+' readings imported; '+b.skipped+' existing dates kept. Reopen Progress to refresh the chart.';
        }catch(error){if(v===version&&section.isConnected)status.textContent=error.message;}finally{button.disabled=false;}};
      }catch(error){rows=null;status.textContent=error.message;}
    };
  }

  function ensureHost(){
    const panel=document.querySelector('#panel-visualise');
    if(!panel)return null;
    let host=document.getElementById('shiftProgressStory');
    if(!host){
      host=document.createElement('section');host.id='shiftProgressStory';host.className='shift-progress-story';host.setAttribute('aria-live','polite');host.setAttribute('aria-busy','true');
      const heading=panel.querySelector(':scope > h2');
      const sub=panel.querySelector(':scope > .mp-muted');
      const anchor=sub||heading,direct=anchor?.parentElement===panel?anchor:[...panel.children].find(child=>anchor&&child.contains(anchor));
      if(panel.querySelector('.member-progress-map'))panel.prepend(host);else if(direct)direct.after(host);else panel.prepend(host);
    }
    const tab=document.querySelector('.mp-tab[data-panel="visualise"]');
    if(tab&&/progress picture/i.test(tab.textContent||'')){tab.textContent='Progress';tab.setAttribute('aria-label','Progress')}
    return host;
  }

  const sessionAllowsView=()=>!document.body.hasAttribute('data-member-session')||document.body.dataset.memberSession==='ready';
  async function render(){
    if(!sessionAllowsView())return;
    const host=ensureHost();if(!host||!window.SST_API?.getProgressSummary)return;
    const version=++renderVersion;++patternVersion;patternData=null;clearPrivatePhotos();host.setAttribute('aria-busy','true');
    try{
      const r=await SST_API.getProgressSummary();const p=r.progress||r;if(version!==renderVersion||document.hidden||!sessionAllowsView())return;chartData=null;
      weightUnits=['stone_lb','kg','lb'].includes(p.units)?p.units:'stone_lb';
      if(!p||p.state==='empty'){
        host.innerHTML=`<div class="shift-progress-intro"><div><span class="eyebrow">YOUR PROGRESS</span><h3>Your progress story starts with the first check-in.</h3><p>Weight is one signal, not the scoreboard. Shift will bring waist, blood pressure, movement, sleep and mood together here as you log them.</p></div><div class="shift-progress-nudge"><strong>Keep it useful.</strong><span>Add what you know. Leave the rest blank.</span></div></div>`;
        host.insertAdjacentHTML('beforeend',chartStyles);mountPatterns(host);mountPhotoJourney(host);mountWeightImport(host);
        return;
      }
      const metrics=Array.isArray(p.metrics)?p.metrics.filter(m=>m&&m.latest!=null):[];
      chartData={...p,metrics};
      const improving=metrics.filter(m=>m.direction==='improving').length;
      const entryCount=cleanNumber(p.entries)||0;
      const milestones=Array.isArray(p.milestones)?p.milestones.map(x=>x.key==='weight'?{...x,detail:deltaCopy(metrics.find(m=>m.key==='weight'))}:x):[];
      host.innerHTML=`<div class="shift-progress-intro">
        <div><span class="eyebrow">YOUR PROGRESS</span><h3>${esc(p.headline||'Since you started')}</h3><p>${esc(p.message||'Progress is bigger than weight.')}</p></div>
        <div class="shift-progress-score"><strong>${improving}</strong><span>signal${improving===1?'':'s'} moving the right way</span><small>${entryCount} saved record${entryCount===1?'':'s'}</small></div>
      </div>
      ${metrics.some(m=>Array.isArray(m.series)&&m.series.length)?chartStyles+'<section class="shift-progress-chart" aria-label="Progress charts"></section>':''}
      ${metrics.length?`<div class="shift-progress-grid">${metrics.map(metricCard).join('')}</div>`:''}
      ${milestones.length?`<div class="shift-progress-milestones"><span class="eyebrow">WINS WORTH NOTICING</span>${milestones.map(x=>`<div><strong>${esc(x.label)}</strong>${x.detail?`<span>${esc(x.detail)}</span>`:''}</div>`).join('')}</div>`:''}
      <p class="shift-progress-foot">This is your trend, not a judgement. One rough day does not erase the direction of travel.</p>`;
      drawChart(host);mountPatterns(host);mountPhotoJourney(host);mountWeightImport(host);
    }catch(err){
      if(version!==renderVersion)return;chartData=null;
      host.innerHTML='<div class="shift-progress-intro"><div><span class="eyebrow">YOUR PROGRESS</span><h3>Your progress is still saved.</h3><p>We could not draw the summary just now. Your retained check-ins and Progress Pictures have not been removed.</p></div></div>';
    }finally{if(version===renderVersion)host.setAttribute('aria-busy','false')}
  }

  function queueRender(delay=0){
    clearTimeout(scheduledRender);scheduledRender=null;
    const host=ensureHost();if(!host||!window.SST_API?.getProgressSummary||document.hidden||!sessionAllowsView())return;
    ++renderVersion;++patternVersion;patternData=null;host.setAttribute('aria-busy','true');
    host.querySelectorAll('.shift-pattern-panel input,.shift-pattern-panel button').forEach(control=>{control.disabled=true;});
    scheduledRender=setTimeout(()=>{scheduledRender=null;render();},delay);
  }
  function boot(){queueRender();document.addEventListener('sst:progress-saved',()=>{if(location.hash==='#visualise')queueRender();});const clear=()=>{clearTimeout(scheduledRender);scheduledRender=null;++renderVersion;++patternVersion;chartData=null;patternData=null;showForecast=false;chartRange=null;chartRangeChosen=false;chartPeriod='28';const host=document.getElementById('shiftProgressStory');clearPrivatePhotos();if(host)host.innerHTML='';};new MutationObserver(()=>{if(!sessionAllowsView())clear();else if(location.hash==='#visualise')queueRender();}).observe(document.body,{attributes:true,attributeFilter:['data-member-session']});window.addEventListener('pagehide',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else if(location.hash==='#visualise')queueRender();});window.addEventListener('hashchange',()=>{if(location.hash==='#visualise')queueRender()});document.addEventListener('click',e=>{if(e.target.closest('.mp-tab[data-panel="visualise"]'))queueRender(120);if(e.target.closest('#saveOriginal,[data-photo-delete]'))setTimeout(render,1800)});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();
