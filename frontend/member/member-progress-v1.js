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
    <span class="shift-progress-label">${esc(m.label)}</span>
    <strong>${esc(formatValue(m))}</strong>
    <small>${esc(deltaCopy(m))}</small>
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
  function progressChartMarkup(metric,units,period,now=Date.now(),width=620){
    const today=new Date(now).toISOString().slice(0,10),day=86400000;
    const cutoff=period==='all'?0:Date.parse(today+'T00:00:00Z')-(Number(period)-1)*day;
    const daily=new Map();
    for(const row of metric.series||[]){
      if(!row||typeof row.value!=='number'||!Number.isFinite(row.value)||typeof row.on!=='string')continue;
      const on=row.on.slice(0,10),stamp=Date.parse(on+'T00:00:00Z');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(on)||!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,10)!==on||on>today||stamp<cutoff)continue;
      daily.set(on,{on,stamp,value:row.value});
    }
    const points=[...daily.values()].sort((a,b)=>a.stamp-b.stamp);
    const dateFormat=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/London'}),date=on=>dateFormat.format(new Date(on+'T12:00:00Z'));
    if(!points.length)return '<p class="shift-chart-empty">No readings in this period. Try all records, or <a href="/member/dashboard#journey">add a measurement in Journey</a>.</p>';
    const first=points[0],last=points.at(-1),min=Math.min(...points.map(p=>p.value)),max=Math.max(...points.map(p=>p.value)),pad=(max-min)*.12||Math.max(Math.abs(max)*.03,1),low=Math.max(0,min-pad),high=max+pad;
    const w=Math.min(620,Math.max(300,Number(width)||620)),left=100,right=w-28,top=24,bottom=206;
    const x=p=>points.length===1?(left+right)/2:left+(p.stamp-first.stamp)/(last.stamp-first.stamp||1)*(right-left);
    const y=p=>bottom-(p.value-low)/(high-low||1)*(bottom-top);
    const grid=[low,(low+high)/2,high].map(v=>{const yy=y({value:v});return '<line x1="'+left+'" x2="'+right+'" y1="'+yy.toFixed(2)+'" y2="'+yy.toFixed(2)+'" stroke="#b8bead"/><text x="88" y="'+(yy+4).toFixed(2)+'" text-anchor="end">'+esc(chartValue(metric,v,units))+'</text>';}).join('');
    const line=points.length>1?'<polyline data-measured-line="true" points="'+points.map(p=>x(p).toFixed(2)+','+y(p).toFixed(2)).join(' ')+'" fill="none" stroke="#34412c" stroke-width="3"/>':'';
    const dots=points.map((p,i)=>{const label=date(p.on)+': '+chartValue(metric,p.value,units);return '<g class="shift-chart-point" tabindex="'+(i===0?0:-1)+'" role="button" aria-label="'+esc(label)+'" data-point="'+i+'" data-reading="'+esc(label)+'"><circle class="shift-chart-hit" cx="'+x(p).toFixed(2)+'" cy="'+y(p).toFixed(2)+'" r="22" fill="transparent"/><circle class="shift-chart-dot" cx="'+x(p).toFixed(2)+'" cy="'+y(p).toFixed(2)+'" r="5" fill="#34412c"/></g>';}).join('');
    const labels=points.length>1?'<text x="'+left+'" y="238">'+esc(date(first.on))+'</text><text x="'+right+'" y="238" text-anchor="end">'+esc(date(last.on))+'</text>':'<text x="'+((left+right)/2)+'" y="238" text-anchor="middle">'+esc(date(first.on))+'</text>';
    return '<p class="shift-chart-latest"><strong>'+esc(chartValue(metric,last.value,units))+'</strong><span>Latest recorded · '+esc(date(last.on))+'</span></p><svg class="shift-chart-svg" viewBox="0 0 '+w+' 260" role="group" aria-labelledby="shiftChartTitle shiftChartDescription"><title id="shiftChartTitle">'+esc(metric.label)+' over time</title><desc id="shiftChartDescription">'+points.length+' recorded '+(points.length===1?'day':'days')+'. Latest saved reading on each day. '+esc(date(first.on))+' to '+esc(date(last.on))+'.</desc>'+grid+line+dots+labels+'</svg><p class="shift-chart-readout" aria-live="polite">'+(points.length===1?'One reading. Add another when you’re ready.':'Tap a dot to see its reading.')+'</p><details class="shift-chart-records"><summary>See readings</summary><table><thead><tr><th scope="col">Date</th><th scope="col">'+esc(metric.label)+'</th></tr></thead><tbody>'+points.map(p=>'<tr><td>'+esc(date(p.on))+'</td><td>'+esc(chartValue(metric,p.value,units))+'</td></tr>').join('')+'</tbody></table></details>';
  }
  const chartStyles='<style>.shift-progress-chart{margin:22px 0;padding:20px;border:1px solid #707762;border-radius:16px;background:#f7f5ef;color:#050505}.shift-chart-controls{display:flex;flex-wrap:wrap;gap:12px}.shift-chart-controls label{flex:1;min-width:140px}.shift-chart-controls select{display:block;width:100%;min-height:44px;font:inherit;padding:8px;margin-top:5px;background:#fff;color:#050505;border:1px solid #707762;border-radius:8px}.shift-chart-latest{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap}.shift-chart-latest strong{font-size:30px}.shift-chart-latest span{font-size:14px}.shift-chart-svg{display:block;width:100%;height:auto;overflow:visible;font:12px Arial,sans-serif;color:#050505}.shift-chart-svg text{fill:currentColor}.shift-chart-point{cursor:pointer;outline:none}.shift-chart-point:focus .shift-chart-dot{stroke:#050505;stroke-width:5}.shift-chart-readout{min-height:24px}.shift-chart-records summary{min-height:44px;cursor:pointer;padding:10px 0}.shift-chart-records table{width:100%;border-collapse:collapse}.shift-chart-records td,.shift-chart-records th{text-align:left;padding:8px;border-bottom:1px solid #b8bead}.shift-chart-controls select:focus-visible,.shift-chart-records summary:focus-visible{outline:3px solid #707762;outline-offset:3px}@media(max-width:480px){.shift-progress-chart{padding:12px}.shift-chart-latest strong{font-size:26px}}</style>';
  let chartData=null,chartMetric='',chartPeriod='all',renderVersion=0;
  function drawChart(host){
    const chart=host.querySelector?.('.shift-progress-chart');if(!chart||!chartData)return;
    const metrics=chartData.metrics.filter(m=>Array.isArray(m.series)&&m.series.length);
    if(!metrics.some(m=>m.key===chartMetric))chartMetric=(metrics.find(m=>m.key==='weight')||metrics[0])?.key||'';
    const metric=metrics.find(m=>m.key===chartMetric);if(!metric)return;
    chart.innerHTML='<h3>Your progress over time</h3><div class="shift-chart-controls"><label>Measure<select data-chart-metric>'+metrics.map(m=>'<option value="'+esc(m.key)+'"'+(m.key===chartMetric?' selected':'')+'>'+esc(m.label)+'</option>').join('')+'</select></label><label>Period<select data-chart-period>'+[['all','All records'],['28','Last 4 weeks'],['84','Last 12 weeks']].map(([v,label])=>'<option value="'+v+'"'+(v===chartPeriod?' selected':'')+'>'+label+'</option>').join('')+'</select></label></div>'+(chartData.historyMayBeLimited?'<p>This view shows up to 1,000 records from each log.</p>':'')+'<div class="shift-chart-view">'+progressChartMarkup(metric,weightUnits,chartPeriod,Date.now(),chart.clientWidth-24)+'</div>';
    chart.querySelector('[data-chart-metric]').onchange=e=>{chartMetric=e.target.value;drawChart(host);chart.querySelector('[data-chart-metric]').focus();};
    chart.querySelector('[data-chart-period]').onchange=e=>{chartPeriod=e.target.value;drawChart(host);chart.querySelector('[data-chart-period]').focus();};
    const show=e=>{const point=e.target.closest?.('[data-point]');if(point){chart.querySelector('.shift-chart-readout').textContent=point.dataset.reading;chart.querySelectorAll('[data-point]').forEach(p=>p.setAttribute('tabindex',p===point?'0':'-1'));}};
    chart.onclick=show;if(chart._readingFocus)chart.removeEventListener('focusin',chart._readingFocus);chart._readingFocus=show;chart.addEventListener('focusin',show);
    chart.onkeydown=e=>{const point=e.target.closest?.('[data-point]');if(!point)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();show(e);}if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const points=[...chart.querySelectorAll('[data-point]')],index=points.indexOf(point),next=e.key==='Home'?0:e.key==='End'?points.length-1:Math.max(0,Math.min(points.length-1,index+(e.key==='ArrowRight'?1:-1)));points[next].focus();}};
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

  async function render(){
    const host=ensureHost();if(!host||!window.SST_API?.getProgressSummary)return;
    const version=++renderVersion;host.setAttribute('aria-busy','true');
    try{
      const r=await SST_API.getProgressSummary();const p=r.progress||r;if(version!==renderVersion||document.hidden)return;chartData=null;
      weightUnits=['stone_lb','kg','lb'].includes(p.units)?p.units:'stone_lb';
      if(!p||p.state==='empty'){
        host.innerHTML=`<div class="shift-progress-intro"><div><span class="eyebrow">YOUR PROGRESS</span><h3>Your progress story starts with the first check-in.</h3><p>Weight is one signal, not the scoreboard. Shift will bring waist, blood pressure, movement, sleep and mood together here as you log them.</p></div><div class="shift-progress-nudge"><strong>Keep it useful.</strong><span>Add what you know. Leave the rest blank.</span></div></div>`;
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
      drawChart(host);
    }catch(err){
      if(version!==renderVersion)return;chartData=null;
      host.innerHTML='<div class="shift-progress-intro"><div><span class="eyebrow">YOUR PROGRESS</span><h3>Your progress is still saved.</h3><p>We could not draw the summary just now. Your retained check-ins and Progress Pictures have not been removed.</p></div></div>';
    }finally{if(version===renderVersion)host.setAttribute('aria-busy','false')}
  }

  function boot(){render();const clear=()=>{++renderVersion;chartData=null;const host=document.getElementById('shiftProgressStory');if(host)host.innerHTML='';};window.addEventListener('pagehide',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else if(location.hash==='#visualise')render();});window.addEventListener('hashchange',()=>{if(location.hash==='#visualise')render()});document.addEventListener('click',e=>{if(e.target.closest('.mp-tab[data-panel="visualise"]'))setTimeout(render,120);if(e.target.closest('#saveOriginal,[data-photo-delete]'))setTimeout(render,1800)});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();
