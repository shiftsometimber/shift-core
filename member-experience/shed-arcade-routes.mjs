import {authenticateMember} from '../member-state-fast-v1.js';
import {arcadeSnapshot,mergeArcade} from './shed-arcade-model.mjs';
const headers={'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
export async function arcadeRoutes(request,env){
 const url=new URL(request.url);if(url.pathname!=='/v1/my-timber/arcade')return null;
 if(!['GET','POST'].includes(request.method))return Response.json({error:'Method not allowed'},{status:405,headers});
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 if(request.method==='POST'&&(request.headers.get('Origin')!==url.origin||!request.headers.get('Content-Type')?.startsWith('application/json')))return Response.json({error:'Use My Timber to save your result.'},{status:403,headers});
 try{
  const raw=request.method==='POST'?await request.text():null;if(raw?.length>1600)throw Object.assign(Error('Result too large'),{status:413});const input=raw?JSON.parse(raw):null;
  if(input&&String(input.expectedAccount)!==String(auth.userId))return Response.json({error:'Your account changed. Reopen My Timber.'},{status:409,headers});
  for(let n=0;n<8;n++){
   const row=await env.DB.prepare("SELECT preferences,json_extract(preferences,'$.shedArcade') AS arcade_json FROM member_state WHERE user_id=?").bind(auth.userId).first(),prefs=JSON.parse(row?.preferences||'{}');
   if(!input)return Response.json({accountId:auth.userId,arcade:arcadeSnapshot(prefs)},{headers});
   const next=mergeArcade(prefs.shedArcade,input);
   if(next===prefs.shedArcade)return Response.json({accountId:auth.userId,arcade:arcadeSnapshot(prefs)},{headers});
   await env.DB.prepare('INSERT OR IGNORE INTO member_state(user_id) VALUES(?)').bind(auth.userId).run();
   // Compare the exact original fragment from the same read, preserving all
   // unrelated member settings even during concurrent health/action writes.
   const result=await env.DB.prepare("UPDATE member_state SET preferences=json_set(preferences,'$.shedArcade',json(?)),updated_at=? WHERE user_id=? AND json_extract(preferences,'$.shedArcade') IS ?").bind(JSON.stringify(next),new Date().toISOString(),auth.userId,row?.arcade_json??null).run();
   if(result.meta.changes===1)return Response.json({accountId:auth.userId,arcade:arcadeSnapshot({...prefs,shedArcade:next})},{headers});
  }
  return Response.json({error:'Your result changed on another device. Try saving again.'},{status:409,headers});
 }catch(e){return Response.json({error:e.status?e.message:'Your arcade result could not be confirmed. Try again.'},{status:e.status||503,headers});}
}
