import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,existsSync,lstatSync,realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const PREPARED_BASE='3ab4dc5f8f47e44108f3f6d5503ffbac90b6adef';
export const PREPARED_FIX='495e865009674b8a801e7176fc5f5362d7134f57';
export const PAYLOAD='27e7300d762539e3d9a3210a951d55b80964c4e5';
export const PAYLOAD_TREE='c6b0be83b702ed8db90edf8442887fba6be85cff';
export const PATHS=Object.freeze([
 'docs/PHARMACY-MY-TIMBER-INTEGRATION-V1.md',
 'frontend/medicine-front-door/medicine-front-door.js',
 'frontend/medicine-front-door/treatment-assessment.html',
 'frontend/medicine-front-door/treatment-assessment.js',
 'frontend/member/clinical-intake-v1.css',
 'frontend/member/member-treatment-journey-v1.js',
 'frontend/member/treatment-assessment.html',
 'frontend/member/treatment-assessment.js',
 'medicine-commerce-v1.js','pharmacy-handover-v1.mjs',
 'tests/checkout-recovery.test.mjs','tests/medicine-commerce-v1.test.mjs',
 'tests/medicine-intake-browser.mjs','tests/medicine-intake-continuity.test.mjs',
 'tests/medicine-intake-sqlite.test.mjs','tests/medicine-purchase-e2e.test.mjs',
 'tests/pharmacy-handover-v1.test.mjs',
]);
export const GP_PRIVACY_PATHS=Object.freeze(['member-experience/member-details-lookups.mjs','member-experience/tests/gp-lookup-private-denial.test.mjs']);
export const MAINTENANCE=Object.freeze([
 '.github/workflows/questionnaire-handover-release-20261016.yml',
 'release/questionnaire-handover-source-20261016.mjs',
 'release/questionnaire-handover-policy-20261016.json',
 'release/questionnaire-handover-owned-release-20261016.mjs',
 'tests/questionnaire-handover-release-20261016.test.mjs',
 'member-experience/tests/lookup-continuation.test.mjs',
]);
const ledger='release/approved-runtime-composition.json';
const policyPath='release/questionnaire-handover-policy-20261016.json';
const sha=s=>assert.match(s||'',/^[a-f0-9]{40}$/,'Exact Git object required');
export function assertQuestionnaireRecord(record,policy){
 assert(record&&policy);assert.equal(record.proof,'EXACT_NONCLINICAL_QUESTIONNAIRE_HANDOVER_20261016');
 assert.deepEqual(Object.keys(record).sort(),['proof','preparedBase','preparedFix','payloadSource','payloadTree','base','baseTree','maintenanceSource','paths','maintenancePaths','partnerApprovedQuestionnaire','partnerTestPassed','homepageChanged','treatmentSalesActivated','clinicalRulesAdded','predictiveModelsActivated','r4Activated','stockChanged','configurationChanged','communicationsSent','sourceGuardsRelaxed','gpPrivateDenialsCorrected'].sort(),'Unknown source approval field');
 assert.equal(record.preparedBase,PREPARED_BASE);assert.equal(record.preparedFix,PREPARED_FIX);
 assert.equal(record.payloadSource,PAYLOAD);assert.equal(record.payloadTree,PAYLOAD_TREE);
 assert.deepEqual(record.paths,PATHS);assert.deepEqual(record.maintenancePaths,MAINTENANCE);
 assert.equal(record.base,policy.acceptedBase.source);assert.equal(record.baseTree,policy.acceptedBase.tree);
 for(const value of [record.base,record.baseTree,record.maintenanceSource])sha(value);
 assert.equal(record.partnerApprovedQuestionnaire,false);assert.equal(record.partnerTestPassed,false);assert.equal(record.gpPrivateDenialsCorrected,true);
 for(const flag of ['homepageChanged','treatmentSalesActivated','clinicalRulesAdded','predictiveModelsActivated','r4Activated','stockChanged','configurationChanged','communicationsSent','sourceGuardsRelaxed'])assert.equal(record[flag],false,flag);
 assert.deepEqual(sorted(Object.keys(policy.payloadBlobs)),sorted(PATHS));
 for(const value of Object.values(policy.payloadBlobs))sha(value);
 assert.deepEqual(sorted(Object.keys(policy.gpPrivacyBlobs)),sorted(GP_PRIVACY_PATHS));for(const value of Object.values(policy.gpPrivacyBlobs))sha(value);
 assert.equal(policy.acceptedBase.repository,'shiftsometimber/shift-core');
 assert.equal(policy.acceptedBase.run,38974318146);
 assert.equal(policy.acceptedBase.source,'55b73025f5b6d2302fab42bce73a222653404186');
 assert.equal(policy.acceptedBase.tree,'550bec05b5dbf98bb31eed006b2158f73b4ee79f');
 assert.deepEqual(Object.keys(policy.predecessors),['core']);
 const predecessor=policy.predecessors.core;
 assert.equal(predecessor.script,'shift-core');assert.equal(predecessor.config,'wrangler.jsonc');
 assert.equal(predecessor.source,record.base);assert.equal(predecessor.run,policy.acceptedBase.run);
 assert.equal(typeof predecessor.gpEnabled,'boolean');
 for(const name of ['deployment','version'])assert.match(predecessor[name]||'',/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/);
 return record;
}
const root=realpathSync(process.cwd());
const selectorVariables=Object.freeze([
 'GIT_DIR','GIT_COMMON_DIR','GIT_WORK_TREE','GIT_INDEX_FILE',
 'GIT_OBJECT_DIRECTORY','GIT_ALTERNATE_OBJECT_DIRECTORIES','GIT_NAMESPACE',
 'GIT_REPLACE_REF_BASE','GIT_GRAFT_FILE','GIT_SHALLOW_FILE',
 'GIT_CONFIG','GIT_CONFIG_GLOBAL','GIT_CONFIG_SYSTEM','GIT_CONFIG_COUNT',
 'GIT_CONFIG_PARAMETERS','GIT_CEILING_DIRECTORIES',
 'GIT_DISCOVERY_ACROSS_FILESYSTEM','GIT_PREFIX',
]);
const sorted=a=>[...a].sort();
const sha40=value=>assert.match(value||'',/^[a-f0-9]{40}$/,'Literal native object identity required');
function rawContext(){
 assert.equal(process.cwd(),root,'Direct GP source drift: actual repository working directory changed');
 for(const name of selectorVariables)assert.equal(Object.hasOwn(process.env,name),false,'Direct GP source drift: Git selector override '+name);
 for(const name of Object.keys(process.env))assert(!/^GIT_CONFIG_(?:KEY|VALUE)_\d+$/.test(name),'Direct GP source drift: injected Git configuration');
}
const nativeEnvironment=()=>({...process.env,GIT_NO_LAZY_FETCH:'1',GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0'});
function git(...args){
 rawContext();
 return execFileSync('/usr/bin/git',['--no-replace-objects',...args],{cwd:root,env:nativeEnvironment(),encoding:'utf8',maxBuffer:64e6});
}
function configuration(name,{regexp=false}={}){
 rawContext();
 const result=spawnSync('/usr/bin/git',['--no-replace-objects','config',regexp?'--get-regexp':'--get',name],{cwd:root,env:nativeEnvironment(),encoding:'utf8',maxBuffer:1e6});
 assert(!result.error&&[0,1].includes(result.status),'Direct GP source drift: native Git configuration unavailable');
 return result.status===1?null:result.stdout.trim();
}
const currentHead=()=>git('rev-parse','HEAD').trim();
const blob=(ref,path)=>git('rev-parse',ref+':'+path).trim();
const content=(ref,path)=>git('show',ref+':'+path);
const diff=(a,b)=>git('diff','--no-ext-diff','--no-textconv','--no-renames','--name-only',a,b,'--').trim().split('\n').filter(Boolean);
const ancestor=(a,b)=>git('merge-base','--is-ancestor',a,b);
function sourceVisible(){
 rawContext();
 const directory=resolve(root,'.git');
 assert(lstatSync(directory).isDirectory()&&!lstatSync(directory).isSymbolicLink(),'Direct GP source drift: ordinary native .git directory required');
 assert.equal(realpathSync(directory),directory,'Direct GP source drift: native Git directory changed');
 assert.equal(realpathSync(resolve(root,git('rev-parse','--git-dir').trim())),directory);
 assert.equal(realpathSync(resolve(root,git('rev-parse','--git-common-dir').trim())),directory,'Direct GP source drift: shared Git directory refused');
 assert.equal(realpathSync(git('rev-parse','--show-toplevel').trim()),root);
 assert.equal(git('rev-parse','--show-prefix').trim(),'');
 for(const path of ['info/grafts','objects/info/alternates','objects/info/http-alternates','commondir','gitdir','shallow'])assert(!existsSync(resolve(directory,path)),'Direct GP source drift: independent complete native history required: '+path);
 assert.equal(configuration('extensions.partialClone'),null,'Direct GP source drift: partial native history refused');
 assert.equal(configuration('^remote\\..+\\.(promisor|partialclonefilter)$',{regexp:true}),null,'Direct GP source drift: lazy native object fetching refused');
 assert.equal(git('for-each-ref','--format=%(refname)','refs/replace').trim(),'','Direct GP source drift: replacement history forbidden');
 for(const name of ['core.ignoreStat','core.fsmonitor','core.sparseCheckout','core.sparseCheckoutCone','index.sparse','extensions.worktreeConfig']){
  const value=configuration(name);assert(value===null||/^(?:false|no|off|0)$/i.test(value),'Direct GP source drift: hidden tracked source configuration '+name);
 }
 const checkStat=configuration('core.checkStat');assert(checkStat===null||checkStat==='default','Direct GP source drift: reduced source stat checks refused');
 const trustCtime=configuration('core.trustCtime');assert(trustCtime===null||/^(?:true|yes|on|1)$/i.test(trustCtime),'Direct GP source drift: source ctime checks disabled');
 for(const row of git('ls-files','-v','-z').split('\0').filter(Boolean))assert(row.startsWith('H '),'Direct GP source drift: assumed, skipped or abnormal tracked source flag');
 assert.equal(git('ls-files','--unmerged').trim(),'','Direct GP source drift: unmerged index');
}
function clean(expected){
 sourceVisible();
 assert.equal(currentHead(),expected,'Direct GP source drift: actual HEAD moved');
 assert.equal(git('diff','--no-ext-diff','--no-textconv','--no-renames','--name-only','HEAD','--').trim(),'','Direct GP source drift: tracked working source changed');
 assert.equal(git('diff','--no-ext-diff','--no-textconv','--no-renames','--cached','--name-only','HEAD','--').trim(),'','Direct GP source drift: staged source changed');
 assert.equal(currentHead(),expected,'Direct GP source drift: actual HEAD moved');
}
function mode(ref,path){
 const rows=git('ls-tree','-z',ref,'--',path).split('\0').filter(Boolean);
 assert.equal(rows.length,1,'Direct GP source drift: one native source path required '+path);
 const match=/^([0-7]{6}) (blob|tree) ([a-f0-9]{40})\t(.+)$/.exec(rows[0]);
 assert(match&&match[4]===path,'Direct GP source drift: exact literal source path required '+path);
 return match[1];
}
function regular(ref,paths,{working=false}={}){
 for(const path of paths){
  assert.equal(mode(ref,path),'100644','Direct GP source drift: regular nonexecutable source required '+path);
  if(working){
   const file=resolve(root,path),stat=lstatSync(file);
   assert(stat.isFile()&&!stat.isSymbolicLink(),'Direct GP source drift: working source type changed '+path);
   assert.equal(stat.mode&0o777,0o644,'Direct GP source drift: working source mode changed '+path);
   assert.equal(readFileSync(file,'utf8'),content(ref,path),'Direct GP source drift: working bytes differ from native source '+path);
  }
 }
}

export function verifyQuestionnaireSource(){
 const g=(...args)=>git(...args).trim();
 // Every mutable fact is read afresh; no current-source or callback cache.
 const head=g('rev-parse','HEAD'),policy=JSON.parse(readFileSync(policyPath,'utf8'));
 const text=(ref,path)=>execFileSync('/usr/bin/git',['--no-replace-objects','show',ref+':'+path],{encoding:'utf8',maxBuffer:64e6,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'}});
 const clean=()=>{assert.equal(g('rev-parse','HEAD'),head,'Raw HEAD moved');sourceVisible();assert.equal(g('diff','--no-ext-diff','--no-textconv','--name-only','HEAD','--'),'');assert.equal(g('diff','--cached','--no-ext-diff','--no-textconv','--name-only','--'),'');};
 clean();
 const current=JSON.parse(text(head,ledger)),record=assertQuestionnaireRecord(current.questionnaireHandover20261016,policy),base=record.base;
 assert.equal(g('rev-parse',base+'^{tree}'),record.baseTree);
 assert.equal(g('rev-parse',PAYLOAD+'^{tree}'),PAYLOAD_TREE);
 for(const [a,b]of [[PREPARED_BASE,PREPARED_FIX],[PREPARED_FIX,PAYLOAD],[PAYLOAD,head],[base,head],[record.maintenanceSource,head]])g('merge-base','--is-ancestor',a,b);
 const paths=(a,b)=>g('diff','--no-ext-diff','--no-textconv','--no-renames','--name-only',a,b,'--').split('\n').filter(Boolean);
 assert.deepEqual(sorted(paths(PREPARED_BASE,PAYLOAD)),sorted(PATHS),'Original questionnaire payload changed');
 assert.deepEqual(sorted(paths(base,head)),sorted([...PATHS,...GP_PRIVACY_PATHS,...MAINTENANCE,ledger]),'Unrelated release change');
 assert.deepEqual(paths(record.maintenanceSource,head),[ledger],'Unreviewed changes after maintenance');
 for(const path of PATHS){
  assert.equal(g('rev-parse',PAYLOAD+':'+path),policy.payloadBlobs[path]);
  assert.equal(g('rev-parse',head+':'+path),policy.payloadBlobs[path],'Questionnaire payload changed '+path);
  const a=g('ls-tree',PREPARED_BASE,'--',path),b=g('ls-tree',base,'--',path);assert.equal(a,b,'Accepted-base predecessor differs '+path);
 }
 for(const path of [...PATHS,...GP_PRIVACY_PATHS,...MAINTENANCE]){
  const row=g('ls-tree',head,'--',path);assert.match(row,/^100644 blob [a-f0-9]{40}\t/,'Only regular exact files permitted');
  assert.equal(g('rev-parse',head+':'+path),g('rev-parse',record.maintenanceSource+':'+path),'Frozen maintenance changed '+path);
 }
 for(const path of GP_PRIVACY_PATHS)assert.equal(g('rev-parse',head+':'+path),policy.gpPrivacyBlobs[path],'Exact GP authentication privacy correction required '+path);
 const privacyPath=GP_PRIVACY_PATHS[0],privacySource=text(head,privacyPath),privacyInsertion="// Authentication failures must retain this private endpoint's cache/privacy policy.\nfunction privateAuthResponse(response){\n const next=new Headers(response.headers);for(const [key,value]of Object.entries(headers))next.set(key,value);\n return new Response(response.body,{status:response.status,statusText:response.statusText,headers:next});\n}\n";
 assert.equal(privacySource.split(privacyInsertion).length-1,1,'One private-response helper required');
 const privateReturn='if(auth.response)return privateAuthResponse(auth.response);';assert.equal(privacySource.split(privateReturn).length-1,2,'Both original authentication returns must remain');
 assert.equal(privacySource.replace(privacyInsertion,'').split(privateReturn).join('if(auth.response)return auth.response;'),text(base,privacyPath),'The complete GP lookup source must restore exactly; authentication, limits, lookup and all other behaviour stay unchanged');
 const legacyTest='member-experience/tests/lookup-continuation.test.mjs';
 assert.equal(text(head,legacyTest).replace("import {originalQuestionnaireAssessmentHtml} from '../../release/questionnaire-handover-source-20261016.mjs';\n",'').replace("const html=originalQuestionnaireAssessmentHtml(new URL(path,import.meta.url));","const html=readFileSync(new URL(path,import.meta.url),'utf8');"),text(base,legacyTest),'Every original lookup/clinical-content assertion, immutable hash and command remains unchanged under the exact registered HTML inverse');
 delete current.questionnaireHandover20261016;
 assert.deepEqual(current,JSON.parse(text(base,ledger)),'Every existing GP/Core ledger row must remain exact');
 for(const path of ['wrangler.jsonc','wrangler.coaching.jsonc','wrangler.hq-management.jsonc','worker-entry-v6.js','shift-coach/worker.mjs','hq-management-entry.mjs','package.json','package-lock.json'])assert.equal(g('rev-parse',head+':'+path),g('rev-parse',base+':'+path),'Protected accepted source changed '+path);
 regular(head,[...PATHS,...GP_PRIVACY_PATHS,...MAINTENANCE],{working:true});
 clean();return {source:head,tree:g('rev-parse',head+'^{tree}'),record,policy};
}

// The old GP assertion remains unchanged. Only the two exact registered
// nonclinical HTML hunks are inverted, after fresh current-source validation.
export function originalQuestionnaireAssessmentHtml(fileUrl){
 const admitted=verifyQuestionnaireSource(),file=realpathSync(fileURLToPath(fileUrl));
 const path=PATHS.find(p=>p.endsWith('/treatment-assessment.html')&&resolve(root,p)===file);assert(path,'Only the two exact assessment source files are eligible');
 let html=readFileSync(file,'utf8');assert.equal(html,content(admitted.source,path),'Current assessment working bytes changed');
 const hunks=[{"before": "  <link rel=\"stylesheet\" href=\"/clinical-intake-v1.css\">\n</head>\n<body>\n<main>\n  <p>CHOOSE → VERIFY → PAY → REVIEW</p>\n  <h1>Verify before any payment.</h1>\n  <p>Your health, GP, identity and clothed body images go securely to the commissioned pharmacy partner. Shift does not store the image files. Payment stays locked until this step is accepted.</p>\n  <form id=\"assessment\" enctype=\"multipart/form-data\">\n    <input name=\"variantId\" id=\"variantId\" type=\"hidden\">\n    <fieldset><legend>Your health</legend>\n      <label>Date of birth<input name=\"dateOfBirth\" type=\"date\" required></label>\n      <label>Height (cm)<input name=\"heightCm\" type=\"number\" min=\"100\" max=\"250\" required></label>\n      <label>Weight (kg)<input name=\"weightKg\" type=\"number\" min=\"30\" max=\"400\" step=\"0.1\" required></label>\n      <label>Do you have a diagnosed weight-related condition?<select name=\"weightRelatedCondition\" required><option value=\"\">Choose one</option><option value=\"no\">No</option><option value=\"yes\">Yes</option></select></label>\n      <label>Conditions<textarea name=\"conditions\" required></textarea></label>\n      <label>Medicines<textarea name=\"medicines\" required></textarea></label>\n      <label>Do you currently take insulin?<select name=\"insulinUse\" required><option value=\"\">Choose one</option><option value=\"no\">No</option><option value=\"yes\">Yes</option></select></label>\n      <p>If you take insulin, you cannot use SHIFT’s weight-management injection service. This applies to new and repeat orders. Speak to the clinician who manages your diabetes about suitable options. Do not stop or reduce insulin to qualify. <a href=\"/shift-health\">Explore SHIFT Health</a> for wider health guides and practical support.</p>\n    </fieldset>\n", "after": "  <link rel=\"stylesheet\" href=\"/clinical-intake-v1.css\">\n</head>\n<body>\n<main class=\"clinical-main\">\n  <p aria-label=\"Treatment journey\">CHOOSE → ACCOUNT → ASSESSMENT → VERIFY → PAY → PRESCRIBER REVIEW</p>\n  <h1>Verify before any payment.</h1>\n  <p>Your health, GP, identity and clothed body images go securely to the commissioned pharmacy partner. Shift does not store the image files. Payment stays locked until this step is accepted.</p>\n  <p>Verification checks your details and evidence. The clinician makes the separate prescribing decision. They may need to contact you or independently check information.</p>\n  <p id=\"accountStatus\" role=\"status\">Checking your My Timber account…</p>\n  <p id=\"selectionStatus\"></p>\n  <div id=\"assessmentActions\" hidden>\n    <button id=\"checkAssessment\" type=\"button\">Check this assessment</button>\n    <button id=\"resumeAssessment\" type=\"button\" hidden>Open secure pharmacy questions</button>\n    <a href=\"/member/dashboard#today\">My Timber treatment tracking</a>\n  </div>\n  <form id=\"assessment\" class=\"clinical-form\" enctype=\"multipart/form-data\" hidden>\n    <input name=\"variantId\" id=\"variantId\" type=\"hidden\">\n    <fieldset><legend>Your contact details</legend>\n      <p>Use your saved contact details or enter your current details. Your verified account email is used for contact. Changes here apply to this assessment.</p>\n      <button id=\"useContactDetails\" type=\"button\">Use contact details saved in My Timber</button>\n      <p id=\"savedContactStatus\" role=\"status\" aria-live=\"polite\"></p>\n      <label>First name<input name=\"patientFirstName\" autocomplete=\"given-name\" maxlength=\"100\" required></label>\n      <label>Last name<input name=\"patientLastName\" autocomplete=\"family-name\" maxlength=\"100\" required></label>\n      <label>Account email<input id=\"patientEmail\" type=\"email\" autocomplete=\"email\" readonly></label>\n      <label>Phone<input name=\"patientPhone\" type=\"tel\" autocomplete=\"tel\" maxlength=\"50\" required></label>\n      <label>Address line 1<input name=\"patientAddress1\" autocomplete=\"address-line1\" maxlength=\"120\" required></label>\n      <label>Address line 2 (optional)<input name=\"patientAddress2\" autocomplete=\"address-line2\" maxlength=\"120\"></label>\n      <label>Town or city<input name=\"patientTown\" autocomplete=\"address-level2\" maxlength=\"100\" required></label>\n      <label>Postcode<input name=\"patientPostcode\" autocomplete=\"postal-code\" maxlength=\"12\" required></label>\n    </fieldset>\n    <fieldset><legend>Your health</legend>\n      <label>Date of birth<input name=\"dateOfBirth\" type=\"date\" required></label>\n      <label>Height (cm)<input name=\"heightCm\" type=\"number\" min=\"100\" max=\"250\" required></label>\n      <label>Weight (kg)<input name=\"weightKg\" type=\"number\" min=\"30\" max=\"400\" step=\"0.1\" required></label>\n      <label>Do you have a diagnosed weight-related condition?<select name=\"weightRelatedCondition\" required><option value=\"\">Choose one</option><option value=\"no\">No</option><option value=\"yes\">Yes</option></select></label>\n      <label>Conditions<textarea name=\"conditions\" required aria-describedby=\"answerSizeHelp\"></textarea></label>\n      <label>Medicines<textarea name=\"medicines\" required aria-describedby=\"answerSizeHelp\"></textarea></label>\n      <p id=\"answerSizeHelp\">The current connection accepts up to 1,000 characters per answer. Do not omit relevant information to fit. If you need more space, the pharmacy must provide a secure route for the full details.</p>\n      <label>Do you currently take insulin?<select name=\"insulinUse\" required><option value=\"\">Choose one</option><option value=\"no\">No</option><option value=\"yes\">Yes</option></select></label>\n      <p>If you take insulin, you cannot use SHIFT’s weight-management injection service. This applies to new and repeat orders. Speak to the clinician who manages your diabetes about suitable options. Do not stop or reduce insulin to qualify. <a href=\"/shift-health\">Explore SHIFT Health</a> for wider health guides and practical support.</p>\n    </fieldset>\n"}, {"before": "    </fieldset>\n    <label><input name=\"answersConfirmed\" type=\"checkbox\" required> I confirm my answers are complete and accurate.</label>\n    <button type=\"submit\">Verify my details before payment</button>\n  </form>\n  <p id=\"status\" role=\"status\" aria-live=\"polite\"></p>\n</main>\n<script src=\"/treatment-assessment.js?v=prepay-1\"></script>\n<script defer src=\"/assets/member-experience/gp-form.mjs\"></script>\n</body>\n</html>\n", "after": "    </fieldset>\n    <label><input name=\"answersConfirmed\" type=\"checkbox\" required> I confirm my answers are complete and accurate.</label>\n    <button type=\"submit\">Verify my details before payment</button>\n    <p id=\"draftHelp\">Answers stay on this page until submitted. Refreshing or closing it can lose unsent answers and selected files. Submitted assessments can be reopened securely with the same account; health answers are not saved in browser storage.</p>\n  </form>\n  <p id=\"status\" role=\"status\" aria-live=\"polite\"></p>\n</main>\n<script src=\"/treatment-assessment.js?v=handover-3\"></script>\n<script defer src=\"/assets/member-experience/gp-form.mjs\"></script>\n</body>\n</html>\n"}];
 for(const {after,before}of hunks){assert.equal(html.split(after).length-1,1,'Unique approved nonclinical HTML inverse required');html=html.replace(after,before);}
 assert.equal(html,content(admitted.record.base,path),'Every other original assessment byte must remain exact');
 return html;
}
