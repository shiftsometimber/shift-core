import {ukDate} from './journey-context.mjs';
import {authenticateMember} from '../member-state-fast-v1.js';
import {enrichGrubRecipes,searchGrubRecipes} from './grub-search.mjs';
import {emptyGrub,usableCatalogue,applyGrubOperation,workspaceView,GrubError} from './grub-workspace.mjs';
import {grubMemberContext} from './grub-intelligence.mjs';
import {loadGovernedGrubCatalogue} from '../grub-expansion-authority-v1.mjs';
const headers={'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','Vary':'Cookie'};
const json=(body,status=200)=>Response.json(body,{status,headers});
export async function loadGrubCatalogue(DB){
 const {authority}=await loadGovernedGrubCatalogue(DB);
 if(authority.incomplete)throw new GrubError('The recipe library is temporarily unavailable. Please try again.',503);
 const records=enrichGrubRecipes(authority.rows);
 if(!records.length)throw new GrubError('The recipe library is temporarily unavailable. Please try again.',503);
 return records;
}
export async function grubWorkspaceRoutes(request,env){
 const u=new URL(request.url);if(!['/v1/grub/search','/v1/grub/workspace'].includes(u.pathname))return null;
 if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true')return json({error:'Not available'},404);
 if(!['GET','POST'].includes(request.method)||u.pathname.endsWith('/search')&&request.method!=='POST')return json({error:'Method not allowed'},405);
 if(request.method==='POST'&&request.headers.get('Origin')!==u.origin)return json({error:'Use this page to make changes.'},403);
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 try{
  let input;
  if(request.method==='POST'){if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'JSON is required'},415);const text=await request.text();if(text.length>12000)return json({error:'Request is too large'},413);try{input=JSON.parse(text)}catch{return json({error:'Invalid request'},400)}if(!input||typeof input!=='object'||Array.isArray(input))return json({error:'Invalid request'},400)}
  const records=await loadGrubCatalogue(env.DB);
  if(u.pathname.endsWith('/search'))return json(searchGrubRecipes(input,records));
  const recipes=usableCatalogue(records),row=await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId).first();
  const prefs=row?JSON.parse(row.preferences||'{}'):{},current=prefs.grubV2||emptyGrub();
  // Preserve explicitly saved legacy recipe names where their identity is exact.
  if(!prefs.grubV2&&Array.isArray(prefs.grub?.savedRecipes))current.saved=recipes.filter(r=>prefs.grub.savedRecipes.includes(r.name)).map(r=>r.id).slice(0,100);
  const context={...grubMemberContext(prefs),date:ukDate(),at:new Date().toISOString()};
  if(request.method==='GET')return json(workspaceView(current,recipes,context));
  const next=applyGrubOperation(current,input,recipes,context);
  if(next.revision===current.revision)return json(workspaceView(current,recipes,context));
  await env.DB.prepare("INSERT OR IGNORE INTO member_state(user_id) VALUES(?)").bind(auth.userId).run();
  const saved=await env.DB.prepare("UPDATE member_state SET preferences=json_set(preferences,'$.grubV2',json(?)),updated_at=? WHERE user_id=? AND COALESCE(json_extract(preferences,'$.grubV2.revision'),0)=?").bind(JSON.stringify(next),new Date().toISOString(),auth.userId,current.revision).run();
  if(saved.meta.changes!==1)throw new GrubError('Your food list changed in another tab. Reload it before trying again.',409);
  return json(workspaceView(next,recipes,context));
 }catch(e){return json({error:e instanceof GrubError?e.message:'Food could not be loaded or saved. Please try again.'},e instanceof GrubError?e.status:503)}
}
