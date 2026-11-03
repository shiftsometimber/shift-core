// Retain private binding/runtime protections while allowing proved public-only dependency releases.
import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
const signature=bindings=>createHash('sha256').update(JSON.stringify(canonical([...bindings].sort((a,b)=>a.name.localeCompare(b.name))))).digest('hex');
export function provePrivateSettings(name,version,anchor){
 const capture=JSON.parse(readFileSync('performance-precompiled-current-source-20261103.json')),source=capture.owners.find(o=>o.name===name&&o.version===anchor.version);assert(source,'Private settings source missing');
 const bytes=readFileSync(source.sourceFile),parsed=JSON.parse(source.sourceFile.endsWith('.gz')?gunzipSync(bytes):bytes),baseline=parsed.version||parsed;
 assert.equal(signature(version.bindings),signature(baseline.bindings),'Private dependency bindings changed');
 assert.equal(version.compatibility_date,baseline.compatibility_date,'Private runtime compatibility changed');assert.deepEqual(version.compatibility_flags||[],baseline.compatibility_flags||[],'Private runtime flags changed');assert.equal(version.usage_model,baseline.usage_model,'Dependency usage model changed');
 return {name,version:version.id,baselineVersion:baseline.id,privateSettingsMatched:true,bindingsSHA256:signature(version.bindings),compatibilityDate:version.compatibility_date,at:new Date().toISOString()};
}