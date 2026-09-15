import assert from 'node:assert/strict';

// Always derive from the source exercise; repeated clicks never compound effort.
export function adjustPreviewExercise(exercise,mode='planned'){
 const x=structuredClone(exercise);
 if(!['easier','harder'].includes(mode))return x;
 const factor=mode==='easier'?.8:1.2;
 const work=n=>Math.max(1,Math.round(Number(n)*factor));
 const rest=n=>Number(n)===0?0:Math.max(15,Number(n)+(mode==='easier'?15:-15));
 const original=String(x.dose_text||'');
 let dose=original.replace(/^(reps|time seconds): (\d+)$/gm,(_,kind,n)=>kind+': '+work(n))
  .replace(/^rest seconds: (\d+)$/gm,(_,n)=>'rest seconds: '+rest(n));
 // Additional authored protocols use plain-language doses. Preserve sets and load.
 if(dose===original&&!/^(reps|time seconds):/m.test(original)){
  dose=dose.replace(/\b(\d+)([–-])(\d+)(\s+reps\b)/g,(_,lo,sep,hi,unit)=>work(lo)+sep+work(hi)+unit)
   .replace(/\b(\d+)(\s+reps\b)/g,(match,n,unit,offset,text)=>/[–-]$/.test(text.slice(0,offset))?match:work(n)+unit)
   .replace(/\b(\d+)(s|\s+seconds?)\s+rest\b/g,(_,n,unit)=>rest(n)+unit+' rest');
 }
 x.dose_text=dose;
 if(original&&dose!==original)x.how=(x.how||[]).map(line=>String(line).replace(original,dose));
 return x;
}

export function applySessionEffort(source){
 const replace=(from,to)=>{assert.equal(source.split(from).length-1,1,'Preview effort hook changed: '+from.slice(0,65));source=source.replace(from,to);};
 replace('function exercise(x,allowFeedback=true){',`${adjustPreviewExercise.toString()}
let previewEffort='planned';
function previewEffortControls(){return '<section class="sf-effort" aria-label="Session effort"><h3>Set today’s effort</h3><div class="sf-effort-buttons">'+[['easier','Go easier'],['planned','As planned'],['harder','Go harder']].map(([value,label])=>'<button type="button" class="sf-secondary" data-preview-effort="'+value+'" aria-pressed="'+(previewEffort===value)+'">'+label+'</button>').join('')+'</div><p role="status">'+({easier:'Less work and more rest.',planned:'Your original session dose.',harder:'A modest increase in work with slightly less rest.'}[previewEffort])+' Same exercises, equipment and time window. Stop if anything hurts or your form breaks down.</p></section>'}
function previewSessionExercise(x,allowFeedback){return exercise(adjustPreviewExercise(x,previewEffort),allowFeedback)}
function exercise(x,allowFeedback=true){`);
 replace("${(s.exercises||[]).map(x=>exercise(x,!p.fallback)).join('')}","${p.fallback?'':previewEffortControls()}${(s.exercises||[]).map(x=>previewSessionExercise(x,!p.fallback)).join('')}");
 replace("currentPlan=null;","currentPlan=null;previewEffort='planned';");
 replace("<summary>Make it easier or harder</summary>","<summary>Movement alternatives</summary>");
 replace("holder.innerHTML=exercise(r.exercise);", "const list=currentPlan?.sessions?.[0]?.exercises||[],index=list.findIndex(x=>x.id===id);if(index>=0)list[index]=r.exercise;holder.innerHTML=previewSessionExercise(r.exercise);");
 replace("panel.addEventListener('click',e=>{",`panel.addEventListener('click',e=>{const effort=e.target.closest('[data-preview-effort]');if(effort){if(!currentPlan||currentPlan.held||currentPlan.fallback||[...panel.querySelectorAll('[data-vote]')].some(b=>b.textContent==='Swapping…'))return;previewEffort=effort.dataset.previewEffort;renderPlan(currentPlan);$('#sfResults [data-preview-effort="'+previewEffort+'"]').focus({preventScroll:true});return}`);
 // The selected session belongs directly after the build control, before utilities.
 replace('<section id="sfResults"></section>','');
 const launchStart=source.indexOf('<section class="sf-card sf-launch">');
 const launchEnd=source.indexOf('</section>',launchStart)+10;
 assert.ok(launchStart>=0&&launchEnd>launchStart);
 const launch=source.slice(launchStart,launchEnd);
 source=source.slice(0,launchStart)+source.slice(launchEnd);
 replace('</header><section class="sf-card sf-daily"','</header>'+launch+'<section id="sfResults"></section><section class="sf-card sf-daily"');
 return source;
}

export const sessionEffortCSS=`.sf-effort{margin:16px 0 22px;padding:16px;border:1px solid #707762;border-radius:12px}.sf-effort h3{margin:0 0 12px}.sf-effort-buttons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.sf-effort-buttons button{min-height:48px;padding:10px 7px;font-size:16px}.sf-effort-buttons button[aria-pressed="true"]{background:#e7e3da;color:#050505;border-color:#e7e3da}.sf-effort p{font-size:14px;margin:12px 0 0}.sf-session-body{scroll-margin-top:12px}@media(max-width:420px){.sf-effort{padding:12px}.sf-effort-buttons{gap:5px}.sf-effort-buttons button{font-size:14px}}`;
