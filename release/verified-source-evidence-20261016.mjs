import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,lstatSync,realpathSync,existsSync,mkdirSync,writeFileSync,appendFileSync,accessSync,constants} from 'node:fs';
import {resolve,join,isAbsolute,delimiter} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';

const REPOSITORY='shiftsometimber/shift-core',WORKFLOW='.github/workflows/cloudflare-production-promote.yml';
const SOURCE_STEP='Verify every original production source command with two execution slots';
const MANIFEST_BLOB='323a87b561a9b03d4cd4ce55ac5664983b36203f';
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const blobId=bytes=>createHash('sha1').update('blob '+Buffer.byteLength(bytes)+'\0').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',['--no-optional-locks',...args],{encoding:'utf8',maxBuffer:64*1024*1024,stdio:'pipe'});
const integer=value=>/^[1-9][0-9]*$/.test(String(value))&&Number.isSafeInteger(Number(value));

function executionAuthority(){
 const path=process.env.PATH;assert(typeof path==='string'&&path.length>0,'Explicit executable search path required');
 let executable=null;
 for(const directory of path.split(delimiter)){const candidate=resolve(directory||process.cwd(),'git');try{accessSync(candidate,constants.X_OK);if(lstatSync(realpathSync(candidate)).isFile()){executable=candidate;break;}}catch{}}
 assert(executable,'The actual Git executable must resolve');
 const fingerprint=value=>{const actual=realpathSync(value),before=lstatSync(actual,{bigint:true});assert(before.isFile()&&!before.isSymbolicLink()&&before.size>0n&&before.size<=268435456n,'Bounded native executable file required');const bytes=readFileSync(actual);assert(['7f454c46','feedface','feedfacf','cefaedfe','cffaedfe','cafebabe','bebafeca','cafebabf','bfbafeca'].includes(bytes.subarray(0,4).toString('hex')),'Native executable required; script wrappers cannot authenticate source');const sha256=digest(bytes),after=lstatSync(actual,{bigint:true});for(const k of ['dev','ino','mode','size','mtimeNs','ctimeNs'])assert.equal(after[k],before[k],'Executable changed while fingerprinting');return{path:actual,dev:String(before.dev),ino:String(before.ino),mode:String(before.mode),bytes:String(before.size),mtimeNs:String(before.mtimeNs),ctimeNs:String(before.ctimeNs),sha256};};
 const selectors=[...new Set(['PATH','SSL_CERT_FILE','SSL_CERT_DIR','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','http_proxy','https_proxy','all_proxy','no_proxy','CI',...Object.keys(process.env).filter(k=>/^(?:GIT_|NODE_|LD_|DYLD_)/.test(k))])].sort();
 return {platform:process.platform,architecture:process.arch,node:fingerprint(process.execPath),git:fingerprint(executable),nodeArgumentsSha256:digest(JSON.stringify(process.execArgv)),selectors:Object.fromEntries(selectors.map(key=>[key,Object.hasOwn(process.env,key)?digest(process.env[key]):null]))};
}

// Fresh mutable authority only. Approval outcomes and callback results are never
// taken from a local cache. Unsupported layouts cannot use the attested path.
export function sourceAuthority(){
 assert(!Object.keys(process.env).some(k=>k.startsWith('GIT_')&&k!=='GIT_PAGER'),'Unsupported Git selector for source proof reuse');
 for(const k of ['NODE_OPTIONS','NODE_PATH','NODE_EXTRA_CA_CERTS','NODE_TLS_REJECT_UNAUTHORIZED'])assert(!Object.hasOwn(process.env,k),'Unsupported Node execution selector for source proof reuse');
 const execution=executionAuthority(),cwd=realpathSync(process.cwd());assert.equal(cwd,process.cwd(),'An ordinary source checkout is required');
 const dir=join(cwd,'.git'),stat=lstatSync(dir);assert(stat.isDirectory()&&!stat.isSymbolicLink(),'Ordinary Git directory required');
 const geometry=git('rev-parse','--path-format=absolute','--show-toplevel','--absolute-git-dir','--git-common-dir','--git-path','objects').trimEnd().split('\n');
 assert.deepEqual(geometry,[cwd,dir,dir,join(dir,'objects')],'Source repository geometry changed');
 assert.equal(git('rev-parse','--show-ref-format').trim(),'files','Unsupported Git reference storage');
 for(const name of ['commondir','gitdir','info/grafts','refs/replace','objects/info/alternates','objects/info/http-alternates','shallow'])assert(!existsSync(join(dir,name)),'Unsupported source history layout: '+name);
 assert.equal(git('for-each-ref','--format=%(refname)','refs/replace').trim(),'','Replacement history forbids source proof reuse');
 const head=git('rev-parse','HEAD').trim(),tree=git('rev-parse','HEAD^{tree}').trim();assert.match(head,/^[a-f0-9]{40}$/);assert.match(tree,/^[a-f0-9]{40}$/);
 for(const [kind,oid]of [['commit',head],['tree',tree]]){const bytes=execFileSync('git',['cat-file',kind,oid],{maxBuffer:8*1024*1024,stdio:'pipe'});assert.equal(createHash('sha1').update(kind+' '+bytes.length+'\0').update(bytes).digest('hex'),oid,'Actual source object bytes changed');}
 for(const args of [['diff','--no-ext-diff','--no-textconv','--ignore-submodules=none','--name-only','HEAD','--'],['diff','--no-ext-diff','--no-textconv','--ignore-submodules=none','--cached','--name-only','--']])assert.equal(git(...args).trim(),'','Tracked source changed after original admission');
 const flags=execFileSync('git',['ls-files','-v','-z'],{maxBuffer:32*1024*1024,stdio:'pipe'});let offset=0;
 while(offset<flags.length){const end=flags.indexOf(0,offset);assert(end>offset,'Invalid source index');const flag=flags[offset];assert(!(flag===83||flag>=97&&flag<=122),'Hidden source index flag');offset=end+1;}
 const paths=new Set(['HEAD','config','config.worktree','packed-refs'].map(p=>join(dir,p)));
 for(const variable of ['GIT_CONFIG_SYSTEM','GIT_CONFIG_GLOBAL'])for(const p of git('var',variable).trimEnd().split('\n'))if(p){assert(isAbsolute(p),'Absolute Git configuration path required');paths.add(p);}
 const config=git('config','--null','--show-origin','--includes','--list'),fields=config.split('\0');assert.equal(fields.pop(),'');assert.equal(fields.length%2,0);
 for(let i=0;i<fields.length;i+=2){assert(fields[i].startsWith('file:'),'Unrecognised Git configuration origin');assert(!/^include(?:if\..*)?\.path\n/i.test(fields[i+1]),'Included configuration requires original source verification');paths.add(resolve(cwd,fields[i].slice(5)));}
 const files=[...paths].sort().map(path=>{const s=lstatSync(path,{throwIfNoEntry:false});if(!s)return[path,null];assert(s.isFile()&&!s.isSymbolicLink()&&s.size<=8*1024*1024,'Unsupported configuration file');return[path,{real:realpathSync(path),dev:String(s.dev),ino:String(s.ino),mode:s.mode,sha256:digest(readFileSync(path))}];});
 assert.deepEqual(executionAuthority(),execution,'Actual executable or selector changed during source verification');
 return {head,tree,cwd,gitDirectory:dir,uid:process.getuid?.()??null,node:process.version,gitVersion:git('--version').trim(),configurationSha256:digest(config),files,execution};
}

export function productionContext(env=process.env){
 if(env.GITHUB_ACTIONS!=='true'||env.GITHUB_WORKFLOW!=='Cloudflare Production Promote'||env.GITHUB_JOB!=='promote')return null;
 assert.equal(env.GITHUB_REPOSITORY,REPOSITORY);assert.equal(env.GITHUB_REF,'refs/heads/main');assert(['push','workflow_dispatch'].includes(env.GITHUB_EVENT_NAME),'Unapproved source proof event');
 assert.equal(env.GITHUB_ACTOR_ID,'315011648','Existing release actor required');assert(integer(env.GITHUB_RUN_ID)&&integer(env.GITHUB_RUN_ATTEMPT),'Exact source run and attempt required');assert.match(env.GITHUB_SHA??'',/^[a-f0-9]{40}$/);
 return {repository:REPOSITORY,workflow:WORKFLOW,runId:Number(env.GITHUB_RUN_ID),attempt:Number(env.GITHUB_RUN_ATTEMPT),head:env.GITHUB_SHA,job:'promote',actorId:315011648};
}

export function makeScopeEvidence({context,authority,manifestBytes,statusBytes,commandsBytes,scopeBytes,stdoutBytes}){
 assert.equal(blobId(manifestBytes),MANIFEST_BLOB,'Exact original source command manifest required');
 validateCompletedCommands(JSON.parse(statusBytes),JSON.parse(commandsBytes),JSON.parse(manifestBytes),context,authority);
 const report=JSON.parse(scopeBytes),last=String(stdoutBytes).trimEnd().split('\n').at(-1);assert.deepEqual(JSON.parse(last),report,'Original successful CLI output and scope report must agree');
 assert.equal(String(scopeBytes),JSON.stringify(report,null,2),'Exact original scope file bytes required');
 return {kind:'SAME_JOB_ORIGINAL_B1_SCOPE_PROOF_V2',context,authority,manifestSha256:digest(manifestBytes),statusSha256:digest(statusBytes),commandsSha256:digest(commandsBytes),reportSha256:digest(JSON.stringify(report)),scopeFileSha256:digest(scopeBytes),scopeReport:report};
}

export function validateScopeEvidence({evidenceBytes,statusBytes,commandsBytes,manifestBytes,provider,context,authority}){
 const e=JSON.parse(evidenceBytes),status=JSON.parse(statusBytes),commands=JSON.parse(commandsBytes),manifest=JSON.parse(manifestBytes);
 assert.equal(blobId(manifestBytes),MANIFEST_BLOB,'Unknown command manifest');assert.equal(e.kind,'SAME_JOB_ORIGINAL_B1_SCOPE_PROOF_V2');assert.deepEqual(e.context,context,'Source evidence belongs to another run, attempt or source');assert.deepEqual(e.authority,authority,'Fresh source authority differs from the admitted source');
 assert.equal(authority.head,context.head);assert.equal(e.manifestSha256,digest(manifestBytes));assert.equal(e.statusSha256,digest(statusBytes));assert.equal(e.commandsSha256,digest(commandsBytes));assert.equal(e.reportSha256,digest(JSON.stringify(e.scopeReport)),'Scope report changed');
 const {run,jobs,artifact}=provider;assert.equal(run.id,context.runId);assert.equal(run.run_attempt,context.attempt);assert.equal(run.head_sha,context.head);assert.equal(run.repository.full_name,REPOSITORY);assert.equal(run.actor.id,context.actorId);assert.equal(run.path.split('@')[0],WORKFLOW);assert(['push','workflow_dispatch'].includes(run.event));assert.equal(run.head_branch,'main');
 const matching=jobs.filter(j=>j.name==='promote'&&j.run_id===context.runId&&j.run_attempt===context.attempt&&j.head_sha===context.head);assert.equal(matching.length,1,'One actual release job required');const job=matching[0];assert.equal(job.status,'in_progress','Source proof reuse is confined to its running release job');
 const index=job.steps.findIndex(s=>s.name===SOURCE_STEP);assert(index>=0&&job.steps[index].conclusion==='success','All original source checks must already have succeeded');assert(job.steps[index+1]?.name==='Retain completed source proofs before runtime operations'&&job.steps[index+1].conclusion==='success','Completed provider-sealed source artifact step required');
 assert.equal(artifact.name,'production-bounded-source-'+context.head);assert.equal(artifact.expired,false);assert.equal(artifact.workflow_run.id,context.runId);assert.equal(artifact.workflow_run.head_sha,context.head);assert.match(artifact.digest??'',/^sha256:[a-f0-9]{64}$/);
 validateCompletedCommands(status,commands,manifest,context,authority);
 const report=e.scopeReport;assert.equal(e.scopeFileSha256,digest(JSON.stringify(report,null,2)));assert.equal(report.runtimeOnly,true);assert.equal(report.databaseMigrations,false);assert.equal(report.contentPublication,false);assert.equal(report.releaseCommit,context.head);assert.equal(report.tree,authority.tree);assert(report.reconciliation&&report.metricsConnection&&report.checkedAt,'Complete original scope report required');
 return report;
}

function validateCompletedCommands(status,commands,manifest,context,authority){
 assert.equal(status.poolId,'production-bounded');assert.equal(status.maxConcurrent,2);assert.equal(status.active,0);assert.equal(status.cancelled,null);assert.equal(status.evidenceFailed,false);assert.deepEqual(status.errors,[]);assert.equal(status.sourceUnchanged,true);assert.deepEqual(status.sourceBefore,{head:context.head,tree:authority.tree});assert.deepEqual(status.sourceAfter,status.sourceBefore);assert(status.finishedAt);
 assert.equal(commands.poolId,'production-bounded');assert.equal(commands.maxConcurrent,2);assert.deepEqual(commands.tasks,manifest.tasks);assert.equal(status.results.length,33);assert.equal(manifest.tasks.length,33);
 for(let i=0;i<manifest.tasks.length;i++){const t=manifest.tasks[i],r=status.results[i];assert.equal(r.id,t.id);assert.equal(r.bodySha256,digest(t.body));assert.equal(r.status,'passed');assert.equal(r.exitCode,0);assert.equal(r.signal,null);assert(integer(r.pid)&&r.startedAt&&r.finishedAt,'Actual complete child execution required');}
}

// Keep the original report and its original checkedAt. A local alteration is
// evidence of drift, even when the provider still has the authentic original.
export function preserveOriginalScopeReceipt(report){
 const directory=resolve('b1-runtime-release');mkdirSync(directory,{recursive:true});const d=lstatSync(directory);assert(d.isDirectory()&&!d.isSymbolicLink(),'Ordinary original scope evidence directory required');
 const path=join(directory,'scope.json'),bytes=JSON.stringify(report,null,2);
 if(existsSync(path)){const s=lstatSync(path);assert(s.isFile()&&!s.isSymbolicLink(),'Ordinary original scope receipt required');assert.equal(readFileSync(path,'utf8'),bytes,'Original local scope receipt changed');}
 else writeFileSync(path,bytes,{flag:'wx'});
 if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,'runtime_only=true\ngrub_publication=false\n');
 return report;
}

// Decode without extracting files. GitHub's SHA-256 authenticates the complete
// sealed ZIP; stdlib zipfile also checks CRCs, names, sizes and entry types.
export function decodeEvidenceArchive(bytes,expectedDigest){
 assert.match(expectedDigest,/^sha256:[a-f0-9]{64}$/);assert.equal('sha256:'+digest(bytes),expectedDigest,'Provider artifact bytes changed');assert(bytes.length>0&&bytes.length<=16*1024*1024,'Bounded source artifact required');
 const code=String.raw`import sys,io,zipfile,json,pathlib,stat
b=sys.stdin.buffer.read()
with zipfile.ZipFile(io.BytesIO(b)) as z:
 rows=z.infolist();assert 0<len(rows)<=300
 names=[r.filename for r in rows];assert len(set(names))==len(names)
 total=0
 for r in rows:
  p=pathlib.PurePosixPath(r.filename);assert not p.is_absolute() and '..' not in p.parts and chr(92) not in r.filename
  assert not(r.flag_bits&1) and r.compress_type in [0,8] and not stat.S_ISLNK(r.external_attr>>16)
  assert r.file_size<=8*1024*1024;total+=r.file_size
 assert total<=32*1024*1024 and z.testzip() is None
 required=['scope-evidence.json','status.json','commands.json'];assert all(n in names for n in required)
 print(json.dumps({n:z.read(n).decode('utf-8') for n in required}))
`;
 return JSON.parse(execFileSync('python3',['-c',code],{input:bytes,maxBuffer:16*1024*1024,timeout:30000,stdio:['pipe','pipe','pipe']}).toString('utf8'));
}

async function github(path,token,binary=false){
 let url='https://api.github.com/repos/'+REPOSITORY+path,headers={Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'};
 for(let hop=0;hop<4;hop++){
  const response=await fetch(url,{headers,redirect:'manual',signal:AbortSignal.timeout(30000)});
  if([301,302,303,307,308].includes(response.status)){const target=new URL(response.headers.get('location'),url);assert.equal(target.protocol,'https:','HTTPS artifact transfer required');if(target.origin!==new URL(url).origin)headers={Accept:'application/octet-stream'};url=target.href;continue;}
  assert(response.ok,'GitHub source proof retrieval failed: '+response.status);return binary?Buffer.from(await response.arrayBuffer()):response.json();
 }
 throw Error('GitHub source proof redirect limit');
}

export async function verifiedSourceScopeAtPointUse(){
 if(process.env.SHIFT_ORIGINAL_SOURCE_SCOPE==='1')return null;
 const context=productionContext();if(!context)return null;
 const token=process.env.GITHUB_TOKEN;assert(token,'Existing read-only Actions credential required for source proof validation');
 const before=sourceAuthority();assert.equal(before.head,context.head,'Current source must be the owned workflow revision');
 const [run,jobResponse,artifactResponse]=await Promise.all([github('/actions/runs/'+context.runId,token),github('/actions/runs/'+context.runId+'/jobs?filter=latest&per_page=100',token),github('/actions/runs/'+context.runId+'/artifacts?name='+encodeURIComponent('production-bounded-source-'+context.head),token)]);
 const artifacts=artifactResponse.artifacts.filter(a=>a.name==='production-bounded-source-'+context.head&&!a.expired);assert.equal(artifacts.length,1,'One sealed current-job source artifact required');const artifact=artifacts[0];
 assert(integer(artifact.id)&&integer(artifact.size_in_bytes)&&artifact.size_in_bytes<=16*1024*1024,'Bounded authentic source artifact required');assert.match(artifact.digest??'',/^sha256:[a-f0-9]{64}$/);
 const cacheDir=join(process.env.RUNNER_TEMP||process.cwd(),'ci-source-proof','sealed-source-cache');mkdirSync(cacheDir,{recursive:true});const cachePath=join(cacheDir,String(artifact.id)+'-'+artifact.digest.slice(7)+'.zip');
 let bytes=existsSync(cachePath)?readFileSync(cachePath):null;
 if(bytes)assert.equal('sha256:'+digest(bytes),artifact.digest,'Local copy of provider-sealed artifact changed');
 else{bytes=await github('/actions/artifacts/'+artifact.id+'/zip',token,true);assert.equal('sha256:'+digest(bytes),artifact.digest,'Provider artifact changed');try{writeFileSync(cachePath,bytes,{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;assert.equal('sha256:'+digest(readFileSync(cachePath)),artifact.digest,'Concurrent provider artifact copy changed');}}
 const files=decodeEvidenceArchive(bytes,artifact.digest),manifestBytes=readFileSync(new URL('./production-source-schedule-20261016.json',import.meta.url),'utf8');
 const report=validateScopeEvidence({evidenceBytes:files['scope-evidence.json'],statusBytes:files['status.json'],commandsBytes:files['commands.json'],manifestBytes,provider:{run,jobs:jobResponse.jobs,artifact},context,authority:before});
 assert.deepEqual(sourceAuthority(),before,'Source changed during independent evidence validation');
 mkdirSync('b1-runtime-release',{recursive:true});assert(lstatSync('b1-runtime-release').isDirectory()&&!lstatSync('b1-runtime-release').isSymbolicLink(),'Ordinary source evidence directory required');writeFileSync('b1-runtime-release/source-proof-'+Date.now()+'.json',JSON.stringify({kind:'CURRENT_JOB_SOURCE_PROOF_REVALIDATED_MUTABLE_STATE_FRESH',context,source:before.head,tree:before.tree,artifact:artifact.id,digest:artifact.digest,checkedAt:new Date().toISOString(),stockOrRuntimeChecksReused:false},null,2)+'\n',{flag:'wx'});
 return report;
}

export function verifiedSourceScopeAtPointUseSync(){
 if(process.env.SHIFT_ORIGINAL_SOURCE_SCOPE==='1'||!productionContext())return null;
 const before=sourceAuthority();
 const result=JSON.parse(execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--owned-source-proof'],{encoding:'utf8',maxBuffer:4*1024*1024,timeout:120000,stdio:['ignore','pipe','pipe']}));
 assert.deepEqual(sourceAuthority(),before,'Source changed while authenticating its original proof');assert.equal(result.releaseCommit,before.head);assert.equal(result.tree,before.tree);return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv[2]!=='--owned-source-proof')throw Error('Only the fixed owned-source proof operation is available');
 verifiedSourceScopeAtPointUse().then(report=>{assert(report,'Owned production proof required');process.stdout.write(JSON.stringify(report)+'\n');}).catch(error=>{console.error(typeof error.code==='string'?error.code:'SOURCE_PROOF_REJECTED');process.exitCode=1;});
}
