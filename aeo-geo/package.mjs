import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
export const ENTRY='aeo-geo/entry.mjs';
export function preparePackage(before,{includeCatalogue=true}={}){
 assert(before.main_module&&before.modules.some(m=>m.name===before.main_module));
 assert.match(before.main_module,/^[a-zA-Z0-9_./-]+\.m?js$/);assert(!before.main_module.split('/').includes('..'));
 assert(!before.modules.some(m=>m.name.startsWith('aeo-geo/')),'AEO wrapper already present; inspect its release before updating');
 const entry='import original from '+JSON.stringify('../'+before.main_module)+';\nexport * from '+JSON.stringify('../'+before.main_module)+';\nimport {withAeoGeo} from "./delivery.mjs";\nimport {catalogue} from "./data.mjs";\nimport * as shell from "./shell.mjs";\nimport metadata from "./sitemap-metadata.mjs";\nexport default withAeoGeo(original,{catalogue,shell,metadata});\n';
 const additions=[{name:ENTRY,content_base64:Buffer.from(entry).toString('base64')}];
 for(const name of ['delivery.mjs','schema.mjs','content.mjs','analytics.mjs','chrome.mjs','sitemap-metadata.mjs'])additions.push({name:'aeo-geo/'+name,content_base64:readFileSync(new URL('./'+name,import.meta.url)).toString('base64')});
 for(const name of ['data.mjs','shell.mjs'])additions.push({name:'aeo-geo/'+name,content_base64:name==='data.mjs'&&!includeCatalogue?Buffer.from('export const catalogue=async()=>({recipes:[],exercises:[],publishedAt:"2026-11-02T08:13:32.729Z"});').toString('base64'):readFileSync('aeo-geo-proof/'+name).toString('base64')});
 return {main_module:ENTRY,modules:[...before.modules,...additions]};
}
export function verifyPackage(before,staged,planned){
 assert.equal(staged.main_module,ENTRY);assert.deepEqual(staged.bindings,before.bindings,'Inherit every existing binding exactly');assert.equal(staged.compatibility_date,before.compatibility_date);
 assert.deepEqual(staged.modules.map(x=>x.name).sort(),planned.modules.map(x=>x.name).sort());
 for(const module of planned.modules){const actual=staged.modules.find(x=>x.name===module.name);assert.equal(hash(Buffer.from(actual.content_base64,'base64')),hash(Buffer.from(module.content_base64,'base64')),module.name);}
 return {existingModulesUnchanged:before.modules.length,addedModules:planned.modules.length-before.modules.length};
}
