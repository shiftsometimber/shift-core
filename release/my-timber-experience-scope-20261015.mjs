import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {realpathSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
// This verifies the actual member-experience payload before the previous,
// unchanged release contracts see their independently verified predecessor.
export const EXPERIENCE_BASE='685ede249cd20c4801d0a25227fed16d46860618';
export const EXPERIENCE_SOURCE='88da89158e2967a07bd6f40ebc9aa4c1a63360bb';
export const EXPERIENCE_MANIFEST='release/approved-runtime-composition.json';
export const EXPERIENCE_KEY='myTimberExperience20261015';
export const EXPERIENCE_PINS=Object.freeze({"evidence/my-timber-experience-20261015/browser-receipt.json":"3bf698d4b5c6a798ec8cfb6684a1b4f35d01459e","evidence/my-timber-experience-20261015/chromium-360-large-text.png":"161aa426894f77043b555161ece69deb8710d503","evidence/my-timber-experience-20261015/chromium-390-fit.png":"2443b45e2b9f025f458f24f503ffbf8f112e6d3a","evidence/my-timber-experience-20261015/chromium-390-grub.png":"f5b28bcdd31974bfeaad66f1da73cace06c74b3b","evidence/my-timber-experience-20261015/chromium-390-today.png":"2082f3f23d2b175e0ef31e8682c7df9ddb4b40c5","evidence/my-timber-experience-20261015/health-browser-receipt.json":"daff72e7f7c1a947888b636ab46b14822f5738c6","evidence/my-timber-experience-20261015/public-preservation.json":"3fd211a146bc75dd944301fdf1a7137038cfbe6b","evidence/my-timber-experience-20261015/returning-fit-settings-first-failure.json":"ec25abc388c5dd08e774e8ffe92a46b814baf4b7","evidence/my-timber-experience-20261015/verification.json":"5ed489f15e1e97e54b3d2fc96355de6f0b5e4f25","evidence/my-timber-experience-20261015/webkit-390-today.png":"c954dd441eb46dac769fea42c9417428c246183a","member-design.mjs":"9dd1b834ce5622cb1d51e64bad45597fdd194b59","member-experience/app-experience.mjs":"d1650a0d4d6772009dbdde393e89e926bf558186","member-experience/chrome.mjs":"e41fa923096a3927ee1bd2ad44dee21d3f43e73b","member-experience/device-health-client.mjs":"0cc9960245050ea09ae550577f7bb744ac36f8c6","member-experience/grub-runtime.mjs":"7ecb727e8952908b36dc1b2a47820c3ed257d851","member-experience/grub-search.mjs":"067be4ff18a18cc4845d7511686254d81de12d12","member-experience/tests/discovery-options.test.mjs":"239d36989159f1e779b630087091e91b85fb0a97","my-timber-pwa/service-worker.mjs":"7354d3aa3e20fec9369b38b5349d8092d54a5530","preview/app-layout/presentation.mjs":"afcde7d546805247da70c6e52e9f53a188bb35a0","preview/app-layout/tabs.mjs":"f51a16efec17bae3de69381e8efc7f798ad93292","preview/app-layout/today.mjs":"f82388cbe816ca75a92d394ee608dcdf0758551b","shift-coach/member-experience-proof.mjs":"cb45a728453162c8e7c87fd67ce4bae40bae7944","shift-coach/ui.mjs":"527e504f963fa2099ef59a754dbb9482b33228d6"});
export const EXPERIENCE_PATHS=Object.freeze(Object.keys(EXPERIENCE_PINS).sort());
export const EXPERIENCE_MAINTENANCE=Object.freeze([
 'release/my-timber-experience-scope-20261015.mjs',
 'release/combined-finite-scope-20261014.mjs',
 'release/approved-runtime-composition.mjs',
 'tests/my-timber-experience-composition-20261015.test.mjs',
 'release/app-member-live.mjs',
 'my-timber-final-production.mjs',
 'shift-coach/full-page-proof.mjs',
 'shift-coach/member-experience-live-proof.mjs'
].sort());
export const EXPERIENCE_RECORD=Object.freeze({
 proof:'EXACT_AUTHORISED_MY_TIMBER_EXPERIENCE_20261015',
 base:EXPERIENCE_BASE,source:EXPERIENCE_SOURCE,paths:EXPERIENCE_PATHS,
 maintenancePaths:EXPERIENCE_MAINTENANCE,integrationIssue:1065,
 approval:{owner:'Matt',scope:'My Timber interface and usability, including corresponding PWA changes',visualDirection:'Looks good',visualApprovalAt:'2026-10-15T19:45:38Z'},
 publicHomepageChanged:false,clinicalChanged:false,memberRecordsChanged:false,
 consentControlsRemoved:false,commercialSettingsChanged:false,nativeBinaryChanged:false,
 externalCommunicationsSent:false,newSpendingAuthorised:false,
 existingGatesWeakened:false,rollbackAuthorityBroadened:false,
 productionDeployed:false,physicalHealthAcceptanceClaimed:false
});
export const EXPERIENCE_COMBINED_IMPORT="import {myTimberExperienceHistoricalView,experienceLegacyComparisonRead} from './my-timber-experience-scope-20261015.mjs';\n";
export const EXPERIENCE_COMBINED_BEFORE=" const rawHead=git('rev-parse','HEAD').trim(),content=(ref,path)=>rawContent(ref==='HEAD'?rawHead:ref,path);\n const blob=(ref,path)=>rawBlob(ref==='HEAD'?rawHead:ref,path),rawRead=defaultReader?blob:reader,current=JSON.parse(content(rawHead,manifest)),c=current.combinedFinite20261014;";
export const EXPERIENCE_COMBINED_AFTER=" const experience=myTimberExperienceHistoricalView(reader,{defaultReader}),rawHead=experience.head,content=experience.content;\n const blob=experience.blob,rawRead=experience.read,current=experience.record,c=current.combinedFinite20261014;";
export const EXPERIENCE_RUNTIME_IMPORT="import {EXPERIENCE_BASE,EXPERIENCE_PATHS,EXPERIENCE_MAINTENANCE} from './my-timber-experience-scope-20261015.mjs';\n";
export const EXPERIENCE_RUNTIME_BRANCH=" if(EXPERIENCE_ADDITIONAL_PATHS.includes(path)){\n  let existed;try{execFileSync('git',['cat-file','-e',EXPERIENCE_BASE+':'+path],{stdio:'ignore'});existed=true;}catch{existed=false;}\n  assert.equal(status,existed?'M':'A','Unexpected exact My Timber experience status: '+status+' '+path);return true;\n }\n";
export const EXPERIENCE_RUNTIME_FOOTER="\nexport const EXPERIENCE_ADDITIONAL_PATHS=Object.freeze([...EXPERIENCE_PATHS,...EXPERIENCE_MAINTENANCE].filter(p=>!RECONCILIATION_PATHS.has(p)));\nfor(const p of EXPERIENCE_ADDITIONAL_PATHS)RECONCILIATION_PATHS.add(p);\n";
const once=(text,before,after='')=>{assert.equal(text.split(before).length,2,'One exact My Timber experience hook required');return text.replace(before,after)};
export function originalExperienceCombined(text){
 text=once(text,EXPERIENCE_COMBINED_IMPORT);
 text=once(text,' reader=experienceLegacyComparisonRead(reader,actual.rawHead);\n');
 text=once(text,EXPERIENCE_COMBINED_AFTER,EXPERIENCE_COMBINED_BEFORE);
 text=once(text,"assert.equal(git('rev-parse','HEAD').trim(),experience.rawHead,'Source HEAD changed during combined verification');","assert.equal(git('rev-parse','HEAD').trim(),rawHead,'Source HEAD changed during combined verification');");
 text=once(text,"return{rawHead:experience.rawHead,head:rawHead,record:current,content,blob,read:normal}","return{rawHead,head:rawHead,record:current,content,blob,read:normal}");
 return once(text,"return{rawHead:experience.rawHead,head:c.base,record,read,blob:","return{rawHead,head:c.base,record,read,blob:");
}
export function originalExperienceRuntime(text){
 for(const fragment of [EXPERIENCE_RUNTIME_IMPORT,EXPERIENCE_RUNTIME_BRANCH,EXPERIENCE_RUNTIME_FOOTER])text=once(text,fragment);
 return text;
}
export const EXPERIENCE_LIVE_HARNESS_EDITS=Object.freeze({"release/app-member-live.mjs":[["import assert from 'node:assert/strict';\n","import assert from 'node:assert/strict';\n\nexport async function openMemberTool(page,key){\n assert(['today','grub','fit','life-back'].includes(key),'Known member tool required');\n const legacy=page.locator('#appTab-'+key);\n await legacy.waitFor({state:'attached',timeout:45000});\n if(await page.locator('body').getAttribute('data-member-experience-ui')!=='20261015'){await legacy.click();return;}\n const nav=page.locator('#appBottomNav');\n if(key==='life-back'){\n  const more=page.locator('#memberMoreDialog');\n  if(!await more.isVisible())await nav.locator('#appMore[aria-controls=\"memberMoreDialog\"]').click();\n  await more.getByRole('link',{name:'Life Back · goals & wins',exact:true}).click();\n  await more.waitFor({state:'hidden',timeout:10000});\n }else await nav.getByRole('link',{name:{today:'Today',grub:'Grub',fit:'Fit'}[key],exact:true}).click();\n}\n",1],["await page.locator('#appTab-grub').waitFor({timeout:45000});","await page.locator('#appTab-grub').waitFor({state:'attached',timeout:45000});await page.waitForFunction(()=>document.body.dataset.memberExperienceUi==='20261015',null,{timeout:45000});",1],["await page.locator('#appTab-today').click()","await openMemberTool(page,'today')",1],["await page.locator('#appTab-grub').click()","await openMemberTool(page,'grub')",3],["await page.locator('#appTab-fit').click()","await openMemberTool(page,'fit')",2],["await page.locator('#appTab-life-back').click()","await openMemberTool(page,'life-back')",2],["assert.equal(await page.locator('#appTab-life-back').getAttribute('aria-selected'),'true');","assert.equal(await page.locator('#appTab-life-back').getAttribute('aria-selected'),'true');await page.locator('#appBottomNav a[href$=\"#journey\"][aria-current=\"page\"]').waitFor({state:'visible',timeout:10000});",1],["assert.equal(await page.locator('#appTab-grub').getAttribute('aria-selected'),'true');","assert.equal(await page.locator('#appTab-grub').getAttribute('aria-selected'),'true');await page.locator('#appBottomNav a[href^=\"/member/grub\"][aria-current=\"page\"]').waitFor({state:'visible',timeout:10000});",1],["assert.equal(await page.locator('#sst-footer-c').count(),1);","assert.equal(await page.locator('#sst-footer-c').count(),1);assert(!(await page.locator('#sst-footer-c').isVisible()),'The member workspace has no visible public website footer');",1]],"my-timber-final-production.mjs":[["import {verifyLiveTools} from './release/app-member-live.mjs';","import {verifyLiveTools,openMemberTool} from './release/app-member-live.mjs';",1],["await page.locator('#appTab-fit').click()","await openMemberTool(page,'fit')",1]],"shift-coach/full-page-proof.mjs":[["import {startCoaching,addCoachingWeek} from './browser-journey-support.mjs';\n","import {startCoaching,addCoachingWeek} from './browser-journey-support.mjs';\nimport {openMemberTool} from '../release/app-member-live.mjs';\n",1],["await page.locator('#appTab-grub').click()","await openMemberTool(page,'grub')",1],["await page.locator('#appTab-today').click()","await openMemberTool(page,'today')",1],["await page.waitForFunction(()=>document.querySelector('#todayActions > .mtm-hero')?.nextElementSibling?.id==='shiftCoach');","await page.waitForFunction(()=>{const heading=document.querySelector('.member-today-intro'),primary=heading?.nextElementSibling;return document.body.dataset.memberExperienceUi==='20261015'?primary?.classList.contains('member-coaching-primary')&&primary.contains(document.querySelector('#shiftCoach')):document.querySelector('#todayActions > .mtm-hero')?.nextElementSibling?.id==='shiftCoach'});",1],["const page=await context.newPage(),errors=[],fixtureResponses=[],checks=[];\n","const page=await context.newPage(),errors=[],fixtureResponses=[],checks=[];\nasync function revealCoachingSetup(){\n const form=page.locator('[data-coach-setup]');await form.waitFor({state:'attached',timeout:30000});\n if(await page.locator('body').getAttribute('data-member-experience-ui')==='20261015'){\n  const disclosure=page.locator('.member-coaching-details');await disclosure.waitFor({state:'visible',timeout:30000});\n  if(!await disclosure.evaluate(n=>n.open))await disclosure.locator(':scope > summary').click();\n }\n await form.waitFor({timeout:30000});\n}\n",1],["await page.locator('[data-coach-setup]').waitFor({timeout:30000});","await page.locator('[data-coach-setup]').waitFor({state:'attached',timeout:30000});",1],[" if(await page.locator('[data-consent=\"necessary\"]').isVisible())await page.locator('[data-consent=\"necessary\"]').click();\n"," if(await page.locator('[data-consent=\"necessary\"]').isVisible())await page.locator('[data-consent=\"necessary\"]').click();\n await revealCoachingSetup();\n",1],["await page.reload();await page.locator('[data-coach-setup]').waitFor();await startCoaching(page,'Enjoy time with the family');","await page.reload();await revealCoachingSetup();await page.locator('[data-coach-setup]').waitFor();await startCoaching(page,'Enjoy time with the family');",1]]});
export function originalExperienceLiveHarness(path,text){
 const edits=EXPERIENCE_LIVE_HARNESS_EDITS[path];assert(edits,'Exact member-tool live acceptance path required');
 for(const [before,after,count]of [...edits].reverse()){
  assert.equal(text.split(after).length-1,count,'Exact counted member-tool live acceptance hook required: '+path);
  text=text.split(after).join(before);
 }
 return text;
}
const sorted=values=>[...values].sort();
export function verifyMyTimberExperience(record,{head,read,blob,content,diff,ancestor}){
 const {maintenanceSource,...fixed}=record||{};
 assert.deepEqual(fixed,EXPERIENCE_RECORD,'Exact approved My Timber experience record required');
 assert.match(head,/^[a-f0-9]{40}$/);assert.match(maintenanceSource,/^[a-f0-9]{40}$/);
 for(const ref of [record.base,record.source,maintenanceSource])ancestor(ref,head);
 ancestor(record.base,record.source);ancestor(record.source,maintenanceSource);
 assert.deepEqual(sorted(diff(record.base,record.source)),EXPERIENCE_PATHS,'Unrelated member-experience payload');
 assert.deepEqual(sorted(diff(record.source,maintenanceSource)),EXPERIENCE_MAINTENANCE,'Unrelated member-experience maintenance');
 assert.deepEqual(diff(maintenanceSource,head),[EXPERIENCE_MANIFEST],'Unreviewed member-experience registration tail');
 assert.deepEqual(sorted(diff(record.base,head)),sorted([...new Set([...EXPERIENCE_PATHS,...EXPERIENCE_MAINTENANCE,EXPERIENCE_MANIFEST])]),'Unlisted member-experience source');
 for(const [path,pin] of Object.entries(EXPERIENCE_PINS)){
  assert.equal(blob(record.source,path),pin,'Frozen approved member-experience source drift: '+path);
  assert.equal(blob('HEAD',path),pin,'Current member-experience source drift: '+path);
  assert.equal(read('HEAD',path),read(record.source,path),'Fresh member-experience source drift: '+path);
 }
 for(const path of EXPERIENCE_MAINTENANCE){
  assert.equal(blob('HEAD',path),blob(maintenanceSource,path),'Current member-experience maintenance drift: '+path);
  assert.equal(read('HEAD',path),read(maintenanceSource,path),'Fresh member-experience maintenance drift: '+path);
 }
 for(const path of ['wrangler.jsonc','wrangler.coaching.jsonc','package.json','package-lock.json','shift-coach/worker.mjs','.github/workflows/cloudflare-production-promote.yml','my-timber-app','public','privacy-health-erasure-route-v1.js']){
  assert.equal(blob('HEAD',path),blob(record.base,path),'Protected member-experience boundary drift: '+path);
  assert.equal(read('HEAD',path),read(record.base,path),'Fresh protected member-experience boundary drift: '+path);
 }
 assert.equal(originalExperienceCombined(content(head,'release/combined-finite-scope-20261014.mjs')),content(record.base,'release/combined-finite-scope-20261014.mjs'),'All original combined assertions and gates retained');
 assert.equal(originalExperienceRuntime(content(head,'release/approved-runtime-composition.mjs')),content(record.base,'release/approved-runtime-composition.mjs'),'All original runtime assertions and gates retained');
 for(const path of Object.keys(EXPERIENCE_LIVE_HARNESS_EDITS))assert.equal(originalExperienceLiveHarness(path,content(head,path)),content(record.base,path),'All original member-tool live acceptance assertions and tasks retained: '+path);
 const current=JSON.parse(content(head,EXPERIENCE_MANIFEST)),prior=JSON.parse(content(record.base,EXPERIENCE_MANIFEST));
 assert.deepEqual(current[EXPERIENCE_KEY],record);delete current[EXPERIENCE_KEY];
 assert.deepEqual(current,prior,'Every previous approval, failure, receipt and hold retained');
 return record;
}
// Cache only real immutable Git object facts. HEAD, index, working-tree checks,
// supplied readers and validation outcomes are always evaluated afresh.
const immutableFacts=new Map();
function nativeGit(...args){
 const fixed=(['show','rev-parse'].includes(args[0])&&/^[a-f0-9]{40}:/.test(args[1]||''))||(args[0]==='diff'&&args[1]==='--name-only'&&args.length===4&&args.slice(2).every(v=>/^[a-f0-9]{40}$/.test(v)))||(args[0]==='merge-base'&&args[1]==='--is-ancestor'&&args.length===4&&args.slice(2).every(v=>/^[a-f0-9]{40}$/.test(v)));
 const key=JSON.stringify([process.cwd(),args]);if(fixed&&immutableFacts.has(key))return immutableFacts.get(key);
 const value=execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8',maxBuffer:64e6});if(fixed)immutableFacts.set(key,value);return value;
}
const git=(...args)=>nativeGit(...args).trimEnd();
const rawContent=(ref,path)=>nativeGit('show',ref+':'+path);
const rawBlob=(ref,path)=>git('rev-parse',ref+':'+path);
function clean(head){
 assert.equal(realpathSync(git('rev-parse','--show-toplevel')),realpathSync(process.cwd()),'Actual current checkout required');
 assert.equal(git('rev-parse','HEAD'),head,'My Timber source HEAD changed');
 assert.equal(git('diff','--name-only'),'','My Timber tracked working source is dirty');
 assert.equal(git('diff','--cached','--name-only'),'','My Timber staged source is dirty');
}
export function myTimberExperienceHistoricalView(reader=null,{defaultReader=reader===null}={}){
 const rawHead=git('rev-parse','HEAD');clean(rawHead);
 const content=(ref,path)=>rawContent(ref==='HEAD'?rawHead:ref,path);
 const blob=(ref,path)=>rawBlob(ref==='HEAD'?rawHead:ref,path);
 const current=JSON.parse(content(rawHead,EXPERIENCE_MANIFEST)),record=current[EXPERIENCE_KEY];
 const supplied=defaultReader?blob:reader;
 assert.equal(typeof supplied,'function','Current source reader required');
 if(!record){clean(rawHead);return{rawHead,head:rawHead,record:current,read:supplied,blob,content};}
 const all=[...EXPERIENCE_PATHS,...EXPERIENCE_MAINTENANCE,EXPERIENCE_MANIFEST];
 const affected=path=>all.includes(path)||all.some(p=>p.startsWith(path+'/'));
 const normal=(ref,path)=>{
  const value=supplied(ref,path),resolved=ref==='HEAD'?rawHead:ref;
  if(typeof value==='string'&&value.startsWith('tree ')){
   for(const display of [ref,resolved]){
    const authentic=rawContent(display,path),prefix='tree '+display+':'+path+'\n';
    if(value===authentic&&value.startsWith(prefix))return value.slice(prefix.length);
   }
  }
  return value;
 };
 verifyMyTimberExperience(record,{head:rawHead,read:normal,blob,content,diff:(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean),ancestor:(a,b)=>git('merge-base','--is-ancestor',a,b)});
 const map=(ref,path)=>ref==='HEAD'&&affected(path)?record.base:ref;
 const read=(ref,path)=>{
  if(ref==='HEAD'&&affected(path)&&!defaultReader){
   const value=supplied(ref,path);
   assert(value===blob(ref,path)||value===content(ref,path)||value===rawContent(ref,path),'Authentic current member-experience reader required: '+path);
  }
  return normal(map(ref,path),path);
 };
 const prior=structuredClone(current);delete prior[EXPERIENCE_KEY];clean(rawHead);
 return{rawHead,head:record.base,record:prior,read,blob:(ref,path)=>blob(map(ref,path),path),content:(ref,path)=>content(map(ref,path),path)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){myTimberExperienceHistoricalView();console.log('PASS exact My Timber experience source; original release and rollback guards retained; no deployment claimed');}

// Abstract comparison adapter only. Real current Git source is independently
// verified first; no supplied reader or historical result authorises release.
export function experienceLegacyComparisonRead(reader,expectedHead){
 const actual=myTimberExperienceHistoricalView();
 assert.equal(actual.rawHead,expectedHead,'Current source changed before legacy member-experience comparison');
 assert.equal(typeof reader,'function');
 const record=JSON.parse(rawContent(actual.rawHead,EXPERIENCE_MANIFEST))[EXPERIENCE_KEY];
 if(!record)return reader;
 const paths=[...EXPERIENCE_PATHS,...EXPERIENCE_MAINTENANCE,EXPERIENCE_MANIFEST];
 const affected=path=>paths.includes(path)||paths.some(p=>p.startsWith(path+'/'));
 const directory=(value,ref,path)=>{
  if(typeof value!=='string'||!value.startsWith('tree '))return value;
  const authentic=rawContent(ref,path),prefix='tree '+ref+':'+path+'\n';
  return value===authentic&&value.startsWith(prefix)?value.slice(prefix.length):value;
 };
 return(ref,path)=>{
  if(ref===actual.rawHead&&affected(path))return reader(actual.head,path);
  if(ref==='HEAD'&&affected(path)){
   const current=reader('HEAD',path),alias=reader(actual.rawHead,path);
   if(directory(current,'HEAD',path)!==directory(alias,actual.rawHead,path))return current;
   return reader(actual.head,path);
  }
  return reader(ref,path);
 };
}
