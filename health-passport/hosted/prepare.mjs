// Runs in CI. No production resource writes; generated secrets stay private.
import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs';
import {createHash,randomBytes,pbkdf2Sync} from 'node:crypto';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {loadGovernedGrubCatalogue} from '../../grub-expansion-authority-v1.mjs';
const dir=resolve('health-passport/hosted/generated'),proof=resolve('passport-hosted-proof');mkdirSync(dir,{recursive:true});mkdirSync(proof,{recursive:true});
const sha=process.env.GITHUB_SHA;if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('Missing exact candidate');
const hash=b=>createHash('sha256').update(b).digest('hex'),quote=s=>"'"+String(s).replaceAll("'","''")+"'";
// Reuse only governed catalogue generation, never obsolete pinned member assets.
// The original staging pin verification is left intact for its own environment.
execFileSync(process.execPath,['member-experience/staging/grub-catalogue.mjs'],{stdio:'inherit'});
const workDir=resolve('work/staging/generated'),assets=resolve(dir,'assets');
execFileSync(process.execPath,['final-v1-production-publication.mjs'],{stdio:'inherit',env:{...process.env,GRUB_PUBLISHABLE_FILE:workDir+'/grub-approved/grub-v1-publishable.json',FINAL_V1_PUBLICATION_DIR:dir+'/accepted-fit'}});
let auth=readFileSync('preview/bootstrap.sql','utf8')+'\n'+readFileSync('member-experience/staging/catalogue-schema.sql','utf8');
auth+='\n'+readFileSync(dir+'/accepted-fit/final-v1-production-publication.sql','utf8').split('\n').filter(line=>line.startsWith('INSERT INTO structured_content')).join('\n');
// Exact existing consent-table contract; every fictional account starts opted out.
auth+="\nCREATE TABLE IF NOT EXISTS consents (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,consent_type TEXT NOT NULL,consent_version TEXT,granted INTEGER NOT NULL DEFAULT 0,granted_at TEXT,withdrawn_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));\n";
const password=randomBytes(30).toString('base64url'),salt=randomBytes(16),passwordHash='pbkdf2$100000$'+salt.toString('base64url')+'$'+pbkdf2Sync(password,salt,100000,32,'sha256').toString('base64url');
const accountBase=Math.floor(Date.now()/1000)*10,browserIds=[1,2,3,4].map(i=>accountBase+i);
for(const id of browserIds)auth+=`INSERT INTO users(id,email,first_name) VALUES(${id},${quote('probe'+id+'@example.invalid')},'Fictional probe');INSERT INTO user_auth(user_id,password_hash,email_verified) VALUES(${id},${quote(passwordHash)},1);INSERT INTO member_status(user_id) VALUES(${id});INSERT INTO member_state(user_id) VALUES(${id});INSERT INTO consents(user_id,consent_type,granted) VALUES(${id},'my_shift_health_tracking',0);\n`;
const schema=readFileSync('health-passport/schema.sql','utf8');auth+='\n'+schema+'\n';
// Validate exact seed and accepted catalogue before any remote resource exists.
const checkDB=new DatabaseSync(':memory:');checkDB.exec(auth);
const catalogue=await loadGovernedGrubCatalogue({prepare(sql){return{bind(...args){return{async all(){return{results:checkDB.prepare(sql).all(...args)}}}}}}});
if(catalogue.authority.incomplete||catalogue.authority.accepted!==798)throw Error('Governed staging catalogue mismatch');
if(checkDB.prepare('SELECT count(*) n FROM user_auth WHERE email_verified=1').get().n!==4)throw Error('Fictional account seed mismatch');
if(checkDB.prepare('SELECT count(*) n FROM health_passport_records').get().n!==0)throw Error('Passport seed must be empty');
checkDB.close();
writeFileSync(dir+'/auth.sql',auth);writeFileSync(dir+'/probe.json',JSON.stringify({password,browserIds}),{mode:0o600});
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
const config={name:'shift-passport-preview-20260919',main:'../worker.mjs',compatibility_date:'2026-08-09',workers_dev:true,preview_urls:false,assets:{directory:'./assets',binding:'MEMBER_ASSETS',run_worker_first:true,html_handling:'none',not_found_handling:'none'},vars:{SHIFT_ENVIRONMENT:'passport-hosted-20260919',STAGING_EXPIRES_AT:new Date(Date.now()+48*3600000).toISOString(),PASSPORT_SOURCE_SHA:sha,HEALTH_PASSPORT_V1_ENABLED:'true',MEMBER_EXPERIENCE_V1_ENABLED:'true',AUTO_VERIFY_EMAIL:'false',TURNSTILE_REQUIRED:'false',WORK_V1_ENABLED:'false'},d1_databases:[]};
writeFileSync(dir+'/config.json',JSON.stringify(config,null,2));
writeFileSync(proof+'/source.json',JSON.stringify({candidate:sha,productionBaseline:'2d257d61ae1276c404de5e265a028040cb422aad',schemaSha256:hash(schema),sourcePages:inventory,authentication:'actual production password/session implementation; seeded fictional verified email accounts; CAPTCHA and email delivery excluded in staging',acceptedRecipeCount:798,productionWrites:false},null,2));
console.log('Prepared current complete scripts and four empty fictional accounts. No passwords or hashes logged.');
