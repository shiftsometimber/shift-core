import {authenticateMember} from '../member-state-fast-v1.js';
import {loadGrubCatalogue} from '../member-experience/grub-routes.mjs';
import {usableCatalogue} from '../member-experience/grub-workspace.mjs';
import {grubMemberContext} from '../member-experience/grub-intelligence.mjs';
import {ukDate} from '../member-experience/journey-context.mjs';
import {emptyFoodDay,suggestFood,recordFoodDay,loggedProtein,FoodDayError} from './core.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie'}});
export function createFoodDayRoutes({authenticate=authenticateMember,loadRecipes=async DB=>usableCatalogue(await loadGrubCatalogue(DB)),day=ukDate}={}){
 return async function(request,env){
  const url=new URL(request.url);if(url.pathname!=='/v1/grub/appetite-day')return null;
  if(env.APPETITE_FOOD_ENABLED!=='true')return json({error:'Not available'},404);
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
  if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)return json({error:'Use this page to make changes.'},403);
  const auth=await authenticate(request,env);if(auth.response)return auth.response;
  try{
   const today=day(),row=await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId).first(),prefs=JSON.parse(row?.preferences||'{}');
   const stored=prefs.appetiteFoodV1||emptyFoodDay();
   const current=stored.day===today?stored:{...stored,appetite:null};
   const recipes=await loadRecipes(env.DB),context={...grubMemberContext(prefs,today),day:today};
   let next=current;
   if(request.method==='POST'){
    if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'JSON is required'},415);
    const raw=await request.text();if(raw.length>6000)return json({error:'Request is too large'},413);
    let input;try{input=JSON.parse(raw)}catch{return json({error:'Invalid request'},400)}
    next=recordFoodDay(current,input,recipes,context);
    if(next!==current){
     next.day=today;
     await env.DB.prepare('INSERT OR IGNORE INTO member_state(user_id) VALUES(?)').bind(auth.userId).run();
     const saved=await env.DB.prepare("UPDATE member_state SET preferences=json_set(preferences,'$.appetiteFoodV1',json(?)),updated_at=? WHERE user_id=? AND COALESCE(json_extract(preferences,'$.appetiteFoodV1.revision'),0)=?").bind(JSON.stringify(next),new Date().toISOString(),auth.userId,stored.revision).run();
     if(saved.meta.changes!==1)return json({error:'Your food day changed in another tab. Reload before saving.'},409);
    }
   }
   return json({state:next,suggestion:suggestFood(next,recipes,context),loggedProtein:loggedProtein(next,recipes,today),day:today});
  }catch(e){return json({error:e instanceof FoodDayError?e.message:'Your food day could not be loaded or saved.'},e instanceof FoodDayError?400:503)}
 };
}
export const foodDayRoutes=createFoodDayRoutes();
