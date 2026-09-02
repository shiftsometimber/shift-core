import fs from 'node:fs';

const out='dave-release-gate-evidence';
fs.mkdirSync(out,{recursive:true});
const startedAt=new Date().toISOString();
const legs=[];
const feedbackLane='dedicated_fresh_oidc';

async function run(name,module){
  const started=Date.now();
  try{
    await import(module);
    legs.push({name,status:'PASS',durationMs:Date.now()-started});
  }catch(error){
    legs.push({name,status:'FAIL',durationMs:Date.now()-started,error:String(error?.message||error)});
    throw error;
  }
}

try{
  await run('public-discovery-trust-anonymous-boundaries','./dave-journey-v1.mjs');
  await run('authenticated-isolation-onboarding-today-progress-retention','./finish-authenticated-production.mjs');
  await run('grub-fit-learning-and-leave-return','./finish-longitudinal-products-production.mjs');
  await run('hydration-plans-today-progress-safe-state','./finish-member-products-production.mjs');
  await run('my-journey-setup-weekly-trends-edit-export-cleanup','./my-journey-production-acceptance.mjs');
  await run('progress-picture-shift-ai-provenance-return-and-clinical-boundary','./finish-b03-final3-production.mjs');
  const report={
    proof:'G1_012_DAVE_SYNTHETIC_RELEASE_GATE_PRODUCTION_V1',
    feedbackLane,
    startedAt,
    completedAt:new Date().toISOString(),
    status:'PASS',
    freshExecution:true,
    humanInboxLegsExcluded:['register-real-inbox','verify-real-inbox','account-recovery-real-inbox'],
    externalBlocked:['treatment-support'],
    legs,
    criterion:'One fresh unattended production job must execute every currently automatable Dave commissioning lane and fail closed on any regression. Real inbox and external partner legs remain outside this synthetic release gate.'
  };
  fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  console.log('PASS G1-012 synthetic Dave release gate — all automatable production lanes executed afresh in one unattended release job; inbox/external boundaries remain explicit.');
}catch(error){
  const report={proof:'G1_012_DAVE_SYNTHETIC_RELEASE_GATE_PRODUCTION_V1',feedbackLane,startedAt,completedAt:new Date().toISOString(),status:'FAIL',freshExecution:true,legs,error:String(error?.message||error)};
  fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));
  console.error(JSON.stringify(report,null,2));
  process.exitCode=1;
}
