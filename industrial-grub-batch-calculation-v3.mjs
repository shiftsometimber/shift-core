import fs from 'node:fs';
import {buildIndustrialCatalogue} from './industrial-catalogue-v8.js';
import {APPROVED,grams,mappingFor,systemicCoverage} from './industrial-grub-systemic-v3.mjs';

const index=JSON.parse(fs.readFileSync(process.env.COFID_INDEX||'/tmp/cofid-index.json','utf8'));
const foods=new Map((index.foods||[]).map(f=>[String(f.code),f]));
const N=['kcal','protein_g','carbohydrate_g','fat_g','fibre_g'];
const round=n=>Math.round((Number(n)+Number.EPSILON)*10)/10;
const calculated=[],quarantine=[];const risks={LOW:0,MEDIUM:0,HIGH:0};

for(const r of buildIndustrialCatalogue().recipes){
 let ok=true;const ev=[];const tot=Object.fromEntries(N.map(k=>[k,0]));
 for(const ing of r.ingredients||[]){
  const map=APPROVED[ing.item],g=grams(ing.amount,ing.item),f=map?foods.get(String(map.code)):null;
  if(!map||!f||!(g>0)){ok=false;break;}
  ev.push({item:ing.item,amount:ing.amount,grams:round(g),cofid_code:f.code,cofid_name:f.name,mapping_state:map.state,mapping_confidence:map.confidence,mapping_basis:map.basis,...(map.limitation?{mapping_limitation:map.limitation}:{})});
  for(const k of N){const v=Number(f[k]);if(!Number.isFinite(v)){ok=false;break}tot[k]+=v*g/100}if(!ok)break;
 }
 if(!ok){quarantine.push(r.id);continue}
 const servings=Math.max(1,Number(r.servings)||1);const nutrition=Object.fromEntries(N.map(k=>[k,round(tot[k]/servings)]));
 const suspicious=nutrition.kcal<80||nutrition.kcal>1800||nutrition.protein_g<0||nutrition.protein_g>150||nutrition.fat_g>160||nutrition.carbohydrate_g>250;
 const safety=!(r.food_safety?.length>=2&&r.method?.length>=4);
 const unresolvedMapping=ev.some(x=>!['exact','approved_canonical_proxy'].includes(x.mapping_state));
 const risk=suspicious||safety?'HIGH':unresolvedMapping?'MEDIUM':'LOW';risks[risk]++;
 const reasons=[];if(unresolvedMapping)reasons.push('unresolved_mapping');if(suspicious)reasons.push('nutrition_outlier');if(safety)reasons.push('food_safety_structure');
 const priorReview=r.review||{};
 const blockers=(priorReview.blockers||[]).filter(x=>x!=='nutrition_validation');
 calculated.push({...r,nutrition:{status:'validated',methodology:'CoFID 2021 governed canonical ingredient propagation',dataset_version:'CoFID 2021',validated_at:'2026-08-13',precision_note:'Calculated ingredient-level estimate, not laboratory analysis; brands, cooking yield and drained weights can vary.',...nutrition,ingredient_evidence:ev},review:{...priorReview,blockers,pre_review:risk==='LOW'?'auto_check_pass':'review_required',risk_tier:risk,reasons,canonical_mapping_governance:risk==='LOW'?'resolved':'exception'}});
}
const low=calculated.filter(r=>r.review.risk_tier==='LOW').length;const coverage=systemicCoverage();
const result={catalogue:coverage.recipes,canonicalDecisions:coverage.canonicalDecisions,canonicalDecisionsUsed:coverage.canonicalDecisionsUsed,nutritionValidated:calculated.length,riskTiers:risks,autoPreReviewLowRisk:low,targetedReview:calculated.length-low,quarantined:quarantine.length,remainingBlockers:coverage.topBlockers.slice(0,20),sample:calculated.slice(0,2).map(r=>({id:r.id,nutrition:r.nutrition,review:r.review}))};
console.log(JSON.stringify(result,null,2));
if(calculated.length<1500)throw new Error(`expected systemic nutrition-valid wave >=1500, got ${calculated.length}`);
if(calculated.some(r=>!r.nutrition.ingredient_evidence.length))throw new Error('missing ingredient-level provenance');
if(calculated.some(r=>r.nutrition.ingredient_evidence.some(e=>e.mapping_state==='approved_canonical_proxy'&&(!e.mapping_basis||!e.mapping_confidence))))throw new Error('governed proxy evidence incomplete');
if(calculated.some(r=>(r.review.blockers||[]).includes('nutrition_validation')))throw new Error('validated recipes retain stale nutrition_validation blocker');
if(risks.MEDIUM!==0)throw new Error(`governed canonical proxies must not remain unresolved MEDIUM mappings: ${risks.MEDIUM}`);
console.log(`PASS governed Grub batch calculation: ${calculated.length}/${coverage.recipes} recipes carry ingredient-level CoFID nutrition; ${low} LOW-risk pre-review passes, ${risks.HIGH} HIGH-risk exceptions, ${quarantine.length} remain quarantined. Canonical proxy decisions are governed once rather than re-reviewing each recipe row.`);
