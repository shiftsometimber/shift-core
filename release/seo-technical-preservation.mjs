import {TECHNICAL_SCHEMA_PAIRS} from './seo-technical-preservation-data.mjs';
// Reverse exact reviewed JSON only. Content, scripts, links and unknown schema edits remain visible to the original hash checks.
export function preserveTechnicalSeo(path,input){
 const pairs=TECHNICAL_SCHEMA_PAIRS[path];if(!pairs)return input;
 const html=input.toString('utf8');
 const restored=html.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,(whole,open,json,close)=>{
  const pair=pairs.find(([,after])=>after===json);return pair?open+pair[0]+close:whole;
 });
 return Buffer.isBuffer(input)?Buffer.from(restored):restored;
}
