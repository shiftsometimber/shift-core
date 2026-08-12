import fs from 'node:fs';
import {buildIndustrialCatalogue} from './industrial-catalogue-v5.js';
import {CANONICAL_APPROVALS} from './grub-canonical-approval-registry-v1.mjs';

const index=JSON.parse(fs.readFileSync(process.env.COFID_INDEX||'/tmp/cofid-index.json','utf8'));
const foods=new Map((index.foods||[]).map(f=>[String(f.code),f]));

const EXACT={
 'olive oil':'17-038','tomato':'13-517','red pepper':'13-524','rolled oats':'11-788','pumpkin seeds':'14-842','lettuce':'13-520','rocket':'13-522','baby potatoes':'13-618','wholemeal bread':'11-981','broccoli':'13-502','onion':'13-499','mixed salad':'15-648','brown rice, dry':'11-866','basmati rice, dry':'11-857','5% beef mince':'18-508','lean pork loin':'18-518','salmon fillet':'16-356','reduced-fat pork sausages':'19-658','boiled eggs':'12-940','large eggs':'12-937','low-fat cottage cheese':'12-550','cherry tomatoes':'13-519','courgette':'13-627','raw king prawns':'16-387','cooked green lentils':'13-661','oven chips':'13-487','individual pizza base':'11-1016','paprika':'13-879','chilli powder':'13-873','garlic powder':'13-830','dried parsley':'13-845','dried oregano':'13-878','wholegrain mustard':'17-365','reduced-fat mayonnaise':'17-679','tomato ketchup':'17-709',
 'chickpeas, drained':'13-670','reduced-fat cheddar':'12-548','apple':'14-319','diced apple':'14-319','dark chocolate, chopped':'17-491','dark chocolate chips':'17-491'
};

export const APPROVED={};
for(const [item,code] of Object.entries(EXACT))APPROVED[item]={code,state:'exact',confidence:'high',basis:'direct canonical CoFID identity'};
for(const [item,a] of Object.entries(CANONICAL_APPROVALS))APPROVED[item]={code:a.code,state:a.state,confidence:a.confidence,basis:a.basis,...(a.limitation?{limitation:a.limitation}:{})};

const PORTION_G={'wholemeal bread':80,'wholemeal wrap':65,'brown rice, dry':75,'basmati rice, dry':75,'wholewheat noodles':70,'baking potato':250,'wholemeal bap':80,'wholemeal burger bun':80,'wholemeal bagel':90,'wholemeal flatbread':70,'oven chips':250,'individual pizza base':150,'roast potatoes':220};
const EACH_G={'boiled eggs':50,'large eggs':60,'egg':60};
const norm=s=>String(s||'').trim();
export function grams(amount,item){const s=norm(amount).toLowerCase();const g=s.match(/(\d+(?:\.\d+)?)\s*g\b/);if(g)return Number(g[1]);const ml=s.match(/(\d+(?:\.\d+)?)\s*ml\b/);if(ml)return Number(ml[1])*(item==='olive oil'?0.92:1);if(/portion/.test(s)&&PORTION_G[item])return PORTION_G[item];if(/^\d+(?:\.\d+)?$/.test(s)&&EACH_G[item])return Number(s)*EACH_G[item];return null}
export function mappingFor(item){const map=APPROVED[norm(item)];if(!map)return null;const food=foods.get(String(map.code));return food?{...map,food}:null}

export function systemicCoverage(){
 const recipes=buildIndustrialCatalogue().recipes;let eligible=0,exactOnly=0,governedProxyUsed=0;const blocked=new Map(),used=new Set();
 for(const r of recipes){let ok=true,hasProxy=false;for(const ing of r.ingredients||[]){const item=norm(ing.item),hit=mappingFor(item),g=grams(ing.amount,item);if(!hit){ok=false;blocked.set(`unmapped:${item}`,(blocked.get(`unmapped:${item}`)||0)+1);continue}used.add(item);if(hit.state!=='exact')hasProxy=true;if(!(g>0)){ok=false;blocked.set(`amount:${item}:${ing.amount}`,(blocked.get(`amount:${item}:${ing.amount}`)||0)+1)}}if(ok){eligible++;if(hasProxy)governedProxyUsed++;else exactOnly++}}
 return{recipes:recipes.length,canonicalDecisions:Object.keys(APPROVED).length,canonicalDecisionsUsed:used.size,nutritionEligible:eligible,exactOnly,governedProxyUsed,quarantined:recipes.length-eligible,topBlockers:[...blocked].sort((a,b)=>b[1]-a[1]).slice(0,50).map(([reason,count])=>({reason,count}))};
}

if(import.meta.url===`file://${process.argv[1]}`){const result=systemicCoverage();console.log(JSON.stringify(result,null,2));if(result.nutritionEligible<300)throw new Error(`systemic mapping regressed below 300 eligible recipes: ${result.nutritionEligible}`);console.log(`PASS systemic Grub canonical propagation: ${result.nutritionEligible}/${result.recipes} recipes are calculation-eligible from ${result.canonicalDecisionsUsed} reused governed ingredient decisions; ${result.quarantined} remain quarantined.`);}
