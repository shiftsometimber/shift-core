// Shared, deterministic view helpers. The medicine line is an invented teaching
// shape, never calculated from medicine, dose, treatment changes or symptoms.
export function journeyPresentation() {
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const add=(on,n)=>new Date(Date.parse(on+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
  const distance=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);
  const date=(on,year=false)=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',...(year?{year:'numeric'}:{}),timeZone:'Europe/London'}).format(new Date(on.length===10?on+'T12:00:00Z':on));
  const weight=(kg,units='kg')=>{
    if(units==='kg')return Number(kg).toFixed(1)+' kg';
    const tenths=Math.round(Number(kg)*2.2046226218*10);
    return units==='lb'?(tenths/10).toFixed(1)+' lb':Math.floor(tenths/140)+' st '+((tenths%140)/10).toFixed(1)+' lb';
  };
  const value=(n,key,units)=>key==='weightKg'?weight(n,units):Number(n.toFixed(1))+' cm';
  const labels={started:'Started treatment',changed:'Changed treatment',paused:'Paused treatment',finished:'Finished treatment',okay:'Felt okay',sick:'Felt sick',hungry:'Hungry again',tired:'Tired'};
  function series(records,key,from,to) {
    // Keep every genuine reading, including same-day corrections from different
    // sources. Do not average, smooth, fill blanks or invent a weighing date.
    return records.filter(r=>r.kind==='measurement'&&typeof r[key]==='number'&&Number.isFinite(r[key])&&r.on>=from&&r.on<=to).map(r=>({id:r.id,on:r.on,value:r[key],source:r.source}));
  }
  function progressGraph(records,key,from,to,units) {
    const points=series(records,key,from,to),xs=on=>52+(distance(from,on)/Math.max(1,distance(from,to)))*500;
    if(!points.length)return '<p class="tj-empty">No '+(key==='weightKg'?'weight':'waist')+' readings in these dates. Add what you know, whenever it suits you.</p>';
    const low=Math.min(...points.map(r=>r.value)),high=Math.max(...points.map(r=>r.value)),pad=Math.max((high-low)*.2,key==='weightKg'?.3:1),min=low-pad,max=high+pad;
    const y=n=>180-(n-min)/(max-min)*150;
    let lines='';
    for(let i=1;i<points.length;i++)if(distance(points[i-1].on,points[i].on)<=1)lines+='<path d="M '+xs(points[i-1].on)+' '+y(points[i-1].value)+' L '+xs(points[i].on)+' '+y(points[i].value)+'" fill="none" stroke="#707762" stroke-width="3"/>';
    const ticks=[min,(min+max)/2,max].map(n=>'<line x1="52" x2="552" y1="'+y(n)+'" y2="'+y(n)+'" stroke="#707762" opacity=".35"/><text x="48" y="'+(y(n)+4)+'" text-anchor="end" font-size="11">'+esc(key==='weightKg'&&units!=='kg'?(n*2.2046226218).toFixed(0):n.toFixed(1))+'</text>').join('');
    const dots=points.map(p=>'<g role="button" tabindex="0" data-tj-reading="'+esc(date(p.on,true)+' · '+value(p.value,key,units))+'" aria-label="'+esc(date(p.on,true)+' · '+value(p.value,key,units))+'"><circle cx="'+xs(p.on)+'" cy="'+y(p.value)+'" r="15" fill="transparent"/><circle cx="'+xs(p.on)+'" cy="'+y(p.value)+'" r="4.5" fill="#E7E3DA" stroke="#050505" stroke-width="1.5"/></g>').join('');
    return '<p class="tj-small">'+(key==='weightKg'?(units==='kg'?'Kilograms':'Pounds on the graph; your chosen units below'):'Centimetres')+'</p><svg class="tj-graph" viewBox="0 0 600 224" role="group" aria-label="Your recorded '+(key==='weightKg'?'weights':'waist readings')+' by date">'+ticks+lines+dots+'<text x="52" y="214" font-size="13">'+esc(date(from,true))+'</text><text x="552" y="214" text-anchor="end" font-size="13">'+esc(date(to,true))+'</text></svg><p class="tj-small" data-tj-reading-result aria-live="polite">Tap a reading for its date and value. Gaps mean no reading was logged.</p><details><summary>Readings as a list</summary><table><thead><tr><th scope="col">Date</th><th scope="col">Reading</th></tr></thead><tbody>'+points.map(p=>'<tr><td>'+esc(date(p.on,true))+'</td><td>'+esc(value(p.value,key,units))+'</td></tr>').join('')+'</tbody></table></details>';
  }
  const example=[.25,.55,.87,.78,.60,.44,.31];
  const exampleLevel=(index)=>example[((index%7)+7)%7];
  function medicineGraph(records,from,to,selected,compact=false,today='') {
    const days=distance(from,to),x=on=>112+distance(from,on)/Math.max(1,days)*458,y=n=>125-n*100;
    const path=Array.from({length:days+1},(_,i)=>(i?'L ':'M ')+x(add(from,i)).toFixed(2)+' '+y(exampleLevel(i)).toFixed(2)).join(' ');
    const lanes=[['okay','Felt okay'],['sick','Felt sick'],['hungry','Hungry again'],['tired','Tired'],['checkin','Other check-ins']];
    const grid=lanes.map(([key,label],i)=>{const yy=179+i*28;return '<text x="3" y="'+(yy+4)+'" font-size="13">'+label+'</text><line x1="112" x2="570" y1="'+yy+'" y2="'+yy+'" stroke="#707762" opacity=".35"/>'+records.filter(r=>r.on>=from&&r.on<=to&&(key==='checkin'?r.kind==='checkin':r.kind==='feeling'&&r.feelings?.includes(key))).map(r=>'<circle cx="'+x(r.on)+'" cy="'+yy+'" r="5" fill="#E7E3DA"/>').join('');}).join('');
    const markers=records.filter(r=>r.kind==='treatment'&&r.on>=from&&r.on<=to).map(r=>'<g><title>'+esc(labels[r.change]+' · '+date(r.on,true))+'</title><line x1="'+x(r.on)+'" x2="'+x(r.on)+'" y1="20" y2="305" stroke="#E7E3DA" stroke-dasharray="3 5" opacity=".6"/><rect x="'+(x(r.on)-3)+'" y="14" width="6" height="6" fill="#E7E3DA"/></g>').join('');
    const ticks=[0,7,14,21,days].filter((n,i,a)=>n<=days&&a.indexOf(n)===i).map(i=>'<text x="'+x(add(from,i))+'" y="'+(compact?158:332)+'" font-size="12" text-anchor="'+(i===days?'end':i===0?'start':'middle')+'">'+esc(date(add(from,i)))+'</text>').join('');
    const todayMark=today>=from&&today<=to?'<line x1="'+x(today)+'" x2="'+x(today)+'" y1="20" y2="'+(compact?130:305)+'" stroke="#707762" stroke-dasharray="2 4"/><text x="'+x(today)+'" y="12" text-anchor="end" font-size="14">Today</text>':'';
    return '<svg class="tj-graph tj-medicine-graph" viewBox="0 0 600 '+(compact?'175':'345')+'" role="img" aria-label="General repeating example'+(compact?'':' above your own dated feelings')+'. Select a date with the control below."><text x="3" y="32" font-size="12">Example</text><text x="3" y="49" font-size="12">level</text><path d="'+path+' L 570 130 L 112 130 Z" fill="#707762" opacity=".2"/><path d="'+path+'" fill="none" stroke="#707762" stroke-width="3" stroke-linejoin="round"/>'+(compact?'':'<text x="112" y="155" font-size="11" letter-spacing="1">HOW I FELT · MY OWN LOG</text>'+grid+markers)+'<line x1="'+x(selected)+'" x2="'+x(selected)+'" y1="20" y2="'+(compact?130:305)+'" stroke="#E7E3DA"/><circle cx="'+x(selected)+'" cy="'+y(exampleLevel(distance(from,selected)))+'" r="5" fill="#E7E3DA"/>'+todayMark+ticks+'</svg>';
  }
  function recordText(r,units) {
    if(r.kind==='win')return r.text;
    if(r.kind==='measurement')return [typeof r.weightKg==='number'?weight(r.weightKg,units):'',typeof r.waistCm==='number'?r.waistCm+' cm waist':''].filter(Boolean).join(' · ');
    if(r.kind==='clothes')return [r.top?'Top: '+r.top:'',r.trousers?'Trousers: '+r.trousers:''].filter(Boolean).join(' · ');
    if(r.kind==='feeling')return r.feelings.map(f=>labels[f]).join(' · ');
    if(r.kind==='treatment')return labels[r.change];
    if(r.kind==='injection')return 'Injection recorded · '+r.site+(r.time?' · '+r.time:'');
    return (r.label?r.label+': ':'')+(r.text||'No note added');
  }
  function snapshotText(data) {
    const rows=['My own snapshot for my appointment','Prepared '+date(data.today,true),'My words and readings, with the dates I recorded. I can edit this and choose what to share.',''];
    if(data.goal?.text)rows.push('MY GOAL',data.goal.text+(data.goal.on?' · '+date(data.goal.on,true):' · Date not recorded'),'');
    for(const [title,kinds,limit]of [['WHAT I NOTICED',['win'],6],['HOW I FELT',['feeling','checkin'],6],['READINGS AND CLOTHES I LOGGED',['measurement','clothes'],8],['TREATMENT CHANGES I RECORDED',['treatment'],6]]){
      const rs=data.records.filter(r=>kinds.includes(r.kind)).slice(-limit);
      if(rs.length){rows.push(title);for(const r of rs)rows.push(date(r.on,true)+' — '+recordText(r,data.units)+(r.note?' · '+r.note:'')+(r.dateBasis?' ('+r.dateBasis+')':''));rows.push('');}
    }
    if(rows.length===4)rows.push('No dated records have been added yet. Add what you want to discuss.','');
    rows.push('WHAT I WANT TO ASK','[Add my questions]','','This is my own record, not medical advice or a record from my clinic. Recent entries only; my full history stays in My Timber.');
    return rows.join('\n');
  }
  return {esc,add,distance,date,weight,value,labels,series,progressGraph,medicineGraph,exampleLevel,recordText,snapshotText};
}
