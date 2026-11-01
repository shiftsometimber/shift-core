import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
export const hash=value=>createHash('sha256').update(value).digest('hex');
export const ENTRY='referral-programme/entry.mjs';
export const MODULES=['delivery.mjs','pages.mjs','referrer-content.mjs','programme-weeks.mjs','assets.mjs'];
export function providerOperationAllowed(mode,path,method='GET'){
 if(!/^\/workers\/(?:scripts|workers)\/shift-core(?:\/|\?|$)/.test(path))return false;
 if(method==='GET')return true;
 if(method!=='POST')return false;
 const version=/^\/workers\/scripts\/shift-core\/versions(?:\?|$)/.test(path),deployment=path==='/workers/scripts/shift-core/deployments';
 return mode==='stage'?version:mode==='release'?version||deployment:mode==='rollback'?deployment:false;
}
export function plannedPackage(before,{replaceOwned=false}={}){
 assert(before.main_module&&before.modules?.some(m=>m.name===before.main_module));
 assert.match(before.main_module,/^[a-zA-Z0-9_./-]+\.m?js$/);assert(!before.main_module.split('/').includes('..'));
 if(replaceOwned){
  assert(before.modules.some(m=>m.name===ENTRY));
  assert.deepEqual(before.modules.filter(m=>m.name.startsWith('referral-programme/')).map(m=>m.name).sort(),[ENTRY,...MODULES.map(n=>'referral-programme/'+n)].sort(),'Unexpected owned module inventory');
  return {...before,modules:before.modules.map(m=>{const name=m.name.replace(/^referral-programme\//,'');return MODULES.includes(name)?{...m,content_base64:readFileSync(new URL(name,import.meta.url)).toString('base64')}:m;})};
 }
 assert(!before.modules.some(m=>m.name.startsWith('referral-programme/')),'Already installed; reconcile instead of replaying');
 const source='import original from '+JSON.stringify('../'+before.main_module)+';\nexport * from '+JSON.stringify('../'+before.main_module)+';\nimport {wrapReferralProgramme} from "./delivery.mjs";\nexport default wrapReferralProgramme(original);\n';
 return {main_module:ENTRY,modules:[...before.modules,{name:ENTRY,content_base64:Buffer.from(source).toString('base64')},...MODULES.map(name=>({name:'referral-programme/'+name,content_base64:readFileSync(new URL(name,import.meta.url)).toString('base64')}))]};
}
export function verifyPackage(before,staged,planned){
 assert.equal(staged.main_module,ENTRY);assert(JSON.stringify(staged.bindings)===JSON.stringify(before.bindings),'Bindings changed');
 assert.equal(staged.compatibility_date,before.compatibility_date);
 assert(JSON.stringify((staged.compatibility_flags||[]).toSorted())===JSON.stringify((before.compatibility_flags||[]).toSorted()),'Compatibility flags changed');
 assert.deepEqual(staged.modules.map(m=>m.name).sort(),planned.modules.map(m=>m.name).sort());
 for(const expected of planned.modules){const actual=staged.modules.find(m=>m.name===expected.name);assert.equal(hash(Buffer.from(actual.content_base64,'base64')),hash(Buffer.from(expected.content_base64,'base64')),expected.name+' bytes changed');}
 return true;
}
