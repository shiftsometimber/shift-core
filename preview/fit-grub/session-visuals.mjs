import assert from 'node:assert/strict';
import {exercisePurpose} from './exercise-purpose.mjs';
export function sessionVisualData(pack){
 const byId={},byVariant={};
 for(const r of pack.records){
  byId[r.id]={id:r.id,image:r.status==='approved'?r.image:null,status:r.status,width:r.width,height:r.height,purpose:exercisePurpose[r.id]||null};
  for(const v of r.variants){assert.ok(!byVariant[v.id]);byVariant[v.id]=r.id;}
 }
 // This is the exact fallback exercise in the existing programme, not a name/group guess.
 byVariant['fallback-easy-walk']='walk';
 return {byId,byVariant};
}
export function applySessionVisuals(source,pack){
 const data=JSON.stringify(sessionVisualData(pack)).replaceAll('<','\\u003c');
 const start=source.indexOf('function visual(x){'),end=source.indexOf('\nfunction ensureVisualDialog()',start);
 assert.ok(start>=0&&end>start,'Existing exercise image renderer not found');
 source=source.slice(0,start)+`const fitAssetData=${data};
function fitAsset(x){
 const mapped=fitAssetData.byVariant[x.id]||(fitAssetData.byId[x.id]?x.id:null);
 if(mapped&&x.canonical_movement&&mapped!==x.canonical_movement)return null;
 const canonical=x.canonical_movement||mapped;
 return canonical?fitAssetData.byId[canonical]||null:null;
}
function visual(x){
 const match=fitAsset(x);if(!match||match.status!=='approved'||!match.image)return '';
 const ref=match.image;
 return '<button class="sf-visual-open" type="button" data-fit-visual data-src="'+esc(ref)+'" data-name="'+esc(x.name)+'" aria-label="Enlarge '+esc(x.name)+' movement demonstration"><img width="'+match.width+'" height="'+match.height+'" src="'+esc(ref)+'" alt="'+esc(x.name)+' — three-panel movement illustration" loading="lazy"><span>Tap to enlarge</span></button>';
}
function exercisePurposeCopy(x){
 const p=(typeof window!=='undefined'?window.SHIFT_FIT_GUIDANCE?.find(r=>r.id===x.canonical_movement)?.purpose:null)||fitAsset(x)?.purpose;
 const reason=x.id==='fallback-easy-walk'?'The session builder is unavailable. This optional walking break fits within your selected time and needs no exercise equipment. It is not a personalised workout.':typeof x.selection_reason==='string'?x.selection_reason:'';
 if(!p&&!reason)return '';
 return '<section class="sf-exercise-purpose" aria-label="Exercise purpose">'+(reason?'<h4>Why this option?</h4><p>'+esc(reason)+'</p>':'')+(p?'<h4>'+esc(p.focus)+'</h4><p>'+esc(p.benefit)+'</p><h4>How it supports your goals</h4><p>'+esc(p.weightLoss)+'</p><details><summary>Evidence behind this guidance</summary><ul>'+p.sources.map((url,i)=>'<li><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+(i===0?'NHS exercise guidance':'British Heart Foundation: exercise and body fat')+'</a></li>').join('')+'</ul></details>':'')+'</section>';
}`+source.slice(end);
 const old='${visual(x)}<div><h3>${esc(x.name)}</h3><div class="sf-mini"><span>${esc(dose||\'Coach-guided movement\')}</span></div><details>';
 const next='<div><h3>${esc(x.name)}</h3><div class="sf-mini"><span>${esc(dose||\'Coach-guided movement\')}</span></div>${visual(x)}${exercisePurposeCopy(x)}<details>';
 assert.equal(source.split(old).length-1,1,'Exercise card hook changed');
 return source.replace(old,next);
}
export const sessionVisualCSS=`.sf-exercise{grid-template-columns:minmax(0,1fr)}.sf-exercise>div{min-width:0}.sf-exercise .sf-visual-open{display:block;margin:18px 0;max-width:960px}.sf-exercise-purpose{margin:20px 0;padding:0 0 18px;border-bottom:1px solid #707762;max-width:850px}.sf-exercise-purpose h4{font-size:18px;margin:18px 0 6px;color:#e7e3da}.sf-exercise-purpose p{line-height:1.55;margin:0 0 12px;color:#e7e3da}.sf-exercise-purpose a{color:#e7e3da}.sf-exercise-purpose summary{cursor:pointer}.sf-exercise-purpose details{font-size:14px}`;
