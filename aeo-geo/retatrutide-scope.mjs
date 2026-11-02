import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,appendFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {evidence} from './retatrutide-evidence.mjs';
export const RETA_FILES=Object.freeze(['.github/workflows/aeo-geo-technical.yml','aeo-geo/delivery.mjs','aeo-geo/package.mjs','aeo-geo/sitemap-metadata.mjs','aeo-geo/retatrutide.mjs','aeo-geo/retatrutide-evidence.mjs','aeo-geo/retatrutide-before-20261102.html','aeo-geo/retatrutide.test.mjs','aeo-geo/retatrutide-scope.mjs','aeo-geo/retatrutide-release.mjs']);
export function verifyRetatrutideScope(){
 assert.equal(evidence.approval.instruction,'Deploy');assert.equal(evidence.independentClinicalReviewClaimed,false);
 assert.equal(evidence.approval.reviewFileSha256,'35ef0181a7b7dd95f7a3cc3d50218b56344a44037d0c03dba913a4c476a32ecb');
 const paths=execFileSync('git',['diff','--name-only',evidence.approval.baselineSource,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 assert(paths.length>0&&paths.every(p=>RETA_FILES.includes(p)),'Only the exact approved Retatrutide amendment may use this release: '+paths.join(', '));
 return {paths,base:evidence.approval.baselineSource,owner:'Matt O’Brien',independentClinicalReviewClaimed:false};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const event=process.env.GITHUB_EVENT_PATH?JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH)):{};
 let selected=false;
 if(process.env.GITHUB_EVENT_NAME==='push'&&process.env.GITHUB_REF==='refs/heads/main'&&event.before&&event.before!=='0'.repeat(40)){
  const paths=execFileSync('git',['diff','--name-only',event.before,'HEAD'],{encoding:'utf8'}).trim().split('\n');
  if(paths.some(p=>p.startsWith('aeo-geo/retatrutide'))){verifyRetatrutideScope();selected=true;}
 }
 if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,'retatrutide='+selected+'\n');
 console.log(JSON.stringify({retatrutide:selected}));
}
