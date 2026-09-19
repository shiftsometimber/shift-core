// Runs in CI. No production resource writes; generated secrets stay private.
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,cpSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const dir=resolve('health-passport/hosted/generated'),proof=resolve('passport-hosted-proof');mkdirSync(dir,{recursive:true});mkdirSync(proof,{recursive:true});
const sha=process.env.GITHUB_SHA;if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('Missing exact candidate');
const hash=b=>createHash('sha256').update(b).digest('hex');
// Existing isolated seed retains approved catalogue provenance and generates
// ordinary password hashes for unique fictional users, without remote writes.
execFileSync(process.execPath,['work/staging/prepare.mjs'],{stdio:'inherit'});
const workDir=resolve('work/staging/generated'),assets=resolve(dir,'assets');
cpSync('frontend/member',assets,{recursive:true});
for(const name of ['_worker.js','_headers','_redirects'])writeFileSync(assets+'/'+name,'');
writeFileSync(assets+'/.assetsignore','_worker.js\n_headers\n_redirects\n**/*.sql\n');
const pagePaths=['/start-here','/member-login','/member/dashboard','/member/settings','/member/grub','/member/fit','/member/check-in'];
const queue=new Set(pagePaths),map={},inventory=[];
for(const path of queue){
 if(queue.size>240)throw Error('Snapshot bound exceeded');
 const response=await fetch('https://shiftsometimber.co.uk'+path,{credentials:'omit',signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Public snapshot failed: '+path+' '+response.status);
 const bytes=Buffer.from(await response.arrayBuffer()),type=response.headers.get('content-type')||'',digest=hash(bytes),asset='/__snapshot/'+digest;
 mkdirSync(assets+'/__snapshot',{recursive:true});writeFileSync(assets+asset,bytes);
 const u=new URL(path,'https://shiftsometimber.co.uk');map[path]={asset,type};map[u.pathname]??={asset,type};
 const entry={path,type,sha256:digest,bytes:bytes.length};
 if(pagePaths.includes(path)){
  const html=bytes.toString();entry.scripts=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m=>m[1]);
  entry.inlineScripts=[...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>hash(m[1]));
  for(const m of html.matchAll(/(?:<script\b[^>]*\bsrc|<link\b[^>]*\bhref|<img\b[^>]*\bsrc)=["']([^"']+)["']/gi)){
   const url=new URL(m[1],'https://shiftsometimber.co.uk'+path);
   if(url.origin==='https://shiftsometimber.co.uk'&&/\.(?:js|mjs|css|png|jpg|jpeg|webp|svg|woff2?)(?:$|\?)/.test(url.pathname+url.search))queue.add(url.pathname+url.search);
  }
 }
 inventory.push(entry);
}
writeFileSync(dir+'/snapshot-map.mjs','export default '+JSON.stringify(map)+';\n');
const original=readFileSync(workDir+'/auth.sql','utf8'),schema=readFileSync('health-passport/schema.sql','utf8');
writeFileSync(dir+'/auth.sql',original+'\n'+schema+'\n');
copyFileSync(workDir+'/probe.json',dir+'/probe.json');
const config={name:'shift-passport-preview-20260919',main:'../worker.mjs',compatibility_date:'2026-08-09',workers_dev:true,preview_urls:false,assets:{directory:'./assets',binding:'MEMBER_ASSETS',run_worker_first:true,html_handling:'none',not_found_handling:'none'},vars:{SHIFT_ENVIRONMENT:'passport-hosted-20260919',STAGING_EXPIRES_AT:new Date(Date.now()+48*3600000).toISOString(),PASSPORT_SOURCE_SHA:sha,HEALTH_PASSPORT_V1_ENABLED:'true',MEMBER_EXPERIENCE_V1_ENABLED:'true',AUTO_VERIFY_EMAIL:'false',TURNSTILE_REQUIRED:'false',WORK_V1_ENABLED:'false'},d1_databases:[]};
writeFileSync(dir+'/config.json',JSON.stringify(config,null,2));
writeFileSync(proof+'/source.json',JSON.stringify({candidate:sha,productionBaseline:'2d257d61ae1276c404de5e265a028040cb422aad',schemaSha256:hash(schema),sourcePages:inventory,authentication:'actual production password/session implementation; seeded fictional verified email accounts; CAPTCHA and email delivery excluded in staging',productionWrites:false},null,2));
console.log('Prepared full original public/member scripts and isolated fixtures. No passwords or hashes logged.');
