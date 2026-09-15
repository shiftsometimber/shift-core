import {aftercareAssets} from './aftercare-assets.mjs';
import {guidanceAssets} from './guidance.mjs';
import {applySessionPreview} from './session-preview.mjs';
import {applySessionVisuals,sessionVisualCSS} from './session-visuals.mjs';
import {applySessionEffort,sessionEffortCSS} from './session-effort.mjs';
import {fitV3Assets,approvedFitPack} from './v3-assets.mjs';
import {catalogueAssets} from './catalogue-page.mjs';
import {applyProgrammeVisuals,programmeVisualCSS} from './programme-visuals.mjs';
import {visualReviewAssets,visualRecords} from './visual-review.mjs';
import {grubIntelligencePreviewAssets} from './grub-intelligence-preview.mjs';
import fs from 'node:fs';
import {lifeBackPreviewAssets} from './life-back-preview.mjs';
const root='preview/fit-grub';
const recipes=JSON.parse(fs.readFileSync('content/grub/batch-01.json')).slice(0,3);
const plan={personalisation:{household_size:2},days:recipes.map((r,i)=>({day:i+1,totals:{},meals:[{id:r.id,type:r.meal_type,name:r.title,minutes:r.prep_minutes+r.cook_minutes,recipe:{servings:r.servings,ingredients:r.ingredients,method:r.method,equipment:r.equipment,storage:r.storage,food_safety:r.food_safety}}]}))};
const mock=`
const samplePlan=${JSON.stringify(plan)};
let previewState={preferences:{fit:{goal:'general fitness and healthy weight support',location:'home',minutes:20,equipment:['No equipment','Chair'],limitations:'none',notes:''},food:{likes:['British'],dislikes:[],dietaryRequirements:[],maxMinutes:30,householdSize:2}}};
try{previewState=JSON.parse(localStorage.getItem('shift-refinement-preview'))||previewState}catch{}
window.SST_API={getMemberState:async()=>({state:previewState}),saveMemberState:async state=>{if(document.querySelector('#failSave').checked)throw Error('Preview: simulated save failure');previewState=state;localStorage.setItem('shift-refinement-preview',JSON.stringify(state));return{state}},getDailyShift:async()=>({daily:{today_plan:{priority:'Your preview day',grub:'Choose a sample meal',movement:'Build a session using the saved preview profile',hydration:'Use your usual drinks routine',recovery:'Keep today manageable'}}}),getFitReminder:async()=>({reminder:{},capabilities:{}}),generateFit:async body=>{if(document.querySelector('#failBuilder').checked)throw Error('Preview: simulated builder failure');return{plan:fitPreview.build(body)}},replaceFitExercise:async body=>fitPreview.replace(body),generateGrub:async()=>{if(previewState.preferences?.food?.dietaryRequirements?.length||previewState.preferences?.food?.dislikes?.length)throw Error('The sample plan is not personalised. Clear only the fictional preview restrictions to inspect it; no live allergy or preference filtering is connected in this demonstration.');return{plan:structuredClone(samplePlan)}},completeFitToday:async data=>{document.querySelector('#previewLog').textContent='Preview only: '+data.minutes+' minutes logged locally. No member record changed.';const key='shift-fit-preview-completions';const entries=JSON.parse(localStorage.getItem(key)||'[]');entries.push({...data,at:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(entries.slice(-100)));return{ok:true}},fitFeedback:async data=>fitPreview.feedback(data.entity_id,data.sentiment),grubFeedback:async()=>({ok:true}),saveShiftTodayGrub:async x=>{document.querySelector('#previewLog').textContent='Preview choice: '+x.mealTitle;return{ok:true}},saveFitReminder:async()=>{throw Error('Preview: notifications are disabled')},replaceGrubMeal:async()=>{throw Error('Preview: meal swaps use the unchanged live integration; no replacement API is connected here.')}};
`;
const assets={};
const approvedPack=approvedFitPack();
const guidance=guidanceAssets(approvedPack);
const builder=fs.readFileSync(root+'/session-builder.js','utf8').replace('export function','function');
assets['/fit-session-builder.js']={type:'text/javascript',body:guidance.script+'\n'+builder+'\nconst fitPreview=createFitPreview(window.SHIFT_FIT_GUIDANCE);'};
assets['/fit-guidance-summary.json']={type:'application/json',body:JSON.stringify(guidance.summary)};
const boundVisuals=visualRecords().filter(r=>r.kind!=='movement'||approvedPack.records.some(m=>m.id===r.id&&m.status==='approved')).map(r=>{if(r.kind!=='movement')return r;const m=approvedPack.records.find(m=>m.id===r.id);return {...r,image:m.image,width:m.width,height:m.height};});
for(const kind of ['fit','grub']){
 const original=fs.readFileSync('frontend/member/member-'+kind+'-programme-v1.js','utf8');
 const sessionSource=kind==='fit'?applySessionEffort(applySessionVisuals(applySessionPreview(original),approvedPack)):original;
 assets['/member-'+kind+'-programme-v1.js']={type:'text/javascript',body:applyProgrammeVisuals(sessionSource,kind,boundVisuals)};
 assets['/member-'+kind+'-programme-v1.css']={type:'text/css',body:fs.readFileSync('frontend/member/member-'+kind+'-programme-v1.css','utf8')+'\n'+programmeVisualCSS+(kind==='fit'?sessionVisualCSS+sessionEffortCSS:'')};
 const html=`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>SHIFT ${kind.toUpperCase()} — isolated preview</title><link rel="stylesheet" href="/member-${kind}-programme-v1.css"><style>*{box-sizing:border-box}body{margin:0;background:#050505;color:#e7e3da;font:16px/1.5 Arial,sans-serif}main{max-width:1100px;margin:auto;padding:20px}a{color:#e7e3da}button,input,select,textarea{font:inherit}.preview-bar{padding:16px 20px;border-bottom:1px solid #707762;background:#10110f}.preview-bar nav{display:flex;flex-wrap:wrap;gap:20px;margin:10px 0}.preview-bar p{margin:8px 0;max-width:900px}.preview-bar label{display:block}#previewLog{min-height:24px}.sg-week-proof,.sg-basis,.sg-proof,.sg-meal>span{display:none}.sf-profile-body,.sg-profile-body{min-width:0}.sf-complete label{display:grid;gap:8px;max-width:280px;margin:18px 0}.sf-complete input{width:100%;padding:12px;border:1px solid #707762;background:#050505;color:#e7e3da;border-radius:8px}img{max-width:100%}</style></head><body><header class="preview-bar"><strong>SHIFT · PREVIEW ONLY</strong><nav><a href="/member/fit">Fit preview</a><a href="/member/grub">Grub preview</a><a href="/phone">Phone layout</a><a href="/visuals">Visual review</a></nav><p>Isolated demonstration · Sample profile and recipes · No live accounts, payments, emails or production connections.</p><p>${kind==='fit'?'Build and swap an illustrated session using the sample profile. This is a content demonstration; draft protocols still require technique and suitability review.':'Build the sample plan, then open “Show my prep plan”. The three sample recipes demonstrate the layout; nutrition figures are not validated in this preview.'}</p><label><input type="checkbox" id="failSave"> Simulate a profile-save failure</label><label><input type="checkbox" id="failBuilder"> Simulate a session-builder failure</label><p id="previewLog" role="status"></p></header><main><div id="panel-${kind}"></div></main><script src="/fit-session-builder.js"></script><script>${mock}</script><script src="/member-${kind}-programme-v1.js"></script></body></html>`;
 assets['/member/'+kind]={type:'text/html',body:html};
}
assets['/phone']={type:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>390px layout check</title><style>body{background:#050505;color:#e7e3da;font:16px Arial;margin:20px}iframe{display:block;width:390px;height:850px;max-width:100%;border:1px solid #707762;margin:auto}a{color:#e7e3da}</style></head><body><p>390px component layout preview · <a href="/phone?view=grub">Grub</a> · <a href="/phone?view=fit">Fit</a></p><iframe title="Phone width preview" src="/member/fit"></iframe><script>document.querySelector("iframe").src=new URLSearchParams(location.search).get("view")==="grub"?"/member/grub":"/member/fit";</script></body></html>'};
Object.assign(assets,visualReviewAssets());
Object.assign(assets,catalogueAssets());
Object.assign(assets,fitV3Assets());
Object.assign(assets,grubIntelligencePreviewAssets());
Object.assign(assets,lifeBackPreviewAssets());
Object.assign(assets,aftercareAssets());
assets['/fit-v3-phone']={type:'text/html',body:'<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>FIT gallery · 390px layout check</title><style>body{background:#050505;color:#e7e3da;font:16px Arial;margin:20px}iframe{display:block;width:390px;height:850px;max-width:100%;border:1px solid #707762;margin:auto}</style></head><body><p>390px movement gallery layout check</p><iframe title="Phone width movement gallery" src="/fit-v3"></iframe></body></html>'};
assets['/fit-v3'].body=assets['/fit-v3'].body.replace('<script src="/fit-v3.js">',guidance.galleryScript+'<script src="/fit-v3.js">');
for(const path of ['/member/fit','/member/grub'])assets[path].body=assets[path].body.replace('<nav>','<nav><a href="/fit-v3">Fit movement images</a><a href="/catalogue">Full catalogue</a>');
fs.writeFileSync(root+'/assets.js','export default '+JSON.stringify(assets)+';\n');
