import fs from 'node:fs';
import {GRUB_BATCH_001} from './content/grub-batch-001.js';
import {FIT_BATCH_001} from './content/fit-batch-001.js';
import {validateContentItem} from './content-factory-v1.js';

const source=fs.readFileSync('member-product-v4.js','utf8');
const legacyRecipes=[...source.matchAll(/R\('([^']+)','(breakfast|lunch|dinner|snack)','([^']+)'/g)].map(m=>({id:m[1],mealType:m[2],title:m[3],source:'legacy-live'}));
const legacyExercises=[...source.matchAll(/X\('([^']+)','([^']+)','([^']+)'/g)].map(m=>({id:m[1],title:m[2],movementPattern:m[3],source:'legacy-live'}));
const authoredRecipes=GRUB_BATCH_001.map(x=>({id:x.id,mealType:x.data.mealType,title:x.title,source:'structured-draft'}));
const authoredExercises=FIT_BATCH_001.map(x=>({id:x.id,title:x.title,movementPattern:x.data.movementPattern,equipment:x.data.equipment,locations:x.data.locations,source:'structured-review'}));

function rotate(pool,count){return Array.from({length:count},(_,i)=>pool[i%pool.length]);}
function grubSim(days,pool){
  const sequence=[];for(let d=0;d<days;d++)for(const mealType of ['breakfast','lunch','dinner','snack']){const p=pool.filter(x=>x.mealType===mealType);sequence.push(rotate(p,d+1).at(-1));}
  const repeats=sequence.length-new Set(sequence.map(x=>x.id)).size;
  const firstRepeat={};for(const mt of ['breakfast','lunch','dinner','snack']){const p=sequence.filter(x=>x.mealType===mt);const seen=new Set();firstRepeat[mt]=p.findIndex(x=>seen.has(x.id)||!seen.add(x.id))+1;}
  return {days,slots:sequence.length,unique:new Set(sequence.map(x=>x.id)).size,repeats,repeatRate:Number((repeats/sequence.length).toFixed(3)),firstRepeatDay:firstRepeat};
}
function fitSim(pool){
  const sessions=36,slotsPerSession=5,seq=rotate(pool,sessions*slotsPerSession),counts={};for(const x of seq)counts[x.id]=(counts[x.id]||0)+1;
  const max=Math.max(...Object.values(counts));const patterns=[...new Set(pool.map(x=>x.movementPattern))];
  return {weeks:12,sessions,sessionsPerWeek:3,exerciseSlots:sessions*slotsPerSession,uniqueExercises:new Set(seq.map(x=>x.id)).size,maxAppearancesOfOneExercise:max,movementPatterns:patterns.length,passesRepetitionFloor:max<=6&&patterns.length>=7};
}

const recipeValidation=GRUB_BATCH_001.map(validateContentItem),exerciseValidation=FIT_BATCH_001.map(validateContentItem);
const currentGrub=[7,14,30,60].map(d=>grubSim(d,legacyRecipes));
const authoredGrub=[7,14,30,60].map(d=>grubSim(d,[...legacyRecipes,...authoredRecipes]));
const currentFit=fitSim(legacyExercises);const authoredFit=fitSim([...legacyExercises,...authoredExercises]);
const result={inventory:{legacyLiveRecipes:legacyRecipes.length,structuredRecipeBatch:GRUB_BATCH_001.length,legacyLiveExercises:legacyExercises.length,structuredExerciseBatch:FIT_BATCH_001.length,approvedVisualsInBatch:FIT_BATCH_001.filter(x=>x.data.visualGuidance.status==='approved'&&x.data.visualGuidance.assetRef).length},validation:{recipeBatchPass:recipeValidation.filter(x=>x.ok).length,exerciseBatchPass:exerciseValidation.filter(x=>x.ok).length},grub:{currentLive:currentGrub,withAuthoredBatch:authoredGrub,provisionalFloor:64},fit:{currentLive:currentFit,withAuthoredBatch:authoredFit,provisionalFloor:48}};
console.log(JSON.stringify(result,null,2));
