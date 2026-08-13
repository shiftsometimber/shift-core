import core from './worker.js';
import {listPublishedContent} from './structured-content-v1.js';

const OWNED=new Set(['/v1/grub/conundrum','/v1/hydration/log','/v1/hydration/today']);
const ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);
const DRINKS={water:{label:'Water',factor:1,note:'Straightforward hydration.'},tea:{label:'Tea / brew',factor:1,note:'Counts towards fluid intake.'},coffee:{label:'Coffee',factor:1,note:'Counts towards fluid intake; keep caffeine sensible.'},squash:{label:'Squash',factor:1,note:'Counts when diluted normally.'},milk:{label:'Milk',factor:1,note:'Counts towards fluid intake.'},juice:{label:'Fruit juice',factor:1,note:'Counts as fluid; keep portions sensible because of free sugars.'},soft_drink:{label:'Soft drink',factor:1,note:'Counts as fluid; calories/sugar may matter separately.'},energy_drink:{label:'Energy drink',factor:1,note:'Counts as fluid, but caffeine and sugar may matter separately.'},beer:{label:'Beer / alcohol',factor:0,note:'Log it, but Shift does not use alcohol to meet your hydration target.'}};
const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();

export async function memberPracticalRoutes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';if(!OWNED.has(path))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(request)});
  const auth=await authenticate(request,env,ctx);if(auth.response)return withCors(auth.response,request);const uid=Number(auth.user.id);await ensureSchema(env.DB);
  if(path==='/v1/grub/conundrum'&&request.method==='POST')return conundrum(request,env,uid);
  if(path==='/v1/hydration/log'&&request.method==='POST')return logDrink(request,env,uid);
  if(path==='/v1/hydration/today'&&request.method==='GET')return hydrationToday(request,env,uid);
  return json({ok:false,error:'method_not_allowed'},405,request);
}

// Kept only as a continuity fallback when no governed recipe has yet been published.
// As soon as a published catalogue exists, Conundrum is constrained to that catalogue.
const IDEAS=[
 {id:'bacon-buttie',name:'Bacon butty',needs:['bacon','bread'],optional:['brown sauce','ketchup'],minutes:10,protein_g:25,method:['Cook the bacon until properly cooked.','Put it between the bread. Add sauce only if you actually have it.']},
 {id:'chicken-cheese-wrap',name:'Chicken & cheese toasted wrap',needs:['chicken','wrap','cheese'],optional:['hot sauce','salad'],minutes:10,protein_g:42,method:['Warm cooked chicken until piping hot.','Add chicken and cheese to the wrap.','Fold and toast in a dry pan until the cheese melts.']},
 {id:'egg-bacon-buttie',name:'Bacon & egg butty',needs:['bacon','egg','bread'],optional:['brown sauce'],minutes:12,protein_g:31,method:['Cook the bacon and egg.','Layer both into the bread and add sauce only if listed.']},
 {id:'cheesy-beans-toast',name:'Cheesy beans on toast',needs:['beans','bread','cheese'],optional:['chilli sauce'],minutes:10,protein_g:24,method:['Toast the bread.','Heat the beans until piping hot.','Spoon over the toast and add cheese.']},
 {id:'tuna-jacket',name:'Tuna jacket potato',needs:['potato','tuna'],optional:['sweetcorn','yoghurt','mayo','cheese'],minutes:18,protein_g:36,method:['Cook the potato until completely soft.','Drain the tuna.','Split the potato and add the tuna plus only the optional extras you listed.']},
 {id:'cheese-omelette',name:'Cheese omelette',needs:['egg','cheese'],optional:['ham','tomato','onion','spinach'],minutes:10,protein_g:28,method:['Beat the eggs.','Cook gently in a non-stick pan.','Add cheese and any listed extras, fold and cook until the egg is set.']},
 {id:'chicken-rice-bowl',name:'Chicken rice bowl',needs:['chicken','rice'],optional:['pepper','onion','soy sauce','hot sauce'],minutes:20,protein_g:42,method:['Cook the rice according to the packet.','Cook or reheat the chicken safely until piping hot.','Add only the vegetables or sauces you listed.']},
 {id:'chicken-pasta',name:'Chicken pasta',needs:['chicken','pasta'],optional:['garlic','cream cheese','tomato','spinach','parmesan'],minutes:25,protein_g:44,method:['Cook the pasta according to the packet.','Cook or reheat the chicken safely.','Combine with only the sauce ingredients you actually listed; use a splash of pasta water if needed.']},
 {id:'sausage-buttie',name:'Sausage butty',needs:['sausage','bread'],optional:['onion','brown sauce','ketchup'],minutes:18,protein_g:24,method:['Cook the sausages fully through.','Put them into the bread with only the extras you listed.']},
 {id:'beans-egg-toast',name:'Beans & egg on toast',needs:['beans','egg','bread'],optional:['cheese','chilli sauce'],minutes:12,protein_g:28,method:['Toast the bread.','Heat the beans until piping hot.','Cook the egg and serve both over the toast.']}
];
const ALIASES={bread:['bread','toast','roll','bun','bap','buttie'],wrap:['wrap','wraps','tortilla'],egg:['egg','eggs'],beans:['beans','baked beans','kidney beans'],sausage:['sausage','sausages'],potato:['potato','potatoes','jacket potato'],chicken:['chicken','chicken breast'],cheese:['cheese','cheddar','mozzarella'],tuna:['tuna'],rice:['rice'],pasta:['pasta'],bacon:['bacon']};
function has(items,need){const words=ALIASES[need]||[need];return items.some(i=>words.some(w=>i.includes(w)||w.includes(i)));}

const MATCH_STOPWORDS=new Set(['and','with','the','a','an','of','or','to','for','in','tin','tinned','fresh','frozen','small','medium','large','diced','chopped','sliced','peeled','grated','cooked','raw','lean','low','fat','reduced','salt','free','optional']);
const PANTRY_WORDS=new Set(['salt','pepper','black pepper','oil','olive oil','cooking oil','water']);
function matchTokens(value){return norm(value).split(' ').filter(x=>x.length>1&&!MATCH_STOPWORDS.has(x)&&!/^\d+$/.test(x));}
function ingredientMatch(items,ingredient){
  const candidate=norm(ingredient);if(!candidate)return false;
  const candidateTokens=matchTokens(candidate);
  return items.some(raw=>{
    const supplied=norm(raw);if(!supplied)return false;
    if(candidate.includes(supplied)||supplied.includes(candidate))return true;
    const suppliedTokens=matchTokens(supplied);
    return suppliedTokens.some(token=>candidateTokens.includes(token));
  });
}
function recipeIngredients(recipe){return (Array.isArray(recipe?.data?.ingredients)?recipe.data.ingredients:[]).map(x=>norm(typeof x==='string'?x:x?.item)).filter(Boolean);}
function usefulIngredient(x){return x&&!PANTRY_WORDS.has(x)&&![...PANTRY_WORDS].some(p=>x===p||x.startsWith(`${p} `));}
export function rankPublishedConundrum(items,recipes,{limit=6}={}){
  const supplied=(items||[]).map(norm).filter(Boolean);
  return (recipes||[]).map(recipe=>{
    const all=recipeIngredients(recipe),core=all.filter(usefulIngredient),pool=core.length?core:all;
    const matched=pool.filter(x=>ingredientMatch(supplied,x));
    const missing=pool.filter(x=>!matched.includes(x));
    const ratio=pool.length?matched.length/pool.length:0;
    const nutrition=recipe?.data?.nutrition||{};
    return{id:String(recipe.id||''),name:String(recipe.title||recipe?.data?.title||'Recipe'),meal_type:recipe?.data?.meal_type||recipe?.data?.mealType||null,minutes:Number(recipe?.data?.timeMinutes||recipe?.data?.prep_minutes||0)+Number(recipe?.data?.cook_minutes||0)||null,protein_g:Number.isFinite(Number(nutrition.protein_g))?Number(nutrition.protein_g):null,matched,missing,match_ratio:ratio,method:Array.isArray(recipe?.data?.method)?recipe.data.method:[],summary:recipe?.data?.summary||null,source:'published_catalogue'};
  }).filter(x=>x.matched.length>=1).sort((a,b)=>b.matched.length-a.matched.length||b.match_ratio-a.match_ratio||a.missing.length-b.missing.length||String(a.name).localeCompare(String(b.name))).slice(0,Math.max(1,limit));
}
async function loadPublishedRecipes(DB,{max=2500}={}){
  const out=[];const pageSize=500;
  for(let offset=0;offset<max;offset+=pageSize){const page=await listPublishedContent(DB,'recipe',{limit:pageSize,offset});out.push(...page);if(page.length<pageSize)break;}
  return out.slice(0,max);
}
function fallbackConundrum(items,pantry){
  return IDEAS.map(x=>{const matched=x.needs.filter(n=>has(items,n)),missing=x.needs.filter(n=>!has(items,n)),extras=x.optional.filter(n=>has(items,n));return{...x,matched,missing,extras,match_ratio:matched.length/x.needs.length};}).filter(x=>x.matched.length>=1&&x.match_ratio>=0.5).sort((a,b)=>a.missing.length-b.missing.length||b.match_ratio-a.match_ratio||b.protein_g-a.protein_g).slice(0,6).map(x=>({id:x.id,name:x.name,minutes:x.minutes,protein_g:x.protein_g,matched:x.matched,missing:x.missing,extras:x.extras,method:x.method,assumed_pantry:pantry,missing_note:x.missing.length?`You’d still need: ${x.missing.join(', ')}.`:'You listed the core ingredients needed.',source:'commissioning_fallback'}));
}
async function conundrum(request,env,uid){
  const b=await read(request);const items=[...(b.fridge||[]),...(b.freezer||[]),...(b.cupboard||[]),...(b.items||[])].map(norm).filter(Boolean);
  if(!items.length)return json({ok:true,top:[],message:'Tell Shift what you genuinely have in. No fantasy berries.',source:'published_catalogue'},200,request);
  const pantry=b.allow_pantry_staples===false?[]:['salt','black pepper','cooking oil'];
  let published=[];try{published=await loadPublishedRecipes(env.DB)}catch{}
  const candidates=published.length?rankPublishedConundrum(items,published):fallbackConundrum(items,pantry);
  return json({ok:true,mode:'use_what_you_have',top:candidates,catalogue_size:published.length,source:published.length?'published_catalogue':'commissioning_fallback',pantry_policy:pantry.length?'Shift assumes only salt, black pepper and cooking oil unless you switch pantry assumptions off.':'No pantry staples assumed.',message:candidates.length?'These are built from the ingredients you actually listed.':published.length?'Nothing in the reviewed, published Grub catalogue matched strongly enough yet — add another ingredient rather than Shift making one up.':'Nothing sensible matched strongly enough yet — add another ingredient rather than Shift making one up.'},200,request);
}

async function logDrink(request,env,uid){const b=await read(request),type=String(b.type||'water').toLowerCase(),cfg=DRINKS[type],ml=Math.round(Number(b.ml)||0);if(!cfg||ml<25||ml>2500)return json({ok:false,error:'invalid_drink',allowed:Object.keys(DRINKS)},400,request);const contribution=Math.round(ml*cfg.factor),caffeine=finite(b.caffeine_mg),calories=finite(b.calories),units=finite(b.alcohol_units);await env.DB.prepare(`INSERT INTO hydration_log(user_id,drink_type,volume_ml,contribution_ml,caffeine_mg,calories,alcohol_units,logged_at,created_at) VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(uid,type,ml,contribution,caffeine,calories,units,String(b.logged_at||new Date().toISOString())).run();return json({ok:true,drink:{type,label:cfg.label,volume_ml:ml,contribution_ml:contribution,note:cfg.note}},201,request);}
async function hydrationToday(request,env,uid){const date=new URL(request.url).searchParams.get('date')||new Date().toISOString().slice(0,10);const {results=[]}=await env.DB.prepare(`SELECT id,drink_type,volume_ml,contribution_ml,caffeine_mg,calories,alcohol_units,logged_at FROM hydration_log WHERE user_id=? AND substr(logged_at,1,10)=? ORDER BY logged_at,id`).bind(uid,date).all();const contribution=results.reduce((a,x)=>a+Number(x.contribution_ml||0),0),total=results.reduce((a,x)=>a+Number(x.volume_ml||0),0);return json({ok:true,date,logged_ml:total,hydration_contribution_ml:contribution,drinks:results.map(x=>({...x,label:DRINKS[x.drink_type]?.label||x.drink_type,note:DRINKS[x.drink_type]?.note||null})),principle:'Shift tracks what you actually drink. Alcohol can be logged but does not count toward the hydration target.'},200,request);}
function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}
async function ensureSchema(DB){await DB.exec(`CREATE TABLE IF NOT EXISTS hydration_log (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,drink_type TEXT NOT NULL,volume_ml INTEGER NOT NULL,contribution_ml INTEGER NOT NULL,caffeine_mg REAL,calories REAL,alcohol_units REAL,logged_at TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);CREATE INDEX IF NOT EXISTS idx_hydration_log_user_date ON hydration_log(user_id,logged_at,id);`);}
async function authenticate(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user};}
async function read(r){try{return await r.json()}catch{return{}}}
function json(data,status=200,request){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...cors(request)}});}
function cors(request){const origin=request.headers.get('Origin')||'',h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h;}
function withCors(response,request){const h=new Headers(response.headers);for(const[k,v]of Object.entries(cors(request)))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
