const c=require('/Users/shiftsometimberltd/SST/shift-bloods-blog-review-v1-20261018/release/approved-bloods-blogs-20261019/common.cjs');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm');
const r=__dirname,load=n=>JSON.parse(fs.readFileSync(r+'/'+n)),save=(n,x)=>fs.writeFileSync(r+'/'+n,JSON.stringify(x,null,2));
const tag='<script defer src="/assets/footer-social-links-v1.js?v=20261020"></script>';
const loader="\n/* Owner-approved Follow SHIFT footer, 20 October 2026. */\n(()=>{if(document.getElementById('shiftFooterSocialClient'))return;const s=document.createElement('script');s.id='shiftFooterSocialClient';s.src='/assets/footer-social-links-v1.js?v=20261020';s.defer=true;document.head.append(s)})();\n";
(async()=>{
 assert(!fs.existsSync(r+'/baseline.json'),'Reconcile existing preparation');
 const p=await c.organicApi(c.pages),d=await c.organicApi(c.pages+'/deployments/'+p.canonical_deployment.id);
 assert.equal(d.uses_functions,false);
 const headerOwner='/Users/shiftsometimberltd/SST/header-logo-fix-20261020/v2',copyOwner='/Users/shiftsometimberltd/SST/sitewide-copy-review-20261020';
 let headerSource;
 if(d.id===JSON.parse(fs.readFileSync(headerOwner+'/production-verification.json')).id)headerSource='/Users/shiftsometimberltd/SST/assessment-v2-20261020-review/budget-inline-20261020/headers-candidate.txt';
 else if(fs.existsSync(copyOwner+'/production-verification.json')&&d.id===JSON.parse(fs.readFileSync(copyOwner+'/production-verification.json')).id)headerSource=copyOwner+'/_headers';
 else throw Error('Current production needs its exact existing header-owner receipt: '+d.id);
 const headers=fs.readFileSync(headerSource);fs.writeFileSync(r+'/_headers',headers);
 save('baseline.json',{id:d.id,url:d.url,branch:p.production_branch,headersSHA256:c.sha(headers),headerSource,files:d.files});
 fs.mkdirSync(r+'/before',{recursive:true});fs.mkdirSync(r+'/after',{recursive:true});
 const coverage=load('entry-coverage.json');
 const extra=coverage.filter(x=>!x.v42&&!x.path.startsWith('/email-templates/')).map(x=>x.path);
 const targets=['/assets/v42.js',...extra],changes=[];
 for(const target of targets){
  const z=await c.get(d.url+target.replace(/\.html$/,''));assert.equal(c.asset(z.bytes,path.extname(target).slice(1)),d.files[target],target);
  const file=target.slice(1);fs.mkdirSync(path.dirname(r+'/before/'+file),{recursive:true});fs.mkdirSync(path.dirname(r+'/after/'+file),{recursive:true});
  const s=z.bytes.toString();assert(!s.includes('footer-social-links-v1'));
  const after=target.endsWith('.js')?s+loader:s.replace(/<\/head>/i,tag+'</head>');assert.notEqual(after,s);
  if(target.endsWith('.html')){assert.equal(c.part(after,'main'),c.part(s,'main'));assert.equal(c.part(after,'header'),c.part(s,'header'));assert.equal(c.part(after,'footer'),c.part(s,'footer'));}
  else{assert(after.startsWith(s));new vm.Script(after);}
  fs.writeFileSync(r+'/before/'+file,z.bytes);fs.writeFileSync(r+'/after/'+file,after);changes.push({path:target,file,before:d.files[target],beforeSHA256:c.sha(z.bytes),after:c.asset(Buffer.from(after),path.extname(target).slice(1)),sha256:c.sha(after)});
 }
 const client=fs.readFileSync(r+'/footer-social-links-v1.js');new vm.Script(client.toString());fs.mkdirSync(r+'/after/assets',{recursive:true});fs.writeFileSync(r+'/after/assets/footer-social-links-v1.js',client);
 changes.push({path:'/assets/footer-social-links-v1.js',file:'assets/footer-social-links-v1.js',before:null,after:c.asset(client,'js'),sha256:c.sha(client)});
 const next={...d.files};for(const x of changes)next[x.path]=x.after;
 save('changes.json',changes);save('manifest-candidate.json',next);save('scope-proof.json',{at:new Date().toISOString(),base:d.id,changes:changes.map(x=>x.path),unchanged:Object.keys(d.files).length-changes.filter(x=>x.before).length,headersPreserved:true,footerApproval:'Matt: Agreed add it, 20 October 2026; Instagram/Facebook/X/YouTube only',customerDataWrites:0,workerWrites:0,existingFooterPreserved:true});
 console.log(JSON.stringify({pass:true,base:d.id,changes:changes.length,extraHTML:extra}));
})().catch(e=>{console.error(e);process.exitCode=1});
