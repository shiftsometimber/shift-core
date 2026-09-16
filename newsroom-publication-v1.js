import {verifyNewsroomPublicationOidc} from './commissioning-identity-v1.js';
import {NEWSROOM_PUBLICATION_RELEASE} from './newsroom-publication-release-v1.mjs';
import {publishFixedNewsroom} from './newsroom-publication-core.mjs';
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function newsroomPublicationRoute(request,env){
 if(new URL(request.url).pathname.replace(/\/+$/,'')!=='/v1/commissioning/newsroom-publication')return null;
 if(request.method!=='POST')return reply({ok:false,error:'method_not_allowed'},405);
 const identity=await verifyNewsroomPublicationOidc(request.headers.get('x-shift-newsroom-oidc')||'');
 if(!identity.ok)return reply({ok:false,error:'newsroom_publication_unauthorised'},403);
 let body;try{const text=await request.text();if(text.length>1024)throw Error('size');body=JSON.parse(text)}catch{return reply({ok:false,error:'newsroom_selector_invalid'},400)}
 const release=NEWSROOM_PUBLICATION_RELEASE;
 if(!body||Array.isArray(body)||Object.keys(body).sort().join(',')!=='release_id,release_sha256'||body.release_id!==release.release_id||body.release_sha256!==release.release_sha256)return reply({ok:false,error:'newsroom_selector_mismatch'},409);
 try{return reply(await publishFixedNewsroom(env,release,{kind:'github_oidc',repository:identity.claims.repository,sha:identity.claims.sha,workflow_ref:identity.claims.workflow_ref,run_id:identity.claims.run_id||null,actor_id:identity.claims.actor_id}))}
 catch(error){const detail=String(error?.message||error);console.error('newsroom_publication_rejected',detail);return reply({ok:false,error:'newsroom_publication_rejected',reason:detail},409)}
}
