import {weightSafeView} from './v7-visibility.mjs';
import {retainedScript} from './v7-retained-content.mjs';
import {v7FoodRoutes,updateNutritionSummary} from './v7-food-routes.mjs';
import {nativeDocument,nativeCSS,nativeJS} from './v7-native.mjs';
import {v7CrewRoutes} from './v7-crew.mjs';
import {authenticateMember} from '../member-state-fast-v1.js';
// V7 owns only the named new behaviour. The captured serving handler and all
// its legacy routes, clinical/commerce controls and private writes stay intact.
import{v7Write}from'./v7-api.mjs';
import{v7Context,v7Offer}from'./v7-context.mjs';
import{v7State}from'./v7-model.mjs';
import{v7PreferencesRoutes}from'./v7-preferences.mjs';
import{supportPlanRuntime,supportPlanStyles}from'./support-plan-client.mjs';
import{journeyPageRuntime}from'./journey-page-client.mjs';
import{foodDiaryRuntime}from'./food-diary-client.mjs';
import{runV7Overnight}from'./v7-overnight.mjs';
const parse=s=>{try{return JSON.parse(s||'{}')}catch{return {}}};
const privateHeaders={'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
export function wrapV7(original,helpers){
 const prepareOffers=async(DB,prefs,at,userId)=>{
  if(helpers.prepareOffers)return helpers.prepareOffers(DB,prefs,at,userId);
  const recipes=helpers.usableCatalogue(await helpers.loadGrubCatalogue(DB));
  const offer=v7Offer(prefs,recipes,at,helpers);
  return {on:offer.today||new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London'}).format(new Date(at)),grubRevision:prefs.grubV2?.revision||0,foodChoices:JSON.stringify(prefs.food||{}),action:offer.action,alternatives:offer.alternatives,choices:[offer.action,...offer.alternatives]};
 };
 return {...original,async fetch(request,env,ctx){
  const path=new URL(request.url).pathname;
  const retained=await retainedScript(request,env,original,ctx);if(retained)return retained;
  const expected=request.headers.get('X-My-Timber-Expected-Account');if(path.startsWith('/v1/')&&expected){const auth=await authenticateMember(request,env);if(auth.response)return auth.response;if(String(auth.userId)!==expected)return Response.json({error:'Your account changed. Reopen My Timber.'},{status:409,headers:privateHeaders});}
  const crew=await v7CrewRoutes(request,env);if(crew)return crew;
  const food=await v7FoodRoutes(request,env,{recipeById:helpers.recipeById||(async(DB,id)=>helpers.usableCatalogue(await helpers.loadGrubCatalogue(DB)).find(r=>r.id===id))});if(food)return food;
  const native=await nativeDocument(request,env);if(native)return native;

  if(path==='/v1/life-back'){const write=await v7Write(request,env,prepareOffers,p=>({...p,supportSummary:helpers.supportSummary(p)}));if(write)return write;}
  const preference=v7PreferencesRoutes(request);if(preference)return helpers.withShopNavigation(request,preference,env);
  if(path==='/assets/member-experience/v7-basket.mjs'&&['GET','HEAD'].includes(request.method)){
   const source=await original.fetch(new Request(new URL('/assets/member-experience/programme-shop-basket.js',request.url),{headers:request.headers}),env,ctx);if(!source.ok)return source;
   let script=await source.text();const api=/'https:\/\/api\.shiftsometimber\.co\.uk'|"https:\/\/api\.shiftsometimber\.co\.uk"/g;
   if(!api.test(script))return new Response('Shared basket source changed',{status:503,headers:privateHeaders});if(new URL(request.url).hostname==='shift-programme-my-timber-v7-test.matobrien.workers.dev')script=script.replace(api,'location.origin');
   return new Response(request.method==='HEAD'?null:script,{headers:{...privateHeaders,'Content-Type':'text/javascript; charset=utf-8'}});
  }
  const publicAssets={
   '/assets/member-experience/v7-native.css':[nativeCSS,'text/css'],
   '/assets/member-experience/v7-native.mjs':[nativeJS,'text/javascript'],
   '/assets/member-experience/programme-support-plan.mjs':[supportPlanRuntime,'text/javascript'],
   '/assets/member-experience/programme-support-plan.css':[supportPlanStyles,'text/css'],
   '/assets/member-experience/programme-journey.mjs':[journeyPageRuntime,'text/javascript'],
   '/assets/member-experience/food-diary.mjs':[foodDiaryRuntime,'text/javascript']
  };
  const asset=publicAssets[path];if(asset&&['GET','HEAD'].includes(request.method))return new Response(request.method==='HEAD'?null:asset[0],{headers:{'Content-Type':asset[1]+'; charset=utf-8','Cache-Control':new URL(request.url).searchParams.get('v')==='__V7_NATIVE_ASSET_TAG__'?'public, max-age=31536000, immutable':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff'}});
  const response=await original.fetch(request,env,ctx);
  if(path==='/v1/grub/eaten'&&['POST','PATCH','DELETE'].includes(request.method)&&response.ok){
   const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
   await updateNutritionSummary(env.DB,auth.userId);
   const result=await response.json(),prefs=parse((await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId).first())?.preferences);
   return Response.json({...result,nutritionDay:prefs.v7NutritionDay},{status:response.status,headers:privateHeaders});
  }
  if(request.method!=='GET'||!response.ok||!['/v1/life-back','/v1/life-back/journey'].includes(path))return response;
  const body=await response.json();if(body.accountId===undefined)return Response.json(body.v7?.preferences?.showWeight===false?weightSafeView(body):body,{headers:privateHeaders});
  const prefs=parse((await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(body.accountId).first())?.preferences);
  if(path==='/v1/life-back')body.v7=await v7Context(env.DB,body.accountId,prefs);
  else{body.v7=v7State(prefs.lifeBack?.progress);body.memory=(prefs.lifeBack?.progress?.memberSupport?.memories||[]).filter(m=>!m.retiredAt).map(({id,text,at})=>({id,text,at}));}
  return Response.json(body.v7?.preferences?.showWeight===false?weightSafeView(body):body,{headers:privateHeaders});
 },async scheduled(event,env,ctx){
  const generate=env.V7_PLANNER?.prepareV7Fit?(userId,settings)=>env.V7_PLANNER.prepareV7Fit({userId,...settings}):null;
  if(generate&&env.V7_PLANNER?.prepareV7FitBatch)generate.batch=(userId,settings)=>env.V7_PLANNER.prepareV7FitBatch({userId,settings});
  const jobs=[(async()=>{const at=new Date(event.scheduledTime||Date.now()).toISOString(),started=Date.now();let result;do{result=await runV7Overnight(env,at,prepareOffers,generate);}while(result.more&&Date.now()-started<12*60*1000);return result;})()];
  if(typeof original.scheduled==='function')jobs.push(original.scheduled(event,env,ctx));
  const p=Promise.allSettled(jobs);if(ctx?.waitUntil)ctx.waitUntil(p);else return await p;
 }};
}
