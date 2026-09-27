import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {CATALOGUE_PUBLICATION_RELEASE} from '../catalogue-publication-release-v1.mjs';
import {validateCatalogueRelease} from '../catalogue-publication-core.mjs';
import {readCurrentMain} from './current-main-guard.mjs';
const API='https://api.shiftsometimber.co.uk/v1/commissioning/catalogue-publication';

export async function assertCurrentMain(env=process.env,fetcher=fetch) {
  return readCurrentMain(env,fetcher);
}
export async function runPublicationClient({release=CATALOGUE_PUBLICATION_RELEASE,env=process.env,fetcher=fetch}={}) {
  await validateCatalogueRelease(release);
  if(release.status==='prepared')return {ok:true,status:'prepared',mutation:'skipped',release_id:release.release_id,rows_sha256:release.rows_sha256};
  if(env.GITHUB_EVENT_NAME!=='push' || env.GITHUB_ACTOR_ID!=='315011648')throw new Error('catalogue_publication_caller_invalid');
  await assertCurrentMain(env,fetcher);
  if(!env.ACTIONS_ID_TOKEN_REQUEST_URL || !env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)throw new Error('catalogue_oidc_unavailable');
  const oidcUrl=new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL);oidcUrl.searchParams.set('audience','shift-catalogue-publication');
  const oidcResponse=await fetcher(oidcUrl,{headers:{Authorization:`Bearer ${env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`}});
  if(!oidcResponse.ok)throw new Error(`catalogue_oidc_http_${oidcResponse.status}`);
  const token=(await oidcResponse.json()).value;if(typeof token!=='string' || !token)throw new Error('catalogue_oidc_empty');
  // Check again after issuing the short-lived token, immediately before writes.
  await assertCurrentMain(env,fetcher);
  const request={method:'POST',headers:{'content-type':'application/json','x-shift-catalogue-oidc':token},body:JSON.stringify({release_id:release.release_id,rows_sha256:release.rows_sha256})};
  const response=await fetcher(API,request);
  const responseText=await response.text();
  let report;try{report=JSON.parse(responseText)}catch{
    const proofResponse=await fetcher(`${API}-status`,request);
    report=await proofResponse.json();
    if(!proofResponse.ok)throw new Error(`catalogue_publication_failed_${response.status}_unverified_timeout`);
  }
  if(response.status===403){
    const claims=JSON.parse(Buffer.from(token.split('.')[1]||'','base64url').toString('utf8'));
    console.error('catalogue_oidc_claims',JSON.stringify(Object.fromEntries(['aud','iss','repository','repository_id','repository_owner_id','actor_id','workflow_ref','ref','sub','event_name','sha','iat','nbf','exp'].map(key=>[key,claims[key]??null]))));
  }
  if(!response.ok || report.ok!==true || report.release_id!==release.release_id || report.rows_sha256!==release.rows_sha256 || report.workflow_sha!==env.GITHUB_SHA || report.original_rows_unchanged!==true || report.transactional!==true || report.inserted+report.already_present!==3427 || report.protected_originals!==2124)throw new Error(`catalogue_publication_failed_${response.status}_${report.error||'invalid_proof'}`);
  return report;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    const result=process.argv.includes('--verify-main')?{ok:true,main_sha:await assertCurrentMain()}:await runPublicationClient();
    if(process.env.CATALOGUE_PUBLICATION_REPORT)fs.writeFileSync(process.env.CATALOGUE_PUBLICATION_REPORT,JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify(result,null,2));
  }catch(error){console.error(error.message);process.exitCode=1}
}
