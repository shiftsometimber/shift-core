// API contract: https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/get/
// Read-only Cloudflare Pages provenance. Never deploys or modifies a Pages project.
import {mkdirSync,writeFileSync} from 'node:fs';
if(process.env.GITHUB_ACTIONS!=='true')throw Error('CI evidence only');
const dir='work/staging/generated/five-points-evidence';mkdirSync(dir,{recursive:true});
const report={at:new Date().toISOString(),workerCandidate:process.env.GITHUB_SHA,project:'projectshift',productionWrites:0};
try{
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/pages/projects/projectshift',{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(20000)});
 report.httpStatus=r.status;const data=await r.json();
 if(!r.ok||!data.success){report.available=false;report.reason='The existing preview credential cannot establish Pages provenance.';report.errorCodes=(data.errors||[]).map(e=>e.code)}
 else{
  const p=data.result,d=p.canonical_deployment,source=p.source?.config;
  report.available=Boolean(d?.id);report.deployment=d?{id:d.id,url:d.url,environment:d.environment,createdOn:d.created_on,commit:d.deployment_trigger?.metadata?.commit_hash,branch:d.deployment_trigger?.metadata?.branch}:null;
  report.source=source?{type:p.source.type,owner:source.owner,repo:source.repo_name,productionBranch:source.production_branch}:{type:'unavailable',reason:'No connected source repository returned; an approved source artifact is still required.'};
  report.previewBaseline='https://0da69833.projectshift.pages.dev/';report.sameAsPreviewBaseline=d?.url?.replace(/\/$/,'')==='https://0da69833.projectshift.pages.dev';
 }
}catch{report.available=false;report.reason='Pages control-plane read did not complete.'}
writeFileSync(dir+'/pages-provenance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
