const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const root=__dirname,prepared=JSON.parse(fs.readFileSync(root+'/prepared-changes.json')),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
(async()=>{const {repairPromiseResponse}=await import(root+'/public-promise-accuracy-v1.mjs');const report={at:new Date().toISOString(),build:prepared.build,checks:[],accountOrDatabaseWrites:0};
 for(const asset of ['treatment-medication-catalogue-v1.js','treatment-order-prototype-v1.js','medicine-front-door-integrated-v1.js']){
  const url='https://shiftsometimber.co.uk/'+asset+'?v='+prepared.build,r=await fetch(url),body=await r.text(),expected=await(await repairPromiseResponse(new Response(fs.readFileSync(root+'/after/'+asset,'utf8')),new Request(url))).text();
  assert.equal(r.status,200);assert.equal(body,expected,asset+' exact served transformed source');report.checks.push({asset,status:r.status,sha256:sha(body),exactTransformedSource:true});
 }
 for(const route of ['/','/start-here','/programme','/treatment-order?medicine=mounjaro&view=spec','/member/grub','/member/fit']){
  const r=await fetch('https://shiftsometimber.co.uk'+route),s=await r.text();assert.equal(r.status,200);assert.ok(s.includes('content="'+prepared.build+'"'),route+' current build');assert.ok(!/Ask Shift/i.test(s));report.checks.push({route,status:r.status,buildInRawHtml:true,noOldAskName:true});
 }
 const r=await fetch('https://shiftsometimber.co.uk/public-release.json'),s=await r.text();assert.equal(s,fs.readFileSync(root+'/after/public-release.json','utf8'));report.checks.push({releaseMetadata:true,sha256:sha(s)});
 report.pass=true;fs.writeFileSync(root+'/live-http-proof.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{fs.writeFileSync(root+'/live-http-error.json',JSON.stringify({at:new Date().toISOString(),error:e.stack},null,2));console.error(e.message);process.exitCode=1});
