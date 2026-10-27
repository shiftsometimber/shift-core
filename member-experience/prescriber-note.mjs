// A bounded draft of attributed records, never a clinical interpretation.
export function prescriberNoteDraft(progress,summary,formatDate){
 const rows=['My own notes for my prescriber','I can edit these notes. I choose whether to share them.','Recent saved entries; up to five readings per measure.',''];
 const dated=(at,text)=>{const d=formatDate(at);if(d&&text)rows.push(d+' — '+text);};
 if(progress.goal&&progress.goal!=='Your personal goal')rows.push('My goal: '+progress.goal);
 for(const e of (progress.entries||[]).slice(-5))if(e.win)dated(e.at,e.win);
 for(const m of (progress.memberSupport?.memories||[]).slice(-5))dated(m.at,m.text);
 const labels={helped:'Helped','not-fit':'Not for me','not-helped':'Tried it, didn’t help','not-tried':'Didn’t get round to it'};
 const feedback=[...(progress.shiftHistory||[]),...(progress.nextShift?[progress.nextShift]:[])].flatMap(a=>(a.reviews||[]).map(r=>({at:r.at,text:labels[r.outcome]?(a.practical?.name||a.title)+': '+labels[r.outcome]:null}))).filter(r=>r.text).slice(-5);
 for(const r of feedback)dated(r.at,r.text);
 const measures={weight:['Weight','kg'],waist:['Waist','cm'],steps:['Steps','steps'],sleep:['Sleep','h'],mood:['Mood','/10'],systolic:['Systolic blood pressure','mmHg'],diastolic:['Diastolic blood pressure','mmHg']};
 for(const metric of summary?.metrics||[]){const spec=measures[metric.key];if(!spec)continue;const series=(metric.series||[]).filter(r=>typeof r.value==='number'&&Number.isFinite(r.value)&&/^\d{4}-\d{2}-\d{2}$/.test(r.on||'')&&Number.isFinite(Date.parse(r.on+'T00:00:00Z'))&&new Date(r.on+'T00:00:00Z').toISOString().slice(0,10)===r.on).sort((a,b)=>a.on.localeCompare(b.on)).slice(-5);for(const r of series)dated(r.on+'T12:00:00Z',spec[0]+': '+r.value+' '+spec[1]);}
 if(rows.length===4)rows.push('No dated entries are available for this draft. Add your own questions below.');
 return rows.join('\n').slice(0,4950);
}
