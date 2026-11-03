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
 const prepareOffers=async(DB,prefs,at)=>{
  const recipes=helpers.usableCatalogue(await helpers.loadGrubCatalogue(DB));
  const offer=v7Offer(prefs,recipes,at,helpers);
  return {on:offer.today||new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London'}).format(new Date(at)),grubRevision:prefs.grubV2?.revision||0,foodChoices:JSON.stringify(prefs.food||{}),action:offer.action,alternatives:offer.alternatives};
 };
 return {...original,async fetch(request,env,ctx){
  const path=new URL(request.url).pathname;
  if(path==='/v1/life-back'){const write=await v7Write(request,env,prepareOffers,p=>({...p,supportSummary:helpers.supportSummary(p)}));if(write)return write;}
  const preference=v7PreferencesRoutes(request);if(preference)return helpers.withShopNavigation(request,preference,env);
  const publicAssets={
   '/assets/member-experience/programme-support-plan.mjs':[supportPlanRuntime,'text/javascript'],
   '/assets/member-experience/programme-support-plan.css':[supportPlanStyles,'text/css'],
   '/assets/member-experience/programme-journey.mjs':[journeyPageRuntime,'text/javascript'],
   '/assets/member-experience/food-diary.mjs':[foodDiaryRuntime,'text/javascript']
  };
  const asset=publicAssets[path];if(asset&&['GET','HEAD'].includes(request.method))return new Response(request.method==='HEAD'?null:asset[0],{headers:{'Content-Type':asset[1]+'; charset=utf-8','Cache-Control':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff'}});
  const response=await original.fetch(request,env,ctx);
  if(request.method!=='GET'||!response.ok||!['/v1/life-back','/v1/life-back/journey'].includes(path))return response;
  const body=await response.json();if(body.accountId===undefined)return Response.json(body,{headers:privateHeaders});
  const prefs=parse((await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(body.accountId).first())?.preferences);
  if(path==='/v1/life-back')body.v7=await v7Context(env.DB,body.accountId,prefs);
  else{body.v7=v7State(prefs.lifeBack?.progress);body.memory=(prefs.lifeBack?.progress?.memberSupport?.memories||[]).filter(m=>!m.retiredAt).map(({id,text,at})=>({id,text,at}));}
  return Response.json(body,{headers:privateHeaders});
 },async scheduled(event,env,ctx){
  const jobs=[runV7Overnight(env,new Date(event.scheduledTime||Date.now()).toISOString(),prepareOffers)];
  if(typeof original.scheduled==='function')jobs.push(original.scheduled(event,env,ctx));
  const p=Promise.allSettled(jobs);if(ctx?.waitUntil)ctx.waitUntil(p);else await p;
 }};
}
