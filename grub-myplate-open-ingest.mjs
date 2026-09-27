import fs from 'node:fs';
import path from 'node:path';

const BASE=process.env.MYPLATE_API_BASE||'https://myplate.food/api/v1';
const OUT=process.env.GRUB_MYPLATE_DIR||'grub-myplate-evidence';
const CONCURRENCY=Math.max(1,Math.min(4,Number(process.env.MYPLATE_CONCURRENCY)||1));
const REQUEST_DELAY=Math.max(250,Number(process.env.MYPLATE_REQUEST_DELAY_MS)||900);
const EXPECTED=1072;

const round1=value=>Math.round((Number(value)+Number.EPSILON)*10)/10;
const splitDirections=value=>String(value||'').split(/(?<=[.!?])\s+(?=[A-Z])/).map(x=>x.trim()).filter(Boolean);
const nutrient=(rows,key)=>rows.find(row=>row.key===key)?.amount;
const mealType=category=>{
  const value=String(category||'').toLowerCase();
  if(/breakfast/.test(value))return'breakfast';
  if(/snack|dessert|beverage|side/.test(value))return'snack';
  if(/salad|sandwich|soup/.test(value))return'lunch';
  return'dinner';
};
const fakeaway=name=>/burger|pizza|kebab|curry|biryani|taco|burrito|quesadilla|fajita|fried rice|chow mein|wings|nugget|fish and chips|takeaway/i.test(name||'');

export function normaliseMyPlateRecipe(detail,summary={}){
  const nutrition=detail.nutrition||[];
  const method=splitDirections(detail.directions);
  const title=String(detail.name||summary.name||'').trim();
  const kcal=nutrient(nutrition,'total_calories');
  const protein=nutrient(nutrition,'protein');
  const fibre=nutrient(nutrition,'dietary_fiber');
  const carbs=nutrient(nutrition,'carbohydrates');
  const fat=nutrient(nutrition,'total_fat');
  const sodium=nutrient(nutrition,'sodium');
  const blockers=[];
  if(!title)blockers.push('missing_title');
  if((detail.ingredients||[]).length<3)blockers.push('thin_ingredients');
  if(method.length<2)blockers.push('thin_method');
  if(!Number.isFinite(Number(kcal)))blockers.push('missing_source_nutrition');
  blockers.push('uk_measurement_normalisation','allergen_review','food_safety_review','shift_editorial_review','independent_human_review');
  return{
    schema_version:1,
    id:`usda-myplate-${detail.slug}`,
    title,
    meal_type:mealType(summary.category),
    servings:detail.yield||null,
    serving_size:detail.serving_size||null,
    ingredients:(detail.ingredients||[]).map(item=>({text:String(item.text||'').trim(),...(item.note?{note:String(item.note).trim()}:{} )})),
    method,
    tags:[fakeaway(title)?'fakeaway':'healthy-everyday','usda-myplate',...(summary.food_groups||[])],
    nutrition:{
      status:Number.isFinite(Number(kcal))?'source_validated':'missing',
      methodology:'USDA MyPlate Kitchen published per-serving nutrition',
      source_url:detail.source_url||detail.canonical_url,
      kcal:round1(kcal),protein_g:round1(protein),carbohydrate_g:round1(carbs),fat_g:round1(fat),fibre_g:round1(fibre),sodium_mg:round1(sodium),
      complete_table:nutrition
    },
    food_groups:detail.food_groups||[],
    source:{name:'USDA MyPlate Kitchen',market:'US',role:'nutrition_reference_and_localisation_candidate',public_domain:true,source_url:detail.source_url,canonical_url:detail.canonical_url,via:'myplate.food',via_credit_required:true,contributor:detail.contributor||null},
    shift_copy:{intro:fakeaway(title)?'Takeaway territory, shifted into a properly portioned home-cooked option.':'Straightforward food with the portions and nutrition already worked out.',method_adapted:false},
    market:{target:'UK',source:'US',eligible_for_uk_publication:false},
    review:{status:'draft',blockers:[...new Set([...blockers,'uk_recipe_reauthoring'])]},
    publication_ready:false
  };
}

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function json(url){
  for(let attempt=0;attempt<7;attempt++){
    const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'Shift-Some-Timber-Catalogue/1.0'}});
    if(response.ok){const data=await response.json();await delay(REQUEST_DELAY);return data}
    if(response.status!==429)throw new Error(`${url} returned ${response.status}`);
    const retryAfter=Number(response.headers.get('retry-after'));
    await delay(Number.isFinite(retryAfter)&&retryAfter>0?retryAfter*1000:Math.min(60000,2000*(2**attempt)));
  }
  throw new Error(`${url} remained rate limited after retries`);
}
async function listAll(){const first=await json(`${BASE}/recipes?limit=100&offset=0`),rows=[...(first.results||[])];for(let offset=100;offset<Number(first.total||0);offset+=100){const page=await json(`${BASE}/recipes?limit=100&offset=${offset}`);rows.push(...(page.results||[]))}return rows}
async function mapConcurrent(rows,fn){const output=new Array(rows.length);let cursor=0;async function worker(){while(cursor<rows.length){const index=cursor++;output[index]=await fn(rows[index],index)}}await Promise.all(Array.from({length:CONCURRENCY},worker));return output}

if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
  fs.mkdirSync(OUT,{recursive:true});
  const summaries=await listAll();
  if(summaries.length!==EXPECTED)throw new Error(`MyPlate catalogue drift: expected ${EXPECTED}, received ${summaries.length}`);
  const cacheDir=path.join(OUT,'cache');fs.mkdirSync(cacheDir,{recursive:true});
  const recipes=await mapConcurrent(summaries,async(summary,index)=>{
    const cacheFile=path.join(cacheDir,`${summary.slug}.json`);
    let detail;
    if(fs.existsSync(cacheFile))detail=JSON.parse(fs.readFileSync(cacheFile,'utf8'));
    else{detail=await json(`${BASE}/recipes/${summary.slug}`);fs.writeFileSync(cacheFile,JSON.stringify(detail))}
    if((index+1)%100===0)console.error(`MyPlate progress ${index+1}/${summaries.length}`);
    return normaliseMyPlateRecipe(detail,summary);
  });
  const unique=new Set(recipes.map(row=>row.id));
  const nutritionReady=recipes.filter(row=>row.nutrition.status==='source_validated').length;
  const structurallyReady=recipes.filter(row=>!row.review.blockers.includes('thin_ingredients')&&!row.review.blockers.includes('thin_method')).length;
  const fakeaways=recipes.filter(row=>row.tags.includes('fakeaway')).length;
  const summary={proof:'GRUB_MYPLATE_OPEN_INGEST_V1',generated_at:new Date().toISOString(),source_records:summaries.length,unique:unique.size,nutrition_ready:nutritionReady,structurally_ready:structurallyReady,fakeaway_candidates:fakeaways,source:'USDA MyPlate Kitchen via myplate.food',licence:'US public domain; myplate.food reuse with credit',publication_ready:0};
  fs.writeFileSync(path.join(OUT,'review-candidates.json'),JSON.stringify(recipes,null,2));
  fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
}
