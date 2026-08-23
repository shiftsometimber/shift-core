import fs from 'node:fs';
import path from 'node:path';

const OUT=process.env.GRUB_OPEN_CATALOGUE_DIR||'grub-open-catalogue-evidence';
const MINIMUM=2500,CURRENT_SHIFT=798;
const SOURCE='https://huggingface.co/datasets/anonnorth/wikibooks-cookbook/resolve/main/recipes_parsed.json';
fs.mkdirSync(OUT,{recursive:true});
const tidy=value=>String(value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const key=value=>tidy(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const section=(line,name)=>String(line.section||'').toLowerCase().includes(name);
const response=await fetch(SOURCE,{headers:{Accept:'application/json','User-Agent':'Shift-Some-Timber-Catalogue/1.0'}});
if(!response.ok)throw new Error(`Wikibooks cookbook export returned ${response.status}`);
const raw=await response.json(),unique=new Map();
for(const row of raw){
  const d=row.recipe_data||{},name=tidy(d.title),lines=d.text_lines||[];
  const ingredients=lines.filter(x=>section(x,'ingredient')&&x.line_type==='ul').map(x=>tidy(x.text)).filter(Boolean);
  const instructions=lines.filter(x=>/(procedure|preparation|method|direction|instruction)/.test(String(x.section||'').toLowerCase())&&['ol','ul','p'].includes(x.line_type)).map(x=>tidy(x.text)).filter(Boolean);
  if(!name||ingredients.length<3||instructions.length<2)continue;
  const id=key(name);if(!id||unique.has(id))continue;
  unique.set(id,{source:'Wikibooks Cookbook',source_url:d.url,source_id:id,name,servings:tidy(d.infobox?.servings),time:tidy(d.infobox?.time),category:tidy(d.infobox?.category).replace('/wiki/Category:','').replaceAll('_',' '),ingredients,instructions,licence:'CC BY-SA 4.0',attribution_required:true,review:{editorial:false,nutrition:false,food_safety:false,meal_type:false,publication:false}});
}
const candidates=[...unique.values()],projected=CURRENT_SHIFT+candidates.length;
const summary={proof:'GRUB_OPEN_CATALOGUE_INGEST_V1',generated_at:new Date().toISOString(),minimum_required:MINIMUM,current_shift_approved:CURRENT_SHIFT,source_records:raw.length,external_usable_unique:candidates.length,projected_before_cross_catalogue_deduplication:projected,source:'Wikibooks Cookbook',licence:'CC BY-SA 4.0',publication_ready:false,reason:projected<MINIMUM?'insufficient unique candidates':'requires Shift duplication, editorial, meal-type, CoFID nutrition and food-safety review before publication'};
fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2));
fs.writeFileSync(path.join(OUT,'review-candidates.json'),JSON.stringify(candidates,null,2));
console.log(JSON.stringify(summary,null,2));if(projected<MINIMUM)process.exitCode=2;
