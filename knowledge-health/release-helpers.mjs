import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const hash=value=>createHash('sha256').update(value).digest('hex');
export const matches=(pattern,url)=>new RegExp('^'+pattern.replace(/^https?:\/\//,'').replace(/[.+?^$()|[\]\\{}]/g,'\\$&').replace(/\*/g,'.*')+'$').test(url.replace(/^https?:\/\//,''));
export const routeOwner=(routes,url)=>routes.filter(r=>matches(r.pattern,url)).sort((a,b)=>b.pattern.replace(/\*/g,'').length-a.pattern.replace(/\*/g,'').length)[0];
const count=(text,needle)=>text.split(needle).length-1;
export function patchAskModule(code,moduleName){
 if(!code.includes('async function askTimberRoutes('))return {code,patched:false};
 assert.equal(count(code,'async function askTimberRoutes('),1,'Ambiguous Ask function');
 assert(!code.includes('SHIFT_HEALTH_20261029_V2'),'This Ask module already has the release');
 const anchor='const reviewedDirect = directReviewedAnswer(message);';
 assert.equal(count(code,anchor),1,'Unrecognised checked-answer insertion point');
 const start=code.indexOf('async function askTimberRoutes('),at=code.indexOf(anchor);
 assert(at>start&&at-start<16000,'Checked-answer insertion point is outside Ask');
 const head=code.slice(start,at),tail=code.slice(at,at+2000);
 const body=head.match(/const ([\w$]+) = await request\.json\(\)/)?.[1];
 const json=tail.match(/if \(reviewedDirect && !wantsJourney\) return ([\w$]+)\(/)?.[1];
 assert(body&&json,'Cannot preserve this Ask adapter’s body and response bindings');
 assert(head.includes('urgentResponse(message)')&&head.includes('allowedOrigin(request)'),'Safety/origin guards missing');
 const direct='\n  /* SHIFT_HEALTH_20261029_V2 */\n  const __shiftHealthDirect = !wantsJourney && !'+body+'?.history?.length ? __shiftHealthAnswer(message) : null;\n  if (__shiftHealthDirect) return '+json+'({ok:true,requestId,mode:"source_checked_health",...__shiftHealthDirect},200,request);';
 const retrieval=/(\bconst items\s*=\s*\[)\.\.\.reviewedFoodEvidence\(message\),/g;
 const hits=[...code.matchAll(retrieval)];assert.equal(hits.length,1,'Ambiguous health evidence insertion point');
 const original=hits[0][0],replacement=hits[0][1]+'...__shiftHealthEvidence(message), ...reviewedFoodEvidence(message),';
 let spec=path.posix.relative(path.posix.dirname(moduleName),'knowledge-health/evidence.mjs');if(!spec.startsWith('.'))spec='./'+spec;
 const prefix='import {healthKnowledgeAnswer as __shiftHealthAnswer,healthKnowledgeEvidence as __shiftHealthEvidence} from '+JSON.stringify(spec)+';\n';
 const result=prefix+code.replace(anchor,anchor+direct).replace(original,replacement);
 assert.equal(result.slice(prefix.length).replace(direct,'').replace(replacement,original),code,'Ask patch changed unrelated bytes');
 return {code:result,patched:true,bodyBinding:body,responseBinding:json};
}
export function entryModule(main){
 assert(main&&!main.includes('..')&&!main.startsWith('/'),'Invalid captured entry');
 return 'import original from '+JSON.stringify('./'+main)+';\nimport {withHealthKnowledgeWorker} from "./knowledge-health/production.mjs";\nexport * from '+JSON.stringify('./'+main)+';\nexport default withHealthKnowledgeWorker(original);\n';
}
export function metadataFor(current,settings,main,source,activeVersion){
 assert.match(activeVersion||'',/^[a-f0-9-]{36}$/,'An exact deployed version is required for binding inheritance');
 const runtime=current.resources?.script_runtime||{};
 // The Workers /workers/{name}/versions JSON API accepts an explicit binding
 // version. The older /scripts/{name}/versions endpoint accepts only "latest".
 const metadata={main_module:main,compatibility_date:runtime.compatibility_date||settings.compatibility_date,compatibility_flags:runtime.compatibility_flags||settings.compatibility_flags||[],bindings:settings.bindings.map(b=>({type:'inherit',name:b.name,version_id:activeVersion})),annotations:{'workers/message':'Matt approved the 50-topic Knowledge expansion; source '+source+'; preserve all other active modules and routes.','workers/tag':'knowledge-'+source.slice(0,12)}};
 for(const k of ['usage_model','limits','placement','cache_options'])if(settings[k]!==undefined)metadata[k]=settings[k];
 if(current.assets)metadata.assets=current.assets;
 if(current.exports)metadata.exports=current.exports;
 return metadata;
}
