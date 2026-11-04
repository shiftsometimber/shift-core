import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const APPROVED_CANDIDATE='b222d2a8847358377838d7b1c22ba7aa0d5d4436';
export const BASELINE_MODULE_SHA256='db1e47b416898acef972900433ed4dc95be059b75da9842988804dad85d33a35';
export const REVIEW_MODULE='article-publication-review-20261104.mjs';
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const startMarker='// babylove/webhook.mjs\n',endMarker='// health-passport/routes.mjs';
export function webhookRegion(code){
 const start=code.indexOf(startMarker),end=code.indexOf(endMarker,start);
 assert(start>=0&&end>start&&code.indexOf(startMarker,start+1)===-1,'Serving webhook ownership moved');
 return code.slice(start,end);
}
export function patchServingModule(input){
 const original=Buffer.from(input).toString('utf8');assert(Buffer.from(original).equals(Buffer.from(input)));
 assert.equal(hash(input),BASELINE_MODULE_SHA256,'Captured serving module changed; reconcile instead of replacing it');
 assert(!original.includes('articlePublicationReview'),'Do not stack/replay a gate');
 const region=webhookRegion(original);
 const before1='    await env.DB.batch([\n';
 const after1='    const reviewIssues = articlePublicationReview(article.body);\n    if (reviewIssues.length) article = { ...article, publish: false };\n'+before1;
 const before2='    return reply3({ success: true, status: article.publish ? "published" : "draft", published: article.publish, link: article.publish ? "/articles/" + article.slug : void 0 });';
 const after2='    return reply3({ success: true, status: article.publish ? "published" : "draft", published: article.publish, link: article.publish ? "/articles/" + article.slug : void 0, ...reviewIssues.length ? { reviewRequired: true, reviewIssues } : {} });';
 const hunks=[{before:before1,after:after1},{before:before2,after:after2}];
 let changed=region;
 for(const h of hunks){assert.equal(changed.split(h.before).length,2,'Missing/ambiguous approved serving target');changed=changed.replace(h.before,h.after);}
 const addition='import {articlePublicationReview} from "./'+REVIEW_MODULE+'";\n';
 const code=addition+original.replace(region,changed);
 let inverse=code.slice(addition.length);
 for(const h of [...hunks].reverse()){assert.equal(inverse.split(h.after).length,2);inverse=inverse.replace(h.after,h.before);}
 assert.equal(inverse,original,'Every unrelated serving byte must remain exact');
 return {code,region:changed,proof:{candidate:APPROVED_CANDIDATE,beforeSHA256:hash(input),afterSHA256:hash(code),hunks:2,addedImport:REVIEW_MODULE,exactInverse:true}};
}
export function prepareGatePackage(before,reviewBytes){
 assert(before.main_module&&before.modules?.length);
 assert(!before.modules.some(m=>m.name===REVIEW_MODULE),'Gate already present');
 const target=before.modules.find(m=>m.name==='worker.js');assert(target,'Expected serving bundled webhook');
 const patched=patchServingModule(Buffer.from(target.content_base64,'base64'));
 const modules=before.modules.map(m=>m===target?{...m,content_base64:Buffer.from(patched.code).toString('base64')}:m);
 modules.push({name:REVIEW_MODULE,content_type:'application/javascript+module',content_base64:Buffer.from(reviewBytes).toString('base64')});
 return {main_module:before.main_module,modules,proof:patched.proof,region:patched.region};
}
export function verifyGatePackage(before,actual,planned){
 assert.equal(actual.main_module,before.main_module,'Main entry must remain exact');
 for(const field of ['bindings','compatibility_date','compatibility_flags','assets','usage_model'])assert.deepEqual(actual[field],before[field],'Preserve serving configuration: '+field);
 // Some provider versions omit migration_tag until promotion; no migrations are uploaded.
 if(actual.migration_tag!==undefined)assert.equal(actual.migration_tag,before.migration_tag);
 assert.deepEqual(actual.modules.map(m=>m.name).sort(),planned.modules.map(m=>m.name).sort());
 for(const m of planned.modules){const a=actual.modules.find(x=>x.name===m.name);assert.equal(a.content_type,m.content_type);assert.equal(a.content_base64,m.content_base64,'Provider source mismatch: '+m.name);}
 for(const m of before.modules.filter(m=>m.name!=='worker.js'))assert.deepEqual(planned.modules.find(x=>x.name===m.name),m);
 return {existingModulesPreserved:before.modules.length-1,changedModules:['worker.js'],addedModules:[REVIEW_MODULE],mainEntryPreserved:true,configurationPreserved:true,...planned.proof};
}
