import {authenticateMember} from '../member-state-fast-v1.js';
import {shiftFoodCapability,shiftRecogniseFood} from '../shift-ai-capabilities.mjs';
import {cachedPublicData,cachePublicData,reservePublicFetch,publicJSON} from './ai-public-retrieval.mjs';

const headers={'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
const json=(data,status=200)=>Response.json(data,{status,headers});
const limits={kcal:6000,proteinG:500,carbsG:1000,fatG:500,fibreG:200};
const clean=(v,n=160)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n):'';
export class CaptureError extends Error {constructor(message,status=400){super(message);this.status=status}}
export function captureCapabilities(env){
 const vision=shiftFoodCapability(env);
 return {description:true,barcode:true,photo:!!vision,label:false,photoProcessor:vision?.processor||null,photoNotice:vision?'A resized photo is processed by '+vision.processor+' for this scan. My Timber does not save the photo. Check the result before saving.':'Photo recognition is not enabled yet. You can describe your meal or enter a packet barcode.'};
}
export function validBarcode(value){
 if(typeof value!=='string'||!/^\d{8}$|^\d{12,14}$/.test(value))return false;
 const digits=[...value].map(Number),check=digits.pop();
 return (10-digits.reverse().reduce((sum,n,i)=>sum+n*(i%2?1:3),0)%10)%10===check;
}
export function boundedNutrition(value){
 const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;
 for(const [key,max]of Object.entries(limits))if(typeof value[key]==='number'&&Number.isFinite(value[key])&&value[key]>=0&&value[key]<=max)out[key]=Math.round(value[key]*10)/10;
 return out;
}
export function scaleNutrition(nutrition,factor){
 if(typeof factor!=='number'||!Number.isFinite(factor)||factor<=0||factor>20)throw new CaptureError('Check how much you ate.');
 const out={};for(const [key,n]of Object.entries(boundedNutrition(nutrition))){const value=Math.round(n*factor*10)/10;if(value>limits[key])throw new CaptureError('That amount is too large. Check the serving.');out[key]=value;}return out;
}
export function normaliseCapture(raw,mode){
 if(typeof raw==='string'){if(raw.length>12000)throw new CaptureError('The scan could not be read. Please describe your food instead.',502);try{raw=JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g,''))}catch{throw new CaptureError('The scan could not be read. Please describe your food instead.',502)}}
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!Array.isArray(raw.items)||!raw.items.length||raw.items.length>12)throw new CaptureError('I could not recognise this food. Add a description or try a clearer photo.',422);
 const items=raw.items.map(x=>clean(x,90)).filter(Boolean);
 if(items.length!==raw.items.length||items.some(x=>/\b(insulin|mounjaro|wegovy|dos(?:e|age)|diagnos\w*|prescrib\w*|allergen[ -]?free)\b/i.test(x)))throw new CaptureError('I could not recognise food in this scan. Please describe your meal.',422);
 return {food:items.join(', ').slice(0,500),items,nutrition:boundedNutrition(raw.nutrition),basis:{amount:1,unit:'pictured portion'},nutritionSource:'member_confirmed_estimate',estimate:true,requiresReview:true,message:mode==='label'?'Check the packet, units and serving before using these numbers.':'Photo estimates can miss ingredients, oil and sauces. Check what is listed and how much you ate.'};
}
export function productDraft(payload,barcode){
 const p=payload?.product;if(!p||!clean(p.product_name_en||p.product_name))throw new CaptureError('That barcode was not found. You can enter the packet details yourself.',404);
 const n=p.nutriments||{},nutrition={};
 for(const [key,source]of Object.entries({kcal:'energy-kcal_100g',proteinG:'proteins_100g',carbsG:'carbohydrates_100g',fatG:'fat_100g',fibreG:'fiber_100g'}))if(typeof n[source]==='number')nutrition[key]=n[source];
 const ml=p.nutrition_data_per==='100ml';
 return {food:clean([p.brands,p.product_name_en||p.product_name].filter(Boolean).join(' '),500),nutrition:boundedNutrition(nutrition),basis:{amount:100,unit:ml?'ml':'g'},nutritionSource:'packet_database',estimate:false,requiresReview:true,barcode,source:{name:'Open Food Facts',url:'https://world.openfoodfacts.org/product/'+barcode,licence:'Open Database Licence (ODbL)'},message:'Community supplied packet data. Check your actual label and enter the amount you ate. This is not an allergy check.'};
}
async function allowed(DB,userId){
 const consent=await DB.prepare("SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(userId).first();
 const row=await DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first();
 return Number(consent?.granted)===1&&JSON.parse(row?.preferences||'{}').myJourney?.setup?.paused!==true;
}
async function reserve(DB,userId,kind){
 const day=new Date().toISOString().slice(0,10),limit=kind==='vision'?5:30,key=kind==='vision'?'grubPhotoUsage':'grubBarcodeUsage';
 await DB.prepare('INSERT OR IGNORE INTO member_state(user_id) VALUES(?)').bind(userId).run();
 const saved=await DB.prepare(`UPDATE member_state SET preferences=json_set(COALESCE(preferences,'{}'),'$.${key}',json_object('day',?,'calls',CASE WHEN json_extract(preferences,'$.${key}.day')=? THEN COALESCE(json_extract(preferences,'$.${key}.calls'),0)+1 ELSE 1 END)) WHERE user_id=? AND (COALESCE(json_extract(preferences,'$.${key}.day'),'')<>? OR COALESCE(json_extract(preferences,'$.${key}.calls'),0)<?)`).bind(day,day,userId,day,limit).run();
 if(saved.meta?.changes!==1)throw new CaptureError('That is enough scans for today. You can still describe and save your food.',429);
 if(kind==='vision'){
  // Aggregate counters contain no member identity, image, food or free text.
  await DB.exec('CREATE TABLE IF NOT EXISTS grub_photo_budget(month TEXT PRIMARY KEY,calls INTEGER NOT NULL,day TEXT NOT NULL,day_calls INTEGER NOT NULL);');
  const result=await DB.prepare('INSERT INTO grub_photo_budget VALUES(?,1,?,1) ON CONFLICT(month) DO UPDATE SET calls=calls+1,day=excluded.day,day_calls=CASE WHEN day=excluded.day THEN day_calls+1 ELSE 1 END WHERE calls<500 AND (day<>excluded.day OR day_calls<50)').bind(day.slice(0,7),day).run();
  if(result.meta?.changes!==1)throw new CaptureError('Photo scans have reached their allowance. You can still describe your food.',429);
 }
}
export async function foodCaptureRoutes(request,env,{fetcher=fetch}={}){
 if(new URL(request.url).pathname!=='/v1/grub/capture')return null;
 if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true')return json({error:'not_available'},404);
 if(!['GET','POST'].includes(request.method))return json({error:'method_not_allowed'},405);
 try{
  const auth=await authenticateMember(request,env);if(auth.response)return new Response(auth.response.body,{status:auth.response.status,headers:{...Object.fromEntries(auth.response.headers),...headers}});
  if(!await allowed(env.DB,auth.userId))return json({error:'tracking_required',message:'Review optional health tracking in Settings before using your private food diary.'},409);
  const capabilities=captureCapabilities(env);if(request.method==='GET')return json({capabilities});
  if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'origin_not_allowed'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'json_required'},415);
  const reader=request.body?.getReader();if(!reader)return json({error:'invalid_request'},400);let raw='',size=0;const decoder=new TextDecoder();
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1100000){await reader.cancel();throw new CaptureError('Use a smaller photo.',413)}raw+=decoder.decode(value,{stream:true})}raw+=decoder.decode()}finally{reader.releaseLock()}
  let input;try{input=JSON.parse(raw)}catch{throw new CaptureError('The request could not be read.')}
  if(!input||typeof input!=='object'||Array.isArray(input))throw new CaptureError('Check your food entry.');
  if(input.mode==='description'){
   const food=clean(input.description,500);if(!food)throw new CaptureError('Describe what you ate.');
   return json({draft:{food,nutrition:{},nutritionSource:'member_entered',requiresReview:true,message:'Your own description. Add amounts only if you know them.'}});
  }
  if(input.mode==='barcode'){
   if(!validBarcode(input.barcode))throw new CaptureError('Check the digits under the barcode.');
   await reserve(env.DB,auth.userId,'barcode');
   const key='food-packet:v1:'+input.barcode;
   let data=await cachedPublicData(env.DB,key);
   if(!data){
    // Across all members/isolates, at most one uncached request every 4.1 s:
    // below the product endpoint's 15 requests/minute limit. Cache public
    // packet data only; consent and per-member limits still apply on hits.
    if(!await reservePublicFetch(env.DB,'open_food_facts',4100))throw new CaptureError('The packet lookup is busy. Try again shortly or describe your food.',429);
    let notFound=false;
    data=await publicJSON(async(url,options)=>{const response=await fetcher(url,options);if(response.status===404)notFound=true;return response},'https://world.openfoodfacts.org/api/v3/product/'+input.barcode+'?fields=product_name,product_name_en,brands,nutriments,nutrition_data_per',{headers:{'User-Agent':'MyTimber/1.0 (https://shiftsometimber.co.uk/contact)'},signal:request.signal}).catch(error=>{if(notFound)throw new CaptureError('That barcode was not found. Enter the packet details instead.',404);throw error});
    // Validate before caching; an error document is never a usable product.
    productDraft(data,input.barcode);await cachePublicData(env.DB,key,data,86400000);
   }
   if(!await allowed(env.DB,auth.userId))throw new CaptureError('Optional tracking has changed. Review Settings before continuing.',409);
   return json({draft:productDraft(data,input.barcode)});
  }
  if(input.mode!=='photo')throw new CaptureError('Choose a food entry method.');
  if(!capabilities.photo)throw new CaptureError(capabilities.photoNotice,503);
  if(input.processingConsent!==true)throw new CaptureError('Choose whether to use AI for this photo before scanning.',409);
  if(typeof input.image!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(input.image)||input.image.length>1050000)throw new CaptureError('Choose a JPEG food photo under 750 KB.');
  const binary=atob(input.image.split(',')[1]);if(binary.length>750000||binary.length<4||binary.charCodeAt(0)!==255||binary.charCodeAt(1)!==216)throw new CaptureError('This photo could not be read. Choose another image.');
  if(typeof input.description!=='undefined'&&(typeof input.description!=='string'||input.description.length>500))throw new CaptureError('Keep the description under 500 characters.');
  await reserve(env.DB,auth.userId,'vision');if(!await allowed(env.DB,auth.userId))throw new CaptureError('Optional tracking has changed. Review Settings before continuing.',409);
  const result=await shiftRecogniseFood(env,{image:input.image,caption:clean(input.description,500),signal:request.signal});
  if(!await allowed(env.DB,auth.userId))throw new CaptureError('Optional tracking has changed. Review Settings before continuing.',409);
  return json({draft:normaliseCapture(result,'photo')});
 }catch(error){return json({error:'capture_unavailable',message:error instanceof CaptureError?error.message:'The scan could not be completed. You can describe and save your food instead.'},error instanceof CaptureError?error.status:503)}
}
