import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
export const ENTRY='aeo-geo/entry.mjs';
const legacyOwnedNames=['entry.mjs','delivery.mjs','schema.mjs','content.mjs','analytics.mjs','chrome.mjs','sitemap-metadata.mjs','data.mjs','shell.mjs'].map(n=>'aeo-geo/'+n);
const medicineNames=['aeo-geo/retatrutide.mjs','aeo-geo/retatrutide-evidence.mjs'];
const ownedNames=[...legacyOwnedNames,...medicineNames];
const entryFor=main=>'import original from '+JSON.stringify('../'+main)+';\nexport * from '+JSON.stringify('../'+main)+';\nimport {withAeoGeo} from "./delivery.mjs";\nimport {catalogue} from "./data.mjs";\nimport * as shell from "./shell.mjs";\nimport metadata from "./sitemap-metadata.mjs";\nexport default withAeoGeo(original,{catalogue,shell,metadata});\n';
export function capturedOriginal(before,{allowOwned=false}={}){
 const owned=before.modules.filter(m=>m.name.startsWith('aeo-geo/'));
 if(!owned.length)return {main:before.main_module,modules:before.modules,owned:[]};
 assert(allowOwned,'Inspect the existing AEO release before updating');assert.equal(before.main_module,ENTRY);
 const known=owned.some(m=>medicineNames.includes(m.name))?ownedNames:legacyOwnedNames;
 assert.deepEqual(owned.map(m=>m.name).sort(),[...known].sort(),'Only the exact known public wrapper may be updated');
 const entry=Buffer.from(owned.find(m=>m.name===ENTRY).content_base64,'base64').toString(),main=entry.match(/^import original from "\.\.\/([a-zA-Z0-9_./-]+\.m?js)";/)?.[1];
 assert(main&&!main.split('/').includes('..'),'Existing wrapper must refer to a captured original module');assert.equal(entry,entryFor(main),'Existing wrapper entry has an unknown format');
 const modules=before.modules.filter(m=>!m.name.startsWith('aeo-geo/'));assert(modules.some(m=>m.name===main));return {main,modules,owned};
}
export function preparePackage(before,{includeCatalogue=true,allowOwned=false}={}){
 assert(before.main_module&&before.modules.some(m=>m.name===before.main_module));
 assert.match(before.main_module,/^[a-zA-Z0-9_./-]+\.m?js$/);assert(!before.main_module.split('/').includes('..'));
 const captured=capturedOriginal(before,{allowOwned}),entry=entryFor(captured.main);
 const additions=[{name:ENTRY,content_type:'application/javascript+module',content_base64:Buffer.from(entry).toString('base64')}];
 for(const name of ['delivery.mjs','schema.mjs','content.mjs','analytics.mjs','chrome.mjs','sitemap-metadata.mjs','retatrutide.mjs','retatrutide-evidence.mjs'])additions.push({name:'aeo-geo/'+name,content_type:'application/javascript+module',content_base64:readFileSync(new URL('./'+name,import.meta.url)).toString('base64')});
 for(const name of ['data.mjs','shell.mjs']){
  const existing=captured.owned.find(m=>m.name==='aeo-geo/'+name);
  // This amendment retains the exact published catalogue and publication
  // dates. Refreshing its governed content is a separate qualified release.
  additions.push(existing||{name:'aeo-geo/'+name,content_type:'application/javascript+module',content_base64:name==='data.mjs'&&!includeCatalogue?Buffer.from('export const catalogue=async()=>({recipes:[],exercises:[],publishedAt:"2026-11-02T08:13:32.729Z"});').toString('base64'):readFileSync('aeo-geo-proof/'+name).toString('base64')});
 }
 return {main_module:ENTRY,modules:[...captured.modules,...additions]};
}
export function prepareRetatrutidePackage(before){
 capturedOriginal(before,{allowOwned:true});
 const names=['aeo-geo/delivery.mjs','aeo-geo/sitemap-metadata.mjs',...medicineNames];
 const replacements=names.map(name=>({name,content_type:'application/javascript+module',content_base64:readFileSync(new URL('../'+name,import.meta.url)).toString('base64')}));
 const metadata=before.modules.find(m=>m.name==='aeo-geo/sitemap-metadata.mjs');assert(metadata);
 const raw=Buffer.from(metadata.content_base64,'base64').toString(),match=raw.match(/export default (\{[\s\S]*\});/);assert(match,'Published sitemap metadata format is required');
 const entries=JSON.parse(match[1]);for(const path of ['/guides/retatrutide-uk-guide','/future-medicines-comparison'])entries[path]={...entries[path],lastmod:'2026-11-02'};
 replacements.find(m=>m.name===metadata.name).content_base64=Buffer.from(raw.replace(match[1],()=>JSON.stringify(entries))).toString('base64');
 const modules=before.modules.filter(m=>!names.includes(m.name)).concat(replacements);
 for(const original of before.modules.filter(m=>!names.includes(m.name))){
  const after=modules.find(m=>m.name===original.name);assert.deepEqual(after,original,'Retatrutide amendment must retain all unrelated modules');
 }
 return {main_module:before.main_module,modules};
}
export function verifyPackage(before,staged,planned){
 assert.equal(staged.main_module,ENTRY);assert.deepEqual(staged.bindings,before.bindings,'Inherit every existing binding exactly');
 for(const field of ['compatibility_date','compatibility_flags','assets','usage_model','migration_tag'])assert.deepEqual(staged[field],before[field],'Preserve serving configuration: '+field);
 assert.deepEqual(staged.modules.map(x=>x.name).sort(),planned.modules.map(x=>x.name).sort());
 const originals=before.modules.filter(m=>!m.name.startsWith('aeo-geo/'));
 for(const module of originals){const plannedOriginal=planned.modules.find(m=>m.name===module.name);assert(plannedOriginal,'Retain original module '+module.name);assert.equal(plannedOriginal.content_type,module.content_type);assert.equal(plannedOriginal.content_base64,module.content_base64,'Never modify original source: '+module.name);}
 for(const module of planned.modules){const actual=staged.modules.find(x=>x.name===module.name);assert.equal(actual.content_type,module.content_type,'Preserve module content type: '+module.name);assert.equal(hash(Buffer.from(actual.content_base64,'base64')),hash(Buffer.from(module.content_base64,'base64')),module.name);}
 return {existingModulesUnchanged:originals.length,addedModules:planned.modules.length-before.modules.length,ownedWrapperModules:planned.modules.filter(m=>m.name.startsWith('aeo-geo/')).length};
}
