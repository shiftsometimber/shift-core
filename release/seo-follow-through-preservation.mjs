import assert from 'node:assert/strict';
import {FOLLOW_THROUGH,FOLLOW_THROUGH_PATHS} from '../public-seo-follow-through.mjs';
// Reverse only the exact approved v3 additions for historical full-body hashes.
// Unknown copy, markup, links and indexing controls stay in the comparison.
export function preserveFollowThrough(path,input,{required=false}={}){
 if(!FOLLOW_THROUGH_PATHS.includes(path))return input;
 let html=input.toString('utf8');if(!/<main\b/i.test(html))return input;
 for(const c of [...FOLLOW_THROUGH.contextLinks,...FOLLOW_THROUGH.ownerCopy].filter(c=>c.path===path)){
  const afterCount=html.split(c.after).length-1;
  assert(afterCount<=1,'Duplicate approved SEO v3 paragraph: '+path);
  if(required)assert.equal(afterCount,1,'Exact approved SEO v3 paragraph absent: '+path);
  if(afterCount===1)html=html.replace(c.after,c.before);
  else assert.equal(html.split(c.before).length-1,1,'Unknown SEO v3 paragraph drift: '+path);
 }
 if(FOLLOW_THROUGH.restoreArchives.includes(path)){
  const before='<meta name="robots" content="noindex,follow">',after='<meta name="robots" content="index,follow">';
  if(required)assert.equal(html.split(after).length-1,1,'Exact archive index restoration absent: '+path);
  if(html.split(after).length===2)html=html.replace(after,before);
 }
 return Buffer.from(html);
}

// Historical source checks reverse only the exact approved v3 adapter lines.
export function originalFollowThroughPreservation(source){
 const imported="import {preserveFollowThrough} from '../release/seo-follow-through-preservation.mjs';\n";
 const composed='restoreStoppingCitation(path,preserveFollowThrough(path,body,{required:Boolean(before)}),{required:Boolean(before)})';
 for(const exact of [imported,composed])assert(source.split(exact).length-1<=1,'Duplicate SEO v3 source integration');
 return source.replace(imported,'').replace(composed,'restoreStoppingCitation(path,body,{required:Boolean(before)})');
}

const PWA_READ_HELPER="// Three bounded attempts for complete GET reads. Assertions and POST origin\n// probes below retain their original behaviour and are never retried.\nasync function readPublicPage(url){\n for(let attempt=0;attempt<3;attempt++){\n  try{\n   const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(30000)});\n   return {response,body:await response.text()};\n  }catch(error){if(attempt===2)throw error;}\n  await new Promise(resolve=>setTimeout(resolve,1000));\n }\n}\n";
const PWA_RETRY_READ="const {response:r,body}=await readPublicPage(origin+path);assert.equal(r.status,200,path);";
const PWA_ORIGINAL_READ="const r=await fetch(origin+path);assert.equal(r.status,200,path);const body=await r.text();";
export function originalPwaLiveReadVerifier(source){
 if(!source.includes(PWA_READ_HELPER))return source;
 assert.equal(source.split(PWA_READ_HELPER).length,2,'Exactly one PWA read helper required');
 assert.equal(source.split(PWA_RETRY_READ).length,3,'Exactly two bounded PWA GET integrations required');
 return source.replace(PWA_READ_HELPER,'').replaceAll(PWA_RETRY_READ,PWA_ORIGINAL_READ);
}
