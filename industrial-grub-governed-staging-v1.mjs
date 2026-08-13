import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {buildIndustrialCatalogue} from './industrial-catalogue-v8.js';
import {APPROVED,grams} from './industrial-grub-systemic-v3.mjs';
import {ensureStructuredContent,upsertStructuredContent} from './structured-content-v1.js';

class D1Statement{
  constructor(db,sql,params=[]){this.db=db;this.sql=sql;this.params=params}
  bind(...params){return new D1Statement(this.db,this.sql,params.map(v=>v===undefined?null:v))}
  async run(){const r=this.db.prepare(this.sql).run(...this.params);return{success:true,meta:{changes:Number(r.changes||0),last_row_id:Number(r.lastInsertRowid||0)}}}
  async first(){return this.db.prepare(this.sql).get(...this.params)||null}
  async all(){return{results:this.db.prepare(this.sql).all(...this.params)}}
}
class D1Database{
  constructor(){this.sqlite=new DatabaseSync(':memory:')}
  prepare(sql){return new D1Statement(this.sqlite,sql)}
  async exec(sql){this.sqlite.exec(sql);return{success:true}}
}

const index=JSON.parse(fs.readFileSync(process.env.COFID_INDEX||'/tmp/cofid-index.json','utf8'));
const foods=new Map((index.foods||[]).map(food=>[String(food.code),food]));
const nutrients=['kcal','protein_g','carbohydrate_g','fat_g','fibre_g'];
const round=n=>Math.round((Number(n)+Number.EPSILON)*10)/10;

function calculate(recipe){
  const evidence=[];
  const totals=Object.fromEntries(nutrients.map(key=>[key,0]));
  for(const ingredient of recipe.ingredients||[]){
    const mapping=APPROVED[ingredient.item];
    const weight=grams(ingredient.amount,ingredient.item);
    const food=mapping?foods.get(String(mapping.code)):null;
    if(!mapping||!food||!(weight>0))return null;
    for(const key of nutrients){
      const value=Number(food[key]);
      if(!Number.isFinite(value))return null;
      totals[key]+=value*weight/100;
    }
    evidence.push({
      item:ingredient.item,
      amount:ingredient.amount,
      grams:round(weight),
      cofid_code:food.code,
      cofid_name:food.name,
      mapping_state:mapping.state,
      mapping_confidence:mapping.confidence,
      mapping_basis:mapping.basis,
      ...(mapping.limitation?{mapping_limitation:mapping.limitation}:{})
    });
  }
  const servings=Math.max(1,Number(recipe.servings)||1);
  const nutrition=Object.fromEntries(nutrients.map(key=>[key,round(totals[key]/servings)]));
  const suspicious=nutrition.kcal<80||nutrition.kcal>1800||nutrition.protein_g<0||nutrition.protein_g>150||nutrition.fat_g>160||nutrition.carbohydrate_g>250;
  const safety=!(recipe.food_safety?.length>=2&&recipe.method?.length>=4);
  if(suspicious||safety)return null;
  const prior=recipe.review||{};
  const blockers=(prior.blockers||[]).filter(x=>x!=='nutrition_validation');
  return{
    ...recipe,
    nutrition:{
      status:'validated',
      methodology:'CoFID 2021 governed canonical ingredient propagation',
      dataset_version:'CoFID 2021',
      validated_at:'2026-08-13',
      precision_note:'Calculated ingredient-level estimate, not laboratory analysis; brands, cooking yield and drained weights can vary.',
      ...nutrition,
      ingredient_evidence:evidence
    },
    review:{
      ...prior,
      blockers,
      pre_review:'auto_check_pass',
      risk_tier:'LOW',
      reasons:[],
      canonical_mapping_governance:'resolved'
    }
  };
}

const DB=new D1Database();
await ensureStructuredContent(DB);
const catalogue=buildIndustrialCatalogue().recipes;
let validated=0,quarantined=0;
for(const recipe of catalogue){
  const calculated=calculate(recipe);
  const item=calculated||recipe;
  await upsertStructuredContent(DB,{id:item.id,contentType:'recipe',title:item.title,version:1,status:'draft',data:item,review:item.review});
  if(calculated)validated++;else quarantined++;
}

const rows=(await DB.prepare("SELECT id,status,data_json,review_json FROM structured_content WHERE content_type='recipe'").all()).results;
assert.equal(rows.length,2876,'all industrial recipes must stage');
let stagedValidated=0;
for(const row of rows){
  assert.equal(row.status,'draft','industrial content must remain draft before independent review');
  const data=JSON.parse(row.data_json||'{}');
  const review=JSON.parse(row.review_json||'{}');
  if(data.nutrition?.status==='validated'){
    stagedValidated++;
    assert.equal(review.risk_tier,'LOW');
    assert.equal(review.pre_review,'auto_check_pass');
    assert.ok(review.blockers?.includes('second_person_content_review'),'independent review barrier must remain');
    assert.ok(!review.blockers?.includes('nutrition_validation'),'validated recipe must not retain stale nutrition blocker');
    assert.equal(data.nutrition.dataset_version,'CoFID 2021');
    assert.equal(data.nutrition.ingredient_evidence?.length,data.ingredients?.length,'every ingredient needs provenance');
  }
}
assert.equal(stagedValidated,validated);
assert.ok(validated>=2200,`current governed staging regressed below 2,200 nutrition-valid recipes: ${validated}`);
assert.equal(validated+quarantined,2876);
const published=await DB.prepare("SELECT COUNT(*) AS c FROM structured_content WHERE status='published'").first();
assert.equal(Number(published.c),0,'staging must not bypass review/publication');

console.log(JSON.stringify({catalogue:2876,stagedDrafts:rows.length,nutritionValidated:validated,lowRisk:validated,quarantined,published:Number(published.c),reviewBarrier:'second_person_content_review'},null,2));
console.log(`PASS M11 governed staging: ${validated}/2,876 current industrial recipes retain ingredient-level CoFID nutrition inside structured_content as LOW-risk drafts; ${quarantined} remain quarantined and zero are published without independent review.`);
