import {queryTerms} from './ai-site-knowledge.mjs';
// Only anonymous, standalone questions composed of published-page title terms.
// Source content and freshness are checked before lookup; changed/withdrawn pages
// cannot reuse a previous answer. No member or free-form personal queries enter it.
export async function publicAnswerCache({request,body,message,evidence,model,cache}){
 if(!cache||/(?:^|;\s*)sst_session=/.test(request.headers.get('Cookie')||'')||request.headers.get('Authorization')||body.useJourney===true||body.history?.length||message.length>180||! /^(what (?:is|are)|how (?:does|do)|explain)\b/i.test(message)||/\b(i|me|my|mine|we|our|us|you|your)\b/i.test(message)||!evidence.length||evidence.some(s=>s.reviewState!=='published_site'))return null;
 const terms=queryTerms(message),titles=new Set(evidence.flatMap(s=>queryTerms(s.title)));
 if(!terms.length||terms.some(t=>!titles.has(t)&&!['work','works'].includes(t)))return null;
 const fingerprint=JSON.stringify({version:1,model,message:message.toLowerCase().trim(),sources:evidence.map(s=>[s.citation,s.title,s.content,s.provenance])});
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fingerprint)))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const key=new Request('https://shiftsometimber.co.uk/__ai_public_answer/'+hash);
 return{async read(){if(/no-cache/i.test(request.headers.get('Cache-Control')||''))return null;try{const response=await cache.match(key);if(!response)return null;const value=await response.json();return value.ok===true&&value.journeyUsed===false?value:null}catch{return null}},async write(value){if(!value?.ok||value.journeyUsed!==false)return;try{const {requestId,...publicValue}=value;await cache.put(key,Response.json(publicValue,{headers:{'Cache-Control':'public, max-age=300'}}))}catch{/* Cache failure must never break an answer. */}}};
}
