import {verifyCataloguePublicationOidc} from './commissioning-identity-v1.js';
import {CATALOGUE_PUBLICATION_RELEASE} from './catalogue-publication-release-v1.mjs';
import {publishFixedCatalogue,verifyFixedCataloguePublication} from './catalogue-publication-core.mjs';
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});

export async function cataloguePublicationRoute(request,env) {
  const path=new URL(request.url).pathname.replace(/\/+$/,'');
  if(path!=='/v1/commissioning/catalogue-publication'&&path!=='/v1/commissioning/catalogue-publication-status')return null;
  if(request.method!=='POST')return reply({ok:false,error:'method_not_allowed'},405);
  const identity=await verifyCataloguePublicationOidc(request.headers.get('x-shift-catalogue-oidc')||'');
  if(!identity.ok)return reply({ok:false,error:'catalogue_publication_unauthorised'},403);
  if(Number(request.headers.get('content-length')||0)>1024)return reply({ok:false,error:'catalogue_selector_invalid'},400);
  let body;
  try{const text=await request.text();if(text.length>1024)throw new Error('size');body=JSON.parse(text)}catch{return reply({ok:false,error:'catalogue_selector_invalid'},400)}
  const release=CATALOGUE_PUBLICATION_RELEASE;
  if(!body || Array.isArray(body) || Object.keys(body).sort().join(',')!=='release_id,rows_sha256' || body.release_id!==release.release_id || body.rows_sha256!==release.rows_sha256)return reply({ok:false,error:'catalogue_selector_mismatch'},409);
  // The caller can select only this compiled, owner-authorised release. It
  // cannot supply content, SQL, database names, or an alternate operation.
  try{return reply({...await (path.endsWith('-status')?verifyFixedCataloguePublication(env.DB,release):publishFixedCatalogue(env.DB,release)),workflow_sha:identity.claims.sha})}
  catch(error){console.error('catalogue_publication_rejected',String(error?.message||error));return reply({ok:false,error:'catalogue_publication_rejected'},409)}
}
