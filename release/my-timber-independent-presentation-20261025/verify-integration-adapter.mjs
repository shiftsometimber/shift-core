import fs from 'node:fs';import assert from 'node:assert/strict';import {assets,documents,knownApprovedStyles}from './presentation-source/data.mjs';import {presentationDocument,presentationAsset}from './presentation-source/presentation.mjs';
const rows=[];const origin='https://shiftsometimber.co.uk';
for(const [path,rules]of Object.entries(documents)){
 const filename=path.split('/').pop(),before=fs.readFileSync(new URL('./live-'+filename+'.html',import.meta.url),'utf8');
 const request=new Request(origin+path),headers={'Content-Type':'text/html','Cache-Control':'private, no-store'};
 const result=await presentationDocument(request,new Response(before,{headers}));const after=await result.text();
 assert.notEqual(after,before);assert(after.includes(rules[0][1]));assert.equal(result.headers.get('Cache-Control'),'private, no-store');
 if(filename==='dashboard'){assert(after.includes("host.closest('.member-coaching-details')"));assert(!after.includes("function position(){const hero=actions?.querySelector"));}
 const again=await presentationDocument(request,new Response(after,{headers}));assert.equal(await again.text(),after);
 const unknown=before.replace(knownApprovedStyles[path],knownApprovedStyles[path].replace('</style>','/* newer unknown owner CSS */</style>'));
 assert.equal(await(await presentationDocument(request,new Response(unknown,{headers}))).text(),unknown);
 const post=await presentationDocument(new Request(origin+path,{method:'POST'}),new Response(before,{headers}));assert.equal(await post.text(),before);
 rows.push({path,knownPriorApprovedHTMLRepaired:true,idempotent:true,unknownFuturePassThrough:true,nonGETUnchanged:true});
}
const entry=assets['/assets/my-timber-layout.mjs'],prior=fs.readFileSync(new URL('./legacy-live-assets/_assets_my-timber-layout.mjs',import.meta.url),'utf8');
const env={CORE:{fetch:async()=>new Response(prior,{headers:{'Content-Type':'text/javascript'}})}};
assert.equal(await(await presentationAsset(new Request(origin+'/assets/my-timber-layout.mjs'),env)).text(),entry.body);
assert(entry.body.includes("(root.closest('#panel-today')||root).after(host)"));
assert(!entry.body.includes('host.hidden=true;root.after(host)}select(queryTool())'));
env.CORE.fetch=async()=>new Response('/* newer unknown runtime */');assert.equal(await(await presentationAsset(new Request(origin+'/assets/my-timber-layout.mjs'),env)).text(),'/* newer unknown runtime */');
fs.writeFileSync(new URL('./integration-adapter-verification.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),pass:true,rows,assetExactPriorApprovedRepair:true,unknownFutureAssetPassThrough:true},null,2));
console.log('PASS: three known page repairs, idempotence, unknown/new source, nonGET, old approved asset structure');
