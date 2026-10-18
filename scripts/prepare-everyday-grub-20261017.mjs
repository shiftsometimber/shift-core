import {readFileSync,writeFileSync} from 'node:fs';
import {buildEverydayMealDrafts,EVERYDAY_DRAFT_SOURCES} from '../content/grub/everyday-meals-draft-20261017.mjs';
process.env.COFID_INDEX||='tests/fixtures/grub-cofid-2021-governed-subset.json';
const {APPROVED,grams}=await import('../industrial-grub-systemic-v3.mjs');
const foods=new Map(JSON.parse(readFileSync(process.env.COFID_INDEX,'utf8')).foods.map(row=>[String(row.code),row]));
const candidates=buildEverydayMealDrafts({foods,mappings:APPROVED,retainedGrams:grams});
const pack={proof:'EVERYDAY_GRUB_AUTHORING_DRAFT_V1',publication_ready:false,accepted_catalogue_changed:false,sources:EVERYDAY_DRAFT_SOURCES,candidates};
writeFileSync('content/grub/everyday-meals-draft-20261017.json',JSON.stringify(pack,null,2)+'\n');
console.log(JSON.stringify({drafts:candidates.length,names:candidates.map(r=>r.title),published:0,unchangedAcceptedCatalogue:true},null,2));
