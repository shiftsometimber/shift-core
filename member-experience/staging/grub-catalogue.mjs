import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {enrichGrubRecipes,searchGrubRecipes} from '../grub-search.mjs';
const dir='work/staging/generated/grub-approved';
// Reuse the retained, accepted publication decisions. Stop if any recipe or
// approval digest has drifted; this does not grant new editorial approval.
execFileSync('python3',['cofid-industrial-extract.py','/tmp/cofid-index.json'],{stdio:'inherit'});
execFileSync(process.execPath,['grub-v1-publication-pack.mjs'],{stdio:'inherit',env:{...process.env,GRUB_PUBLICATION_DIR:dir,GRUB_DECISIONS_FILE:'evidence/grub-v1-final-decisions-2026-08-14.json'}});
const source=JSON.parse(readFileSync(dir+'/grub-v1-publishable.json','utf8'));
if(source.items.length!==798)throw Error('Accepted recipe catalogue changed');
const out='work/staging/generated/assets/staging/grub-approved.json';
mkdirSync('work/staging/generated/assets/staging',{recursive:true});
const recipes=enrichGrubRecipes(source.items);
for(const filter of ['Fast','High protein','Family','Budget','Vegetarian'])if(!searchGrubRecipes({filter},recipes).top.length)throw Error('Recipe filter has no accepted content: '+filter);
const smoke=searchGrubRecipes({query:'Chicken, beef, noodles, bread'},recipes);
if(!smoke.top.length||smoke.top.some(r=>!r.ingredients.length||r.method.length<2))throw Error('Accepted catalogue search is incomplete');
writeFileSync(out,JSON.stringify(recipes));
