import {qualifyJoinedSuccessor as qualifyFixtureUi} from '../release/my-timber-joined-look-scope-20261024.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import{execFileSync}from'node:child_process';
import{approvedNewsTickerOuterFrame,withApprovedTickerPredecessor,approvedTickerPredecessorHead}from'../release/approved-news-ticker-frame-20261024.mjs';
const g=(...a)=>execFileSync('/usr/bin/git',a,{encoding:'utf8',maxBuffer:64e6}).trimEnd();
test('finite approvedTicker source admission retains actual native identity and every prior receipt',()=>{
 const f=approvedNewsTickerOuterFrame();assert(f);assert.equal(f.rawHead,g('rev-parse','HEAD'));assert.notEqual(f.base,f.rawHead);
 const ledger='release/approved-runtime-composition.json',current=JSON.parse(g('show','HEAD:'+ledger)),prior=JSON.parse(g('show',f.base+':'+ledger));delete current.approvedNewsTicker20261024;delete current.approvedNewsTickerIntegration20261025;assert.deepEqual(current,prior);
 assert.equal(approvedTickerPredecessorHead(),null);withApprovedTickerPredecessor(f,()=>assert.equal(approvedTickerPredecessorHead(),f.base));assert.equal(approvedTickerPredecessorHead(),null);
 assert.throws(()=>withApprovedTickerPredecessor({...f},()=>{}),/Independent/);
});
test('finite approvedTicker callbacks authenticate actual file and directory aliases before historical projection',()=>{
 const f=approvedNewsTickerOuterFrame();
 for(const p of ['medicines-watch/industry.mjs','radar-news-pages-v1.js','release','release/approved-runtime-composition.json']){
  let forged=false,calls=0;const read=(r,p)=>{calls++;return forged&&(r==='HEAD'||r===f.rawHead)?'forged':g('rev-parse',r+':'+p)};
  const projected=f.projectRead(read);assert.equal(projected('HEAD',p),g('rev-parse',f.base+':'+p));assert(calls>=3);forged=true;assert.throws(()=>projected('HEAD',p),{name:'AssertionError',code:'ERR_ASSERTION',message:'Approved ticker source drift: unauthentic supplied approvedTicker source: HEAD:'+p});
 }
});
test('finite approvedTicker never accepts a forged native diff or ancestry callback',()=>{
 const f=approvedNewsTickerOuterFrame();assert.throws(()=>f.projectDiff(()=>[])(f.base,'HEAD'),/diff/);assert.throws(()=>f.projectAncestor(()=>false)(f.base,'HEAD'),/ancestry/);
});

import{websiteEditorialCompletionHistoricalView}from'../release/website-editorial-scope-20261018.mjs';
test('both current native aliases retain the same admitted historical content and reader calls',()=>{const f=approvedNewsTickerOuterFrame(),v=websiteEditorialCompletionHistoricalView(),p='medicines-watch/industry.mjs';assert.equal(v.read(f.rawHead,p),v.read('HEAD',p));assert.equal(v.content(f.rawHead,p),v.content('HEAD',p));assert.equal(v.projectRead((r,p)=>g('rev-parse',r+':'+p))(f.rawHead,p),v.read('HEAD',p));assert.deepEqual(v.diff(v.head,f.rawHead),v.diff(v.head,'HEAD'));});

import {verifyHealthVisionExtension} from '../release/health-vision-scope-20261021.mjs';
import {verifyTestosteroneExtension} from '../release/testosterone-scope-20261021.mjs';
test('Health and TRT preserve their actual current native HEAD after exact ticker qualification',()=>{for(const verify of [verifyHealthVisionExtension,verifyTestosteroneExtension]){const proof=verify();assert.equal(proof.actual,g('rev-parse','HEAD'));assert.equal(proof.productionVerified,false);}});

test('original ledger fixture restoration is exact and rejects any forged current bytes',()=>{const f=approvedNewsTickerOuterFrame(),raw=g('show','HEAD:release/approved-runtime-composition.json');assert.equal(approvedTickerOriginalLedger(raw),g('show',f.base+':release/approved-runtime-composition.json'));assert.throws(()=>approvedTickerOriginalLedger(raw+' '));assert.equal(approvedTickerOriginalFixtureHead(),f.base);});
import {approvedTickerOriginalLedger,approvedTickerOriginalFixtureHead} from '../release/approved-news-ticker-frame-20261024.mjs';

import {verifyMemberRecordingRepair} from '../release/member-recording-repair-20261024.mjs';
import {approvedTickerOriginalWorkingBytes} from '../release/approved-news-ticker-frame-20261024.mjs';
test('member native repair rejects any unqualified tail and retains its actual current source after exact ticker admission',()=>{const f=approvedNewsTickerOuterFrame(),proof=verifyMemberRecordingRepair();assert.equal(proof.head,g('rev-parse','HEAD'));assert.equal(proof.paths.length,41);assert.equal(g('diff','--name-only','200ff3dd4c4e01505f418e31149389da0f81fe80','8551b285de1b808c810d49163b5cea5a3b98e575').split('\n').length,20);const path='release/member-recording-repair-20261024.mjs',raw=Buffer.from(g('show','HEAD:'+path)+'\n');assert.throws(()=>approvedTickerOriginalWorkingBytes(path,raw));withApprovedTickerPredecessor(f,()=>{assert.equal(approvedTickerOriginalWorkingBytes(path,raw).toString().trimEnd(),g('show',f.base+':'+path));assert.throws(()=>approvedTickerOriginalWorkingBytes(path,Buffer.concat([raw,Buffer.from('forged')])));});});

import {approvedTickerComparisonValue} from '../release/approved-news-ticker-frame-20261024.mjs';
test('exact current admission maps only native approved changed pins and preserves foreign values and heads',()=>{const f=approvedNewsTickerOuterFrame(),path='release/health-vision-scope-20261021.mjs',pin=g('rev-parse','HEAD:'+path),old=g('rev-parse',f.base+':'+path);assert.notEqual(pin,old);assert.equal(approvedTickerComparisonValue(path,pin,f.rawHead),old);assert.equal(approvedTickerComparisonValue(path,pin+'forged',f.rawHead),pin+'forged');assert.equal(approvedTickerComparisonValue(path,pin,f.base),pin);});

import {readFileSync,writeFileSync} from 'node:fs';
test('nested admission reuses only the private synchronous frame and never an unscoped verdict',()=>{const f=approvedNewsTickerOuterFrame();withApprovedTickerPredecessor(f,()=>{assert.equal(approvedNewsTickerOuterFrame(),f);withApprovedTickerPredecessor(f,()=>assert.equal(approvedNewsTickerOuterFrame(),f));});assert.equal(approvedTickerPredecessorHead(),null);assert.notEqual(approvedNewsTickerOuterFrame(),f);});
test('nested reuse retains callback authentication and clears the private context on refusal',()=>{const f=approvedNewsTickerOuterFrame();withApprovedTickerPredecessor(f,()=>{const reused=approvedNewsTickerOuterFrame();assert.throws(()=>reused.projectRead(()=> 'forged')('HEAD','radar-published-ticker-v1.js'),/unauthentic/);});assert.throws(()=>withApprovedTickerPredecessor(f,()=>Promise.resolve(1)),/synchronous/);assert.equal(approvedTickerPredecessorHead(),null);});
test('nested reuse rejects real working-source mutation through the original fresh guard',()=>{const f=approvedNewsTickerOuterFrame(),path='radar-published-ticker-v1.js',before=readFileSync(path);try{assert.throws(()=>withApprovedTickerPredecessor(f,()=>{writeFileSync(path,Buffer.concat([before,Buffer.from('\n// unapproved mutation\n')]));assert.throws(()=>approvedNewsTickerOuterFrame());throw Error('changed source must invalidate outer return');}));}finally{writeFileSync(path,before);}assert.equal(approvedTickerPredecessorHead(),null);assert(approvedNewsTickerOuterFrame());});

import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {realpathSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
function isolatedTickerProbe(script){const directory=realpathSync(mkdtempSync(tmpdir()+'/ticker-storage-proof-'));try{execFileSync('/usr/bin/git',['clone','--quiet','--no-hardlinks',process.cwd(),directory+'/checkout'],{stdio:'pipe'});const result=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:directory+'/checkout',encoding:'utf8',timeout:120000});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);}finally{rmSync(directory,{recursive:true,force:true});}}
test('nested construction rejects disappearance of a required historical Git object',()=>isolatedTickerProbe("import{approvedNewsTickerOuterFrame,withApprovedTickerPredecessor}from'./release/approved-news-ticker-frame-20261024.mjs';import{existsSync,renameSync}from'node:fs';import assert from'node:assert/strict';const f=approvedNewsTickerOuterFrame(),loose='.git/objects/'+f.base.slice(0,2)+'/'+f.base.slice(2),path=existsSync(loose)?loose:'.git/objects/pack',park=path+'.park';withApprovedTickerPredecessor(f,()=>{renameSync(path,park);try{assert.throws(()=>approvedNewsTickerOuterFrame());}finally{renameSync(park,path)}});"));
test('changed unrelated ref namespace falls back to the complete original constructor',()=>isolatedTickerProbe("import{approvedNewsTickerOuterFrame,withApprovedTickerPredecessor}from'./release/approved-news-ticker-frame-20261024.mjs';import{execFileSync}from'node:child_process';import assert from'node:assert/strict';const f=approvedNewsTickerOuterFrame(),ref='refs/tags/ticker-storage-proof';withApprovedTickerPredecessor(f,()=>{execFileSync('/usr/bin/git',['update-ref',ref,f.rawHead]);try{const fresh=approvedNewsTickerOuterFrame();assert.notEqual(fresh,f);assert.equal(fresh.rawHead,f.rawHead);}finally{execFileSync('/usr/bin/git',['update-ref','-d',ref]);}});"));
test('canonical reconciliation preserves every earlier private proposal as immutable evidence',()=>{const row=JSON.parse(g('show','HEAD:release/approved-runtime-composition.json')).approvedNewsTicker20261024;assert.equal(row.retainedPrivateProposal,'d062c58ec1581cfda4768b4029d85fd1396c2e2b');assert.equal(g('merge-base','--is-ancestor',row.retainedPrivateProposal,'HEAD'),'');assert.equal(createHash('sha256').update(execFileSync('/usr/bin/git',['show',row.retainedPrivateProposal+':release/approved-runtime-composition.json'],{maxBuffer:64e6})).digest('hex'),row.retainedPrivateLedgerSha256);});

test('all original current-runtime forged blob and directory cases retain the source-drift error contract',()=>{const f=approvedNewsTickerOuterFrame();for(const path of ['member-experience/member-details-lookups.mjs','frontend','release','release/approved-runtime-composition.json','.github/workflows/cloudflare-production-promote.yml']){const read=(r,p)=>r==='HEAD'&&p===path?'a'.repeat(40):g('rev-parse',r+':'+p);assert.throws(()=>f.projectRead(read)('HEAD',path),/source drift/);}});

test('canonical integration retains the complete production ledger and every independent backend source',()=>{
 const ui=qualifyFixtureUi(),f=approvedNewsTickerOuterFrame(),ledger='release/approved-runtime-composition.json',now=JSON.parse(g('show','HEAD:'+ledger)),old=JSON.parse(g('show',f.base+':'+ledger));assert.equal(f.base,'ec139dcc3eeaf137ef4792e4b1c697ac55616d70');delete now.approvedNewsTicker20261024;assert.deepEqual(now,old);
 for(const path of ['worker-entry-v6.js','worker.js','release/app-scope.mjs','release/immutable-git-facts.mjs','release/recorded-week-navigation-outer-frame-20261018.mjs','release/member-recording-repair-20261024.json','release/member-recording-repair-inverses-20261024.json','medicines-watch/scheduler.test.mjs','release/watch-registry-wave-scope.mjs'])assert.equal(ui.comparisonValue(path,g('rev-parse','HEAD:'+path)),g('rev-parse',f.base+':'+path));
});
test('current-main integration rejects changed backend working source without hiding it behind ticker projection',()=>{
 const f=approvedNewsTickerOuterFrame(),path='worker-entry-v6.js',before=readFileSync(path);
 try{writeFileSync(path,Buffer.concat([before,Buffer.from('\n// owned native integration negative\n')]));assert.throws(()=>f.projectRead()('HEAD',path),/source|working|tracked|changed/i);}
 finally{writeFileSync(path,before);}
 assert(approvedNewsTickerOuterFrame());
});

import {withImmutableHistoryVerification} from '../release/immutable-git-facts.mjs';
test('closed native proof reuses only its admitted ticker frame and still authenticates every supplied callback',()=>withImmutableHistoryVerification(()=>{
 const f=approvedNewsTickerOuterFrame();assert.equal(approvedNewsTickerOuterFrame(),f);let calls=0;
 const read=(r,p)=>{calls++;return g('rev-parse',r+':'+p)};assert.equal(f.projectRead(read)('HEAD','worker-entry-v6.js'),g('rev-parse',f.base+':worker-entry-v6.js'));assert(calls>=3);
 assert.throws(()=>approvedNewsTickerOuterFrame().projectRead(()=> 'forged')('HEAD','worker-entry-v6.js'),/source drift/);
}));
test('warmed closed ticker proof retains actual working-source mutation rejection',()=>withImmutableHistoryVerification(()=>{
 const f=approvedNewsTickerOuterFrame(),path='radar-published-ticker-v1.js',before=readFileSync(path);assert.equal(approvedNewsTickerOuterFrame(),f);
 try{writeFileSync(path,Buffer.concat([before,Buffer.from('\n// owned warmed native mutation\n')]));assert.throws(()=>approvedNewsTickerOuterFrame(),/working|source|tracked|changed/i);}
 finally{writeFileSync(path,before);}
}));
test('closed ticker evidence reuse rejects disappearance of required historical object storage',()=>isolatedTickerProbe("import{approvedNewsTickerOuterFrame}from'./release/approved-news-ticker-frame-20261024.mjs';import{withImmutableHistoryVerification}from'./release/immutable-git-facts.mjs';import{existsSync,renameSync}from'node:fs';import assert from'node:assert/strict';withImmutableHistoryVerification(()=>{const f=approvedNewsTickerOuterFrame();assert.equal(approvedNewsTickerOuterFrame(),f);const loose='.git/objects/'+f.base.slice(0,2)+'/'+f.base.slice(2),path=existsSync(loose)?loose:'.git/objects/pack',park=path+'.park';renameSync(path,park);try{assert.throws(()=>approvedNewsTickerOuterFrame());}finally{renameSync(park,path)}});"));

test('reviewed scheduler test pin projects only exact current bytes after native admission',()=>{
 const ui=qualifyFixtureUi(),f=approvedNewsTickerOuterFrame(),path='medicines-watch/scheduler.test.mjs',pin=g('rev-parse','HEAD:'+path),prior=g('rev-parse',f.base+':'+path);
 assert.equal(ui.comparisonValue(path,pin),prior);assert.equal(ui.comparisonValue(path,approvedTickerComparisonValue(path,pin,f.rawHead)),prior);assert.equal(memberRecordingComparisonValue(path,pin,f.rawHead),g('rev-parse',watchCurrentSource(path)+':'+path));
 assert.equal(approvedTickerComparisonValue(path,pin+'forged',f.rawHead),pin+'forged');assert.equal(approvedTickerComparisonValue(path,pin,f.base),pin);
});
test('historical editorial workflow fixture retains actual caller authentication and every original inverse',()=>{
 const ui=qualifyFixtureUi(),f=approvedNewsTickerOuterFrame(),view=websiteEditorialCompletionHistoricalView(),path='.github/workflows/cloudflare-production-promote.yml',actual=g('show','HEAD:'+path)+'\n';
 const restored=websiteEditorialCompletionOriginalSource(path,actual,view);
 const source=readFileSync('release/website-editorial-scope-20261018.mjs','utf8'),line=source.split('\n').find(x=>x.startsWith('const policy=')),policy=JSON.parse(line.slice('const policy='.length,-1));
 assert.equal(restored,g('show',policy.base+':'+path)+'\n');assert.equal(ui.comparisonValue(path,g('rev-parse','HEAD:'+path)),g('rev-parse',f.base+':'+path),'Every actual production workflow byte remains unchanged');
 assert.throws(()=>websiteEditorialCompletionOriginalSource(path,actual+'\nforged',view),/source|fixture|exact/i);
});
import {websiteEditorialCompletionOriginalSource} from '../release/website-editorial-scope-20261018.mjs';

import {createHash} from 'node:crypto';
import {memberRecordingComparisonValue} from '../release/member-recording-repair-20261024.mjs';
import {watchCurrentSource} from '../shift-coach/release-contract.mjs';
import {WATCH_OWNERSHIP_PATHS,WATCH_OWNERSHIP_SOURCE,WATCH_DEADLINE_PATHS,WATCH_DEADLINE_SOURCE} from '../release/watch-registry-wave-scope.mjs';
test('the actual coaching Watch owner resolver selects only the exact reviewed scheduler test source',()=>{
 const path='medicines-watch/scheduler.test.mjs',source=watchCurrentSource(path);assert.equal(source,WATCH_OWNERSHIP_SOURCE);assert.equal(memberRecordingComparisonValue(path,g('rev-parse','HEAD:'+path)),g('rev-parse',source+':'+path));
 for(const p of WATCH_OWNERSHIP_PATHS.filter(p=>p!==path))assert.equal(watchCurrentSource(p),WATCH_DEADLINE_PATHS.includes(p)?WATCH_DEADLINE_SOURCE:WATCH_OWNERSHIP_SOURCE);
 assert.equal(g('rev-parse','HEAD:shift-coach/release-contract.mjs'),g('rev-parse','55af81540a004cdeedd24eb98c96441d2421b582:shift-coach/release-contract.mjs'),'Every original coaching verifier byte remains exact');
});

const exactEditorialFixturePaths=[".github/workflows/cloudflare-production-promote.yml", "scheduled-knowledge-v1.js", "wrangler.jsonc", "release/accepted-uk-grub-preservation-20261017.mjs", "release/current-runtime-preservation-20261016.mjs", "worker-entry-v6.js", "fit-expansion-authority-v1.mjs", "g2-011-progress-story-production.mjs", "member-experience/tests/weight-import-mapping-ui.test.mjs", "release/approved-runtime-composition.mjs", "release/seo-audit-scope-20261016.mjs", "tests/seo-audit-scope-20261016.test.mjs"];

test('every original editorial fixture path restores the complete earlier source and still rejects forged actual bytes',()=>withImmutableHistoryVerification(()=>{
 const view=websiteEditorialCompletionHistoricalView(),source=readFileSync('release/website-editorial-scope-20261018.mjs','utf8'),line=source.split('\n').find(x=>x.startsWith('const policy=')),policy=JSON.parse(line.slice('const policy='.length,-1));
 for(const path of exactEditorialFixturePaths){const actual=readFileSync(path,'utf8');assert.equal(websiteEditorialCompletionOriginalSource(path,actual,view),execFileSync('/usr/bin/git',['show',policy.base+':'+path],{encoding:'utf8',maxBuffer:64e6}));assert.throws(()=>websiteEditorialCompletionOriginalSource(path,actual+'\nforged',view),/source|fixture|exact/i);}
}));

test('the original Watch owner remains exact inside the independently admitted historical frame',()=>{const f=approvedNewsTickerOuterFrame(),path='medicines-watch/scheduler.test.mjs';assert.equal(watchCurrentSource(path),WATCH_OWNERSHIP_SOURCE);withApprovedTickerPredecessor(f,()=>assert.equal(watchCurrentSource(path),WATCH_OWNERSHIP_SOURCE));assert.equal(watchCurrentSource(path),WATCH_OWNERSHIP_SOURCE);});

test('the retained native boundary rejects a changed HEAD even with identical tree and working bytes',()=>isolatedTickerProbe("import{approvedNewsTickerOuterFrame}from'./release/approved-news-ticker-frame-20261024.mjs';import{execFileSync}from'node:child_process';import assert from'node:assert/strict';const g=(...a)=>execFileSync('/usr/bin/git',a,{encoding:'utf8'}).trim(),f=approvedNewsTickerOuterFrame(),same=g('commit-tree',g('rev-parse','HEAD^{tree}'),'-p',f.rawHead,'-m','Isolated identical-tree HEAD negative');g('update-ref','HEAD',same);try{assert.throws(()=>f.assertCurrent(),/source|metadata|HEAD/i);}finally{g('update-ref','HEAD',f.rawHead);}assert(approvedNewsTickerOuterFrame());"));

import {RECORDING_REPAIR_REGISTRATION} from '../release/member-recording-repair-20261024.mjs';
import {APPROVED_NEWS_TICKER_MAINTENANCE} from '../release/approved-news-ticker-frame-20261024.mjs';
test('overlapping registered helpers retain exact before-images and reject actual or supplied byte mutation',()=>{
 const paths=RECORDING_REPAIR_REGISTRATION.filter(p=>APPROVED_NEWS_TICKER_MAINTENANCE.includes(p));assert(paths.includes('release/website-editorial-scope-20261018.mjs'));assert(paths.includes('release/health-vision-scope-20261021.mjs'));
 for(const path of paths){const f=approvedNewsTickerOuterFrame(),before=readFileSync(path);
  withApprovedTickerPredecessor(f,()=>{assert.equal(approvedTickerOriginalWorkingBytes(path,before).toString(),execFileSync('/usr/bin/git',['show',f.base+':'+path],{encoding:'utf8',maxBuffer:64e6}));assert.throws(()=>approvedTickerOriginalWorkingBytes(path,Buffer.concat([before,Buffer.from('forged')])));});
  try{writeFileSync(path,Buffer.concat([before,Buffer.from('\n// isolated unapproved helper mutation\n')]));assert.throws(()=>verifyMemberRecordingRepair(),/source|working|changed|tracked|metadata/i);}finally{writeFileSync(path,before);}
  assert(approvedNewsTickerOuterFrame());
 }
});

test('scoped verification entries keep their original before-images, private implementations and live mutation checks',()=>isolatedTickerProbe("import assert from'node:assert/strict';import{readFileSync,writeFileSync}from'node:fs';import{execFileSync}from'node:child_process';import{approvedNewsTickerOuterFrame,withApprovedTickerPredecessor,approvedTickerOriginalWorkingBytes}from'./release/approved-news-ticker-frame-20261024.mjs';const paths=['release/growth-scope.mjs','release/metrics-connection-scope.mjs','scripts/b1-release-scope.mjs'];for(const path of paths){const mod=await import('./'+path);for(const name of ['validateGrowthSourceQualified','verifyMetricsConnectionQualified','verifyScopeQualified'])assert.equal(Object.hasOwn(mod,name),false,'Internal implementation must not bypass native qualification');const f=approvedNewsTickerOuterFrame(),before=readFileSync(path);withApprovedTickerPredecessor(f,()=>{assert.equal(approvedTickerOriginalWorkingBytes(path,before).toString(),execFileSync('/usr/bin/git',['show',f.base+':'+path],{encoding:'utf8',maxBuffer:64e6}));assert.throws(()=>approvedTickerOriginalWorkingBytes(path,Buffer.concat([before,Buffer.from('forged')])));});try{writeFileSync(path,Buffer.concat([before,Buffer.from('// Unapproved verification entry mutation')]));assert.throws(()=>f.assertCurrent(),/source|working|changed|metadata/i);}finally{writeFileSync(path,before);}assert(approvedNewsTickerOuterFrame());}"));
