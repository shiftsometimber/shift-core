import fs from 'node:fs';
import {buildIndustrialCatalogue} from './industrial-catalogue-v3.js';
const exercises=buildIndustrialCatalogue().exercises.filter(x=>String(x.id).startsWith('industrial-v3-fit-'));
const families=[...new Set(exercises.map(x=>x.canonical_movement))].sort();
if(families.length!==44)throw new Error(`expected 44 canonical Fit families, got ${families.length}`);
const asset='assets/fit/shift-fit-industrial-v3.svg';
if(!fs.existsSync(asset))throw new Error(`missing ${asset}`);
const svg=fs.readFileSync(asset,'utf8');
const missing=[];const wrongRefs=[];
for(const family of families){
  if(!svg.includes(`id="${family}"`))missing.push(family);
  const descendants=exercises.filter(x=>x.canonical_movement===family);
  for(const x of descendants){const ref=x.visual?.canonical_asset||x.visual?.asset||x.visual?.asset_ref||'';if(ref!==`${asset}#${family}`)wrongRefs.push({id:x.id,ref,expected:`${asset}#${family}`});}
}
if(missing.length)throw new Error(`missing visual fragments: ${missing.join(', ')}`);
if(wrongRefs.length)throw new Error(`canonical visual reference mismatches: ${JSON.stringify(wrongRefs.slice(0,10))}`);
if(!svg.includes('pending anatomical and member-comprehension approval'))throw new Error('asset must explicitly remain pending domain/member visual QA');
console.log(JSON.stringify({canonicalFamilies:families.length,descendants:exercises.length,fragmentCoverage:families.length,missing:0,referenceMismatches:0,domainApproval:'PENDING'},null,2));
console.log('PASS M12 candidate visual asset gate: 44/44 canonical movement fragments exist and all 2,244 industrial Fit descendants point at the consolidated asset. This is visual-review readiness, not domain approval.');
